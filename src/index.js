// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import './global.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const firebaseConfig = {
  apiKey: "AIzaSyAuvZyoIoYnxmYGG0XhgoGb1pITlya_xLA",
  authDomain: "fix-me-database.firebaseapp.com",
  databaseURL: "https://fix-me-database-default-rtdb.firebaseio.com",
  projectId: "fix-me-database",
  storageBucket: "fix-me-database.appspot.com",
  messagingSenderId: "230427204647",
  appId: "1:230427204647:web:a1653bd4ed842165dfc202",
  measurementId: "G-7EKEM0NKDQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set up an authentication listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is signed in', user);
    // You can set the user in your app's state here if needed
  } else {
    console.log('User is signed out');
    // Handle the case where the user is signed out
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals(console.log);

reportWebVitals();
