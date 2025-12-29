
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Message as MessageType } from '../types';
import Message from './Message';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  userName: string;
  channelId: string;
  channelName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userName, channelId, channelName }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reference to the messages subcollection
    const messagesRef = collection(db, 'channels', channelId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: MessageType[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MessageType));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [channelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      const messagesRef = collection(db, 'channels', channelId, 'messages');
      await addDoc(messagesRef, {
        text,
        senderName: userName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
      await updateDoc(messageRef, {
        text: newText,
        editedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-light text-slate-400">#</span>
          <h2 className="text-xl font-bold text-slate-800">{channelName}</h2>
        </div>
        <div className="text-xs text-slate-400 hidden md:block">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center select-none">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>This is the start of the #{channelName} channel.</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <Message 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderName === userName} 
              onDelete={() => handleDeleteMessage(msg.id)}
              onEdit={(newText) => handleEditMessage(msg.id, newText)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-slate-100">
        <MessageInput onSend={handleSendMessage} placeholder={`Message #${channelName}`} />
      </div>
    </div>
  );
};

export default ChatWindow;
