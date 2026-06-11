/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoalRule, CalendarEvent, ReminderItem } from './types';
import { DEFAULT_GOAL_RULES, DEFAULT_CALENDAR_EVENTS, DEFAULT_REMINDERS } from './initialData';
import Dashboard from './components/Dashboard';
import GoalDetail from './components/GoalDetail';
import RuleManager from './components/RuleManager';
import SandboxData from './components/SandboxData';
import { Activity, LayoutDashboard, Settings, CalendarRange, Palette } from 'lucide-react';

interface ColorTheme {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  bg: string;
  border: string;
  surface: string;
  text: string;
  muted: string;
  statusOkBg?: string;
  statusOkText?: string;
  statusOkBorder?: string;
  statusOffBg?: string;
  statusOffText?: string;
  statusOffBorder?: string;
  auxiliary?: string;
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'sage',
    name: 'Sage Garden',
    accent: '#5E634F',
    accentSoft: '#A6AF92',
    bg: '#FAF9F6',
    border: '#E6E5DF',
    surface: '#FFFFFF',
    text: '#31332C',
    muted: '#7E8272',
    statusOkBg: '#EDF1D6',
    statusOkText: '#40513B',
    statusOkBorder: '#9DC08B',
    auxiliary: '#E9C46A',
  },
  {
    id: 'crimson',
    name: 'Crimson Rose',
    accent: '#C0392B',
    accentSoft: '#E6B0AA',
    bg: '#FAF4F4',
    border: '#F5DCDD',
    surface: '#FFFFFF',
    text: '#4A2318',
    muted: '#935147',
    statusOkBg: '#E8F8F5',
    statusOkText: '#117864',
    statusOkBorder: '#A3E4D7',
    statusOffBg: '#FDEDEC',
    statusOffText: '#C0392B',
    statusOffBorder: '#FADBD8',
    auxiliary: '#E59866',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    accent: '#2F74B8',
    accentSoft: '#73A5D4',
    bg: '#F2F6FA',
    border: '#D9E6F5',
    surface: '#FFFFFF',
    text: '#1C334E',
    muted: '#5F7796',
    statusOkBg: '#EAFAF1',
    statusOkText: '#145A32',
    statusOkBorder: '#A9DFBF',
    auxiliary: '#F39C12',
  },
  {
    id: 'forest',
    name: 'Forest Moss',
    accent: '#38761D',
    accentSoft: '#8CB26C',
    bg: '#F5FAF2',
    border: '#E1F0D8',
    surface: '#FFFFFF',
    text: '#1B3012',
    muted: '#526E43',
    statusOkBg: '#D4EFDF',
    statusOkText: '#196F3D',
    statusOkBorder: '#A9DFBF',
    auxiliary: '#E67E22',
  },
  {
    id: 'peach',
    name: 'Peach Amber',
    accent: '#E67E22',
    accentSoft: '#EDBB99',
    bg: '#FCF6F0',
    border: '#F5CBA7',
    surface: '#FFFFFF',
    text: '#5E3516',
    muted: '#B26E3A',
    statusOkBg: '#D4EFDF',
    statusOkText: '#196F3D',
    statusOkBorder: '#A5D6A7',
    statusOffBg: '#FDF2E9',
    statusOffText: '#D35400',
    statusOffBorder: '#FDEBD0',
    auxiliary: '#F4D35E',
  },
  {
    id: 'lavender',
    name: 'Lavender Mist',
    accent: '#8E44AD',
    accentSoft: '#BB8FCE',
    bg: '#F7F4FB',
    border: '#E8E2F2',
    surface: '#FFFFFF',
    text: '#2E1E3F',
    muted: '#7D659E',
    statusOkBg: '#D5F5E3',
    statusOkText: '#117A65',
    statusOkBorder: '#A2D9CE',
    statusOffBg: '#F9EBEA',
    statusOffText: '#922B21',
    statusOffBorder: '#F5B7B1',
    auxiliary: '#E59866',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load state from localStorage or default to seeded data for first-time visits
  const [rules, setRules] = useState<GoalRule[]>(() => {
    const saved = localStorage.getItem('apple_goals_rules');
    return saved ? JSON.parse(saved) : DEFAULT_GOAL_RULES;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('apple_goals_events');
    return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_EVENTS;
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('apple_goals_reminders');
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(() => {
    return rules[0]?.id || null;
  });

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // 4 = May (0-indexed)

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('apple_goals_theme') || 'sage';
  });

  // Sync to local storage whenever changes occur
  useEffect(() => {
    localStorage.setItem('apple_goals_rules', JSON.stringify(rules));
    if (rules.length > 0 && !selectedGoalId) {
      setSelectedGoalId(rules[0].id);
    }
  }, [rules, selectedGoalId]);

  useEffect(() => {
    localStorage.setItem('apple_goals_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('apple_goals_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('apple_goals_theme', currentThemeId);
  }, [currentThemeId]);

  // Reset database defaults to make testing and demonstration extremely painless
  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to restore the default mock database? Your current customizations will be reset.')) {
      setRules(DEFAULT_GOAL_RULES);
      setEvents(DEFAULT_CALENDAR_EVENTS);
      setReminders(DEFAULT_REMINDERS);
      setSelectedGoalId(DEFAULT_GOAL_RULES[0].id);
      setActiveTab('dashboard');
    }
  };

  const activeTheme = COLOR_THEMES.find(t => t.id === currentThemeId) || COLOR_THEMES[0];
  const themeStyles = {
    '--color-natural-bg': activeTheme.bg,
    '--color-natural-surface': activeTheme.surface,
    '--color-natural-accent': activeTheme.accent,
    '--color-natural-accent-soft': activeTheme.accentSoft,
    '--color-natural-text': activeTheme.text,
    '--color-natural-muted': activeTheme.muted,
    '--color-natural-border': activeTheme.border,
    ...(activeTheme.statusOkBg && { '--color-status-ok-bg': activeTheme.statusOkBg }),
    ...(activeTheme.statusOkText && { '--color-status-ok-text': activeTheme.statusOkText }),
    ...(activeTheme.statusOkBorder && { '--color-status-ok-border': activeTheme.statusOkBorder }),
    ...(activeTheme.statusOffBg && { '--color-status-off-bg': activeTheme.statusOffBg }),
    ...(activeTheme.statusOffText && { '--color-status-off-text': activeTheme.statusOffText }),
    ...(activeTheme.statusOffBorder && { '--color-status-off-border': activeTheme.statusOffBorder }),
    ...(activeTheme.auxiliary && { '--color-auxiliary': activeTheme.auxiliary }),
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-natural-accent-soft selection:text-white" 
      id="application-container"
      style={themeStyles}
    >
      {/* 1. TOP HEADER BANNER */}
      <header className="border-b border-natural-border bg-natural-surface sticky top-0 z-40 shadow-[0_2px_8px_rgba(107,112,92,0.03)]" id="appl-header">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Logo Name & Branded Title */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-natural-accent flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold text-natural-accent tracking-tighter font-serif leading-none">SyncLife</h1>
              <p className="text-[9px] text-natural-muted font-medium font-sans">Apple Calendar Goals</p>
            </div>
          </div>

          {/* Theme & Navigation Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* COMPACT PALETTE SELECTOR */}
            <div className="flex items-center gap-1.5 bg-natural-bg/70 border border-natural-border p-1 rounded-xl">
              <span className="text-[10px] font-bold text-natural-muted px-1 cursor-default flex items-center gap-1">
                <Palette className="w-3 h-3 text-natural-accent" />
                Theme:
              </span>
              <div className="flex items-center gap-1 select-none">
                {COLOR_THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentThemeId(t.id)}
                    className={`w-3 h-3 rounded-full border transition-all cursor-pointer ${
                      currentThemeId === t.id ? 'ring-2 ring-natural-accent scale-110' : 'border-black/10 hover:scale-105'
                    }`}
                    style={{ backgroundColor: t.accent }}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            <nav className="flex items-center gap-1 flex-wrap">
              <button
                id="nav-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-natural-accent text-white font-bold shadow-sm'
                    : 'text-natural-muted hover:text-natural-text hover:bg-natural-border/40'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                id="nav-tab-detail"
                onClick={() => setActiveTab('detail')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'detail'
                    ? 'bg-natural-accent text-white font-bold shadow-sm'
                    : 'text-natural-muted hover:text-natural-text hover:bg-natural-border/40'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>

              <button
                id="nav-tab-rules"
                onClick={() => setActiveTab('rules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'rules'
                    ? 'bg-natural-accent text-white font-bold shadow-sm'
                    : 'text-natural-muted hover:text-natural-text hover:bg-natural-border/40'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Rules</span>
              </button>

              <button
                id="nav-tab-sandbox"
                onClick={() => setActiveTab('sandbox')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'sandbox'
                    ? 'bg-natural-accent text-white font-bold shadow-sm'
                    : 'text-natural-muted hover:text-natural-text hover:bg-natural-border/40'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Data Import</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 2. CORE VIEW CANVAS */}
      <main className="max-w-6xl mx-auto px-4 py-5" id="appl-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            rules={rules}
            events={events}
            reminders={reminders}
            selectedGoalId={selectedGoalId}
            setSelectedGoalId={setSelectedGoalId}
            setActiveTab={setActiveTab}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        )}

        {activeTab === 'detail' && (
          <GoalDetail
            rules={rules}
            events={events}
            reminders={reminders}
            selectedRuleId={selectedGoalId}
            setSelectedRuleId={setSelectedGoalId}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        )}

        {activeTab === 'rules' && (
          <RuleManager
            rules={rules}
            setRules={setRules}
            onSelectGoal={(id) => setSelectedGoalId(id)}
          />
        )}

        {activeTab === 'sandbox' && (
          <SandboxData
            events={events}
            setEvents={setEvents}
            reminders={reminders}
            setReminders={setReminders}
            resetToDefaults={handleResetToDefaults}
          />
        )}
      </main>

      {/* 3. COHESIVE SYSTEM FOOTER */}
      <footer className="border-t border-natural-border bg-natural-surface py-4 mt-10 text-center text-xs text-natural-muted font-medium">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 SyncLife Calendar sync engine. Local sandbox mode.</p>
          <div className="flex gap-4 font-mono text-[10px] text-natural-muted">
            <span>Status: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
