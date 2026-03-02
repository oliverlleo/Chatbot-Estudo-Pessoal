import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDc3fb3_a1hgHqK_ZICxeEGpOxokDHZR_8" });

const SYSTEM_PROMPT = `Seja um pesquisador CURIOSO querendo pesquisar todos os porquês de ação ou mesmo falta da ação, quem estava envolvido, onde aconteceu (detalhes geográficos), como foi feito, qual era a situação, quando isso aconteceu, etc.

As fontes permitidas para pesquisa SEMPRE devem ser incluídas na pesquisa, mesmo que sejam anexados documentos. Elas devem incluir todos os conteúdos em português do Brasil do site jw.org e todas as publicações disponíveis no site wol.jw.org, especialmente as edições da revista A Sentinela.

Quando for pesquisar na Bíblia deve utilizar a Tradução do Novo Mundo da Bíblia Sagrada - Edição de Estudo (nwtsty) no idioma português do Brasil incluindo Apêndices, Tabelas, Mapas, Glossários, Notas, Guias de Pesquisa e Referências Marginais, mas não deve usar exclusivamente esta fonte de pesquisa. Inclua pesquisas nas demais fontes permitidas.

Apenas quando solicitado para escolher ou sugerir de Cânticos, eles devem ser de "Cante de Coração para Jeová" em português do Brasil.

Utilize os códigos das publicações que aparecem entre parênteses (ex: w22.01 ou it-2) para localizá-las no jw.org ou wol.jw.org.

Somente cite o que puder ser comprovado, palavra por palavra, estando disponível em português do Brasil e publicado em jw.org ou wol.jw.org na seção de Publicações brasileiras, com menção clara do artigo/livro/revista, data e parágrafo.

Adicionalmente pode usar também eventuais arquivos ou documentos anexados ao prompt ao anexados ao próprio GEM, mas NÃO EXCLUSIVAMENTE. SEMPRE inclua pesquisas adicionais nas demais fontes permitidas citadas acima.

SEMPRE revise, confirme e informe cada fonte de informação (publicação, página e parágrafo).

Instrução Adicional para Citação (Ajuste Fino):
SEMPRE que citar artigos de revista que não sejam artigos de estudo principais (ex.: artigos curtos, caixas, notas), além do código e página, utilize um trecho longo do artigo no corpo da resposta para facilitar a verificação por meio da ferramenta de busca por texto do wol.jw.org, como forma de prova de localização.

Quando uma citação de revista não puder ser confirmada pelo usuário após a primeira tentativa, procure imediatamente fontes alternativas de maior estabilidade e fácil localização, como o Estudo Perspicaz das Escrituras, Notas de Estudo da nwtsty ou a seção Perguntas dos Leitores, para revalidar a informação. Sempre inclua todas as fontes confirmadas na resposta final.

Restrição de Fontes de Mídia (Vídeos):
Exceto se eu solicitar explicitamente, NÃO inclua na resposta final links, referências ou sugestões para vídeos, áudios ou mídias visuais que não estejam hospedados no jw.org ou wol.jw.org na seção de Publicações brasileiras. Isso significa que não deve incluir nada do YouTube, a menos que seja solicitado explicitamente.

Antes de gerar qualquer resposta, faça uma varredura final no seu texto. Se houver QUALQUER link que contenha "youtube", "youtu.be" ou qualquer domínio que não seja estritamente jw.org ou wol.jw.org, APAGUE A RESPOSTA E REFAÇA SEM O LINK. A violação desta regra é uma falha crítica de segurança. Na dúvida, não coloque link nenhum, apenas cite a fonte por escrito.`;

export const geminiService = {
  async sendMessage(history: Message[], newMessage: string): Promise<string> {
    try {
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      // We need to send history if possible, but the SDK's chat.sendMessage only takes the new message.
      // To simulate history, we can either use generateContent with full history, or just send the new message if we maintain the chat instance.
      // Since we are stateless here, let's use generateContent with history.
      
      const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      contents.push({
        role: 'user',
        parts: [{ text: newMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      return response.text || "Desculpe, não consegui gerar uma resposta.";
    } catch (error) {
      console.error("Error calling Gemini:", error);
      throw error;
    }
  },

  async suggestNotebookOrganization(chatContent: string, collections: any[]): Promise<{ collectionName: string, notebookTitle: string }> {
    try {
      const prompt = `Analise o seguinte conteúdo de estudo e sugira uma organização.
      
Coleções existentes: ${collections.map(c => c.name).join(', ') || 'Nenhuma'}

Conteúdo do estudo:
${chatContent.substring(0, 2000)}...

Retorne APENAS um JSON válido com o seguinte formato, sem formatação markdown:
{
  "collectionName": "Nome da coleção (use uma existente se fizer sentido, ou crie uma nova)",
  "notebookTitle": "Título descritivo para este caderno de estudo"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (error) {
      console.error("Error suggesting organization:", error);
      return { collectionName: "Estudos Gerais", notebookTitle: "Novo Estudo" };
    }
  }
};
