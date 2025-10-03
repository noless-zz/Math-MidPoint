// FIX: The errors indicate that Firebase v9 modular imports are failing.
// This suggests an older version of Firebase (v8 or below) is likely being used.
// The fix is to use the namespaced API from Firebase v8.
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

// This robust check prevents re-initialization on hot reloads.
// FIX: Use v8 syntax for app initialization.
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// FIX: Use v8 syntax to get auth and firestore instances.
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db, app };
