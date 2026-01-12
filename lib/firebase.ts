// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBNjf-50r_afCJro0NRQVRA9L3PBmvEumY",
  authDomain: "melaner-57aed.firebaseapp.com",
  projectId: "melaner-57aed",
  storageBucket: "melaner-57aed.firebasestorage.app",
  messagingSenderId: "933785572498",
  appId: "1:933785572498:web:7a3ae559efe1971adfc24b",
  measurementId: "G-T6GB9X6NGT"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);