import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAsf8ZYG4Ko8dfOXPqBFtRDl9mUPsKd6Gs",
    authDomain: "launch-os-e84de.firebaseapp.com",
    projectId: "launch-os-e84de",
    storageBucket: "launch-os-e84de.firebasestorage.app",
    messagingSenderId: "152358577710",
    appId: "1:152358577710:web:91416fe8f3f19f9b5b21bf",
    measurementId: "G-8C58WYT9HT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
