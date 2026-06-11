/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoalRule, CalendarEvent, ReminderItem } from '../types';
import { calculateGoalProgress, aggregatePeriodically } from '../goalEngine';
import { Check, X, ShieldAlert, Award, Calendar, Activity, ChevronRight, ChevronLeft, Edit } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DashboardProps {
  rules: GoalRule[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string) => void;
  setActiveTab: (tab: string) => void;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedMonth: number;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
}

export default function Dashboard({
  rules,
  events,
  reminders,
  selectedGoalId,
  setSelectedGoalId,
  setActiveTab,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth
}: DashboardProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [statementText, setStatementText] = useState(() => {
    return localStorage.getItem('apple_goals_statement') || `Evaluating performance for 2026-05-30 using rules matching your local calendar & reminders.`;
  });
  const [isEditingStatement, setIsEditingStatement] = useState(false);

  const getAvailableYears = () => {
    const years = new Set<number>([2024, 2025, 2026, 2027]);
    events.forEach(e => {
      if (e.startDate) {
        const yr = new Date(e.startDate).getFullYear();
        if (!isNaN(yr)) years.add(yr);
      }
    });
    reminders.forEach(r => {
      if (r.dueDate) {
        const yr = new Date(r.dueDate).getFullYear();
        if (!isNaN(yr)) years.add(yr);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 0) {
        setSelectedYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => {
      if (prev === 11) {
        setSelectedYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Dynamically calculate the anchor date:
  // If Selected Year-Month is May 2026, keep '2026-05-30' for compatibility
  let anchorDateStr = '2026-05-30';
  if (selectedYear !== 2026 || selectedMonth !== 4) {
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const targetDay = Math.min(30, lastDay);
    const mStr = String(selectedMonth + 1).padStart(2, '0');
    const dStr = String(targetDay).padStart(2, '0');
    anchorDateStr = `${selectedYear}-${mStr}-${dStr}`;
  }
  const anchorDate = new Date(`${anchorDateStr}T00:00:00`);

  // Start Date for general calculations (covers the selected month/year)
  const rangeStart = new Date(selectedYear, selectedMonth, 1, 0, 0, 0);
  const rangeEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  // Process rules to grab scores
  const ruleStats = rules.map(rule => {
    // 1. Get raw day progressions
    const dayAggs = calculateGoalProgress(rule, events, reminders, rangeStart, rangeEnd);
    
    // 2. Aggregate periodically
    const periodAggs = aggregatePeriodically(rule, dayAggs);

    // 3. Find current period values
    let currentPeriodVal = 0;
    let isAchieved = false;
    let currentLabel = '';
    let currentPeriodAgg = periodAggs[periodAggs.length - 1]; // default fallback (latest)

    if (rule.period === 'daily') {
      const match = periodAggs.find(p => p.periodKey === anchorDateStr);
      if (match) {
        currentPeriodAgg = match;
        currentPeriodVal = match.value;
        isAchieved = match.achieved;
        currentLabel = 'Today';
      }
    } else if (rule.period === 'weekly') {
      // Find the week containing anchorDate
      const current = new Date(anchorDate.getTime());
      const day = current.getDay();
      const distanceToMonday = (day === 0 ? -6 : 1 - day);
      const monday = new Date(current.getTime());
      monday.setDate(current.getDate() + distanceToMonday);
      monday.setHours(0,0,0,0);
      const y = monday.getFullYear();
      const m = String(monday.getMonth() + 1).padStart(2, '0');
      const d = String(monday.getDate()).padStart(2, '0');
      const targetWeekKey = `W-${y}-${m}-${d}`;

      const match = periodAggs.find(p => p.periodKey === targetWeekKey);
      if (match) {
        currentPeriodAgg = match;
        currentPeriodVal = match.value;
        isAchieved = match.achieved;
        currentLabel = 'This Week';
      }
    } else if (rule.period === 'monthly') {
      const targetMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const match = periodAggs.find(p => p.periodKey === targetMonthKey);
      if (match) {
        currentPeriodAgg = match;
        currentPeriodVal = match.value;
        isAchieved = match.achieved;
        currentLabel = 'This Month';
      }
    }

    // Grab latest fallback if no anchor match is resolved
    if (!currentLabel) {
      currentPeriodVal = currentPeriodAgg?.value || 0;
      isAchieved = currentPeriodAgg?.achieved || false;
      currentLabel = currentPeriodAgg?.label || 'Current Period';
    }

    return {
      rule,
      currentPeriodVal,
      isAchieved,
      currentLabel,
      currentPeriodAgg
    };
  });

  // Filtered list
  const filteredStats = ruleStats.filter(stat => {
    if (filterPeriod === 'all') return true;
    return stat.rule.period === filterPeriod;
  });

  // Count total achievements
  const totalTracked = filteredStats.length;
  const totalAchieved = filteredStats.filter(s => s.isAchieved).length;
  const achievementRate = totalTracked > 0 ? Math.round((totalAchieved / totalTracked) * 100) : 0;

  return (
    <div className="space-y-4" id="dashboard-container">
      {/* 1. STATUS HIGHLIGHT BANNER */}
      <div className="bg-natural-surface border border-natural-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-natural-accent">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-bold font-sans tracking-wider uppercase">Apple Health Sync Active</span>
          </div>
          <h2 className="text-lg font-bold text-natural-text font-serif tracking-tight">Dashboard</h2>
          <div className="pt-1.5 pb-0.5">
            {isEditingStatement ? (
              <div className="flex items-center gap-2 max-w-xl">
                <textarea
                  value={statementText}
                  onChange={(e) => {
                    setStatementText(e.target.value);
                    localStorage.setItem('apple_goals_statement', e.target.value);
                  }}
                  className="w-full text-[11px] px-3 py-2 border border-natural-border bg-natural-bg text-natural-text rounded-lg focus:outline-none focus:border-natural-accent transition-colors font-sans resize-y"
                  rows={2}
                  placeholder="Enter your custom motivational statement or goal status..."
                />
                <button
                  type="button"
                  onClick={() => setIsEditingStatement(false)}
                  className="px-2.5 py-1.5 bg-natural-accent hover:bg-natural-accent/90 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm border-none self-end animate-pulse"
                >
                  Save
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingStatement(true)}
                className="group flex items-start gap-1.5 cursor-pointer max-w-xl rounded-lg border border-transparent hover:border-natural-border/30 hover:bg-natural-bg/30 p-1 -ml-1 transition-all"
                title="Click to edit statement"
              >
                <p className="text-[11px] text-natural-muted leading-relaxed font-sans select-none flex-1">
                  {statementText}
                </p>
                <button
                  type="button"
                  className="p-1 text-natural-muted/60 opacity-0 group-hover:opacity-100 hover:text-natural-accent transition-all cursor-pointer rounded bg-natural-bg/40"
                  aria-label="Edit statement"
                >
                  <Edit className="w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 divide-x divide-natural-border flex-wrap">
          <div className="text-left">
            <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block mb-0.5">Completion Rate</span>
            <span className="text-lg font-bold text-natural-text font-mono">
              {achievementRate}%
            </span>
          </div>
          <div className="pl-4 text-left">
            <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block mb-0.5">Goals Met</span>
            <span className="text-lg font-bold text-natural-text font-mono">
              {totalAchieved} <span className="text-natural-muted font-sans text-xs font-normal">of {totalTracked}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. FILTER BUTTONS & MONTH SELECTOR */}
      <div className="flex justify-between items-center flex-wrap gap-2.5 border-b border-natural-border pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-0.5 bg-natural-bg/80 border border-natural-border p-0.5 rounded-lg">
            {(['all', 'daily', 'weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                id={`filter-tab-${p}`}
                onClick={() => setFilterPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                  filterPeriod === p
                    ? 'bg-natural-accent text-white shadow-sm'
                    : 'text-natural-muted hover:text-natural-text hover:bg-natural-border/30'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Month/Year Navigation Control bar */}
          <div className="flex items-center gap-1 bg-natural-bg/80 border border-natural-border p-0.5 rounded-lg">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded text-natural-muted hover:text-natural-text transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center bg-white px-2 py-0.5 rounded border border-natural-border/40 gap-1 shadow-sm">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="text-[10px] font-sans font-bold text-natural-text bg-transparent border-none outline-none focus:ring-0 cursor-pointer pr-1"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              
              <span className="text-[9px] text-natural-border font-light">|</span>

              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="text-[10px] font-mono font-bold text-natural-text bg-transparent border-none outline-none focus:ring-0 cursor-pointer"
              >
                {getAvailableYears().map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded text-natural-muted hover:text-natural-text transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('sandbox')}
          className="text-xs text-natural-accent hover:text-natural-accent-soft font-semibold cursor-pointer flex items-center gap-1 transition-colors"
        >
          <span>Modify Mock Activities</span>
          <ChevronRight className="w-3" />
        </button>
      </div>

      {/* 3. GOALS CARD LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3.5">
        {filteredStats.map(({ rule, currentPeriodVal, isAchieved, currentLabel, currentPeriodAgg }) => {
          // Calculate percentages for SVG path stroke array
          const target = rule.threshold;
          const ratio = target > 0 ? (currentPeriodVal / target) : 0;
          
          // If condition is 'lt' (Under limit e.g. entertainment), we treat 100% progress as being 0, 
          // and if they exceed the limit, the bar fills up past 100%. Highlight color can change.
          let percentage = Math.min(Math.round(ratio * 100), 100);
          if (rule.condition === 'lt') {
            percentage = ratio > 1 ? 100 : Math.round(ratio * 100);
          }
          if (percentage < 0) percentage = 0;

          const circumference = 2 * Math.PI * 18; // r=18 => 113.1
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          // Natural Tones Dynamic Circle Colors
          let ringColor = 'stroke-natural-accent';
          let ringBg = 'stroke-natural-bg';
          if (rule.condition === 'lt') {
            ringColor = currentPeriodVal >= target ? 'stroke-status-off-text' : 'stroke-natural-accent';
            ringBg = currentPeriodVal >= target ? 'stroke-status-off-bg/60' : 'stroke-natural-bg';
          } else {
            ringColor = isAchieved ? 'stroke-natural-accent' : 'stroke-auxiliary';
            ringBg = isAchieved ? 'stroke-status-ok-bg/50' : 'stroke-natural-bg';
          }

          // Compute historical matrices for section 3 (Analysis of goal achievement)
          let historyElements: React.ReactNode = null;

          if (rule.period === 'daily') {
            const current = new Date(anchorDate.getTime());
            const day = current.getDay();
            const distanceToMonday = (day === 0 ? -6 : 1 - day);
            const monday = new Date(current.getTime());
            monday.setDate(current.getDate() + distanceToMonday);
            monday.setHours(0,0,0,0);

            const sunday = new Date(monday.getTime());
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23,59,59,999);

            const dailyProgress = calculateGoalProgress(rule, events, reminders, monday, sunday);
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            historyElements = (
              <div className="flex gap-1.5 items-center justify-center scale-[0.8] origin-center">
                {dailyProgress.map((dayObj, idx) => {
                  const isCompleted = dayObj.achieved;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-natural-accent text-white shadow-sm font-semibold' 
                          : 'bg-natural-bg/60 border border-natural-border/80'
                      }`}>
                        {isCompleted ? <Check className="w-[7px] md:w-3.5 h-[7px] md:h-3.5 stroke-[3px]" /> : <span className="w-[7px] md:w-3.5 h-[7px] md:h-3.5" />}
                      </div>
                      <span className="text-[8px] font-mono text-natural-muted font-bold">
                        {labels[idx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          } else if (rule.period === 'weekly') {
            const weekStats = currentPeriodAgg ? aggregatePeriodically(rule, calculateGoalProgress(rule, events, reminders, rangeStart, rangeEnd)) : [];
            historyElements = (
              <div className="flex gap-1.5 items-center justify-center scale-[0.8] origin-center">
                {weekStats.map((week, idx) => {
                  const isCompleted = week.achieved;
                  return (
                    <div key={week.periodKey} className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-natural-accent text-white shadow-sm font-semibold' 
                          : 'bg-natural-bg/60 border border-natural-border/80'
                      }`}>
                        {isCompleted ? <Check className="w-[7px] md:w-3.5 h-[7px] md:h-3.5 stroke-[3px]" /> : <span className="w-[7px] md:w-3.5 h-[7px] md:h-3.5" />}
                      </div>
                      <span className="text-[8px] font-mono text-natural-muted font-bold">
                        W{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          } else if (rule.period === 'monthly') {
            const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthsList = [];
            for (let i = 5; i >= 0; i--) {
              let m = selectedMonth - i;
              let y = selectedYear;
              if (m < 0) {
                m += 12;
                y -= 1;
              }
              monthsList.push({ year: y, month: m });
            }

            const monthsData = monthsList.map(m => {
              const start = new Date(m.year, m.month, 1, 0, 0, 0);
              const end = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);
              const dayAggsForMonth = calculateGoalProgress(rule, events, reminders, start, end);
              const monthlyAggsVec = aggregatePeriodically(rule, dayAggsForMonth);
              const isCompleted = monthlyAggsVec[0]?.achieved || false;
              return {
                label: MONTH_ABBR[m.month],
                isCompleted
              };
            });

            historyElements = (
              <div className="flex gap-1.5 items-center justify-center font-sans scale-[0.8] origin-center">
                {monthsData.map((m, idx) => {
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-[10px] md:w-6 h-[10px] md:h-6 rounded-[2px] md:rounded-md flex items-center justify-center transition-all ${
                        m.isCompleted 
                          ? 'bg-natural-accent text-white shadow-sm font-semibold' 
                          : 'bg-natural-bg/60 border border-natural-border/80'
                      }`}>
                        {m.isCompleted ? <Check className="w-[7px] md:w-3.5 h-[7px] md:h-3.5 stroke-[3px]" /> : <span className="w-[7px] md:w-3.5 h-[7px] md:h-3.5" />}
                      </div>
                      <span className="text-[8px] font-mono text-natural-muted font-bold">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <div
              key={rule.id}
              id={`goal-card-${rule.id}`}
              onClick={() => {
                setSelectedGoalId(rule.id);
                setActiveTab('detail');
              }}
              className="bg-natural-surface border border-natural-border rounded-xl p-3.5 hover:shadow-md hover:border-natural-accent-soft/50 transition-all cursor-pointer flex flex-row justify-between items-center gap-3 text-left group shadow-sm overflow-hidden"
            >
              {/* Left Column: Title and specifications */}
              <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0 pr-1">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-natural-bg/70 text-natural-muted border border-natural-border/60 rounded uppercase">
                      {rule.period}
                    </span>
                    <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-status-ok-bg/50 text-status-ok-text border border-status-ok-border/40 rounded uppercase">
                      {currentLabel}
                    </span>
                  </div>
                  <h3 className="text-xs md:text-sm font-semibold font-serif text-natural-text group-hover:text-natural-accent transition-colors leading-snug break-words">
                    {rule.name}
                  </h3>
                </div>

                {/* Score details */}
                <div className="mt-2 space-y-0.5">
                  <p className="text-sm md:text-base font-bold font-mono text-natural-text leading-none">
                    {currentPeriodVal % 1 === 0 ? currentPeriodVal : currentPeriodVal.toFixed(1)} 
                    <span className="text-[9px] md:text-[10px] text-natural-muted font-sans font-medium pl-1">
                      / {target} {rule.statsMethod === 'duration' ? 'hrs' : 'pts'}
                    </span>
                  </p>
                  <p className="text-[8px] md:text-[9px] text-natural-muted font-sans leading-none">
                    {rule.condition === 'gte' ? 'Requires' : 'Limit'} {rule.condition === 'gte' ? '≥' : '<'} {target}
                  </p>
                </div>
              </div>

              {/* Middle Column: Ring and indicators */}
              <div className="flex flex-col items-center justify-center p-1 border-l border-natural-border/40 shrink-0 gap-1.5 select-none w-[90px] md:w-[100px] text-center relative -left-[10px]">
                {/* Indicator Badge */}
                {isAchieved ? (
                  <div className="flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-bold text-status-ok-text bg-status-ok-bg border border-status-ok-border/80 px-1.5 py-0.5 rounded-md">
                    <Check className="w-[15px] md:w-2.5 h-[15px] md:h-2.5" />
                    <span>Goal Met</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-[8px] md:text-[9px] font-bold text-status-off-text bg-status-off-bg border border-status-off-border/80 px-1.5 py-0.5 rounded-md">
                    <X className="w-[15px] md:w-2.5 h-[15px] md:h-2.5" />
                    <span>Not Met</span>
                  </div>
                )}

                {/* SVG Circular Ring */}
                <div className="relative">
                  <svg className="w-10 h-10 md:w-11 md:h-11 transform -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      className={`${ringBg} transition-all`}
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      className={`${ringColor} transition-all`}
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] md:text-[9px] font-bold font-mono text-natural-text">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Historical Analysis */}
              <div className="flex flex-col items-center justify-center p-1 border-l border-natural-border/40 shrink-0 select-none w-[170px] md:w-[190px] text-center relative -left-[10px]">
                <span className="text-[8px] font-bold font-mono text-natural-muted tracking-wider uppercase mb-1.5 block">
                  {rule.period === 'daily' && 'Weekly History (Mon-Sun)'}
                  {rule.period === 'weekly' && 'Monthly History (Weeks)'}
                  {rule.period === 'monthly' && '6-Month History (Months)'}
                </span>
                {historyElements}
              </div>
            </div>
          );
        })}

        {filteredStats.length === 0 && (
          <div className="col-span-full py-8 text-center border border-dashed border-natural-border bg-natural-surface rounded-xl text-natural-muted text-xs">
            No rules matched this filter period criteria.
          </div>
        )}
      </div>

      {/* 4. KEY CONSTRAINTS CALLOUT */}
      <div className="bg-status-ok-bg/30 border border-status-ok-border/60 rounded-xl p-3.5 flex gap-2.5 text-left">
        <ShieldAlert className="w-4.5 h-4.5 text-status-ok-text shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-status-ok-text font-serif">Calculated Strategy Trace</p>
          <p className="text-[10px] text-status-ok-text/90 leading-relaxed">
            Click into any card above to view the precise day-by-day calculations, view detailed calendar heatmaps, 
            and see the exact annotation of the midnight-splitting algorithm values.
          </p>
        </div>
      </div>
    </div>
  );
}
