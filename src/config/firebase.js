// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// ✅ Firebase config from your Celefyy project
const firebaseConfig = {
  apiKey: "AIzaSyCJW7YC3im-oAmnKMXEGQldMwpXGqOPX-g",
  authDomain: "celefyy.firebaseapp.com",
  projectId: "celefyy",
  storageBucket: "celefyy.appspot.com",
  messagingSenderId: "682198067789",
  appId: "1:682198067789:web:69086257cb403e2356ca04"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();



// ✅ Export everything
export {
  auth,
  db,
  googleProvider
 
};
