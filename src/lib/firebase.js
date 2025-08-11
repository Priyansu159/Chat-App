import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chatapp-794e2.firebaseapp.com",
  projectId: "chatapp-794e2",
  storageBucket: "chatapp-794e2.firebasestorage.app",
  messagingSenderId: "808040555631",
  appId: "1:808040555631:web:9b49fd4ea062090ebe599a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()