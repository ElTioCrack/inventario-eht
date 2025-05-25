import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAhOlUD8gZDm9mSLcQFM7hFHj2qSAyFjdo",
  authDomain: "inventario-eht.firebaseapp.com",
  databaseURL: "https://inventario-eht-default-rtdb.firebaseio.com",
  projectId: "inventario-eht",
  storageBucket: "inventario-eht.firebasestorage.app",
  messagingSenderId: "748512001188",
  appId: "1:748512001188:web:f44c03e683382ad2843a31",
  measurementId: "G-DPVKP85PQS",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
