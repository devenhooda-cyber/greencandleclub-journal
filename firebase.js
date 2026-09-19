// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQmsHLIndWu3UgNPxd8NOYqn96_OdX4Ng",
  authDomain: "greencandleclub-journal.firebaseapp.com",
  databaseURL: "https://greencandleclub-journal-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "greencandleclub-journal",
  storageBucket: "greencandleclub-journal.firebasestorage.app",
  messagingSenderId: "727009745521",
  appId: "1:727009745521:web:560fea9a1a9c902a8099d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "greencandleclub");