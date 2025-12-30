
import React, { useState } from 'react';
import { Channel, User } from '../types';

interface SidebarProps {
  userName: string;
  channels: Channel[];
  users: User[];
  activeChannelId: string | null;
  unreadCounts: {[key: string]: number};
  onSelectChannel: (id: string) => void;
  onSelectUser: (userName: string) => void;
  onCreateChannel: (name: string) => void;
  onDeleteChannel: (id: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  isOpen: boolean;
  onClose: () => void;
  onThemeChange: (theme: string) => void;
  currentTheme: string;
  blockedUsers?: string[];
}

const themes = [
  { id: 'default', name: 'Default', class: 'bg-slate-50' },
  { id: 'dark', name: 'Midnight', class: 'bg-slate-900' },
  { id: 'sunset', name: 'Sunset', class: 'bg-gradient-to-br from-orange-100 to-rose-100' },
  { id: 'ocean', name: 'Ocean', class: 'bg-gradient-to-br from-blue-100 to-cyan-100' },
  { id: 'forest', name: 'Forest', class: 'bg-gradient-to-br from-emerald-50 to-teal-100' },
  { id: 'lavender', name: 'Lavender', class: 'bg-gradient-to-br from-violet-100 to-purple-100' },
];

const Sidebar: React.FC<SidebarProps> = ({
  userName,
  channels,
  users,
  activeChannelId,
  unreadCounts,
  onSelectChannel,
  onSelectUser,
  onCreateChannel,
  onDeleteChannel,
  onLogout,
  onDeleteAccount,
  isOpen,
  onClose,
  onThemeChange,
  currentTheme,
  blockedUsers
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName);
      setNewChannelName('');
      setIsCreating(false);
    }
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 flex flex-col h-full text-slate-300 transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-white truncate max-w-[120px]">Trinetra</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="md:hidden text-slate-500 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 bg-slate-800/50 relative">
        <div
          className="flex items-center justify-between cursor-pointer group/user"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-slate-500">Settings & Account</p>
            </div>
          </div>
          <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {showUserMenu && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => {
                setShowThemeMenu(!showThemeMenu);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Background Theme
              </div>
              <svg className={`w-3 h-3 transition-transform ${showThemeMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {showThemeMenu && (
              <div className="bg-slate-900/50 py-1 border-y border-slate-700/50 max-h-48 overflow-y-auto">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t.id);
                      setShowUserMenu(false);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-6 py-2 text-xs transition-colors ${
                      currentTheme === t.id ? 'text-indigo-400 font-bold bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${t.class} border border-white/20`}></div>
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure? This will PERMANENTLY delete your account and you will no longer be able to login with this name.")) {
                  onDeleteAccount();
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto mt-4 px-2 space-y-1">
        <div className="px-3 py-2 flex items-center justify-between group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Channels</span>
          <button
            onClick={() => setIsCreating(true)}
            className="text-slate-500 hover:text-white transition-colors"
            title="Create Channel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="px-3 mb-2">
            <input
              autoFocus
              type="text"
              placeholder="channel-name"
              className="w-full bg-slate-800 text-sm py-2 px-3 rounded border border-slate-700 focus:border-indigo-500 outline-none"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onBlur={() => !newChannelName && setIsCreating(false)}
            />
          </form>
        )}

        {channels.filter(c => !c.type || c.type === 'channel').map((channel) => (
          <div key={channel.id} className="group relative">
            <button
              onClick={() => onSelectChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${activeChannelId === channel.id
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="opacity-60 text-lg">#</span>
                <div className="overflow-hidden">
                   <span className="truncate block">{channel.name}</span>
                   {channel.lastMessage && (
                     <p className={`text-[10px] truncate opacity-60 ${activeChannelId === channel.id ? 'text-white' : 'text-slate-400'}`}>
                       {channel.lastSenderName === userName ? 'You: ' : `${channel.lastSenderName}: `}{channel.lastMessage}
                     </p>
                   )}
                </div>
              </div>
              {unreadCounts[channel.id] > 0 && activeChannelId !== channel.id && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCounts[channel.id]}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Direct Messages List */}
      <div className="mt-6 px-2 space-y-1">
        <div className="px-3 py-2 flex items-center justify-between group">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Direct Messages</span>
        </div>

        {users.map((user) => {
          const dmChannel = channels.find(c => 
            c.type === 'dm' && 
            c.members?.includes(userName) && 
            c.members?.includes(user.displayName)
          );
          
          const isActive = activeChannelId === dmChannel?.id;
          const unreadCount = dmChannel ? unreadCounts[dmChannel.id] : 0;
          
          const isOnline = user.status === 'online';
          const isBlockedByMe = blockedUsers?.includes(user.id) || false;
          const hasBlockedMe = user.blockedUsers?.includes(userName.toLowerCase()) || false;
          
          const formatLastSeenShort = (timestamp: any) => {
            if (!timestamp || hasBlockedMe) return 'Offline';
            const date = timestamp.toDate();
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            
            return isToday 
              ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date)
              : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
          };
          
          return (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.displayName)}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  {(!isBlockedByMe && !hasBlockedMe) && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate block ${isActive ? 'text-white' : 'text-slate-200'}`}>{user.displayName}</span>
                    {isBlockedByMe && (
                      <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30">Blocked</span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {isBlockedByMe ? 'You blocked this user' : (hasBlockedMe ? 'Offline' : (isOnline ? 'Online' : `Last seen: ${formatLastSeenShort(user.lastSeen)}`))}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && !isActive && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {users.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-600 italic">No other users online</p>
        )}
      </div>

      <div className="p-4 text-[10px] text-slate-600 text-center uppercase tracking-widest border-t border-slate-800 mt-auto">
        Mini Team Chat v1.0
      </div>
    </div>
  );
};

export default Sidebar;
