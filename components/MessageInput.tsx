
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

interface MessageInputProps {
  onSend: (text: string) => void;
  onSendGif: (url: string) => void;
  onSendImage: (url: string) => void;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onSendGif, onSendImage, placeholder }) => {
  const [text, setText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = useCallback(async (query: string) => {
    setLoadingGifs(true);
    setGifError(null);
    try {
      // Using a more reliable public key
      const apiKey = 'LIVDSRZ79vof8vHwH8s4fM2fU816tU6u'; 
      const url = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch GIFs');
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error("Error fetching gifs:", error);
      setGifError("Failed to load GIFs. Please try again.");
    } finally {
      setLoadingGifs(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (!showGifPicker) return;
    
    const timer = setTimeout(() => {
      fetchGifs(gifSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [gifSearch, showGifPicker, fetchGifs]);

  const toggleGifPicker = () => {
    setShowGifPicker(!showGifPicker);
  };

  const handleGifSelect = (gif: any) => {
    // Use fixed_height for better performance in chat, fall back to original if needed
    const url = gif.images.fixed_height?.url || gif.images.original.url;
    onSendGif(url);
    setShowGifPicker(false);
    setGifSearch('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB now, 5MB might be too small for some mobile photos)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `chat_images/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      onSendImage(downloadURL);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploadingImage(false);
    }
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
              onChange={(e) => setGifSearch(e.target.value)}
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
              <div className="col-span-2 flex flex-col items-center justify-center h-full text-slate-400 text-xs italic gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Loading GIFs...
              </div>
            ) : gifError ? (
              <div className="col-span-2 flex flex-col items-center justify-center h-full text-red-400 text-xs italic gap-2">
                {gifError}
                <button 
                  onClick={() => fetchGifs(gifSearch)}
                  className="text-indigo-600 font-bold underline"
                >
                  Retry
                </button>
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif) => (
                <button 
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-slate-100 aspect-video relative group/item"
                >
                  <img 
                    src={gif.images.fixed_height_small.url} 
                    alt={gif.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
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
             <img src="https://giphy.com/static/img/powered_by_giphy.png" alt="Powered by Giphy" className="h-4 object-contain" />
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
          <div className="absolute right-3 bottom-3 flex items-center gap-1 md:gap-2">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-lg transition-colors ${uploadingImage ? 'bg-slate-100 text-slate-300' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'}`}
              title="Upload Image"
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={toggleGifPicker}
              className={`p-1.5 rounded-lg transition-colors ${showGifPicker ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'}`}
              title="Add GIF"
            >
              <span className="text-[10px] font-black leading-none border-2 border-current px-0.5 rounded-sm">GIF</span>
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
