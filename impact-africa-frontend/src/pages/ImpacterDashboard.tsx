import { useState, useEffect } from 'react';
import { Users, MapPin, Camera, Award, Clock, CheckCircle, XCircle, Brain, AlertCircle } from 'lucide-react';
import { web3Provider } from '../utils/web3Provider';
import { ipfsService } from '../utils/ipfs';
import { opportunityContract } from '../utils/opportunityContract';
import { verifyImage, loadAIModels, areModelsLoaded } from '../utils/aiVerification';
import type { AIVerificationResult } from '../utils/aiVerification';
import { ethers } from 'ethers';
import { showToast } from '../utils/toast';

interface ImpacterDashboardProps {
  account: string | null;
}

interface Opportunity {
  id: number;
  ngo: string;
  category: number;
  title: string;
  description: string;
  proofRequirements: string;
  latitude: bigint;
  longitude: bigint;
  radius: bigint;
  rewardAmount: bigint;
  maxImpacters: bigint;
  currentImpacters: bigint;
  active: boolean;
}

interface Submission {
  id: number;
  opportunityId: number;
  impacter: string;
  ipfsProofHash: string;
  latitude: bigint;
  longitude: bigint;
  submittedAt: bigint;
  status: number;
}

export default function ImpacterDashboard({ account }: ImpacterDashboardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [aiVerificationResult, setAiVerificationResult] = useState<AIVerificationResult | null>(null);
  const [verifyingAI, setVerifyingAI] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const categories = ['Environmental', 'Education', 'Healthcare', 'Community Service', 'Agriculture', 'Other'];

  useEffect(() => {
    
    const initAI = async () => {
      if (!areModelsLoaded()) {
        try {
          await loadAIModels();
          setModelsLoaded(true);
        } catch (error) {
          console.error('Failed to load AI models:', error);
        }
      } else {
        setModelsLoaded(true);
      }
    };
    initAI();

    if (account) {
      loadOpportunities();
      loadMySubmissions();
      getUserLocation();
    }
  }, [account]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const opportunityContract = web3Provider.getOpportunityContract();
      if (!opportunityContract) return;

      const activeIds = await opportunityContract.getActiveOpportunities();
      console.log('📋 Active opportunity IDs:', activeIds);
      const opportunitiesData: Opportunity[] = [];

      for (const id of activeIds) {
        const opp = await opportunityContract.opportunities(id);
        console.log(`📊 Raw opportunity data for ID ${id}:`, opp);

        const opportunity = {
          id: Number(id),
          ngo: opp.ngo || opp[1],
          category: Number(opp.category !== undefined ? opp.category : opp[2]),
          title: opp.title || opp[3],
          description: opp.description || opp[4],
          proofRequirements: opp.proofRequirements || opp[5],
          latitude: opp.latitude || opp[6],
          longitude: opp.longitude || opp[7],
          radius: opp.radius || opp[8],
          rewardAmount: opp.rewardAmount || opp[9],
          maxImpacters: opp.maxVolunteers || opp[10],
          currentImpacters: opp.currentVolunteers || opp[11],
          active: opp.active !== undefined ? opp.active : opp[14]
        };

        
        const isActive = opportunity.active !== undefined ? opportunity.active : opp[13];
        const current = Number(opportunity.currentImpacters || 0);
        const max = Number(opportunity.maxImpacters || 0);

        if (isActive && current < max) {
          opportunitiesData.push(opportunity);
        }
      }

      console.log('✅ Processed opportunities:', opportunitiesData);
      setOpportunities(opportunitiesData);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMySubmissions = async () => {
    try {
      if (!account) return;

      const opportunityContract = web3Provider.getOpportunityContract();
      if (!opportunityContract) return;

      const submissionIds = await opportunityContract.getSubmissionsByVolunteer(account);
      console.log('📋 Submission IDs for impacter:', submissionIds);
      const submissionsData: Submission[] = [];

      for (const id of submissionIds) {
        const sub = await opportunityContract.submissions(id);
        console.log(`📊 Raw submission data for ID ${id}:`, sub);

        submissionsData.push({
          id: Number(id),
          opportunityId: Number(sub.opportunityId !== undefined ? sub.opportunityId : sub[1]),
          impacter: sub.volunteer || sub[2],
          ipfsProofHash: sub.ipfsProofHash || sub[3],
          latitude: sub.latitude || sub[4],
          longitude: sub.longitude || sub[5],
          submittedAt: sub.submittedAt || sub[6],
          status: Number(sub.status !== undefined ? sub.status : sub[7])
        });
      }

      console.log('✅ Processed submissions:', submissionsData);
      setMySubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleProofFileChange = async (file: File | null) => {
    setProofFile(file);
    setAiVerificationResult(null);

    if (!file || !modelsLoaded) return;

    
    try {
      setVerifyingAI(true);
      const result = await verifyImage(file, 'community');
      setAiVerificationResult(result);
    } catch (error) {
      console.error('AI verification failed:', error);
      setAiVerificationResult({
        isValid: false,
        confidence: 0,
        detectedObjects: [],
        suggestions: ['AI verification failed. Manual review required.'],
        needsManualReview: true
      });
    } finally {
      setVerifyingAI(false);
    }
  };

  const submitProof = async () => {
    try {
      if (!selectedOpportunity) return;
      if (!proofFile) {
        showToast.error('Please upload a proof image');
        return;
      }
      if (!userLocation) {
        showToast.error('Please enable location services');
        return;
      }

      
      if (!aiVerificationResult && modelsLoaded) {
        await handleProofFileChange(proofFile);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setLoading(true);

      
      const ipfsHash = await ipfsService.uploadFile(proofFile);

      
      const aiVerified = aiVerificationResult?.isValid || false;
      const aiConfidence = aiVerificationResult?.confidence || 0;
      const needsManualReview = aiVerificationResult?.needsManualReview ?? true;

      
      await opportunityContract.submitProofWithAI(
        selectedOpportunity.id,
        ipfsHash,
        userLocation.lat,
        userLocation.lng,
        aiVerified,
        aiConfidence,
        needsManualReview
      );

      
      if (aiVerified) {
        showToast.success('Proof submitted successfully! AI pre-verified your submission. Awaiting NGO final approval.');
      } else {
        showToast.success('Proof submitted successfully! Awaiting NGO verification.');
      }

      setSelectedOpportunity(null);
      setProofFile(null);
      setAiVerificationResult(null);
      await loadMySubmissions();
      await loadOpportunities();
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      showToast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatusBadge = (status: number) => {
    const statuses = ['Pending', 'Approved', 'Rejected'];
    const colors = ['bg-yellow-100 text-yellow-800', 'bg-green-100 text-green-800', 'bg-red-100 text-red-800'];
    const icons = [<Clock className="h-4 w-4" />, <CheckCircle className="h-4 w-4" />, <XCircle className="h-4 w-4" />];

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]} flex items-center gap-1`}>
        {icons[status]}
        {statuses[status]}
      </span>
    );
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const isWithinRadius = (opportunity: Opportunity): boolean => {
    if (!userLocation) return false;

    const oppLat = Number(opportunity.latitude) / 1e6;
    const oppLng = Number(opportunity.longitude) / 1e6;
    const distance = calculateDistance(userLocation.lat, userLocation.lng, oppLat, oppLng);

    console.log(`🗺️ Distance check for "${opportunity.title}":`, {
      yourLocation: { lat: userLocation.lat, lng: userLocation.lng },
      oppLocation: { lat: oppLat, lng: oppLng },
      distance: `${(distance / 1000).toFixed(2)} km`,
      allowedRadius: `${Number(opportunity.radius) / 1000} km`,
      withinRadius: distance <= Number(opportunity.radius)
    });

    return distance <= Number(opportunity.radius);
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-xl text-yellow-800">Please connect your wallet to access the Impacter Dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Impacter Dashboard</h1>
        <p className="text-gray-600">Find opportunities, submit proof, and earn rewards</p>
        {userLocation && (
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        )}
      </div>

      
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">My Submissions</h2>

        {mySubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No submissions yet. Start impacting!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mySubmissions.map((submission) => {
              const opportunity = opportunities.find(o => o.id === submission.opportunityId);
              return (
                <div key={submission.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Opportunity #{submission.opportunityId}</p>
                      <p className="text-sm text-gray-500">Submitted: {new Date(Number(submission.submittedAt) * 1000).toLocaleString()}</p>
                    </div>
                    {getSubmissionStatusBadge(submission.status)}
                  </div>

                  {submission.ipfsProofHash && (
                    <img
                      src={ipfsService.getIPFSUrl(submission.ipfsProofHash)}
                      alt="Proof"
                      className="w-full h-48 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                      }}
                    />
                  )}

                  <p className="text-sm text-gray-600">
                    Location: {(Number(submission.latitude) / 1e6).toFixed(6)}, {(Number(submission.longitude) / 1e6).toFixed(6)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Opportunities</h2>

        {loading && opportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No active opportunities at the moment</p>
            <p className="text-gray-500 mt-2">Check back later for new impacter opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {opportunities.map((opportunity) => {
              const withinRadius = isWithinRadius(opportunity);
              return (
                <div key={opportunity.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{opportunity.title}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {categories[opportunity.category]}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{opportunity.description}</p>
                      <p className="text-sm text-gray-500"><strong>Proof Required:</strong> {opportunity.proofRequirements}</p>
                      <p className="text-sm text-gray-500">NGO: {opportunity.ngo.slice(0, 10)}...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-primary-600" />
                      <div>
                        <p className="text-sm text-gray-600">Reward</p>
                        <p className="font-semibold">{opportunity.rewardAmount ? ethers.formatEther(opportunity.rewardAmount) : '0'} IAT</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-africa-600" />
                      <div>
                        <p className="text-sm text-gray-600">Spots Left</p>
                        <p className="font-semibold">{Number(opportunity.maxImpacters || 0) - Number(opportunity.currentImpacters || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Radius</p>
                        <p className="font-semibold">{opportunity.radius.toString()}m</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className={`h-5 w-5 ${withinRadius ? 'text-green-600' : 'text-red-600'}`} />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className={`font-semibold ${withinRadius ? 'text-green-600' : 'text-red-600'}`}>
                          {withinRadius ? 'In Range' : 'Too Far'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedOpportunity(opportunity)}
                    disabled={!withinRadius}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withinRadius ? 'Submit Proof' : 'You must be within the location radius'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-3xl font-bold mb-6">Submit Proof</h2>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedOpportunity.title}</h3>
              <p className="text-gray-600 mb-3">{selectedOpportunity.description}</p>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                <strong>Proof Requirements:</strong> {selectedOpportunity.proofRequirements}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Proof Photo <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleProofFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-700 font-medium">
                      {proofFile ? proofFile.name : 'Click to upload photo'}
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 10MB</p>
                </div>

                {proofFile && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(proofFile)}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg"
                    />
                  </div>
                )}

                
                {modelsLoaded && proofFile && (
                  <div className="mt-4">
                    {verifyingAI ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <Brain className="h-5 w-5 text-blue-600 mr-2 animate-pulse" />
                          <p className="text-sm text-blue-800">AI is analyzing your image...</p>
                        </div>
                      </div>
                    ) : aiVerificationResult ? (
                      <div className={`border rounded-lg p-4 ${
                        aiVerificationResult.isValid
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start mb-2">
                          {aiVerificationResult.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              aiVerificationResult.isValid ? 'text-green-900' : 'text-yellow-900'
                            }`}>
                              AI Verification: {aiVerificationResult.isValid ? 'Passed' : 'Needs Review'}
                            </p>
                            <p className={`text-xs ${
                              aiVerificationResult.isValid ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                              Confidence: {(aiVerificationResult.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>

                        {aiVerificationResult.detectedObjects.length > 0 && (
                          <div className="mt-2">
                            <p className={`text-xs ${
                              aiVerificationResult.isValid ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                              Detected: {aiVerificationResult.detectedObjects.slice(0, 5).join(', ')}
                            </p>
                          </div>
                        )}

                        {aiVerificationResult.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {aiVerificationResult.suggestions.map((suggestion, idx) => (
                              <p key={idx} className={`text-xs ${
                                aiVerificationResult.isValid ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                • {suggestion}
                              </p>
                            ))}
                          </div>
                        )}

                        {aiVerificationResult.needsManualReview && (
                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                            <p className="text-xs text-gray-600">
                              ℹ️ NGO will manually review this submission
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}

                {!modelsLoaded && proofFile && (
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      AI verification loading... Your submission will require manual NGO approval.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Location Verified</p>
                    {userLocation && (
                      <p className="text-sm text-green-700">
                        Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Reward:</strong> {selectedOpportunity.rewardAmount ? ethers.formatEther(selectedOpportunity.rewardAmount) : '0'} IAT
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  You will receive this reward after the NGO approves your submission
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setSelectedOpportunity(null);
                  setProofFile(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={submitProof}
                disabled={loading || !proofFile}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Proof'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}