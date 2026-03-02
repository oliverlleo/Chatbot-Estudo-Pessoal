import React from 'react';
import { Collection, Notebook, ChatSession } from '../types';
import { MessageSquare, Book, Folder, Plus, LogOut, User, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import clsx from 'clsx';

interface SidebarProps {
  collections: Collection[];
  notebooks: Notebook[];
  chats: ChatSession[];
  activeTab: 'chat' | 'notebook' | 'settings';
  activeChatId: string | null;
  activeNotebookId: string | null;
  onSelectChat: (id: string) => void;
  onSelectNotebook: (id: string) => void;
  onNewChat: (agent: 'estudo' | 'apostila') => void;
  onOpenSettings: () => void;
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
  onOpenSettings,
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

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => onNewChat('estudo')}
          className="flex-1 py-2 px-2 bg-gradient-to-br from-[#87D68D]/20 to-[#114B5F]/20 hover:from-[#87D68D]/30 hover:to-[#114B5F]/30 border border-[#87D68D]/30 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-medium text-[#87D68D]"
        >
          <Plus className="w-4 h-4" /> Estudo
        </button>
        <button
          onClick={() => onNewChat('apostila')}
          className="flex-1 py-2 px-2 bg-gradient-to-br from-[#F8C537]/20 to-[#d4a21e]/20 hover:from-[#F8C537]/30 hover:to-[#d4a21e]/30 border border-[#F8C537]/30 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-medium text-[#F8C537]"
        >
          <Plus className="w-4 h-4" /> Apostila
        </button>
      </div>

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
                    ? chat.agent === 'apostila' ? 'bg-[#F8C537]/20 text-[#F8C537]' : 'bg-[#114B5F]/40 text-[#87D68D]' 
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <MessageSquare className={clsx("w-4 h-4 opacity-70", chat.agent === 'apostila' && activeTab === 'chat' && activeChatId === chat.id ? 'text-[#F8C537]' : '')} />
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

      <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="truncate">Configurações</span>
        </button>
        
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
