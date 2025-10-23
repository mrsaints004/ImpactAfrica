import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY || '';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

export class IPFSService {
  
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        timestamp: Date.now().toString(),
      },
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data`,
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  
  async uploadJSON(data: any): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  
  getIPFSUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  
  async fetchFromIPFS(hash: string): Promise<any> {
    try {
      const response = await axios.get(this.getIPFSUrl(hash));
      return response.data;
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw new Error('Failed to fetch from IPFS');
    }
  }
}

export const ipfsService = new IPFSService();