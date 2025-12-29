
import React, { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import ChatWorkspace from './components/ChatWorkspace';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('chat_user_name');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleJoin = (name: string) => {
    localStorage.setItem('chat_user_name', name);
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_user_name');
    setUserName(null);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50">
      {!userName ? (
        <JoinScreen onJoin={handleJoin} />
      ) : (
        <ChatWorkspace userName={userName} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
