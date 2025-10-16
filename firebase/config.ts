// Fix: Use Firebase v8 imports to resolve module export errors.
// Fix: Updated Firebase imports to use the v8 SDK directly, removing the compat layer.
// @fixtsc
// Re-enabling compat layer as v8 syntax is used with what appears to be a v9+ SDK installation.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// Firestore is re-enabled to support email/password account creation.
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

// Initialize Firebase
// Fix: Use v8 syntax for initialization.
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Fix: Use v8 syntax to get auth instance.
const auth = firebase.auth();

// Initialize Firestore
const db = firebase.firestore();

// Disabled Firestore persistence as it likely conflicts with auth persistence in sandboxed environments.
/*
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence initialization failed: Another tab might be open.', err);
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported in this browser.', err);
    }
  });
*/

export { auth, db, app };