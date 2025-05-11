// Firebase configuration file
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBjRbmQXEBGGXE7ukPyKVH_zXZNxGFEJA",
  authDomain: "fruit-acf8e.firebaseapp.com",
  databaseURL: "https://fruit-acf8e-default-rtdb.firebaseio.com",
  projectId: "fruit-acf8e",
  storageBucket: "fruit-acf8e.appspot.com",
  messagingSenderId: "1039460737097",
  appId: "1:1039460737097:web:c8a3c4d1c5c6c6e0e5c6c6",
  measurementId: "G-PNR38CD67P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Export the services
export {
  auth,
  database,
  storage,
  db
};

export default app;
