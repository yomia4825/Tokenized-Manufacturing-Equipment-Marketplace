import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
const mockPrincipal = (address) => ({ address });
const mockTxSender = mockPrincipal('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
const mockAdmin = mockTxSender;
const mockVerifier = mockPrincipal('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG');

describe('Condition Verification Contract', () => {
  let authorizedVerifiers = new Map();
  let conditionReports = new Map();
  let reportIdCounter = 0;
  let admin = mockAdmin;
  
  // Mock contract functions
  const addVerifier = (verifier) => {
    if (mockTxSender !== admin) {
      return { error: 100 };
    }
    
    authorizedVerifiers.set(verifier.address, true);
    return { value: true };
  };
  
  const removeVerifier = (verifier) => {
    if (mockTxSender !== admin) {
      return { error: 100 };
    }
    
    authorizedVerifiers.delete(verifier.address);
    return { value: true };
  };
  
  const isAuthorizedVerifier = (address) => {
    return authorizedVerifiers.get(address.address) || false;
  };
  
  const submitConditionReport = (equipmentId, conditionRating, notes, maintenanceHistory, imagesHash) => {
    if (!isAuthorizedVerifier(mockTxSender)) {
      return { error: 400 };
    }
    
    if (conditionRating > 10) {
      return { error: 401 };
    }
    
    const newReportId = reportIdCounter + 1;
    reportIdCounter = newReportId;
    
    const key = `${equipmentId}-${newReportId}`;
    conditionReports.set(key, {
      verifier: mockTxSender,
      conditionRating,
      inspectionDate: 123, // Mock block height
      notes,
      maintenanceHistory,
      imagesHash
    });
    
    return { value: newReportId };
  };
  
  const getConditionReport = (equipmentId, reportId) => {
    const key = `${equipmentId}-${reportId}`;
    return conditionReports.get(key);
  };
  
  const getLatestReportId = () => {
    return reportIdCounter;
  };
  
  beforeEach(() => {
    authorizedVerifiers.clear();
    conditionReports.clear();
    reportIdCounter = 0;
    admin = mockAdmin;
  });
  
  it('should add an authorized verifier', () => {
    const result = addVerifier(mockVerifier);
    
    expect(result).toEqual({ value: true });
    expect(isAuthorizedVerifier(mockVerifier)).toBe(true);
  });
  
  it('should remove an authorized verifier', () => {
    addVerifier(mockVerifier);
    expect(isAuthorizedVerifier(mockVerifier)).toBe(true);
    
    const result = removeVerifier(mockVerifier);
    
    expect(result).toEqual({ value: true });
    expect(isAuthorizedVerifier(mockVerifier)).toBe(false);
  });
  
  it('should submit a condition report', () => {
    // First authorize the verifier
    addVerifier(mockVerifier);
    
    // Change tx-sender to verifier
    const originalSender = mockTxSender;
    Object.defineProperty(mockTxSender, 'address', { value: mockVerifier.address });
    
    const result = submitConditionReport(
        1, // equipment ID
        8, // condition rating (1-10)
        'Equipment is in good condition with minor wear',
        'Regular maintenance performed every 3 months',
        Buffer.from('imagehash123', 'utf-8')
    );
    
    expect(result).toEqual({ value: 1 });
    
    const report = getConditionReport(1, 1);
    expect(report).toHaveProperty('conditionRating', 8);
    expect(report).toHaveProperty('notes', 'Equipment is in good condition with minor wear');
    
    // Restore original sender
    Object.defineProperty(mockTxSender, 'address', { value: originalSender.address });
  });
  
  it('should not allow unauthorized verifiers to submit reports', () => {
    // Don't add the verifier to authorized list
    
    // Change tx-sender to verifier
    const originalSender = mockTxSender;
    Object.defineProperty(mockTxSender, 'address', { value: mockVerifier.address });
    
    const result = submitConditionReport(
        1, // equipment ID
        8, // condition rating
        'Equipment is in good condition',
        'Regular maintenance',
        Buffer.from('imagehash123', 'utf-8')
    );
    
    expect(result).toEqual({ error: 400 });
    
    // Restore original sender
    Object.defineProperty(mockTxSender, 'address', { value: originalSender.address });
  });
  
  it('should validate condition rating range', () => {
    // First authorize the verifier
    addVerifier(mockVerifier);
    
    // Change tx-sender to verifier
    const originalSender = mockTxSender;
    Object.defineProperty(mockTxSender, 'address', { value: mockVerifier.address });
    
    const result = submitConditionReport(
        1, // equipment ID
        11, // condition rating (invalid: > 10)
        'Equipment is in good condition',
        'Regular maintenance',
        Buffer.from('imagehash123', 'utf-8')
    );
    
    expect(result).toEqual({ error: 401 });
    
    // Restore original sender
    Object.defineProperty(mockTxSender, 'address', { value: originalSender.address });
  });
});
