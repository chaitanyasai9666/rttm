import React, { useState } from 'react';

const TargetScanButton = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    try {
      const token = localStorage.getItem('token') || '';
      // Make POST request to the new /api/target-scan endpoint
      const response = await fetch('http://localhost:5000/api/target-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setScanResult(data);
        if (onScanComplete) {
          onScanComplete();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to scan target URLs.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while scanning target URLs. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ 
      marginBottom: '1rem', 
      padding: '1.5rem', 
      backgroundColor: 'rgba(255,255,255,0.03)', 
      borderRadius: '8px', 
      border: '1px solid rgba(255,255,255,0.1)' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Target URL Scanner</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manually scan your configured Target URLs against your keywords.
          </p>
        </div>
        
        <button 
          onClick={handleScan} 
          disabled={isScanning}
          style={{
            backgroundColor: isScanning ? 'var(--text-secondary)' : 'var(--status-secure)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'background-color 0.2s ease',
            minWidth: '200px'
          }}
        >
          {isScanning ? 'Scanning Target URLs...' : 'Scan Specific Target URLs'}
        </button>
      </div>

      {/* Display Success Message showing exact URLs processed and threats found */}
      {scanResult && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(0, 255, 136, 0.1)', 
          color: 'var(--status-secure)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          ✓ Scan Complete! Found {scanResult.matches_found} threats. Exact URLs processed: {scanResult.urls_scanned}
        </div>
      )}

      {/* Display Error Message */}
      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(255, 68, 68, 0.1)', 
          color: 'var(--status-alert)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
};

export default TargetScanButton;
