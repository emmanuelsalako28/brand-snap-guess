import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIaA1dNaKY8tXZcek0SvkLs9lxi1nZAw4",
  authDomain: "brand-guess-game-2026.firebaseapp.com",
  projectId: "brand-guess-game-2026",
  storageBucket: "brand-guess-game-2026.firebasestorage.app",
  messagingSenderId: "794425490811",
  appId: "1:794425490811:web:677ac7b08f019d965351de"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
