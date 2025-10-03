import { getFirestore } from '@firebase/firestore';
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA3UIywHgeGTrJAcuVKqZqpfBO_N5Vf4ws",
  authDomain: "middlepoint-f5127.firebaseapp.com",
  projectId: "middlepoint-f5127",
  storageBucket: "middlepoint-f5127.appspot.com",
  messagingSenderId: "707057089481",
  appId: "1:707057089481:web:1d83479a50cac377900618",
  measurementId: "G-D1F9H37DJX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, app };
