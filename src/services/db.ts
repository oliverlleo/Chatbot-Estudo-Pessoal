import { collection, doc, setDoc, getDocs, getDoc, query, orderBy, addDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Collection, Notebook, ChatSession, Message } from '../types';

export const dbService = {
  // User Settings
  async saveUserSettings(userId: string, apiKey: string): Promise<void> {
    const docRef = doc(db, `users/${userId}`);
    await setDoc(docRef, { apiKey }, { merge: true });
  },

  async getUserSettings(userId: string): Promise<{ apiKey?: string }> {
    const docRef = doc(db, `users/${userId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { apiKey?: string };
    }
    return {};
  },

  // Collections
  async getCollections(userId: string): Promise<Collection[]> {
    const q = query(collection(db, `users/${userId}/collections`), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
  },

  async createCollection(userId: string, name: string): Promise<Collection> {
    const docRef = await addDoc(collection(db, `users/${userId}/collections`), {
      name,
      createdAt: Date.now()
    });
    return { id: docRef.id, name, createdAt: Date.now() };
  },

  // Notebooks
  async getNotebooks(userId: string, collectionId: string): Promise<Notebook[]> {
    const q = query(collection(db, `users/${userId}/collections/${collectionId}/notebooks`), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, collectionId, ...doc.data() } as Notebook));
  },

  async createNotebook(userId: string, collectionId: string, title: string, content: string): Promise<Notebook> {
    const docRef = await addDoc(collection(db, `users/${userId}/collections/${collectionId}/notebooks`), {
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { id: docRef.id, collectionId, title, content, createdAt: Date.now(), updatedAt: Date.now() };
  },

  async updateNotebook(userId: string, collectionId: string, notebookId: string, content: string): Promise<void> {
    const docRef = doc(db, `users/${userId}/collections/${collectionId}/notebooks/${notebookId}`);
    await updateDoc(docRef, {
      content,
      updatedAt: Date.now()
    });
  },

  // Chats
  async getChats(userId: string): Promise<ChatSession[]> {
    const q = query(collection(db, `users/${userId}/chats`), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
  },

  async createChat(userId: string, title: string, agent: 'estudo' | 'apostila' = 'estudo'): Promise<ChatSession> {
    const docRef = await addDoc(collection(db, `users/${userId}/chats`), {
      title,
      agent,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return { id: docRef.id, title, agent, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
  },

  async updateChatMessages(userId: string, chatId: string, messages: Message[]): Promise<void> {
    const docRef = doc(db, `users/${userId}/chats/${chatId}`);
    await updateDoc(docRef, {
      messages,
      updatedAt: Date.now()
    });
  }
};
