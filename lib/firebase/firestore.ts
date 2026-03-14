import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  WhereFilterOp,
} from 'firebase/firestore';
import { db } from './config';

// Generic CRUD helpers — callers get typed results at the call site.

export const getCollection = async <T>(collectionName: string): Promise<(T & { id: string })[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(d => ({ id: d.id, ...(d.data() as T) }));
};

export const getDocument = async <T>(collectionName: string, docId: string): Promise<T & { id: string }> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Document not found');
  return { id: docSnap.id, ...(docSnap.data() as T) };
};

export const addDocument = async <T extends object>(collectionName: string, data: T): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

export const updateDocument = async <T extends object>(collectionName: string, docId: string, data: Partial<T>): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

export const queryDocuments = async <T>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: unknown
): Promise<(T & { id: string })[]> => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(d => ({ id: d.id, ...(d.data() as T) }));
};
