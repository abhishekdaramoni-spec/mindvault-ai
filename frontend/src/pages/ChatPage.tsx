import React, { useState } from 'react';
import { BotMessageSquare, Send, BookOpen, Sparkles, AlertCircle, Copy, Check } from 'lucide-react';
import { sendChatMessage, ChatMessage, Citation } from '../services/api';

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text, conversationId);
      setConversationId(res.conversation_id);
      const asstMsg: ChatMessage = {
        id: res.message_id,
        role: 'assistant',
        content: res.content,
        citations: res.citations,
        model_used: res.model_used,
        suggested_follow_ups: res.suggested_follow_ups,
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error communicating with MindVault backend. Ensure server and local Ollama are running.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col rounded-xl border border-[#1e293b] bg-[#121929] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#1e293b] bg-[#0e1424] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400">
            <BotMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-100">AI Research Assistant</h1>
            <p className="text-[11px] text-gray-400">Grounded strictly on your indexed documents with verifiable citations</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([]);
            setConversationId(undefined);
          }}
          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-[#1e293b] hover:bg-[#162035]"
        >
          New Session
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto text-gray-400 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-200">Start Knowledge Inquiry</h2>
              <p className="text-xs text-gray-400 mt-1">
                Ask questions across all indexed reports, documents, and research papers. MindVault will retrieve exact excerpts and build grounded synthesis.
              </p>
            </div>
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => handleSend("What are the core technical themes across the documents?")}
                className="w-full text-left p-3 rounded-lg bg-[#0e1424] border border-[#1e293b] hover:border-violet-500/40 text-xs text-gray-300 transition"
              >
                "What are the core technical themes across the documents?"
              </button>
              <button
                onClick={() => handleSend("Summarize the key architectural components.")}
                className="w-full text-left p-3 rounded-lg bg-[#0e1424] border border-[#1e293b] hover:border-violet-500/40 text-xs text-gray-300 transition"
              >
                "Summarize the key architectural components."
              </button>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div key={m.id} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-[#0e1424] border border-[#1e293b] text-gray-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Citation cards */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-3 border-t border-[#1e293b]/80 space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-cyan-400" />
                        <span>Sources & Citations</span>
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {m.citations.map((c, i) => (
                          <div
                            key={c.id || i}
                            className="p-2.5 rounded-lg bg-[#141d2e] border border-[#1e293b] text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between text-violet-300 font-semibold">
                              <span>[{i + 1}] {c.document_title}</span>
                              <span className="text-gray-400 text-[10px]">p. {c.page_number || 1}</span>
                            </div>
                            <p className="text-gray-400 italic font-serif">"{c.excerpt}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 text-[10px] text-gray-500">
                      <span>Model: {m.model_used || 'Ollama Local'}</span>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="flex items-center gap-1 hover:text-gray-300"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-[#0e1424] border border-[#1e293b] p-4 rounded-2xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>Analyzing knowledge base and synthesizing grounded response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#1e293b] bg-[#0e1424]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question grounded in your documents..."
            className="flex-1 bg-[#141d2e] border border-[#1e293b] rounded-lg px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
