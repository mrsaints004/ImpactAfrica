import { Link } from 'react-router-dom';
import { Sprout, Users, Award, TrendingUp, Shield, Globe } from 'lucide-react';

interface HomeProps {
  account: string | null;
}

export default function Home({ account }: HomeProps) {
  return (
    <div className="animate-fade-in">
      
      <section className="relative bg-gradient-to-r from-primary-600 to-africa-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-slide-up">
              Empowering African Farmers
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Blockchain-powered community funding for sustainable agriculture
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/farmer"
                className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transform hover:scale-105 transition shadow-lg"
              >
                I'm a Farmer
              </Link>
              <Link
                to="/community"
                className="px-8 py-4 bg-africa-500 text-white rounded-lg font-semibold hover:bg-africa-600 transform hover:scale-105 transition shadow-lg"
              >
                Support Farmers
              </Link>
              <Link
                to="/ngo"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transform hover:scale-105 transition"
              >
                For NGOs
              </Link>
            </div>
          </div>
        </div>
      </section>

      
      {account && (
        <section className="py-12 bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">1,234</div>
                <div className="text-gray-600">Projects Funded</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-africa-600 mb-2">$2.5M</div>
                <div className="text-gray-600">Total Pledged</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary-600 mb-2">5,678</div>
                <div className="text-gray-600">Community Members</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-africa-600 mb-2">892</div>
                <div className="text-gray-600">NGO Opportunities</div>
              </div>
            </div>
          </div>
        </section>
      )}

      
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">How Impact Africa Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Sprout className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">For Farmers</h3>
              <p className="text-gray-600 mb-6">
                Create farming projects, receive community pledges, and share harvest returns with supporters. Build your reputation on-chain.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Create project proposals
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Receive community funding
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Share harvest profits
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Build on-chain reputation
                </li>
              </ul>
              <Link
                to="/farmer"
                className="block text-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Start Farming
              </Link>
            </div>

            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105">
              <div className="w-16 h-16 bg-africa-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-africa-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">For Community</h3>
              <p className="text-gray-600 mb-6">
                Pledge tokens to support farmers and earn returns after successful harvests. Make social impact while earning.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-africa-600 mr-2">✓</span>
                  Browse farming projects
                </li>
                <li className="flex items-start">
                  <span className="text-africa-600 mr-2">✓</span>
                  Pledge tokens to farmers
                </li>
                <li className="flex items-start">
                  <span className="text-africa-600 mr-2">✓</span>
                  Earn harvest returns
                </li>
                <li className="flex items-start">
                  <span className="text-africa-600 mr-2">✓</span>
                  Track impact metrics
                </li>
              </ul>
              <Link
                to="/community"
                className="block text-center px-6 py-3 bg-africa-600 text-white rounded-lg font-medium hover:bg-africa-700 transition"
              >
                Support Farmers
              </Link>
            </div>

            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition transform hover:scale-105">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">For NGOs</h3>
              <p className="text-gray-600 mb-6">
                Create Impacter opportunities, verify community work, and reward contributors with tokens and reputation NFTs.
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Post opportunities
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Verify submissions
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Reward Impacters
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  Track social impact
                </li>
              </ul>
              <Link
                to="/ngo"
                className="block text-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Create Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-gradient-to-br from-primary-50 to-africa-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose Impact Africa?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Transparent & Secure</h3>
              <p className="text-gray-600">
                All transactions recorded on Hedera blockchain. Smart contracts ensure trustless operations.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="h-10 w-10 text-africa-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Earn Returns</h3>
              <p className="text-gray-600">
                Support farmers and earn profits after successful harvests. Make impact while earning.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Globe className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community Driven</h3>
              <p className="text-gray-600">
                Governance system lets token holders vote on platform decisions. Shape the future together.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-gradient-to-r from-primary-600 to-africa-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of farmers, supporters, and NGOs building a sustainable future for African agriculture.
          </p>
          {!account ? (
            <div className="text-xl bg-white text-primary-600 rounded-lg p-8 shadow-xl">
              <p className="mb-4">Connect your wallet to get started</p>
              <p className="text-sm text-gray-600">Make sure you're on Hedera Testnet (Chain ID: 296)</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/farmer"
                className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transform hover:scale-105 transition shadow-lg"
              >
                Create Project
              </Link>
              <Link
                to="/community"
                className="px-8 py-4 bg-africa-500 text-white rounded-lg font-semibold hover:bg-africa-600 transform hover:scale-105 transition shadow-lg"
              >
                Browse Projects
              </Link>
              <Link
                to="/staking"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transform hover:scale-105 transition"
              >
                Stake Tokens
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}