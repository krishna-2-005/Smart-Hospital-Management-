'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FirebaseTest() {
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribePatients = onSnapshot(
      collection(db, "patients"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(data);
      },
      (err) => {
        setError(err.message);
      }
    );

    const unsubscribeDoctors = onSnapshot(
      collection(db, "doctors"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(data);
      },
      (err) => {
        setError(err.message);
      }
    );

    setLoading(false);

    return () => {
      unsubscribePatients();
      unsubscribeDoctors();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '50px', fontSize: '18px' }}>Connecting to Firebase Firestore...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '50px', color: 'red', fontSize: '18px' }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔥 Firebase Real-time Connection Test</h1>
      <p style={{ color: 'green', fontWeight: 'bold', fontSize: '18px' }}>
        ✅ If you see data below, Firebase is successfully connected!
      </p>

      <h2>Patients ({patients.length})</h2>
      {patients.length === 0 ? (
        <p>No patients found. Add some in Firestore console.</p>
      ) : (
        patients.map((patient) => (
          <div key={patient.id} style={{ margin: '10px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <strong>{patient.name}</strong> — Age: {patient.age} — Phone: {patient.phone}
          </div>
        ))
      )}

      <h2 style={{ marginTop: '40px' }}>Doctors ({doctors.length})</h2>
      {doctors.length === 0 ? (
        <p>No doctors found. Add some in Firestore console.</p>
      ) : (
        doctors.map((doctor) => (
          <div key={doctor.id} style={{ margin: '10px 0', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <strong>{doctor.name}</strong> — {doctor.specialization}
          </div>
        ))
      )}
    </div>
  );
}