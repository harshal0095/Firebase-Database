
import React from 'react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isMe: boolean;
  onDelete: () => void;
  onEdit: (newText: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, isMe, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.text);

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
        <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative group ${
          isMe 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
        }`}>
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
              {message.type === 'gif' ? (
                <div className="rounded-lg overflow-hidden max-w-[250px] bg-slate-200 animate-pulse min-h-[100px] flex items-center justify-center relative">
                  <img 
                    src={message.gifUrl} 
                    alt="GIF" 
                    className="w-full h-auto block relative z-10"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).parentElement?.classList.remove('animate-pulse', 'bg-slate-200');
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}
              
              {isMe && (
                <div className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/80 backdrop-blur-sm md:bg-transparent rounded-full md:rounded-none shadow-sm md:shadow-none p-1 md:p-0 border border-slate-100 md:border-none z-10">
                  {message.type !== 'gif' && (
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
            </>
          )}
        </div>
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
