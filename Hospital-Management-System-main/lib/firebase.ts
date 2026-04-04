// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbHhl7nwjRjIZE0qiAX8FC577UqYfQby8",
  authDomain: "smart-hospital-managemen-d2fb0.firebaseapp.com",
  projectId: "smart-hospital-managemen-d2fb0",
  storageBucket: "smart-hospital-managemen-d2fb0.firebasestorage.app",
  messagingSenderId: "718372719687",
  appId: "1:718372719687:web:d0ae99aa3d9a0033e23562"
};

// Initialize Firebase only once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;