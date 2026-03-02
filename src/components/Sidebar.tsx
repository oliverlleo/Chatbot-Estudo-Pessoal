import React from 'react';
import { Collection, Notebook, ChatSession } from '../types';
import { MessageSquare, Book, Folder, Plus, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  collections: Collection[];
  notebooks: Notebook[];
  chats: ChatSession[];
  activeTab: 'chat' | 'notebook';
  activeChatId: string | null;
  activeNotebookId: string | null;
  onSelectChat: (id: string) => void;
  onSelectNotebook: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  userEmail: string;
}

export default function Sidebar({
  collections,
  notebooks,
  chats,
  activeTab,
  activeChatId,
  activeNotebookId,
  onSelectChat,
  onSelectNotebook,
  onNewChat,
  onLogout,
  userEmail
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full p-4 pt-16 md:pt-4">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 bg-gradient-to-br from-[#87D68D] to-[#114B5F] rounded-xl flex items-center justify-center shadow-lg">
          <Book className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#87D68D] to-[#F8C537]">
          Estudo Pessoal
        </h1>
      </div>

      <button
        onClick={onNewChat}
        className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all mb-6 text-sm font-medium"
      >
        <Plus className="w-4 h-4" /> Novo Estudo
      </button>

      <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Chats Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Conversas Recentes</h2>
          <div className="space-y-1">
            {chats.slice(0, 10).map(chat => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                  activeTab === 'chat' && activeChatId === chat.id 
                    ? 'bg-[#114B5F]/40 text-[#87D68D]' 
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 opacity-70" />
                <span className="truncate">{chat.title || 'Novo Estudo'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notebooks Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Meus Cadernos</h2>
          <div className="space-y-4">
            {collections.map(collection => (
              <div key={collection.id} className="space-y-1">
                <div className="flex items-center gap-2 px-2 text-sm font-medium text-gray-400">
                  <Folder className="w-4 h-4" />
                  <span className="truncate">{collection.name}</span>
                </div>
                <div className="pl-4 space-y-1 border-l border-white/10 ml-4 mt-2">
                  {notebooks.filter(n => n.collectionId === collection.id).map(notebook => (
                    <button
                      key={notebook.id}
                      onClick={() => onSelectNotebook(notebook.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                        activeTab === 'notebook' && activeNotebookId === notebook.id 
                          ? 'bg-[#F8C537]/20 text-[#F8C537]' 
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <Book className="w-4 h-4 opacity-70" />
                      <span className="truncate">{notebook.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm text-gray-400 truncate">{userEmail}</span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
