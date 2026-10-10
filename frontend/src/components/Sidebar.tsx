import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderArchive,
  Network,
  BotMessageSquare,
  GitFork,
  Scale,
  Sparkles,
  BarChart3,
  Settings,
  Cpu,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

interface SidebarProps {
  ollamaStatus?: boolean;
}

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, badge: null },
  { name: 'My Knowledge', path: '/knowledge', icon: FolderArchive, badge: null },
  { name: 'Knowledge Graph', path: '/graph', icon: Network, badge: 'Live' },
  { name: 'AI Research Chat', path: '/chat', icon: BotMessageSquare, badge: null },
  { name: 'Connections', path: '/connections', icon: GitFork, badge: null },
  { name: 'Contradictions', path: '/contradictions', icon: Scale, badge: null },
  { name: 'Knowledge Gaps', path: '/gaps', icon: Sparkles, badge: null },
  { name: 'Analytics', path: '/analytics', icon: BarChart3, badge: null },
  { name: 'Settings', path: '/settings', icon: Settings, badge: null },
];

export const Sidebar: React.FC<SidebarProps> = ({ ollamaStatus = true }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-[#0c111e]/95 backdrop-blur-xl border-r border-[#1a2336] flex flex-col h-screen fixed left-0 top-0 select-none z-30 transition-all duration-300 ease-in-out shadow-2xl shadow-black/40`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1a2336] flex items-center justify-between relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-600/30 flex-shrink-0 border border-violet-400/20">
            <Network className="w-5 h-5 text-white animate-pulse" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                MindVault <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-cyan-300 font-mono border border-violet-500/30">AI</span>
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Intelligence Engine</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#162035] transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/25 to-cyan-600/10 text-cyan-300 border border-violet-500/40 shadow-lg shadow-violet-900/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#131b2e]'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform text-gray-300 group-hover:text-cyan-400" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Pill */}
      <div className="p-3 border-t border-[#1a2336] bg-[#080d17]/80">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d]">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-gray-300 font-medium text-[11px]">Local Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${ollamaStatus ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[10px] text-gray-400 font-mono">{ollamaStatus ? 'ONLINE' : 'WAIT'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>100% On-Device</span>
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>SQLite + Vectors</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span title="Ollama Status" className={`w-2.5 h-2.5 rounded-full ${ollamaStatus ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span title="Private & Local"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
          </div>
        )}

      </div>
    </aside>
  );
};
