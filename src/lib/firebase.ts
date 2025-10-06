import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAu2cxEHXBZhkxxUlTQ3CKjTU6bHs6mtGg",
  authDomain: "brand-guess-game.firebaseapp.com",
  projectId: "brand-guess-game",
  storageBucket: "brand-guess-game.firebasestorage.app",
  messagingSenderId: "28228700673",
  appId: "1:28228700673:web:db59ab5b2c8d9e63704e00"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
