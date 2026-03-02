import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/db';
import { Collection, Notebook, ChatSession, Message } from '../types';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import NotebookArea from '../components/NotebookArea';
import SettingsArea from '../components/SettingsArea';
import { Menu, X } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [userApiKey, setUserApiKey] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'chat' | 'notebook' | 'settings'>('chat');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [cols, chs, settings] = await Promise.all([
      dbService.getCollections(user.uid),
      dbService.getChats(user.uid),
      dbService.getUserSettings(user.uid)
    ]);
    setCollections(cols);
    setChats(chs);
    if (settings.apiKey) {
      setUserApiKey(settings.apiKey);
    }
    
    // Load all notebooks for all collections
    const allNotebooks: Notebook[] = [];
    for (const col of cols) {
      const notes = await dbService.getNotebooks(user.uid, col.id);
      allNotebooks.push(...notes);
    }
    setNotebooks(allNotebooks);
  };

  const handleNewChat = async (agent: 'estudo' | 'apostila') => {
    if (!user) return;
    const title = agent === 'apostila' ? 'Nova Apostila' : 'Novo Estudo';
    const newChat = await dbService.createChat(user.uid, title, agent);
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setActiveTab('chat');
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeNotebook = notebooks.find(n => n.id === activeNotebookId) || null;

  return (
    <div className="flex h-screen bg-[#241623] text-white overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#114B5F] rounded-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#1a1019] border-r border-white/10 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          collections={collections}
          notebooks={notebooks}
          chats={chats}
          activeTab={activeTab}
          activeChatId={activeChatId}
          activeNotebookId={activeNotebookId}
          onSelectChat={(id) => { setActiveChatId(id); setActiveTab('chat'); setIsSidebarOpen(false); }}
          onSelectNotebook={(id) => { setActiveNotebookId(id); setActiveTab('notebook'); setIsSidebarOpen(false); }}
          onNewChat={handleNewChat}
          onOpenSettings={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          onLogout={logout}
          userEmail={user?.email || ''}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {activeTab === 'chat' ? (
          <ChatArea 
            chat={activeChat} 
            onUpdateChat={loadData}
            collections={collections}
            onNotebookSaved={loadData}
            userApiKey={userApiKey}
            onOpenSettings={() => setActiveTab('settings')}
          />
        ) : activeTab === 'notebook' ? (
          <NotebookArea 
            notebook={activeNotebook}
            onUpdateNotebook={loadData}
          />
        ) : (
          <SettingsArea 
            currentApiKey={userApiKey}
            onSaveApiKey={(key) => setUserApiKey(key)}
          />
        )}
      </div>
    </div>
  );
}
