import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, Collection } from '../types';
import { geminiService } from '../services/gemini';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Send, Save, Loader2, Sparkles, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

interface ChatAreaProps {
  chat: ChatSession | null;
  onUpdateChat: () => void;
  collections: Collection[];
  onNotebookSaved: () => void;
}

export default function ChatArea({ chat, onUpdateChat, collections, onNotebookSaved }: ChatAreaProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      setLocalMessages(chat.messages);
    } else {
      setLocalMessages([]);
    }
  }, [chat?.id, chat?.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isLoading]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 h-full bg-[#241623]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-24 h-24 bg-gradient-to-br from-[#87D68D] to-[#114B5F] rounded-3xl flex items-center justify-center shadow-2xl mb-6"
        >
          <BookOpen className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Estudo Pessoal</h2>
        <p className="text-center max-w-md">
          Selecione uma conversa ao lado ou inicie um novo estudo para começar suas pesquisas profundas.
        </p>
      </div>
    );
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...localMessages, newMessage];
    setLocalMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to DB
      await dbService.updateChatMessages(user.uid, chat.id, updatedMessages);
      
      // Get AI response
      const responseText = await geminiService.sendMessage(localMessages, newMessage.content, selectedModel, chat.agent || 'estudo');
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      const finalMessages = [...updatedMessages, modelMessage];
      setLocalMessages(finalMessages);
      
      // Save AI message to DB
      await dbService.updateChatMessages(user.uid, chat.id, finalMessages);
      onUpdateChat();
    } catch (error: any) {
      console.error("Failed to get response:", error);
      
      let errorMessage = "Erro ao obter resposta da IA.";
      if (error?.message?.includes('leaked')) {
        errorMessage = "Sua chave de API do Gemini vazou e foi bloqueada pelo Google. Por favor, configure uma nova chave no painel de Secrets (Segredos) do AI Studio.";
      } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        errorMessage = "Você excedeu o limite de uso (quota) da sua chave de API do Gemini. Por favor, verifique seu plano ou configure uma nova chave no painel de Secrets.";
      } else if (error?.message?.includes('MISSING_API_KEY')) {
        errorMessage = "Chave de API do Gemini não configurada. Por favor, adicione-a no painel de Secrets do AI Studio.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotebook = async () => {
    if (!user || localMessages.length === 0 || isSaving) return;
    setIsSaving(true);

    try {
      const chatContent = localMessages.map(m => `${m.role === 'user' ? 'Pergunta' : 'Resposta'}:\n${m.content}`).join('\n\n');
      const suggestion = await geminiService.suggestNotebookOrganization(chatContent, collections);
      
      let collectionId = collections.find(c => c.name.toLowerCase() === suggestion.collectionName.toLowerCase())?.id;
      
      if (!collectionId) {
        const newCol = await dbService.createCollection(user.uid, suggestion.collectionName);
        collectionId = newCol.id;
      }

      await dbService.createNotebook(user.uid, collectionId, suggestion.notebookTitle, chatContent);
      onNotebookSaved();
      alert('Estudo salvo no caderno com sucesso!');
    } catch (error) {
      console.error("Error saving notebook:", error);
      alert('Erro ao salvar o estudo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#241623] relative">
      {/* Chat Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1019]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", chat.agent === 'apostila' ? 'bg-gradient-to-br from-[#F8C537] to-[#d4a21e]' : 'bg-gradient-to-br from-[#87D68D] to-[#114B5F]')}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{chat.title || 'Novo Estudo'}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black/30 border border-white/10 text-white text-sm rounded-lg focus:ring-[#87D68D] focus:border-[#87D68D] block p-2 outline-none"
          >
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Melhor)</option>
            <option value="gemini-3-flash-preview">Gemini 3 Flash (Rápido)</option>
          </select>
          
          <button 
            onClick={handleSaveToNotebook}
            disabled={isSaving || localMessages.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#F8C537]/10 hover:bg-[#F8C537]/20 text-[#F8C537] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar no Caderno'}</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {localMessages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={clsx(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md",
                msg.role === 'user' 
                  ? "bg-gradient-to-br from-[#114B5F] to-[#0d3b4b] text-white rounded-tr-sm" 
                  : "bg-[#1a1019] border border-white/10 text-gray-200 rounded-tl-sm"
              )}>
                {msg.role === 'model' && (
                  <div className={clsx("flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider", chat.agent === 'apostila' ? 'text-[#F8C537]' : 'text-[#87D68D]')}>
                    <Sparkles className="w-3 h-3" />
                    {chat.agent === 'apostila' ? 'Apostila' : 'Estudo Pessoal'}
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start w-full"
          >
            <div className="bg-[#1a1019] border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-[#87D68D]" />
              <span className="text-sm animate-pulse">Pesquisando nas fontes...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#1a1019]/80 backdrop-blur-md border-t border-white/10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-2">
          <div className="relative flex-1 bg-black/30 border border-white/10 rounded-2xl focus-within:border-[#87D68D]/50 focus-within:ring-1 focus-within:ring-[#87D68D]/50 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Faça sua pergunta de pesquisa..."
              className="w-full max-h-32 min-h-[56px] bg-transparent text-white placeholder-gray-500 p-4 resize-none focus:outline-none custom-scrollbar rounded-2xl"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-14 w-14 shrink-0 bg-gradient-to-br from-[#87D68D] to-[#114B5F] hover:from-[#76c27c] hover:to-[#0d3b4b] text-white rounded-2xl flex items-center justify-center shadow-lg disabled:opacity-50 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-2 text-xs text-gray-500">
          Pressione Enter para enviar, Shift + Enter para nova linha
        </div>
      </div>
    </div>
  );
}
