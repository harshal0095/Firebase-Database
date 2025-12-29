
import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendGif: (url: string) => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onSendGif, placeholder }) => {
  const [text, setText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  const fetchGifs = async (query: string) => {
    setLoadingGifs(true);
    try {
      const apiKey = 'dc6zaTOxFJmzC'; // Public Beta Key
      const url = query 
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=12&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=12&rating=g`;
      
      const response = await fetch(url);
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error fetching gifs:", error);
    } finally {
      setLoadingGifs(false);
    }
  };

  const toggleGifPicker = () => {
    const newState = !showGifPicker;
    setShowGifPicker(newState);
    if (newState && gifs.length === 0) {
      fetchGifs('');
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    onSendGif(gifUrl);
    setShowGifPicker(false);
    setGifSearch('');
  };

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
    <div className="relative">
      {showGifPicker && (
        <div className="absolute bottom-full left-0 mb-2 w-72 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <input 
              type="text"
              placeholder="Search Giphy..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              value={gifSearch}
              onChange={(e) => {
                setGifSearch(e.target.value);
                fetchGifs(e.target.value);
              }}
            />
            <button 
              onClick={() => setShowGifPicker(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-2 overflow-y-auto grid grid-cols-2 gap-2 h-64">
            {loadingGifs ? (
              <div className="col-span-2 flex items-center justify-center h-full text-slate-400 text-xs italic">
                Loading GIFs...
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif) => (
                <button 
                  key={gif.id}
                  onClick={() => handleGifSelect(gif.images.fixed_height.url)}
                  className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-slate-100 aspect-video"
                >
                  <img 
                    src={gif.images.fixed_height_small.url} 
                    alt={gif.title} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center h-full text-slate-400 text-xs italic">
                No GIFs found
              </div>
            )}
          </div>
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-center">
             <img src="https://raw.githubusercontent.com/Giphy/giphy-js/master/packages/components/src/assets/powered_by_giphy.png" alt="Powered by Giphy" className="h-4" />
          </div>
        </div>
      )}
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
            <button
              type="button"
              onClick={toggleGifPicker}
              className={`p-1.5 rounded-lg transition-colors ${showGifPicker ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'}`}
              title="Add GIF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
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
    </div>
  );
};

export default MessageInput;
