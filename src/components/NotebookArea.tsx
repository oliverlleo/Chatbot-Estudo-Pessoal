import React, { useState, useEffect } from 'react';
import { Notebook } from '../types';
import { dbService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Save, Loader2, Book, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

interface NotebookAreaProps {
  notebook: Notebook | null;
  onUpdateNotebook: () => void;
}

export default function NotebookArea({ notebook, onUpdateNotebook }: NotebookAreaProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notebook) {
      setContent(notebook.content);
      setIsEditing(false);
    }
  }, [notebook]);

  if (!notebook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 h-full bg-[#241623]">
        <Book className="w-16 h-16 mb-4 text-[#F8C537] opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Nenhum caderno selecionado</h2>
        <p className="text-center max-w-md">
          Selecione um caderno na barra lateral para visualizar ou editar seus estudos salvos.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!user || !notebook || isSaving) return;
    setIsSaving(true);

    try {
      await dbService.updateNotebook(user.uid, notebook.collectionId, notebook.id, content);
      setIsEditing(false);
      onUpdateNotebook();
    } catch (error) {
      console.error("Error updating notebook:", error);
      alert('Erro ao salvar o caderno.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#241623] relative">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#1a1019]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F8C537]/20 rounded-lg flex items-center justify-center">
            <Book className="w-4 h-4 text-[#F8C537]" />
          </div>
          <div>
            <h2 className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{notebook.title}</h2>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              Atualizado em {format(notebook.updatedAt, "dd 'de' MMM, HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setContent(notebook.content); setIsEditing(false); }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[#F8C537] hover:bg-[#e0b232] text-black rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[calc(100vh-12rem)] bg-black/20 border border-white/10 rounded-2xl p-6 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F8C537]/50 resize-none font-mono text-sm leading-relaxed custom-scrollbar"
            />
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-[#F8C537] prose-a:text-[#87D68D] prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 bg-[#1a1019] p-8 rounded-2xl border border-white/5 shadow-xl">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
