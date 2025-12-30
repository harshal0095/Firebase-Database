
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Channel } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

interface ChatWorkspaceProps {
  userName: string;
  onLogout: () => void;
}

const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userName, onLogout }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize and listen to channels
  useEffect(() => {
    const q = query(collection(db, 'channels'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelData: Channel[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Channel));

      setChannels(channelData);
      
      // Seed default channels if none exist
      if (snapshot.empty) {
        seedInitialChannels();
      }

      // Set first channel as active if none is selected
      if (channelData.length > 0 && !activeChannelId) {
        setActiveChannelId(channelData[0].id);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeChannelId]);

  const seedInitialChannels = async () => {
    const defaults = ['general', 'frontend', 'backend'];
    for (const name of defaults) {
      await addDoc(collection(db, 'channels'), {
        name,
        createdAt: serverTimestamp()
      });
    }
  };

  const handleCreateChannel = async (name: string) => {
    if (!name.trim()) return;
    const docRef = await addDoc(collection(db, 'channels'), {
      name: name.trim().toLowerCase(),
      createdAt: serverTimestamp()
    });
    setActiveChannelId(docRef.id);
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this channel? All messages will be lost.')) {
        await deleteDoc(doc(db, 'channels', id));
        if (activeChannelId === id) {
          setActiveChannelId(null);
        }
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <Sidebar 
        userName={userName}
        channels={channels} 
        activeChannelId={activeChannelId} 
        onSelectChannel={(id) => {
          setActiveChannelId(id);
          setSidebarOpen(false); // Close on selection for mobile
        }}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col bg-white overflow-hidden w-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : activeChannelId ? (
          <ChatWindow 
            userName={userName} 
            channelId={activeChannelId} 
            channelName={activeChannel?.name || ''} 
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mb-4 p-2 text-indigo-600 border border-indigo-200 rounded-lg"
            >
              Open Channels
            </button>
            <div>
              <p className="text-xl font-medium text-slate-600">No channel selected</p>
              <p className="mt-2">Select or create a channel from the sidebar to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWorkspace;
