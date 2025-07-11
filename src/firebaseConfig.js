import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0ZaV9EJl1z4hT0wd5EL-7RqG2slAE5Kg",
  authDomain: "comunidade-team-hiit.firebaseapp.com",
  projectId: "comunidade-team-hiit",
  storageBucket: "comunidade-team-hiit.firebasestorage.app",
  messagingSenderId: "106629704358",
  appId: "1:106629704358:web:7151af4773e2e4c3822267",
  measurementId: "G-9GDD249KT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };



