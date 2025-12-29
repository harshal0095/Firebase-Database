
import { Timestamp } from 'firebase/firestore';

export interface Channel {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  text?: string;
  type?: 'text' | 'gif';
  gifUrl?: string;
  senderName: string;
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
}

export interface User {
  displayName: string;
}
