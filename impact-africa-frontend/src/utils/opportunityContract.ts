import { ethers } from 'ethers';
import { web3Provider } from './web3Provider';

const OPPORTUNITY_CONTRACT_ADDRESS = import.meta.env.VITE_OPPORTUNITY_CONTRACT_ADDRESS || '0x5a696abddF8e64b2FCD909650fCb08643fc5Bdf6';

const OPPORTUNITY_ABI = [
  "function submitProof(uint256 opportunityId, string memory ipfsProofHash, int256 latitude, int256 longitude, bool aiVerified, uint256 aiConfidence, bool needsManualReview) external returns (uint256)",
  "function verifySubmission(uint256 submissionId, bool approved) external",
  "function getPendingSubmissions(uint256 opportunityId) external view returns (uint256[] memory)",
  "function submissions(uint256) external view returns (uint256 id, uint256 opportunityId, address volunteer, string ipfsProofHash, int256 latitude, int256 longitude, uint256 submittedAt, uint8 status, bool aiVerified, uint256 aiConfidence, bool needsManualReview)",
  "function opportunities(uint256) external view returns (uint256 id, address ngo, uint8 category, string title, string description, string proofRequirements, int256 latitude, int256 longitude, uint256 radius, uint256 rewardAmount, uint256 maxVolunteers, uint256 currentVolunteers, uint256 stakeAmount, uint256 createdAt, bool active)",
  "function getActiveOpportunities() external view returns (uint256[] memory)",
  "function getOpportunitiesByNGO(address ngo) external view returns (uint256[] memory)",
  "function getSubmissionsByVolunteer(address volunteer) external view returns (uint256[] memory)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed opportunityId, address indexed volunteer)",
  "event SubmissionVerified(uint256 indexed submissionId, address indexed volunteer, bool approved)"
];

export const SubmissionStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2
} as const;

export interface Submission {
  id: string;
  opportunityId: string;
  volunteer: string;
  ipfsProofHash: string;
  latitude: string;
  longitude: string;
  submittedAt: string;
  status: SubmissionStatus;
  aiVerified: boolean;
  aiConfidence: number; 
  needsManualReview: boolean;
}

export interface Opportunity {
  id: string;
  ngo: string;
  category: number;
  title: string;
  description: string;
  proofRequirements: string;
  latitude: string;
  longitude: string;
  radius: string;
  rewardAmount: string;
  maxVolunteers: string;
  currentVolunteers: string;
  stakeAmount: string;
  createdAt: string;
  active: boolean;
}

class OpportunityContractService {
  private getContract(signer?: ethers.Signer) {
    const provider = web3Provider.getProvider();
    return new ethers.Contract(
      OPPORTUNITY_CONTRACT_ADDRESS,
      OPPORTUNITY_ABI,
      signer || provider
    );
  }

  
  async submitProofWithAI(
    opportunityId: number,
    ipfsHash: string,
    latitude: number,
    longitude: number,
    aiVerified: boolean,
    aiConfidence: number,
    needsManualReview: boolean
  ): Promise<string> {
    try {
      const signer = await web3Provider.getSigner();
      const contract = this.getContract(signer);

      
      const latInt = Math.floor(latitude * 1000000);
      const lonInt = Math.floor(longitude * 1000000);

      
      const confidencePercent = Math.floor(aiConfidence * 100);

      const tx = await contract.submitProof(
        opportunityId,
        ipfsHash,
        latInt,
        lonInt,
        aiVerified,
        confidencePercent,
        needsManualReview
      );

      const receipt = await tx.wait();

      
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'SubmissionCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        return parsed?.args.submissionId.toString();
      }

      return receipt.hash;
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      throw new Error(error.reason || error.message || 'Failed to submit proof');
    }
  }

  
  async verifySubmission(submissionId: number, approved: boolean): Promise<void> {
    try {
      const signer = await web3Provider.getSigner();
      const contract = this.getContract(signer);

      const tx = await contract.verifySubmission(submissionId, approved);
      await tx.wait();
    } catch (error: any) {
      console.error('Error verifying submission:', error);
      throw new Error(error.reason || error.message || 'Failed to verify submission');
    }
  }

  
  async getPendingSubmissions(opportunityId: number): Promise<Submission[]> {
    try {
      const contract = this.getContract();
      const submissionIds = await contract.getPendingSubmissions(opportunityId);

      const submissions = await Promise.all(
        submissionIds.map(async (id: bigint) => {
          const submission = await contract.submissions(id);
          return this.formatSubmission(submission);
        })
      );

      return submissions;
    } catch (error: any) {
      console.error('Error getting pending submissions:', error);
      throw new Error(error.reason || error.message || 'Failed to get pending submissions');
    }
  }

  
  async getSubmission(submissionId: number): Promise<Submission> {
    try {
      const contract = this.getContract();
      const submission = await contract.submissions(submissionId);
      return this.formatSubmission(submission);
    } catch (error: any) {
      console.error('Error getting submission:', error);
      throw new Error(error.reason || error.message || 'Failed to get submission');
    }
  }

  
  async getOpportunity(opportunityId: number): Promise<Opportunity> {
    try {
      const contract = this.getContract();
      const opportunity = await contract.opportunities(opportunityId);
      return this.formatOpportunity(opportunity);
    } catch (error: any) {
      console.error('Error getting opportunity:', error);
      throw new Error(error.reason || error.message || 'Failed to get opportunity');
    }
  }

  
  async getActiveOpportunities(): Promise<Opportunity[]> {
    try {
      const contract = this.getContract();
      const opportunityIds = await contract.getActiveOpportunities();

      const opportunities = await Promise.all(
        opportunityIds.map(async (id: bigint) => {
          const opportunity = await contract.opportunities(id);
          return this.formatOpportunity(opportunity);
        })
      );

      return opportunities;
    } catch (error: any) {
      console.error('Error getting active opportunities:', error);
      throw new Error(error.reason || error.message || 'Failed to get active opportunities');
    }
  }

  
  async getOpportunitiesByNGO(ngoAddress: string): Promise<Opportunity[]> {
    try {
      const contract = this.getContract();
      const opportunityIds = await contract.getOpportunitiesByNGO(ngoAddress);

      const opportunities = await Promise.all(
        opportunityIds.map(async (id: bigint) => {
          const opportunity = await contract.opportunities(id);
          return this.formatOpportunity(opportunity);
        })
      );

      return opportunities;
    } catch (error: any) {
      console.error('Error getting NGO opportunities:', error);
      throw new Error(error.reason || error.message || 'Failed to get NGO opportunities');
    }
  }

  
  async getSubmissionsByVolunteer(volunteerAddress: string): Promise<Submission[]> {
    try {
      const contract = this.getContract();
      const submissionIds = await contract.getSubmissionsByVolunteer(volunteerAddress);

      const submissions = await Promise.all(
        submissionIds.map(async (id: bigint) => {
          const submission = await contract.submissions(id);
          return this.formatSubmission(submission);
        })
      );

      return submissions;
    } catch (error: any) {
      console.error('Error getting volunteer submissions:', error);
      throw new Error(error.reason || error.message || 'Failed to get volunteer submissions');
    }
  }

  
  private formatSubmission(data: any): Submission {
    return {
      id: data.id.toString(),
      opportunityId: data.opportunityId.toString(),
      volunteer: data.volunteer,
      ipfsProofHash: data.ipfsProofHash,
      latitude: (Number(data.latitude) / 1000000).toString(),
      longitude: (Number(data.longitude) / 1000000).toString(),
      submittedAt: new Date(Number(data.submittedAt) * 1000).toISOString(),
      status: Number(data.status) as SubmissionStatus,
      aiVerified: data.aiVerified,
      aiConfidence: Number(data.aiConfidence),
      needsManualReview: data.needsManualReview
    };
  }

  
  private formatOpportunity(data: any): Opportunity {
    return {
      id: data.id.toString(),
      ngo: data.ngo,
      category: Number(data.category),
      title: data.title,
      description: data.description,
      proofRequirements: data.proofRequirements,
      latitude: (Number(data.latitude) / 1000000).toString(),
      longitude: (Number(data.longitude) / 1000000).toString(),
      radius: data.radius.toString(),
      rewardAmount: ethers.formatEther(data.rewardAmount),
      maxVolunteers: data.maxVolunteers.toString(),
      currentVolunteers: data.currentVolunteers.toString(),
      stakeAmount: ethers.formatEther(data.stakeAmount),
      createdAt: new Date(Number(data.createdAt) * 1000).toISOString(),
      active: data.active
    };
  }
}

export const opportunityContract = new OpportunityContractService();