
import { Timestamp } from 'firebase/firestore';

export interface Channel {
  id: string;
  name: string;
  createdAt: Timestamp;
  type?: 'channel' | 'dm';
  owner?: string; // userName of the creator
  members?: string[]; // Array of userNames
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  lastSenderName?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  text?: string;
  type?: 'text' | 'gif' | 'image';
  gifUrl?: string;
  imageUrl?: string;
  senderName: string;
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
  readBy?: string[];
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userNames
}

export interface User {
  id: string;
  displayName: string;
  lastSeen?: Timestamp;
  status?: 'online' | 'offline';
  blockedUsers?: string[]; // Array of user IDs
}
