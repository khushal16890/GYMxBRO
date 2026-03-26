import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwPcoSCZMGEOPUzraTmmyMChB6-voNSSQ",
  authDomain: "gymxbro-7b45f.firebaseapp.com",
  projectId: "gymxbro-7b45f",
  storageBucket: "gymxbro-7b45f.firebasestorage.app",
  messagingSenderId: "937955274494",
  appId: "1:937955274494:web:bd83f25da785df71547faf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();