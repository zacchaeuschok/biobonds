import React, { useState } from 'react';
import { xrplService } from '../lib/xrpl';
import { useXRPLStore } from '../lib/store';

/**
 * Component for healthcare providers to issue verifiable credentials
 * for health outcomes on the XRPL
 */
export function CredentialIssuer({ 
  bondId,
  patientAddress,
  onCredentialIssued 
}) {
  const { wallet, providers } = useXRPLStore();
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    credentialType: 'HealthOutcome',
    outcomeDescription: '',
    outcomeValue: '',
    outcomeDate: new Date().toISOString().split('T')[0],
    expirationDays: 365
  });

  // Find the provider that matches the current wallet
  const currentProvider = providers.find(p => p.address === wallet?.address);
  const isProvider = !!currentProvider;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isProvider) {
      setError('Only healthcare providers can issue credentials');
      return;
    }
    
    if (!wallet || !wallet.address) {
      setError('Please connect your provider wallet first');
      return;
    }
    
    if (!patientAddress) {
      setError('Patient address is required');
      return;
    }
    
    try {
      setIsIssuing(true);
      setError('');
      setSuccess('');
      
      const outcomeData = {
        bondId,
        description: formData.outcomeDescription,
        value: formData.outcomeValue,
        date: formData.outcomeDate,
        providerName: currentProvider.name
      };
      
      // Issue the credential on XRPL
      const credential = await xrplService.createHealthCredential({
        issuerAddress: wallet.address,
        subjectAddress: patientAddress,
        credentialType: formData.credentialType,
        outcomeData,
        expirationDays: parseInt(formData.expirationDays)
      });
      
      setSuccess('Health credential successfully issued on XRPL!');
      
      if (onCredentialIssued) {
        onCredentialIssued(credential);
      }
      
      // Reset form
      setFormData({
        ...formData,
        outcomeDescription: '',
        outcomeValue: ''
      });
      
    } catch (err) {
      console.error('Failed to issue credential:', err);
      setError(err.message || 'Failed to issue credential');
    } finally {
      setIsIssuing(false);
    }
  };

  if (!isProvider) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-yellow-700">
          Only healthcare providers can issue health credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-4">Issue Health Outcome Credential</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Credential Type
          </label>
          <select
            name="credentialType"
            value={formData.credentialType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="HealthOutcome">Health Outcome</option>
            <option value="ScreeningCompletion">Screening Completion</option>
            <option value="VaccinationRecord">Vaccination Record</option>
            <option value="LabResult">Lab Result</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Outcome Description
          </label>
          <input
            type="text"
            name="outcomeDescription"
            value={formData.outcomeDescription}
            onChange={handleInputChange}
            placeholder="e.g., Diabetes Screening Completed"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Outcome Value
          </label>
          <input
            type="text"
            name="outcomeValue"
            value={formData.outcomeValue}
            onChange={handleInputChange}
            placeholder="e.g., HbA1c reduced to 5.7%"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Outcome Date
          </label>
          <input
            type="date"
            name="outcomeDate"
            value={formData.outcomeDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Expiration (days)
          </label>
          <input
            type="number"
            name="expirationDays"
            value={formData.expirationDays}
            onChange={handleInputChange}
            min="1"
            max="3650"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Patient Address
          </label>
          <input
            type="text"
            value={patientAddress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            disabled
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Issuer (Provider)
          </label>
          <input
            type="text"
            value={`${currentProvider?.name} (${wallet?.address})`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            disabled
          />
        </div>
        
        <button
          type="submit"
          disabled={isIssuing}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isIssuing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isIssuing ? 'Issuing Credential...' : 'Issue Credential on XRPL'}
        </button>
      </form>
    </div>
  );
}
