// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxHAiZOX5nA1Zq_xXOB8WoJMVa2dolbXY",
  authDomain: "fir-datastore-7b6f7.firebaseapp.com",
  projectId: "fir-datastore-7b6f7",
  storageBucket: "fir-datastore-7b6f7.firebasestorage.app",
  messagingSenderId: "168448643776",
  appId: "1:168448643776:web:89ac86716ec4778d4d5325",
  measurementId: "G-S3PGCT5SQF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);