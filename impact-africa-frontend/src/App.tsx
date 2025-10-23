import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Sprout, Users, Award, Vote, TrendingUp, Menu, X, Wallet } from 'lucide-react';
import { web3Provider } from './utils/web3Provider';
import toast, { Toaster } from 'react-hot-toast';


import Home from './pages/Home';
import FarmerDashboard from './pages/FarmerDashboard';
import CommunityPledging from './pages/CommunityPledging';
import NGODashboard from './pages/NGODashboard';
import ImpacterDashboard from './pages/ImpacterDashboard';
import Governance from './pages/Governance';
import Staking from './pages/Staking';
import Leaderboard from './pages/Leaderboard';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    
    checkConnection();

    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not detected. Please install MetaMask extension.', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }

    try {
      setConnecting(true);
      toast.loading('Connecting wallet...', { id: 'wallet-connect' });

      const address = await web3Provider.connect();
      setAccount(address);

      
      const provider = web3Provider.getProvider();
      if (provider) {
        const network = await provider.getNetwork();
        if (network.chainId !== 296n) {
          toast('Connected, but please switch to Hedera Testnet in MetaMask', {
            id: 'wallet-connect',
            duration: 5000,
            icon: '⚠️',
            style: {
              background: '#f59e0b',
              color: '#fff',
            },
          });
        } else {
          toast.success(`Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`, {
            id: 'wallet-connect',
            duration: 3000,
            icon: '✅',
          });
        }
      } else {
        toast.success(`Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`, {
          id: 'wallet-connect',
          duration: 3000,
          icon: '✅',
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);

      let errorMessage = 'Failed to connect wallet';
      if (error.message?.includes('User rejected') || error.code === 4001) {
        errorMessage = 'Connection request rejected';
      } else if (error.message?.includes('MetaMask not installed')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || 'Failed to connect wallet';
      }

      toast.error(errorMessage, {
        id: 'wallet-connect',
        duration: 4000,
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    await web3Provider.disconnect();
    setAccount(null);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-africa-50">
        
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
              padding: '16px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <Sprout className="h-8 w-8 text-primary-600" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-africa-600 bg-clip-text text-transparent">
                    Impact Africa
                  </span>
                </Link>
              </div>

              
              <div className="hidden md:flex items-center space-x-4">
                <Link to="/farmer" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Sprout className="h-4 w-4" />
                  <span>Farmers</span>
                </Link>
                <Link to="/community" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Users className="h-4 w-4" />
                  <span>Community</span>
                </Link>
                <Link to="/ngo" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Award className="h-4 w-4" />
                  <span>NGOs</span>
                </Link>
                <Link to="/impacter" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Users className="h-4 w-4" />
                  <span>Impacter</span>
                </Link>
                <Link to="/governance" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Vote className="h-4 w-4" />
                  <span>Governance</span>
                </Link>
                <Link to="/staking" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <TrendingUp className="h-4 w-4" />
                  <span>Staking</span>
                </Link>
                <Link to="/leaderboard" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition">
                  <Award className="h-4 w-4" />
                  <span>Leaderboard</span>
                </Link>

                {account ? (
                  <div className="flex items-center space-x-2">
                    <div className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                      {formatAddress(account)}
                    </div>
                    <button
                      onClick={disconnectWallet}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-africa-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}
              </div>

              
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-gray-700 hover:text-primary-600"
                >
                  {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          
          {menuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link to="/farmer" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Farmers
                </Link>
                <Link to="/community" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Community
                </Link>
                <Link to="/ngo" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  NGOs
                </Link>
                <Link to="/impacter" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Impacter
                </Link>
                <Link to="/governance" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Governance
                </Link>
                <Link to="/staking" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Staking
                </Link>
                <Link to="/leaderboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600">
                  Leaderboard
                </Link>
                {account ? (
                  <div className="px-3 py-2">
                    <div className="mb-2 text-sm font-medium text-gray-700">{formatAddress(account)}</div>
                    <button
                      onClick={disconnectWallet}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    disabled={connecting}
                    className="mx-3 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>

        
        <Routes>
          <Route path="/" element={<Home account={account} />} />
          <Route path="/farmer" element={<FarmerDashboard account={account} />} />
          <Route path="/community" element={<CommunityPledging account={account} />} />
          <Route path="/ngo" element={<NGODashboard account={account} />} />
          <Route path="/impacter" element={<ImpacterDashboard account={account} />} />
          <Route path="/governance" element={<Governance account={account} />} />
          <Route path="/staking" element={<Staking account={account} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>

        
        <footer className="bg-gray-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Sprout className="h-8 w-8 text-primary-400" />
                  <span className="text-xl font-bold">Impact Africa</span>
                </div>
                <p className="text-gray-400">
                  Empowering African farmers through blockchain technology and community support.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/farmer" className="hover:text-white">For Farmers</Link></li>
                  <li><Link to="/community" className="hover:text-white">Community Pledging</Link></li>
                  <li><Link to="/ngo" className="hover:text-white">For NGOs</Link></li>
                  <li><Link to="/governance" className="hover:text-white">Governance</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Network</h3>
                <p className="text-gray-400">Built on Hedera EVM</p>
                <p className="text-gray-400 mt-2">Testnet: Chain ID 296</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Impact Africa. Empowering communities through blockchain.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;