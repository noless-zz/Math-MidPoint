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


// --- Firestore Offline Support Configuration ---
// The following configuration is added to address the "Could not reach Cloud Firestore backend"
// error and improve the application's resilience to network issues.

try {
  // Firestore settings must be applied before any other Firestore operations.
  db.settings({
    // experimentalForceLongPolling can help bypass issues with WebSockets,
    // which is a potential cause for connectivity problems in some network environments.
    experimentalForceLongPolling: true,
    // Use unlimited cache size for offline data.
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  });

  // Enable offline persistence. This allows the app to function with cached data
  // when the network is unavailable and synchronizes data when the connection is restored.
  // 'synchronizeTabs: true' ensures data consistency across multiple browser tabs.
  db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // This error can occur if the app is open in multiple tabs and persistence
        // is being initialized in all of them. `synchronizeTabs` helps, but
        // we log it for debugging.
        console.warn('Firestore persistence initialization failed: Another tab might be open.', err);
      } else if (err.code === 'unimplemented') {
        // The browser does not support the features required for persistence.
        console.warn('Firestore persistence is not supported in this browser.', err);
      }
    });
} catch (error) {
    console.error("Failed to apply Firestore offline settings:", error);
}


export { auth, db, app };