// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkPQPzhbCtPxR9Dh8Wv5p76hE-b3sr0jA",
  authDomain: "iptracker-d6aac.firebaseapp.com",
  databaseURL: "https://iptracker-d6aac-default-rtdb.firebaseio.com",
  projectId: "iptracker-d6aac",
  storageBucket: "iptracker-d6aac.firebasestorage.app",
  messagingSenderId: "352009531638",
  appId: "1:352009531638:web:50ef03f74631115cddfcd7",
  measurementId: "G-RZKLS087CN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


