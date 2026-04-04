// lib/db.ts - Real-time Firestore functions and PostgreSQL support
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// Firestore functions - safe for client and server
// Listen to patients in real-time
export function listenToPatients(callback: (patients: any[]) => void) {
  const q = collection(db, "patients");
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  });
}

// Listen to doctors in real-time
export function listenToDoctors(callback: (doctors: any[]) => void) {
  const q = collection(db, "doctors");
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  });
}

// Add a new patient (example function)
export async function addPatient(patientData: any) {
  try {
    const docRef = await addDoc(collection(db, "patients"), {
      ...patientData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding patient:", error);
    throw error;
  }
}