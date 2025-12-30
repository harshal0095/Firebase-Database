
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc, where, getDocs, collectionGroup, updateDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, rtdb } from '../firebase/config';
import { ref, onValue, onDisconnect, set, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { Channel, User, Message } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';

interface ChatWorkspaceProps {
  userName: string;
  onLogout: () => void;
}

const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userName, onLogout }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<{[key: string]: number}>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bgTheme, setBgTheme] = useState<string>(() => {
    return localStorage.getItem(`chat_theme_${userName}`) || 'default';
  });

  const handleThemeChange = (theme: string) => {
    setBgTheme(theme);
    localStorage.setItem(`chat_theme_${userName}`, theme);
  };

  // Listen to current user data
  useEffect(() => {
    if (!userName) return;
    const userRef = doc(db, 'users', userName.toLowerCase());
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setCurrentUser({ id: doc.id, ...doc.data() } as User);
      }
    });
    return () => unsubscribe();
  }, [userName]);

  // Initialize and listen to channels (both public and DMs)
  useEffect(() => {
    const q = query(collection(db, 'channels'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelData: Channel[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Channel));

      // Filter channels:
      // 1. DMs where user is a member
      // 2. Regular channels where user is the owner OR a member
      // 3. Special case: 'buddy' channel might be public (or we can just auto-add everyone to it)
      const filteredChannels = channelData.filter(c => {
        if (c.type === 'dm') {
          return c.members?.includes(userName);
        }
        
        // Group channels: must be owner, member, or the default 'buddy' channel
        return (
          c.name === 'buddy' || 
          c.owner === userName || 
          c.members?.includes(userName)
        );
      });

      // Sort channels: those with lastMessageAt first (newest), then by createdAt
      filteredChannels.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setChannels(filteredChannels);
      
      // Seed default channels if none exist
      if (snapshot.empty) {
        seedInitialChannels();
      }

      // Set first channel as active if none is selected
      if (filteredChannels.length > 0 && !activeChannelId) {
        const firstPublic = filteredChannels.find(c => !c.type || c.type === 'channel');
        if (firstPublic) setActiveChannelId(firstPublic.id);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeChannelId, userName]);

  // Listen to ALL messages to calculate unread counts across all channels
  useEffect(() => {
    const messagesQuery = query(collectionGroup(db, 'messages'));
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const counts: {[key: string]: number} = {};
      
      snapshot.docs.forEach(doc => {
        const msg = doc.data() as Message;
        // If message is not sent by me and I haven't read it
        if (msg.senderName !== userName && (!msg.readBy || !msg.readBy.includes(userName))) {
          // The parent of 'messages' is the specific channel document
          const channelId = doc.ref.parent.parent?.id;
          if (channelId) {
            counts[channelId] = (counts[channelId] || 0) + 1;
          }
        }
      });
      
      setUnreadMessages(counts);
    });

    return () => unsubscribe();
  }, [userName]);

  // Listen to users and their real-time status
  useEffect(() => {
    const usersFirestoreRef = collection(db, 'users');
    const statusRTDBRef = ref(rtdb, 'status');

    let rtdbStatus: {[key: string]: any} = {};

    // Listen to RTDB status for all users
    const unsubscribeRTDBStatus = onValue(statusRTDBRef, (snapshot) => {
      rtdbStatus = snapshot.val() || {};
      // Trigger a refresh of the users list if we already have firestore data
      updateUsersList();
    });

    let firestoreUsers: any[] = [];
    const unsubscribeFirestore = onSnapshot(usersFirestoreRef, (snapshot) => {
      firestoreUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      updateUsersList();
    });

    const updateUsersList = () => {
      const mergedUsers = firestoreUsers.map(u => {
        const statusData = rtdbStatus[u.id];
        return {
          ...u,
          displayName: u.displayName || u.name || 'Unknown User',
          // Prioritize RTDB status for "online" state
          status: statusData?.status || u.status || 'offline',
          // If RTDB has a lastSeen, it might be more recent than Firestore's
          lastSeen: u.lastSeen // Keep firestore timestamp for simplicity in rendering
        } as User;
      });

      const otherUsers = mergedUsers.filter(u => 
        u.displayName !== userName && 
        u.id !== userName.toLowerCase()
      );
      
      setUsers(otherUsers);
      setLoading(false);
    };

    return () => {
      unsubscribeRTDBStatus();
      unsubscribeFirestore();
    };
  }, [userName]);

  // Enhanced Presence System for current user
  useEffect(() => {
    if (!userName) return;

    const userStatusFirestoreRef = doc(db, 'users', userName.toLowerCase());
    const userStatusDatabaseRef = ref(rtdb, '/status/' + userName.toLowerCase());
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribeRTDB = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) return;

      // When we connect/reconnect, set up onDisconnect
      onDisconnect(userStatusDatabaseRef).set({
        status: 'offline',
        lastSeen: rtdbTimestamp(),
      }).then(() => {
        // Set online status in RTDB
        set(userStatusDatabaseRef, {
          status: 'online',
          lastSeen: rtdbTimestamp(),
        });
        
        // Also update Firestore to online
        updateDoc(userStatusFirestoreRef, {
          status: 'online',
          lastSeen: serverTimestamp(),
        }).catch(() => {});
      });
    });

    // Update Firestore status when visibility changes, but ONLY mark offline on close/disconnect
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateDoc(userStatusFirestoreRef, {
          status: 'online',
          lastSeen: serverTimestamp(),
        }).catch(() => {});
      }
    };

    const handleBeforeUnload = () => {
      // Last ditch effort for Firestore
      updateDoc(userStatusFirestoreRef, {
        status: 'offline',
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateDoc(userStatusFirestoreRef, {
          lastSeen: serverTimestamp(),
          status: 'online'
        }).catch(() => {});
      }
    }, 60000);

    return () => {
      unsubscribeRTDB();
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userName]);

  const handleUnblockUser = async (targetUserId: string) => {
    if (!userName) return;
    try {
      const userRef = doc(db, 'users', userName.toLowerCase());
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(targetUserId.toLowerCase())
      });
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleBlockUser = async (targetUserId: string) => {
    if (!userName) return;
    if (targetUserId.toLowerCase() === userName.toLowerCase()) return;
    
    try {
      const userRef = doc(db, 'users', userName.toLowerCase());
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(targetUserId.toLowerCase())
      });
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleAddMember = async (channelId: string, memberUserName: string) => {
    try {
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        members: arrayUnion(memberUserName)
      });
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMember = async (channelId: string, memberUserName: string) => {
    try {
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        members: arrayRemove(memberUserName)
      });
      
      // If the removed member was the active one, they will lose access via filtering
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const seedInitialChannels = async () => {
    const defaults = ['buddy'];
    for (const name of defaults) {
      await addDoc(collection(db, 'channels'), {
        name,
        type: 'channel',
        createdAt: serverTimestamp(),
        members: []
      });
    }
  };

  const handleCreateChannel = async (name: string) => {
    if (!name.trim()) return;
    const docRef = await addDoc(collection(db, 'channels'), {
      name: name.trim().toLowerCase(),
      type: 'channel',
      owner: userName,
      members: [userName],
      createdAt: serverTimestamp()
    });
    setActiveChannelId(docRef.id);
  };

  const handleSelectUser = async (otherUserName: string) => {
    // Check if DM channel already exists
    const existingDm = channels.find(c => 
      c.type === 'dm' && 
      c.members?.includes(userName) && 
      c.members?.includes(otherUserName)
    );

    if (existingDm) {
      setActiveChannelId(existingDm.id);
    } else {
      // Create new DM channel
      const docRef = await addDoc(collection(db, 'channels'), {
        name: `dm-${userName}-${otherUserName}`,
        type: 'dm',
        members: [userName, otherUserName],
        createdAt: serverTimestamp()
      });
      setActiveChannelId(docRef.id);
    }
    setSidebarOpen(false);
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

  const handleDeleteAccount = async () => {
    try {
      const userRef = doc(db, 'users', userName.toLowerCase());
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
      await deleteDoc(userRef);
      onLogout();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account.");
    }
  };

  const handleLogoutWithStatus = async () => {
    try {
      const userRef = doc(db, 'users', userName.toLowerCase());
      await updateDoc(userRef, {
        status: 'offline',
        lastSeen: serverTimestamp()
      });
    } catch (e) {}
    onLogout();
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);
  const otherUserName = activeChannel?.type === 'dm' 
    ? activeChannel.members?.find(m => m !== userName)
    : null;
  
  const activeUser = otherUserName ? users.find(u => u.displayName === otherUserName) : null;

  const displayName = activeChannel?.type === 'dm' 
    ? otherUserName || 'Direct Message'
    : activeChannel?.name || '';

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <Sidebar 
        userName={userName}
        channels={channels} 
        users={users}
        activeChannelId={activeChannelId} 
        unreadCounts={unreadMessages}
        onSelectChannel={(id) => {
          setActiveChannelId(id);
          setSidebarOpen(false); // Close on selection for mobile
        }}
        onSelectUser={handleSelectUser}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
        onLogout={handleLogoutWithStatus}
        onDeleteAccount={handleDeleteAccount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onThemeChange={handleThemeChange}
        currentTheme={bgTheme}
        blockedUsers={currentUser?.blockedUsers}
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
            channelName={displayName} 
            isDM={activeChannel?.type === 'dm'}
            activeUser={activeUser}
            currentUser={currentUser}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            bgTheme={bgTheme}
            onBlock={handleBlockUser}
            onUnblock={handleUnblockUser}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
            onDeleteChannel={handleDeleteChannel}
            isAdmin={activeChannel?.owner === userName}
            allUsers={users}
            members={activeChannel?.members}
            ownerName={activeChannel?.owner}
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
