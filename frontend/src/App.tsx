import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { GraphPage } from './pages/GraphPage';
import { ChatPage } from './pages/ChatPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { ContradictionsPage } from './pages/ContradictionsPage';
import { KnowledgeGapsPage } from './pages/KnowledgeGapsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const handleGlobalSearch = (query: string) => {
    window.location.href = `/chat?q=${encodeURIComponent(query)}`;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex">
        {/* Persistent Left Sidebar */}
        <Sidebar />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onSearch={handleGlobalSearch} />

          <main className="flex-1 p-8 pl-72 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/contradictions" element={<ContradictionsPage />} />
              <Route path="/gaps" element={<KnowledgeGapsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
