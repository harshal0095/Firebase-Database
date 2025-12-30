
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
  onToggleSidebar: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userName, channelId, channelName, onToggleSidebar }) => {
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
        type: 'text',
        senderName: userName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    try {
      const messagesRef = collection(db, 'channels', channelId, 'messages');
      await addDoc(messagesRef, {
        type: 'gif',
        gifUrl: gifUrl,
        senderName: userName,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending GIF:", error);
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
      <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-xl md:text-2xl font-light text-slate-400">#</span>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[150px] md:max-w-none">{channelName}</h2>
          </div>
        </div>
        <div className="text-[10px] md:text-xs text-slate-400">
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
        <MessageInput 
          onSend={handleSendMessage} 
          onSendGif={handleSendGif}
          placeholder={`Message #${channelName}`} 
        />
      </div>
    </div>
  );
};

export default ChatWindow;
