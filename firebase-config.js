import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC79CsYTIjr2lahLJv2U1HX_1laEU7-31E",
  authDomain: "shursh-messenger.firebaseapp.com",
  databaseURL: "https://shursh-messenger-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "shursh-messenger",
  storageBucket: "shursh-messenger.firebasestorage.app",
  messagingSenderId: "1063665415609",
  appId: "1:1063665415609:web:d5069aef0e640e23f2b268",
  measurementId: "G-9TSG5MHTJ8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getDatabase(app);
