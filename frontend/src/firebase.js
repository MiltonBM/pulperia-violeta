import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_cmRlvnJqRzhoBegQfdIMobscrF--C5E",
  authDomain: "pulperia-violetta.firebaseapp.com",
  projectId: "pulperia-violetta",
  storageBucket: "pulperia-violetta.firebasestorage.app",
  messagingSenderId: "622145092636",
  appId: "1:622145092636:web:0f1ba129fb6ef7d0d173d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Referencias a colecciones
export const proveedoresCollection = collection(db, 'proveedores');
export const productosCollection = collection(db, 'productos');
export const ventasCollection = collection(db, 'ventas');
export const comprasCollection = collection(db, 'compras');
export const detalleVentasCollection = collection(db, 'detalleVentas');
export const detalleComprasCollection = collection(db, 'detalleCompras');

// Utilidad para timestamp
export const getCurrentTimestamp = () => {
  return new Date();
};