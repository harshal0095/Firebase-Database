
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Channel, Message as MessageType, User } from '../types';
import Message from './Message';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  userName: string;
  channelId: string;
  channelName: string;
  isDM?: boolean;
  activeUser?: User | null;
  currentUser?: User | null;
  onToggleSidebar: () => void;
  bgTheme?: string;
  onBlock?: (userId: string) => void;
  onUnblock?: (userId: string) => void;
  onAddMember?: (channelId: string, memberUserName: string) => void;
  onRemoveMember?: (channelId: string, memberUserName: string) => void;
  onDeleteChannel?: (id: string) => void;
  isAdmin?: boolean;
  allUsers?: User[];
  members?: string[];
  ownerName?: string;
}

const themeClasses: {[key: string]: string} = {
  default: 'bg-white',
  dark: 'bg-slate-900',
  sunset: 'bg-gradient-to-br from-orange-50 to-rose-100',
  ocean: 'bg-gradient-to-br from-blue-50 to-cyan-100',
  forest: 'bg-gradient-to-br from-emerald-50 to-teal-100',
  lavender: 'bg-gradient-to-br from-violet-50 to-purple-100',
};

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  userName, 
  channelId, 
  channelName, 
  isDM, 
  activeUser, 
  currentUser,
  onToggleSidebar, 
  bgTheme = 'default',
  onBlock,
  onUnblock,
  onAddMember,
  onRemoveMember,
  onDeleteChannel,
  isAdmin,
  allUsers = [],
  members = [],
  ownerName
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Block status logic
  const isBlockedByMe = currentUser?.blockedUsers?.includes(activeUser?.id || '') || false;
  const hasBlockedMe = activeUser?.blockedUsers?.includes(userName.toLowerCase()) || false;
  
  // Filter messages: If I have blocked this user, hide their messages from my view
  // They will "appear" when I unblock them because they are still in the database
  const visibleMessages = messages.filter(msg => {
    if (isDM && isBlockedByMe && msg.senderName.toLowerCase() === activeUser?.id.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Get current theme class
  const themeClass = themeClasses[bgTheme] || themeClasses.default;
  const isDarkTheme = bgTheme === 'dark';

  const handleAddMemberClick = (memberUserName: string) => {
    if (onAddMember) {
      onAddMember(channelId, memberUserName);
      setShowAddMember(false);
    }
  };

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

  // Mark messages as read
  useEffect(() => {
    if (messages.length === 0) return;

    // Only process the last 10 messages to avoid heavy loops
    const lastMessages = messages.slice(-10);
    
    lastMessages.forEach(async (msg) => {
      if (msg.id && (!msg.readBy || !msg.readBy.includes(userName))) {
        try {
          const messageRef = doc(db, 'channels', channelId, 'messages', msg.id);
          await updateDoc(messageRef, {
            readBy: arrayUnion(userName)
          });
        } catch (error) {
          // Ignore errors for read receipts to avoid "load" on the UI
          console.debug("Error marking message as read:", error);
        }
      }
    });
  }, [messages, userName, channelId]);

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

      // Update channel metadata for previews
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        lastSenderName: userName
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

      // Update channel metadata for previews
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        lastMessage: "Sent a GIF",
        lastMessageAt: serverTimestamp(),
        lastSenderName: userName
      });
    } catch (error) {
      console.error("Error sending GIF:", error);
    }
  };

  const handleSendImage = async (imageUrl: string) => {
    try {
      const messagesRef = collection(db, 'channels', channelId, 'messages');
      await addDoc(messagesRef, {
        type: 'image',
        imageUrl: imageUrl,
        senderName: userName,
        createdAt: serverTimestamp()
      });

      // Update channel metadata for previews
      const channelRef = doc(db, 'channels', channelId);
      await updateDoc(channelRef, {
        lastMessage: "Sent an image",
        lastMessageAt: serverTimestamp(),
        lastSenderName: userName
      });
    } catch (error) {
      console.error("Error sending Image:", error);
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

  const formatLastSeen = (user?: User | null) => {
    if (!user) return '';
    // If the other user has blocked me, or if I have blocked them, don't show real status
    // The requirement says: if I block someone, they shouldn't see my status.
    // So if 'user' (the other person) is viewing ME, and I have blocked them, they see 'Offline'.
    // Here we are in MY view, looking at 'user'. 
    // If 'user' has blocked ME, I should see them as Offline.
    if (hasBlockedMe) return 'Offline';
    
    if (user.status === 'online') return 'Online';
    if (!user.lastSeen) return 'Offline';
    
    const date = user.lastSeen.toDate();
    
    return `Last seen ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date)}`;
  };

  return (
    <div className={`flex-1 flex flex-col h-full relative ${themeClass} transition-colors duration-500`}>
      {/* Header */}
      <div className={`h-16 flex items-center justify-between px-4 md:px-6 border-b ${isDarkTheme ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-white/80'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onToggleSidebar}
            className={`md:hidden p-2 ${isDarkTheme ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'} rounded-lg transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-1 md:gap-2">
            {isDM ? (
              <div className={`w-8 h-8 rounded-lg ${isDarkTheme ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            ) : (
              <span className={`text-xl md:text-2xl font-light ${isDarkTheme ? 'text-slate-600' : 'text-slate-400'}`}>#</span>
            )}
            <div className="flex flex-col cursor-pointer group/title relative" onClick={() => !isDM && setShowMembers(!showMembers)}>
              <h2 className={`text-base md:text-lg font-bold truncate max-w-[150px] md:max-w-none leading-tight flex items-center gap-1 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                {channelName}
                {!isDM && (
                  <svg className={`w-3 h-3 transition-transform ${showMembers ? 'rotate-180' : ''} ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </h2>
              {isDM ? (
                <span className={`text-[10px] ${activeUser?.status === 'online' && !hasBlockedMe ? 'text-green-500 font-bold' : (isDarkTheme ? 'text-slate-500' : 'text-slate-400')}`}>
                  {formatLastSeen(activeUser)}
                </span>
              ) : (
                <span className={`text-[10px] ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  {members.length} members
                </span>
              )}

              {/* Members Dropdown */}
              {showMembers && !isDM && (
                <div className={`absolute left-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-50 border overflow-hidden animate-in fade-in slide-in-from-top-2 ${
                  isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${
                    isDarkTheme ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-100'
                  }`}>
                    Group Members
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {/* Admin/Owner always first */}
                    {ownerName && (
                      <div className={`px-4 py-2 flex items-center justify-between ${isDarkTheme ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                            {ownerName.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-xs truncate ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>{ownerName}</span>
                        </div>
                        <span className="text-[8px] font-bold text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Admin</span>
                      </div>
                    )}
                    {/* Other members */}
                    {members.filter(m => m !== ownerName).map((member) => (
                      <div key={member} className={`px-4 py-2 flex items-center justify-between group/member ${isDarkTheme ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            isDarkTheme ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {member.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-xs truncate ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>{member}</span>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Remove ${member} from this group?`)) {
                                onRemoveMember?.(channelId, member);
                              }
                            }}
                            className="text-[10px] text-red-500 hover:text-red-600 opacity-0 group-hover/member:opacity-100 transition-opacity font-medium px-2 py-1 rounded hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isDM && isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDeleteChannel?.(channelId)}
                className={`p-2 rounded-full transition-all border ${
                  isDarkTheme 
                    ? 'text-slate-500 border-slate-800 hover:text-red-500 hover:bg-red-500/10' 
                    : 'text-slate-400 border-slate-100 hover:text-red-500 hover:bg-red-50'
                }`}
                title="Delete Group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className={`flex items-center gap-1 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                    isDarkTheme 
                      ? 'bg-indigo-900/50 text-indigo-300 border-indigo-800 hover:bg-indigo-900' 
                      : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add Member
                </button>

                {showAddMember && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-50 border overflow-hidden animate-in fade-in slide-in-from-top-2 ${
                    isDarkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b ${
                      isDarkTheme ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-100'
                    }`}>
                      Invite User
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {allUsers.length > 0 ? (
                        allUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleAddMemberClick(u.displayName)}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              isDarkTheme ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                          >
                            {u.displayName}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-[10px] text-slate-500 italic text-center">
                          No users available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isDM && activeUser && (
            <button
              onClick={() => isBlockedByMe ? onUnblock?.(activeUser.id) : onBlock?.(activeUser.id)}
              className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                isBlockedByMe 
                  ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                  : 'text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200'
              }`}
            >
              {isBlockedByMe ? 'Unblock User' : 'Block User'}
            </button>
          )}
          <div className={`text-[10px] md:text-xs ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
            {messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center opacity-30 text-center select-none ${isDarkTheme ? 'text-white' : ''}`}>
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>This is the start of your conversation with {isDM ? '' : '#'}{channelName}.</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          visibleMessages.map((msg) => (
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
      <div className={`p-4 border-t ${isDarkTheme ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        {isBlockedByMe ? (
          <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl text-slate-500 text-sm border border-slate-100 italic">
            You have blocked this user. Unblock them to send messages.
          </div>
        ) : (
          <MessageInput 
            onSend={handleSendMessage} 
            onSendGif={handleSendGif}
            onSendImage={handleSendImage}
            placeholder={`Message ${isDM ? '' : '#'}${channelName}`} 
          />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
