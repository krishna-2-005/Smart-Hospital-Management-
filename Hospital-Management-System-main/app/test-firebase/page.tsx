'use client';

import { useEffect, useState } from 'react';

export default function FirebaseTest() {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firestore connection disabled - requires proper security rules configuration
    // To enable: Configure Firestore rules to allow read access, then uncomment below
    /*
    try {
      const unsubscribePatients = listenToPatients((data) => {
        setPatients(data);
      });

      const unsubscribeDoctors = listenToDoctors((data) => {
        setDoctors(data);
      });

      setLoading(false);

      return () => {
        unsubscribePatients();
        unsubscribeDoctors();
      };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
    */
  }, []);

  if (loading) return <div style={{ padding: '50px' }}>Connecting to Firebase...</div>;
  if (error) return <div style={{ padding: '50px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>🔥 Firebase Connection Test</h1>
      <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '20px' }}>
        <p style={{ margin: '0', color: '#856404' }}>
          <strong>⚠️ Firestore Disabled</strong><br />
          This page requires proper Firestore security rules configuration.
          <br /><br />
          <strong>To enable Firestore:</strong>
          <ol style={{ marginTop: '10px' }}>
            <li>Go to your Firebase Console: <code>console.firebase.google.com</code></li>
            <li>Navigate to Firestore Database → Rules</li>
            <li>Set up appropriate security rules (currently denying all access)</li>
            <li>Then uncomment the Firestore code in this page component</li>
          </ol>
        </p>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
        <p style={{ color: '#004085' }}>
          <strong>Current Status:</strong> Firestore integration is available but disabled for development.
          <br />
          The app is configured to use both Firestore (real-time) and PostgreSQL (structured data) backends.
        </p>
      </div>
    </div>
  );
}