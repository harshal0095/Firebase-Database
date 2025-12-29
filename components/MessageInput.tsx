
import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, placeholder }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1 relative">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type a message..."}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-slate-700 min-h-[48px] max-h-32"
          style={{ height: 'auto' }}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
           {/* Placeholder for emojis or attachments if needed */}
        </div>
      </div>
      <button
        type="submit"
        disabled={!text.trim()}
        className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-md transition-all active:scale-90 ${
          text.trim() 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
        }`}
      >
        <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </button>
    </form>
  );
};

export default MessageInput;
