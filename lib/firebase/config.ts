import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnDuzZGLZCEbVrEAlLRhQmJBMXdMLySHs",
  authDomain: "lock-it-a3dee.firebaseapp.com",
  projectId: "lock-it-a3dee",
  storageBucket: "lock-it-a3dee.firebasestorage.app",
  messagingSenderId: "634357056435",
  appId: "1:634357056435:web:6135c347f26b601f4f01c6",
  measurementId: "G-QNWQCKYTWQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);

export default app;
