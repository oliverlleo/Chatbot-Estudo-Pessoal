import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, Loader2, Archive, MessageSquare, RotateCcw } from 'lucide-react';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { ChatSession } from '../types';

interface SettingsAreaProps {
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
  chats: ChatSession[];
  onUpdateChat: () => void;
}

export default function SettingsArea({ currentApiKey, onSaveApiKey, chats, onUpdateChat }: SettingsAreaProps) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage('');
    try {
      await dbService.saveUserSettings(user.uid, apiKey);
      onSaveApiKey(apiKey);
      setMessage('Configurações salvas com sucesso!');
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreChat = async (chatId: string) => {
    if (!user) return;
    await dbService.updateChat(user.uid, chatId, { isArchived: false });
    onUpdateChat();
  };

  const archivedChats = chats.filter(c => c.isArchived);

  return (
    <div className="flex flex-col h-full bg-[#241623] relative">
      <div className="h-16 border-b border-white/10 flex items-center px-6 bg-[#1a1019]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-white">Configurações</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-[#1a1019] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#F8C537]" />
              Chave de API do Gemini
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Para utilizar o assistente, você precisa fornecer sua própria chave de API do Google Gemini. 
              Sua chave será salva de forma segura no seu banco de dados e usada apenas para as suas requisições.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#87D68D]/50 transition-all"
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#87D68D] hover:underline"
                >
                  Obter uma chave de API
                </a>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#87D68D] to-[#114B5F] hover:from-[#76c27c] hover:to-[#0d3b4b] text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('sucesso') ? 'bg-[#87D68D]/20 text-[#87D68D]' : 'bg-red-500/20 text-red-400'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1019] border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-400" />
                Conversas Arquivadas
              </h3>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm text-white rounded-xl font-medium transition-all"
              >
                {showArchived ? 'Ocultar Arquivadas' : 'Mostrar Arquivadas'}
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Aqui você pode visualizar todas as conversas que foram arquivadas. Você pode restaurá-las para a barra lateral a qualquer momento.
            </p>

            {showArchived && (
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {archivedChats.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 bg-black/20 rounded-xl border border-white/5">
                    Nenhuma conversa arquivada no momento.
                  </div>
                ) : (
                  archivedChats.map(chat => (
                    <div key={chat.id} className="flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{chat.title}</span>
                      </div>
                      <button
                        onClick={() => handleRestoreChat(chat.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-[#87D68D]/10 hover:bg-[#87D68D]/20 text-[#87D68D] rounded-lg text-xs font-medium transition-all shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restaurar
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
