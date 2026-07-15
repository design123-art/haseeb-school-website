// ============================================================
// Firebase configuration — Haseeb School Management System
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkmloNDpeYJyzWFygscZ2KFTqYuG97KkE",
  authDomain: "haseebschool-5a53d.firebaseapp.com",
  projectId: "haseebschool-5a53d",
  storageBucket: "haseebschool-5a53d.firebasestorage.app",
  messagingSenderId: "79903238827",
  appId: "1:79903238827:web:a8d5ed2a959a00253ce5ee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app, auth, db,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp
};
