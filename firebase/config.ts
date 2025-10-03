// Fix: Updated Firebase imports and initialization to use the v8 namespaced API.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA3UIywHgeGTrJAcuVKqZqpfBO_N5Vf4ws",
  authDomain: "middlepoint-f5127.firebaseapp.com",
  projectId: "middlepoint-f5127",
  storageBucket: "middlepoint-f5127.appspot.com",
  messagingSenderId: "707057089481",
  appId: "1:707057089481:web:1d83479a50cac377900618",
  measurementId: "G-D1F9H37DJX"
};

// Initialize Firebase using the v8 namespaced syntax
// Fix: Changed to default import of firebase to access properties like .apps and .initializeApp
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, app };