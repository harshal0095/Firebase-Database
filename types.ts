
import { Timestamp } from 'firebase/firestore';

export interface Channel {
  id: string;
  name: string;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  senderName: string;
  createdAt: Timestamp | null;
}

export interface User {
  displayName: string;
}
