export interface User {
  uid: string;
  email: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}

export interface Notebook {
  id: string;
  collectionId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}
