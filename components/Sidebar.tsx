
import React, { useState } from 'react';
import { Channel } from '../types';

interface SidebarProps {
  userName: string;
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string) => void;
  onDeleteChannel: (id: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  userName, 
  channels, 
  activeChannelId, 
  onSelectChannel, 
  onCreateChannel,
  onDeleteChannel,
  onLogout,
  isOpen,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

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
          <span className="font-bold text-white truncate max-w-[120px]">Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onLogout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            title="Sign out as guest"
          >
            Logout
          </button>
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
      <div className="px-4 py-4 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500">Guest User</p>
          </div>
        </div>
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

        {channels.map((channel) => (
          <div key={channel.id} className="group relative">
            <button
              onClick={() => onSelectChannel(channel.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                activeChannelId === channel.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="opacity-60 text-lg">#</span>
              <span className="truncate pr-6">{channel.name}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChannel(channel.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete Channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 text-[10px] text-slate-600 text-center uppercase tracking-widest border-t border-slate-800">
        Mini Team Chat v1.0
      </div>
    </div>
  );
};

export default Sidebar;
