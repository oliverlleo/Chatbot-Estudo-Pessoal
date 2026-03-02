import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCTBrX_TzPhiqn0xW2ugozysnKp8XwEt_Y",
  authDomain: "chatbotestudopessoal.firebaseapp.com",
  projectId: "chatbotestudopessoal",
  storageBucket: "chatbotestudopessoal.firebasestorage.app",
  messagingSenderId: "894179333169",
  appId: "1:894179333169:web:b3156b063906dcf630b110",
  measurementId: "G-BT83KRC2NL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
