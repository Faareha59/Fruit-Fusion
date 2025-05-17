import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyBczW5bKIaZGBfiBJ8O2rhxF5MQie0HsUg",
  authDomain: "fruit-acf8e.firebaseapp.com",
  databaseURL: "https://fruit-acf8e-default-rtdb.firebaseio.com",
  projectId: "fruit-acf8e",
  storageBucket: "fruit-acf8e.firebasestorage.app",
  messagingSenderId: "367584970307",
  appId: "1:367584970307:web:8239826708cafab3a236f6"
};

let app;
if (!app) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };