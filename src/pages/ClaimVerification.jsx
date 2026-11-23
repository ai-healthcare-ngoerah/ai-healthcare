import React, { useState } from 'react';
import { verifyClaim } from '../services/api';
import './ClaimVerification.css';

const ClaimVerification = () => {
  const [patientId, setPatientId] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('Idle'); // Idle, Pending Audit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    // Patient ID Validation
    if (!patientId) {
      newErrors.patientId = 'Patient ID is required';
    } else if (!/^RM-/.test(patientId)) {
      newErrors.patientId = 'Patient ID must start with RM-';
    }

    // ICD-10 Validation
    if (!icdCode) {
      newErrors.icdCode = 'ICD-10 Code is required';
    } else if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(icdCode)) {
      newErrors.icdCode = 'Invalid ICD-10 Code format';
    }

    // Claim Amount Validation
    if (!claimAmount) {
      newErrors.claimAmount = 'Claim amount is required';
    } else if (Number(claimAmount) <= 0) {
      newErrors.claimAmount = 'Claim amount must be greater than zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await verifyClaim({
        patient_id: patientId,
        icd_code: icdCode,
        claim_amount: Number(claimAmount)
      });

      setSuccessMessage('Claim Submitted Successfully');
      setStatus('Pending Audit');
    } catch (error) {
      console.error('Submission failed', error);
      alert(`Error: ${error.message || 'Failed to submit claim'}`);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  return (
    <div className="claim-verification-container">
      <h2>Healthcare Claim & Medical Audit Verification Portal</h2>
      
      {successMessage && (
        <div className="toast success" data-testid="success-toast">
          {successMessage}
        </div>
      )}

      <div className="status-container">
        <span>Status: </span>
        <span data-testid="claim-status-badge" className={`badge ${status.toLowerCase().replace(' ', '-')}`}>
          {status}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="claim-form">
        <div className="form-group">
          <label htmlFor="patientId">Patient ID (e.g. RM-99201)</label>
          <input
            id="patientId"
            type="text"
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.patientId && <span className="error-text" data-testid="error-patient-id">{errors.patientId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="icdCode">ICD-10 Diagnosis Code (e.g. A09)</label>
          <input
            id="icdCode"
            type="text"
            placeholder="Enter ICD-10 Code"
            value={icdCode}
            onChange={(e) => setIcdCode(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.icdCode && <span className="error-text" data-testid="error-icd-code">{errors.icdCode}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="claimAmount">Claim Amount (IDR)</label>
          <input
            id="claimAmount"
            type="number"
            placeholder="Enter Claim Amount"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.claimAmount && <span className="error-text" data-testid="error-claim-amount">{errors.claimAmount}</span>}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-btn"
          name="Submit Claim"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Claim'}
        </button>
      </form>
    </div>
  );
};

export default ClaimVerification;
