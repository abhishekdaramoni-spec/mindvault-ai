import React, { useEffect, useState } from 'react';
import { Settings, Cpu, HardDrive, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { testOllama, updateSettings } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('llama3.2:3b');
  const [status, setStatus] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setTesting(true);
      const res = await testOllama();
      setStatus(res);
      if (res.selected_model) setModel(res.selected_model);
    } catch (e: any) {
      setStatus({ is_reachable: false, message: 'Could not connect to Ollama' });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({ base_url: baseUrl, model });
      setSaveMsg('Configuration updated successfully!');
      setTimeout(() => setSaveMsg(null), 3000);
      await checkConnection();
    } catch (e) {
      alert('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-400" />
          <span>System & Engine Settings</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure local Ollama inference endpoints, default LLM models, and embedding behavior.
        </p>
      </div>

      {saveMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Honest Architecture & Operating Modes Card */}
      <div className="bg-[#121929] border border-[#1e293b] rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          <span>Deployment & Operating Modes</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#0c111e] border border-[#1f293d] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200">Local Mode (Recommended)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-600/20 text-violet-300 border border-violet-500/30">Local Host</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Runs on your machine with direct access to local Ollama (<code className="text-violet-300">localhost:11434</code>), local SQLite database, and persistent file storage in <code className="text-cyan-300">./data/</code>.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0c111e] border border-[#1f293d] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200">Hosted Mode (Vercel)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-600/20 text-cyan-300 border border-cyan-500/30">Cloud Serverless</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Runs serverless Python backend with in-memory/ephemeral <code className="text-cyan-300">/tmp</code> storage and 384-d semantic HashingVectorizer. Local Ollama on your personal laptop is not directly reachable by Vercel serverless functions across public networks.
            </p>
          </div>
        </div>
      </div>

      {/* Ollama Configuration Card */}
      <form onSubmit={handleSave} className="bg-[#121929] border border-[#1e293b] rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
          <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Local AI Model (Ollama)</span>
          </h2>
          <button
            type="button"
            onClick={checkConnection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162035] text-gray-300 hover:text-white text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {status && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              status.is_reachable
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}
          >
            {status.is_reachable ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{status.message || (status.is_reachable ? 'Ollama is reachable' : 'Ollama is offline')}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Ollama Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-[#0e1424] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Ollama Model</label>
            {status?.models && status.models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0e1424] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-violet-500 font-mono"
              >
                {status.models.map((m: string) => (
                  <option key={m} value={m} className="bg-[#0e1424]">
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama3.2:3b"
                className="w-full bg-[#0e1424] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-violet-500 font-mono"
              />
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Embeddings Diagnostics Card */}
      <div className="bg-[#121929] border border-[#1e293b] rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Vector Storage & Privacy Guarantee</span>
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          MindVault AI operates strictly in local mode. All documents, extracted chunks, and vector embeddings are stored locally inside <code className="text-violet-300">./data/</code> on your computer. No external third-party cloud services or API keys are required.
        </p>
      </div>
    </div>
  );
};
