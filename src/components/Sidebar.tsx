import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Collection, Notebook, ChatSession } from '../types';
import { MessageSquare, Book, Folder, Plus, LogOut, User, Settings, MoreVertical, Archive, Trash2, Edit2, Pin, PinOff, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { dbService } from '../services/db';

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
  onUpdateChat: () => void;
  userId: string;
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
  userEmail,
  onUpdateChat,
  userId
}: SidebarProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [visibleChatsCount, setVisibleChatsCount] = useState(7);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'all' | 'title' | 'content'>('all');
  const [searchMatch, setSearchMatch] = useState<'approx' | 'exact'>('approx');
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRenameSubmit = async (e: React.FormEvent, chatId: string) => {
    e.preventDefault();
    if (editTitle.trim()) {
      await dbService.updateChat(userId, chatId, { title: editTitle });
      onUpdateChat();
    }
    setEditingChatId(null);
  };

  const togglePin = async (chat: ChatSession) => {
    await dbService.updateChat(userId, chat.id, { isPinned: !chat.isPinned });
    onUpdateChat();
    setMenuOpenId(null);
  };

  const archiveChat = async (chat: ChatSession) => {
    await dbService.updateChat(userId, chat.id, { isArchived: true });
    if (activeChatId === chat.id) {
      onSelectChat('');
    }
    onUpdateChat();
    setMenuOpenId(null);
  };

  const deleteChat = async (chatId: string) => {
    if (window.confirm('Tem certeza de que deseja deletar esta conversa definitivamente? Essa ação não pode ser desfeita.')) {
      await dbService.deleteChat(userId, chatId);
      if (activeChatId === chatId) {
        onSelectChat('');
      }
      onUpdateChat();
    }
    setMenuOpenId(null);
  };

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    let result = chats.filter(c => !c.isArchived);

    // Search
    if (searchQuery.trim() !== '') {
      const q = searchMatch === 'exact' ? searchQuery : searchQuery.toLowerCase();
      result = result.filter(c => {
        let titleMatch = false;
        let contentMatch = false;

        if (searchTarget === 'title' || searchTarget === 'all') {
          titleMatch = searchMatch === 'exact' ? c.title.includes(q) : c.title.toLowerCase().includes(q);
        }

        if (searchTarget === 'content' || searchTarget === 'all') {
          const allContent = c.messages.map(m => m.content).join(' ');
          contentMatch = searchMatch === 'exact' ? allContent.includes(q) : allContent.toLowerCase().includes(q);
        }

        return titleMatch || contentMatch;
      });
    }

    // Sort: pinned first, then by date
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [chats, searchQuery, searchTarget, searchMatch]);

  const displayedChats = filteredAndSortedChats.slice(0, visibleChatsCount);

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
          <div className="flex flex-col mb-3 px-2 gap-2 relative z-20" ref={searchRef}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversas Recentes</h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#87D68D]/50"
              />
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2" />
              <button
                onClick={() => setShowSearchOptions(!showSearchOptions)}
                className="absolute right-2 top-1.5 p-0.5 text-gray-400 hover:text-white rounded"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSearchOptions ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {showSearchOptions && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-2 right-2 mt-1 bg-[#241623] border border-white/10 rounded-lg p-3 shadow-xl z-30"
                >
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Buscar em:</span>
                      <div className="flex gap-2">
                        {['all', 'title', 'content'].map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="radio"
                              name="searchTarget"
                              checked={searchTarget === opt}
                              onChange={() => setSearchTarget(opt as any)}
                              className="accent-[#87D68D]"
                            />
                            {opt === 'all' ? 'Tudo' : opt === 'title' ? 'Título' : 'Conteúdo'}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5 block">Correspondência:</span>
                      <div className="flex gap-2">
                        {['approx', 'exact'].map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                            <input
                              type="radio"
                              name="searchMatch"
                              checked={searchMatch === opt}
                              onChange={() => setSearchMatch(opt as any)}
                              className="accent-[#87D68D]"
                            />
                            {opt === 'approx' ? 'Aproximada' : 'Exata'}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1 relative z-10">
            {displayedChats.map(chat => (
              <div key={chat.id} className="group relative">
                {editingChatId === chat.id ? (
                  <form onSubmit={(e) => handleRenameSubmit(e, chat.id)} className="px-3 py-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={(e) => handleRenameSubmit(e, chat.id)}
                      className="w-full bg-black/40 border border-[#87D68D]/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                    />
                  </form>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => onSelectChat(chat.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                        activeTab === 'chat' && activeChatId === chat.id
                          ? chat.agent === 'apostila' ? 'bg-[#F8C537]/20 text-[#F8C537]' : 'bg-[#114B5F]/40 text-[#87D68D]'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className={clsx("w-4 h-4 opacity-70 shrink-0", chat.agent === 'apostila' && activeTab === 'chat' && activeChatId === chat.id ? 'text-[#F8C537]' : '')} />
                      <span className="truncate flex-1">{chat.title || 'Novo Estudo'}</span>
                      {chat.isPinned && <Pin className="w-3 h-3 text-[#F8C537] shrink-0" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                      }}
                      className={`p-1.5 rounded-md transition-opacity shrink-0 mr-1 ${
                        menuOpenId === chat.id ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'
                      }`}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                )}

                {/* Context Menu */}
                {menuOpenId === chat.id && !editingChatId && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpenId(null)}
                    />
                    <div className="absolute right-2 top-10 w-40 bg-[#1a1019] border border-white/10 rounded-lg shadow-xl py-1 z-50">
                      <button
                        onClick={() => {
                          setEditTitle(chat.title);
                          setEditingChatId(chat.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Renomear
                      </button>
                      <button
                        onClick={() => togglePin(chat)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                      >
                        {chat.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        {chat.isPinned ? 'Desfixar' : 'Fixar'}
                      </button>
                      <button
                        onClick={() => archiveChat(chat)}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5" /> Arquivar
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        onClick={() => deleteChat(chat.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Deletar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {filteredAndSortedChats.length > visibleChatsCount && (
              <button
                onClick={() => setVisibleChatsCount(prev => prev + 7)}
                className="w-full mt-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Mostrar mais...
              </button>
            )}

            {filteredAndSortedChats.length === 0 && (
              <div className="text-center py-4 text-xs text-gray-500">
                Nenhuma conversa encontrada.
              </div>
            )}
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
