import React, { useState } from 'react';

const LiveScanButton = ({ onScanComplete }) => {
  // State to track if a scan is currently running
  const [isScanning, setIsScanning] = useState(false);
  
  // State to hold the success message after a scan
  const [scanResult, setScanResult] = useState(null);
  
  // State to hold any error messages
  const [error, setError] = useState(null);

  const handleScan = async () => {
    // 1. Show a loading state when the button is clicked
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    try {
      const token = localStorage.getItem('token') || '';
      
      // 2. Make a POST request to our new Flask /api/trigger-scan endpoint
      const response = await fetch('http://localhost:5000/api/trigger-scan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Scan failed. Server returned ${response.status}`);
      }

      // 3. Receive the JSON response containing the number of matches found
      const data = await response.json();
      
      // 4. Show a success message
      setScanResult(`Scan complete! Found ${data.matches} threats in the wild.`);
      
      // 5. Trigger a refresh of the main alerts table
      // This calls the function passed from DashboardLayout.jsx
      if (onScanComplete) {
        onScanComplete();
      }
      
    } catch (err) {
      console.error("Live scan error:", err);
      setError("An error occurred during the live scan. Please try again.");
    } finally {
      // Always remove the loading state, regardless of success or failure
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
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Live Intelligence Scan</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Query the live URLhaus malware feed to cross-reference against your configured keywords in real-time.
          </p>
        </div>
        
        {/* The Trigger Button */}
        <button 
          onClick={handleScan} 
          disabled={isScanning}
          style={{
            backgroundColor: isScanning ? 'var(--text-secondary)' : 'var(--status-alert)',
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
          {isScanning ? 'Scanning the wild...' : 'Run Live Intelligence Scan'}
        </button>
      </div>
      
      {/* Feedback Messages */}
      {scanResult && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '10px', 
          backgroundColor: 'rgba(0, 255, 136, 0.1)', 
          color: 'var(--status-secure)', 
          borderRadius: '4px',
          fontWeight: '500' 
        }}>
          ✓ {scanResult}
        </div>
      )}
      
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

export default LiveScanButton;
