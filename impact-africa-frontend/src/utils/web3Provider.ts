import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';


import ImpactTokenJSON from '../contracts/ImpactToken.json';
import ReputationNFTJSON from '../contracts/ReputationNFT.json';
import FarmingProjectJSON from '../contracts/FarmingProject.json';
import OpportunityContractJSON from '../contracts/OpportunityContract.json';
import StakingPoolJSON from '../contracts/StakingPool.json';
import GovernanceJSON from '../contracts/Governance.json';
import contractAddressesJSON from '../contracts/addresses.json';

const ImpactTokenABI = ImpactTokenJSON.abi;
const ReputationNFTABI = ReputationNFTJSON.abi;
const FarmingProjectABI = FarmingProjectJSON.abi;
const OpportunityContractABI = OpportunityContractJSON.abi;
const StakingPoolABI = StakingPoolJSON.abi;
const GovernanceABI = GovernanceJSON.abi;


const contractAddresses = {
  ImpactToken: import.meta.env.VITE_IMPACT_TOKEN_ADDRESS || contractAddressesJSON.ImpactToken,
  ReputationNFT: import.meta.env.VITE_REPUTATION_NFT_ADDRESS || contractAddressesJSON.ReputationNFT,
  FarmingProject: import.meta.env.VITE_FARMING_PROJECT_ADDRESS || contractAddressesJSON.FarmingProject,
  OpportunityContract: import.meta.env.VITE_OPPORTUNITY_CONTRACT_ADDRESS || contractAddressesJSON.OpportunityContract,
  StakingPool: import.meta.env.VITE_STAKING_POOL_ADDRESS || contractAddressesJSON.StakingPool,
  Governance: import.meta.env.VITE_GOVERNANCE_ADDRESS || contractAddressesJSON.Governance,
};

export class Web3Provider {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private address: string | null = null;
  private networkChangeListenerAdded: boolean = false;

  async connect(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.');
    }

    try {
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.address = accounts[0];
      console.log('Account connected:', this.address);

      
      this.provider = new BrowserProvider(window.ethereum);
      const network = await this.provider.getNetwork();
      console.log('Current network chain ID:', network.chainId);

      
      if (network.chainId !== 296n) {
        console.log('Not on Hedera Testnet (current chain:', network.chainId, '), attempting to switch...');

        
        const switched = await this.switchToHederaTestnet();

        if (switched) {
          console.log('Network switched successfully, reinitializing provider...');
          
          this.provider = new BrowserProvider(window.ethereum);
        } else {
          console.warn('Could not switch to Hedera Testnet. User may need to switch manually.');
          
          console.warn('⚠️ Please switch to Hedera Testnet manually in MetaMask');
        }
      } else {
        console.log('✅ Already on Hedera Testnet');
      }

      
      this.signer = await this.provider.getSigner();


      this.setupNetworkChangeListener();

      console.log('✅ Successfully connected to:', this.address);
      if (!this.address) throw new Error('Failed to get wallet address');
      return this.address;
    } catch (error: any) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  private setupNetworkChangeListener(): void {
    if (!window.ethereum || this.networkChangeListenerAdded) return;

    window.ethereum.on('chainChanged', async (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      console.log('Network changed to chain ID:', chainId);

      if (chainId !== 296) {
        console.warn('Switched away from Hedera Testnet. Please switch back.');
        
        
      } else {
        console.log('Connected to Hedera Testnet');
        
        if (window.ethereum) {
          this.provider = new BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        }
      }
    });

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        console.log('User disconnected wallet');
        this.disconnect();
      } else {
        console.log('Account changed to:', accounts[0]);
        this.address = accounts[0];
        
        if (this.provider) {
          this.provider.getSigner().then(signer => {
            this.signer = signer;
          });
        }
      }
    });

    this.networkChangeListenerAdded = true;
  }

  async switchToHederaTestnet(): Promise<boolean> {
    if (!window.ethereum) {
      console.error('MetaMask not available');
      return false;
    }

    try {
      
      console.log('Attempting to switch to Hedera Testnet (Chain ID: 296, Hex: 0x128)...');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x128' }], 
      });
      console.log('✅ Successfully switched to Hedera Testnet');
      return true;
    } catch (switchError: any) {
      console.log('Switch error code:', switchError.code, 'message:', switchError.message);

      
      if (switchError.code === 4902) {
        try {
          console.log('Hedera Testnet not found in wallet. Adding it now...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x128',
                chainName: 'Hedera Testnet',
                nativeCurrency: {
                  name: 'HBAR',
                  symbol: 'HBAR',
                  decimals: 18,
                },
                rpcUrls: ['https://testnet.hashio.io/api'],
                blockExplorerUrls: ['https://hashscan.io/testnet'],
              },
            ],
          });
          console.log('✅ Successfully added Hedera Testnet to wallet');
          return true;
        } catch (addError: any) {
          console.error('Failed to add Hedera Testnet:', addError);
          console.error('Add error code:', addError.code, 'message:', addError.message);
          if (addError.code === 4001) {
            console.log('User rejected the request to add Hedera Testnet');
          }
          return false;
        }
      } else if (switchError.code === 4001) {
        
        console.log('User rejected the request to switch networks');
        return false;
      } else {
        console.error('Unknown error switching to Hedera Testnet');
        console.error('Error details:', switchError);
        return false;
      }
    }
  }

  getAddress(): string | null {
    return this.address;
  }

  getSigner(): JsonRpcSigner | null {
    return this.signer;
  }

  getProvider(): BrowserProvider | null {
    return this.provider;
  }

  
  getImpactToken(): Contract | null {
    if (!this.signer || !contractAddresses.ImpactToken) return null;
    return new Contract(contractAddresses.ImpactToken, ImpactTokenABI, this.signer);
  }

  getReputationNFT(): Contract | null {
    if (!this.signer || !contractAddresses.ReputationNFT) return null;
    return new Contract(contractAddresses.ReputationNFT, ReputationNFTABI, this.signer);
  }

  getFarmingProject(): Contract | null {
    if (!this.signer || !contractAddresses.FarmingProject) return null;
    return new Contract(contractAddresses.FarmingProject, FarmingProjectABI, this.signer);
  }

  getOpportunityContract(): Contract | null {
    if (!this.signer || !contractAddresses.OpportunityContract) return null;
    return new Contract(contractAddresses.OpportunityContract, OpportunityContractABI, this.signer);
  }

  getStakingPool(): Contract | null {
    if (!this.signer || !contractAddresses.StakingPool) return null;
    return new Contract(contractAddresses.StakingPool, StakingPoolABI, this.signer);
  }

  getGovernance(): Contract | null {
    if (!this.signer || !contractAddresses.Governance) return null;
    return new Contract(contractAddresses.Governance, GovernanceABI, this.signer);
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }

  isConnected(): boolean {
    return this.address !== null;
  }

  
  getContractAddresses() {
    return contractAddresses;
  }
}


export const web3Provider = new Web3Provider();


declare global {
  interface Window {
    ethereum?: any;
  }
}