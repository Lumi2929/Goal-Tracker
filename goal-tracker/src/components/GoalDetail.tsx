/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoalRule, CalendarEvent, ReminderItem } from '../types';
import { calculateGoalProgress, aggregatePeriodically, formatDateStr } from '../goalEngine';
import { Calendar, BarChart2, Info, ArrowLeftRight, Clock, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface GoalDetailProps {
  rules: GoalRule[];
  events: CalendarEvent[];
  reminders: ReminderItem[];
  selectedRuleId: string | null;
  setSelectedRuleId: (id: string) => void;
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedMonth: number;
  setSelectedMonth: React.Dispatch<React.SetStateAction<number>>;
}

export default function GoalDetail({
  rules,
  events,
  reminders,
  selectedRuleId,
  setSelectedRuleId,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth
}: GoalDetailProps) {
  const [visualMode, setVisualMode] = useState<'heatmap' | 'barchart'>('heatmap');

  const activeRule = rules.find(r => r.id === selectedRuleId) || rules[0];

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

  if (!activeRule) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm border bg-slate-50 rounded-xl" id="goal-detail-empty">
        Please configure tracking rules first to inspect historical data.
      </div>
    );
  }

  // Anchor and Calculation Boundaries config dynamically using selectedMonth and selectedYear
  const rangeStart = new Date(selectedYear, selectedMonth, 1, 0, 0, 0);
  const rangeEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  // 1. Get raw day progressions
  const dayAggs = calculateGoalProgress(activeRule, events, reminders, rangeStart, rangeEnd);
  
  // 2. Aggregate periodically
  const periodAggs = aggregatePeriodically(activeRule, dayAggs);

  // Generate calendar days representing selected month/year for the Heatmap grid
  const getMonthGrid = () => {
    const grid: Array<{ date: Date | null; dayNum: number; dayAgg?: typeof dayAggs[0] }> = [];
    
    // Day of week of 1st of selected month (0 is Sunday, etc.)
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const startOffset = firstDay.getDay();

    // Pad prior month days
    for (let i = 0; i < startOffset; i++) {
      grid.push({ date: null, dayNum: 0 });
    }

    // Days in selected Month:
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Add days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, selectedMonth, d);
      const dateKey = formatDateStr(date);
      const agg = dayAggs.find(a => a.dateStr === dateKey);

      grid.push({
        date,
        dayNum: d,
        dayAgg: agg
      });
    }

    return grid;
  };

  const calendarGrid = getMonthGrid();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Concise label helper (no month, only date/range number)
  const getConciseLabel = (d: typeof periodAggs[0]) => {
    if (activeRule.period === 'daily') {
      return d.periodKey.substring(8, 10);
    } else if (activeRule.period === 'weekly') {
      const match = d.periodKey.match(/W-(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const yr = parseInt(match[1], 10);
        const mo = parseInt(match[2], 10) - 1;
        const dy = parseInt(match[3], 10);
        const monday = new Date(yr, mo, dy);
        const sunday = new Date(monday.getTime());
        sunday.setDate(monday.getDate() + 6);
        return `${monday.getDate()}-${sunday.getDate()}`;
      }
    } else if (activeRule.period === 'monthly') {
      const match = d.periodKey.match(/(\d{4})-(\d{2})/);
      if (match) {
        const yr = parseInt(match[1], 10);
        const mo = parseInt(match[2], 10) - 1;
        const lastDay = new Date(yr, mo + 1, 0).getDate();
        return `1-${lastDay}`;
      }
    }
    return d.label;
  };

  // Bar Chart calculations (Responsive inline SVG)
  // Determine bars dataset: Displays full matching period data
  const getBarChartData = () => {
    return periodAggs;
  };

  const chartData = getBarChartData();
  const maxVal = Math.max(...chartData.map(c => c.value), activeRule.threshold, 1);

  // Grab contributing logs for May 2026
  const contributionLogs = dayAggs.flatMap(day => {
    return day.contributions.map(contrib => ({
      dateStr: day.dateStr,
      ...contrib
    }));
  });

  return (
    <div className="space-y-4" id="goal-detail-container">
      {/* HEADER SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-natural-border h-[97.5px] pt-0 pb-[8px]">
        <div className="text-left space-y-1">
          <span className="text-[9px] uppercase font-bold text-natural-muted font-mono tracking-wider block">Selected Target Analysis</span>
          <select
            value={activeRule.id}
            onChange={e => setSelectedRuleId(e.target.value)}
            className="text-sm font-bold font-serif text-natural-text border border-natural-border hover:border-natural-accent-soft rounded-lg bg-natural-surface px-3 py-1.5 bg-none focus:outline-none transition-colors cursor-pointer"
          >
            {rules.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Month selector & Visualization toggle */}
        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex gap-0.5 bg-natural-bg/80 border border-natural-border p-0.5 rounded-lg">
            <button
              onClick={() => setVisualMode('heatmap')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                visualMode === 'heatmap' ? 'bg-natural-surface shadow-sm text-natural-text' : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              <Calendar className="w-3 h-3 text-natural-accent" />
              <span>Map view</span>
            </button>
            <button
              onClick={() => setVisualMode('barchart')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                visualMode === 'barchart' ? 'bg-natural-surface shadow-sm text-natural-text' : 'text-natural-muted hover:text-natural-text'
              }`}
            >
              <BarChart2 className="w-3 h-3 text-natural-accent" />
              <span>Bar View</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT COLUMN (2/3): HEATMAP / BAR CHART VISUALIZER */}
        <div className="lg:col-span-2 mt-[15px] bg-natural-surface border border-natural-border rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-bold text-natural-text text-sm font-serif flex items-center gap-2">
              <Clock className="w-4 h-4 text-natural-accent" />
              <span>Historical Completion Trends ({MONTH_NAMES[selectedMonth]} {selectedYear})</span>
            </h3>

            <div className="flex gap-4 text-[10px] font-mono tracking-wider font-semibold uppercase">
              <span className="flex items-center gap-1.5 text-natural-muted">
                <span className="w-3.5 h-3.5 rounded bg-natural-accent block"></span>
                <span>Goal Met</span>
              </span>
              <span className="flex items-center gap-1.5 text-natural-muted">
                <span className="w-3.5 h-3.5 rounded bg-auxiliary block"></span>
                <span>Below Target</span>
              </span>
            </div>
          </div>

          {/* RENDERING COHESIVE VISUAL SPACES */}
          {visualMode === 'heatmap' ? (
            <div className="px-5 pt-[15px] pb-[15px] bg-natural-bg/50 border border-natural-border rounded-xl space-y-4">
              <div className="text-center font-bold text-natural-muted text-[10px] tracking-wider uppercase font-mono">{MONTH_NAMES[selectedMonth]} {selectedYear} Grid</div>
              
              <div className="grid grid-cols-7 gap-1.5 max-w-[260px] mx-auto pb-1">
                {/* Weekday headers */}
                {weekdays.map(d => (
                  <div key={d} className="text-[9px] font-bold text-natural-muted/80 text-center uppercase tracking-wider py-0.5 select-none font-mono">
                    {d}
                  </div>
                ))}

                {/* Calendar boxes */}
                {calendarGrid.map((item, index) => {
                  if (!item.date || !item.dayAgg) {
                    return <div key={`empty-${index}`} className="aspect-square bg-transparent rounded"></div>;
                  }

                  const val = item.dayAgg.value;
                  const target = activeRule.threshold;
                  const met = item.dayAgg.achieved;

                  // Natural Tones Heatmap Color classes mapping
                  let colorClass = 'bg-natural-bg border border-natural-border/70 text-natural-muted hover:border-natural-accent-soft hover:bg-natural-accent-soft/10';
                  if (val > 0) {
                    if (met) {
                      colorClass = 'bg-natural-accent border border-natural-accent/90 text-white shadow-sm hover:bg-natural-accent/90';
                    } else {
                      colorClass = 'bg-auxiliary border border-auxiliary text-white shadow-sm hover:bg-auxiliary/90';
                    }
                  }

                  return (
                    <div
                      key={item.dayNum}
                      className={`relative aspect-square rounded flex flex-col justify-center items-center text-[10px] font-bold transition-all cursor-crosshair group/item ${colorClass}`}
                      title={`${item.dayAgg.dateStr}: ${val.toFixed(1)} / ${target} (${met ? '✓ Met' : '✕ Missed'})`}
                    >
                      <span>{item.dayNum}</span>

                      {/* Hover details cards */}
                      <div className="absolute bottom-[115%] left-1/2 transform -translate-x-1/2 bg-natural-text text-white text-[10px] rounded-xl p-3 shadow-2xl opacity-0 scale-75 group-hover/item:opacity-100 group-hover/item:scale-100 pointer-events-none transition-all duration-150 z-20 w-48 space-y-1.5 border border-natural-accent-soft/30">
                        <p className="font-bold font-serif border-b border-white/10 pb-1 text-status-ok-bg">{item.dayAgg.dateStr}</p>
                        <p className="font-semibold text-white/90">
                          Value: <strong className="font-mono">{val.toFixed(1)}</strong> / {target} {activeRule.statsMethod === 'duration' ? 'hrs' : 'items'}
                        </p>
                        <p className="font-semibold text-status-ok-bg">{met ? '✓ Target Achieved' : '✕ Below Target'}</p>
                        {item.dayAgg.contributions.length > 0 && (
                          <p className="text-[9px] text-white/60 italic">
                            ({item.dayAgg.contributions.length} matched entries)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* BAR CHART GRID (SVG with viewBox to solve stacking/calc bugs) */
            <div className="px-5 pt-[15px] pb-[15px] bg-natural-bg/50 border border-natural-border rounded-xl space-y-3">
              <div className="text-center font-bold text-natural-muted text-xs tracking-wider uppercase font-mono">Historical Metric Bars</div>
              <div className="w-full h-56 pt-2 relative">
                <svg viewBox="0 0 500 240" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                    const yVal = 180 - r * 140;
                    const gridLabel = (r * maxVal).toFixed(1);
                    return (
                      <g key={i}>
                        <line x1="50" y1={yVal} x2="480" y2={yVal} className="stroke-natural-border" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="42" y={yVal + 3} className="text-[10px] font-mono fill-natural-muted font-bold" textAnchor="end">{gridLabel}</text>
                      </g>
                    );
                  })}

                  {/* Threshold Line */}
                  {(() => {
                    const thresholdY = 180 - (activeRule.threshold / maxVal) * 140;
                    return (
                      <g>
                        <line x1="50" y1={thresholdY} x2="480" y2={thresholdY} className="stroke-natural-accent" strokeWidth="1.5" strokeDasharray="4 2" />
                        <text x="55" y={thresholdY - 5} className="text-[9px] font-bold font-serif fill-natural-accent tracking-wider font-semibold">TARGET LIMIT ({activeRule.threshold})</text>
                      </g>
                    );
                  })()}

                  {/* Render Bars */}
                  {chartData.map((d, index) => {
                    const count = chartData.length;
                    const chartWidth = 430; // 480 - 50
                    const slotWidth = chartWidth / count;
                    const barWidth = Math.max(8, slotWidth * 0.7);
                    
                    const barHeight = (d.value / maxVal) * 140;
                    const barY = 180 - barHeight;
                    const isMet = d.achieved;

                    let barColor = 'fill-natural-accent-soft/80 hover:fill-natural-accent';
                    if (isMet) {
                      barColor = 'fill-natural-accent hover:opacity-95';
                    } else if (d.value > 0) {
                      barColor = 'fill-auxiliary hover:opacity-95';
                    }

                    const barX = 50 + index * slotWidth + (slotWidth - barWidth) / 2;
                    const labelX = 50 + index * slotWidth + slotWidth / 2;

                    return (
                      <g key={d.periodKey} className="group/bar">
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={Math.max(barHeight, 2)}
                          rx="3"
                          className={`${barColor} transition-all cursor-pointer`}
                        />

                        {/* Flatten bottom rounded corners only */}
                        {barHeight > 4 && (
                          <rect
                            x={barX}
                            y={176}
                            width={barWidth}
                            height={4}
                            className={`${barColor} transition-all`}
                          />
                        )}

                        {/* Labels with collision avoidance to resolve overlapping/block stacking */}
                        {(() => {
                          const count = chartData.length;
                          let shouldShow = true;
                          if (count > 15) {
                            if (count <= 22) {
                              shouldShow = index % 2 === 0 || index === count - 1;
                            } else {
                              shouldShow = index % 3 === 0 || index === count - 1;
                            }
                          }
                          if (!shouldShow) return null;
                          return (
                            <text
                              x={labelX}
                              y="198"
                              className="text-[9px] font-mono fill-natural-muted font-bold"
                              textAnchor="middle"
                            >
                              {getConciseLabel(d)}
                            </text>
                          );
                        })()}

                        {/* Hover overlay values */}
                        <text
                          x={labelX}
                          y={barY - 6}
                          className="text-[10px] font-bold font-mono fill-natural-text opacity-0 group-hover/bar:opacity-100 transition-opacity"
                          textAnchor="middle"
                        >
                          {d.value.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (1/3): CURRENT STRATEGY SUMMARY & LOGS */}
        <div className="lg:col-span-1 bg-natural-surface border border-natural-border rounded-xl p-4 shadow-sm space-y-4 text-left">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-natural-muted uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <ArrowLeftRight className="w-4 h-4 text-natural-accent" />
              <span>Attribution Logic</span>
            </h4>

            <div className="p-2.5 bg-natural-bg/70 border border-natural-border rounded-xl space-y-2 text-natural-text" style={{ fontSize: '60%' }}>
              <div className="font-bold text-natural-accent font-serif" style={{ fontSize: '1.15em' }}>Active Configuration:</div>
              <div className="space-y-1 leading-relaxed font-sans text-natural-muted">
                <p>• <strong className="text-natural-text">Frequency rules:</strong> count matches 1:1, allocated precisely to date.</p>
                <p>• <strong className="text-natural-text">Goal Type:</strong> {activeRule.statsMethod === 'duration' ? 'Cumulative Duration' : 'Frequency Occurrences'}</p>
                {activeRule.statsMethod === 'duration' && (
                  <p>• <strong className="text-natural-text font-semibold">Cross-Day:</strong> {activeRule.crossDayStrategy === 'split' 
                    ? 'Split by Natural Day (Midnight cutoffs divide overnight values)' 
                    : 'All Included in Start Date (Full values credited on key start date)'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            <h4 className="text-xs font-bold text-natural-muted uppercase tracking-widest font-mono">Device Sync Events</h4>
            
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {contributionLogs.map((log, index) => {
                return (
                  <div key={index} className="border border-natural-border rounded-xl p-3 bg-natural-bg/30 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center bg-natural-surface px-2 py-0.5 rounded border border-natural-border/70">
                      <span className="font-bold text-[10px] text-natural-accent font-mono inline-block uppercase">
                        {log.dateStr}
                      </span>
                      <span className="font-mono text-[9px] text-natural-muted uppercase font-bold">
                        {log.type}
                      </span>
                    </div>

                    <div className="font-semibold text-natural-text line-clamp-1 font-serif text-xs">{log.title}</div>
                    
                    <div className="text-[11px] text-natural-muted leading-normal">
                      <span className="font-mono">Attributed: </span>
                      <strong className="text-natural-text font-bold">
                        {log.attributedValue % 1 === 0 ? log.attributedValue : log.attributedValue.toFixed(2)}
                      </strong> 
                      <span> / raw {log.originalValue % 1 === 0 ? log.originalValue : log.originalValue.toFixed(1)} {activeRule.statsMethod === 'duration' ? 'h' : 'pts'}</span>
                    </div>

                    <p className="text-[10px] text-natural-muted/95 leading-relaxed italic border-t border-natural-border/40 pt-1">
                      📄 {log.annotation}
                    </p>
                  </div>
                );
              })}

              {contributionLogs.length === 0 && (
                <div className="text-center py-8 text-xs text-natural-muted italic">
                  No overlapping metrics matched rules criteria in selected period database.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
