
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDIWERIxJ93tBxBbxw6xEcEwNxYahcY3YE",
  authDomain: "microondas-queue.firebaseapp.com",
  projectId: "microondas-queue",
  storageBucket: "microondas-queue.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
