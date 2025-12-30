
import React from 'react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isMe: boolean;
  onDelete: () => void;
  onEdit: (newText: string) => void;
  onToggleReaction?: (emoji: string) => void;
  userName: string;
}

const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const Message: React.FC<MessageProps> = ({ message, isMe, onDelete, onEdit, onToggleReaction, userName }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.text);
  const [showReadBy, setShowReadBy] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">
            {message.senderName}
          </span>
        )}
        <div 
          onClick={() => isMe && setShowReadBy(!showReadBy)}
          className={`px-4 py-2.5 rounded-2xl shadow-sm relative group transition-all ${
            isMe 
              ? 'bg-indigo-600 text-white rounded-tr-none cursor-pointer' 
              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 cursor-default'
          }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-indigo-700 text-white border-none outline-none rounded-lg p-2 text-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.text || '');
                  }}
                  className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (editText.trim() && editText !== message.text) {
                      onEdit(editText.trim());
                    }
                    setIsEditing(false);
                  }}
                  className="text-[10px] bg-white text-indigo-600 font-bold px-2 py-1 rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === 'gif' || message.type === 'image' ? (
                <div className={`rounded-xl overflow-hidden max-w-full sm:max-w-[320px] bg-slate-100 min-h-[150px] flex items-center justify-center relative border border-slate-200/50 ${!message.imageUrl && !message.gifUrl ? 'animate-pulse' : ''}`}>
                  <img 
                    src={message.type === 'gif' ? message.gifUrl : message.imageUrl} 
                    alt={message.type === 'gif' ? 'GIF' : 'Image'} 
                    className="w-full h-auto block relative z-10 transition-opacity duration-300 opacity-0"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.opacity = '1';
                      img.parentElement?.classList.remove('animate-pulse', 'bg-slate-100');
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.parentElement?.classList.add('bg-red-50');
                      img.parentElement?.classList.remove('animate-pulse');
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
              
              {isMe && (
                <div className="absolute -left-20 md:-left-24 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/80 backdrop-blur-sm md:bg-transparent rounded-full md:rounded-none shadow-sm md:shadow-none p-1 md:p-0 border border-slate-100 md:border-none z-10">
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-yellow-500"
                      title="Add reaction"
                    >
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-slate-100 p-1 flex gap-1 z-50 animate-in zoom-in-50">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onToggleReaction?.(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="hover:scale-125 transition-transform p-1 text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type !== 'gif' && message.type !== 'image' && (
                    <button 
                      onClick={() => {
                        setIsEditing(true);
                        setEditText(message.text || '');
                      }}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-indigo-500"
                      title="Edit message"
                    >
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this message?')) {
                        onDelete();
                      }
                    }}
                    className="p-1.5 md:p-2 text-slate-400 hover:text-red-500"
                    title="Delete message"
                  >
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {!isMe && (
                <div className="absolute -right-8 md:-right-10 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-yellow-500"
                      title="Add reaction"
                    >
                      <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white rounded-full shadow-lg border border-slate-100 p-1 flex gap-1 z-50 animate-in zoom-in-50">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onToggleReaction?.(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="hover:scale-125 transition-transform p-1 text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reactions Display */}
        {message.reactions && Object.entries(message.reactions).some(([_, users]) => users.length > 0) && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              if (users.length === 0) return null;
              const hasReacted = users.includes(userName);
              return (
                <button
                  key={emoji}
                  onClick={() => onToggleReaction?.(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
                    hasReacted 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                  title={users.join(', ')}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {isMe && showReadBy && message.readBy && message.readBy.length > 0 && (
          <div className={`mt-1 flex items-center gap-1 text-[9px] font-medium animate-in fade-in slide-in-from-top-1 flex-row-reverse text-indigo-400`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="truncate">
              Read by: {message.readBy.filter(u => u !== message.senderName).length > 0 
                ? message.readBy.filter(u => u !== message.senderName).join(', ') 
                : 'Only you'}
            </span>
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatTime(message.createdAt)}
            {message.editedAt && (
              <span className="ml-1 opacity-60">(edited)</span>
            )}
          </span>
          {isMe && (
            <span className="text-[10px] text-indigo-400 font-medium italic">
              You
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
