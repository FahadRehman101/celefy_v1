// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const messaging = getMessaging(app);
const googleProvider = new GoogleAuthProvider();

// ✅ Get FCM token with your VAPID key
const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BFb5-wzFMJLqBdpNhipHQrR0KulFWkWLeEDiZUkehVHVRD02Su4q_oQEAueg5DhwylXDTHdA2r0gZD5Rv4APgiE"
    });
    if (token) {
      console.log("🔐 FCM Token:", token);
    } else {
      console.warn("🚫 No registration token available. Request permission to generate one.");
    }
    return token;
  } catch (err) {
    console.error("❌ An error occurred while retrieving FCM token:", err);
  }
};

// ✅ Listen for foreground messages
const onForegroundMessage = (callback) => {
  onMessage(messaging, callback);
};

// ✅ Export everything
export {
  auth,
  db,
  messaging,
  googleProvider,
  getFCMToken,
  onForegroundMessage
};
