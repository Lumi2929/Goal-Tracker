/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoalRule, DataSourceType, KeywordLogicType, LocationModeType, CombinationLogicType, StatsMethodType, PeriodType, CrossDayStrategyType, ThresholdConditionType } from '../types';
import { Settings, Plus, Trash2, Edit, Save, PlusCircle, X, ShieldAlert, BadgeInfo } from 'lucide-react';

interface RuleManagerProps {
  rules: GoalRule[];
  setRules: (newRules: GoalRule[]) => void;
  onSelectGoal?: (goalId: string) => void;
}

export default function RuleManager({ rules, setRules, onSelectGoal }: RuleManagerProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(rules[0]?.id || null);
  const [isNewRule, setIsNewRule] = useState<boolean>(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [dataSource, setDataSource] = useState<DataSourceType>('calendar');
  const [keywordListText, setKeywordListText] = useState('');
  const [keywordLogic, setKeywordLogic] = useState<KeywordLogicType>('any');
  const [calendarIncludesText, setCalendarIncludesText] = useState('');
  const [calendarExcludesText, setCalendarExcludesText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [locationMode, setLocationMode] = useState<LocationModeType>('any');
  const [combinationLogic, setCombinationLogic] = useState<CombinationLogicType>('and');
  const [statsMethod, setStatsMethod] = useState<StatsMethodType>('duration');
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [crossDayStrategy, setCrossDayStrategy] = useState<CrossDayStrategyType>('startDate');
  const [threshold, setThreshold] = useState<number>(8);
  const [condition, setCondition] = useState<ThresholdConditionType>('gte');
  const [includeOnlyCompletedReminders, setIncludeOnlyCompletedReminders] = useState(true);

  // Load selected rule into form
  useEffect(() => {
    if (isNewRule) {
      // Clear form
      setName('');
      setDataSource('calendar');
      setKeywordListText('');
      setKeywordLogic('any');
      setCalendarIncludesText('');
      setCalendarExcludesText('');
      setLocationText('');
      setLocationMode('any');
      setCombinationLogic('and');
      setStatsMethod('duration');
      setPeriod('daily');
      setCrossDayStrategy('startDate');
      setThreshold(8);
      setCondition('gte');
      setIncludeOnlyCompletedReminders(true);
      return;
    }

    const activeRule = rules.find(r => r.id === selectedRuleId);
    if (activeRule) {
      setName(activeRule.name);
      setDataSource(activeRule.dataSource);
      setKeywordListText(activeRule.keywords.join(', '));
      setKeywordLogic(activeRule.keywordLogic);
      setCalendarIncludesText(activeRule.calendars.join(', '));
      setCalendarExcludesText(activeRule.excludeCalendars.join(', '));
      setLocationText(activeRule.locationText);
      setLocationMode(activeRule.locationMode);
      setCombinationLogic(activeRule.combinationLogic);
      setStatsMethod(activeRule.statsMethod);
      setPeriod(activeRule.period);
      setCrossDayStrategy(activeRule.crossDayStrategy);
      setThreshold(activeRule.threshold);
      setCondition(activeRule.condition);
      setIncludeOnlyCompletedReminders(activeRule.includeOnlyCompletedReminders);
    }
  }, [selectedRuleId, isNewRule, rules]);

  // Adjust Stats Method if dataSource is only reminders (Reminders can't measure cumulative duration)
  useEffect(() => {
    if (dataSource === 'reminders' && statsMethod === 'duration') {
      setStatsMethod('count');
    }
  }, [dataSource, statsMethod]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parseCSV = (csv: string): string[] => {
      return csv
        .split(/[,，]/)
        .map(x => x.trim().normalize('NFKC'))
        .filter(x => x.length > 0);
    };

    const formattedRule: GoalRule = {
      id: isNewRule ? `rule-${Date.now()}` : (selectedRuleId || `rule-${Date.now()}`),
      name,
      dataSource,
      keywords: parseCSV(keywordListText),
      keywordLogic,
      calendars: parseCSV(calendarIncludesText),
      excludeCalendars: parseCSV(calendarExcludesText),
      locationText,
      locationMode,
      combinationLogic,
      statsMethod,
      period,
      crossDayStrategy,
      threshold: Number(threshold),
      condition,
      includeOnlyCompletedReminders
    };

    if (isNewRule) {
      setRules([...rules, formattedRule]);
      setSelectedRuleId(formattedRule.id);
      setIsNewRule(false);
      if (onSelectGoal) onSelectGoal(formattedRule.id);
    } else {
      setRules(rules.map(r => r.id === selectedRuleId ? formattedRule : r));
    }
  };

  const handleDeleteRule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    if (selectedRuleId === id) {
      setSelectedRuleId(updated[0]?.id || null);
      setIsNewRule(updated.length === 0);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="rule-manager-container">
      {/* 1. LEFT SIDEBAR: LIST OF RULES */}
      <div className="md:col-span-1 bg-natural-surface border border-natural-border rounded-xl p-5 shadow-[0_2px_8px_rgba(107,112,92,0.015)] space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-natural-border">
          <span className="font-bold font-serif text-natural-text text-sm">Tracking Rules</span>
          <button
            type="button"
            onClick={() => {
              setIsNewRule(true);
              setSelectedRuleId(null);
            }}
            id="btn-create-rule"
            className="p-1 px-2.5 bg-status-ok-bg/75 border border-status-ok-border/60 text-status-ok-text hover:bg-status-ok-bg cursor-pointer rounded-lg text-xs font-bold flex items-center gap-1 transition-colors animate-pulse"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {rules.map(rule => {
            const isSelected = !isNewRule && rule.id === selectedRuleId;
            return (
              <div
                key={rule.id}
                onClick={() => {
                  setSelectedRuleId(rule.id);
                  setIsNewRule(false);
                }}
                className={`group p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center ${
                  isSelected
                    ? 'border-natural-accent bg-natural-accent-soft/10 shadow-inner'
                    : 'border-natural-border hover:border-natural-accent-soft/30 hover:bg-natural-bg/40'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-natural-text">{rule.name}</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold px-1 py-0.5 bg-natural-bg border border-natural-border/70 text-natural-muted rounded">
                      {rule.period.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1 py-0.5 bg-status-ok-bg/40 border border-status-ok-border/30 text-status-ok-text rounded">
                      {rule.dataSource === 'both' ? 'Dual Source' : rule.dataSource.toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteRule(rule.id, e)}
                  className="p-1 text-natural-muted hover:text-status-off-text hover:bg-status-off-bg/40 rounded transition-colors"
                  title="Delete tracked rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {rules.length === 0 && (
            <div className="text-center py-8 text-xs text-natural-muted">
              No rules configured. Please click "New" to design one.
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: EDIT/CREATE RULE CONFIGURATION FORM */}
      <div className="md:col-span-2 bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-[0_10px_30px_rgba(107,112,92,0.08)]">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-natural-border">
            <div className="space-y-0.5">
              <h3 className="text-md font-bold font-serif text-natural-text">
                {isNewRule ? 'Create New Tracking Rule' : `Configure Rule: ${name}`}
              </h3>
              <p className="text-xs text-natural-muted font-sans font-medium">Design structural matching logic evaluated against Apple databases.</p>
            </div>
            <button
              type="submit"
              id="btn-save-rule"
              className="px-4 py-2 bg-natural-accent hover:bg-natural-accent/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors border-none"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNewRule ? 'Create & Add Rule' : 'Save Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            {/* Goal Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Goal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Exercise Every Week"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft transition-colors"
              />
            </div>

            {/* Data Source & Method */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Data Source</label>
              <select
                value={dataSource}
                onChange={e => setDataSource(e.target.value as DataSourceType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft"
              >
                <option value="calendar">Calendar Events Only</option>
                <option value="reminders">Reminders Only</option>
                <option value="both">Both (Combined)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Statistics Metric</label>
              <select
                value={statsMethod}
                onChange={e => setStatsMethod(e.target.value as StatsMethodType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft disabled:opacity-50"
                disabled={dataSource === 'reminders'}
              >
                <option value="duration">Cumulative Duration (Hours)</option>
                <option value="count">Count (Number of Events/Reminders)</option>
              </select>
              {dataSource === 'reminders' && (
                <span className="text-[10px] text-status-off-text mt-1 block font-bold">
                  ⚠️ Cumulative Duration is only applicable to Calendar events.
                </span>
              )}
            </div>

            {/* Period & Cross-Day */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Statistical Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as PeriodType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Monday to Sunday)</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Attribution Strategy (Cross-Day)</label>
              <select
                value={crossDayStrategy}
                disabled={statsMethod === 'count'}
                onChange={e => setCrossDayStrategy(e.target.value as CrossDayStrategyType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft disabled:opacity-50"
              >
                <option value="split">Split by Natural Day (Midnight limit)</option>
                <option value="startDate">All Included in Start Date</option>
              </select>
              {statsMethod === 'count' && (
                <span className="text-[10px] text-natural-muted mt-1 block">
                  ℹ️ Not applicable to frequency-based goals (counts attribute to action dates).
                </span>
              )}
            </div>

            {/* Threshold & Target Condition */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Target Value</label>
              <input
                type="number"
                step="any"
                required
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest mb-1.5 font-mono">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as ThresholdConditionType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none focus:border-natural-accent-soft"
              >
                <option value="gte">≥ Threshold (At least / Greater than or Equal)</option>
                <option value="lt">&lt; Threshold (Under / Less than)</option>
              </select>
            </div>

            {/* Advanced Checkboxes */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 p-3 bg-status-ok-bg/15 border border-status-ok-border/40 rounded-xl text-status-ok-text">
                <input
                  type="checkbox"
                  id="includeOnlyCompletedReminders"
                  checked={includeOnlyCompletedReminders}
                  onChange={e => setIncludeOnlyCompletedReminders(e.target.checked)}
                  disabled={dataSource === 'calendar'}
                  className="rounded border-natural-border accent-natural-accent"
                />
                <label htmlFor="includeOnlyCompletedReminders" className="text-xs text-natural-text cursor-pointer select-none">
                  Only count <strong className="font-bold text-natural-accent">Completed Reminders</strong> (completed checked off)
                </label>
              </div>
            </div>

            {/* FILTERS SECTION ACCORDION BANNER */}
            <div className="sm:col-span-2 pt-3 border-t border-natural-border">
              <h4 className="text-xs font-bold text-natural-accent mb-3 flex items-center gap-1.5 font-serif">
                <Settings className="w-4 h-4 text-natural-accent" />
                <span>Precise Filtering Rules & Combinations</span>
              </h4>
            </div>

            {/* Calendar Lists Match */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Included Calendars (CSV)</label>
              <input
                type="text"
                placeholder="Health, Personal"
                value={calendarIncludesText}
                onChange={e => setCalendarIncludesText(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none"
              />
              <span className="text-[10px] text-natural-muted block">Leave empty to include all calendars by default.</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Excluded Calendars (CSV)</label>
              <input
                type="text"
                placeholder="Work, Bills"
                value={calendarExcludesText}
                onChange={e => setCalendarExcludesText(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none"
              />
            </div>

            {/* Keywords Match */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Keywords (Supports English, Chinese & Emojis)</label>
              <input
                type="text"
                placeholder="Sleep, 运动, 🏋️"
                value={keywordListText}
                onChange={e => setKeywordListText(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none"
              />
              <span className="text-[10px] text-natural-muted block">Matches title, notes, and locations (comma-separated).</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Keyword Logic Match Type</label>
              <select
                value={keywordLogic}
                onChange={e => setKeywordLogic(e.target.value as KeywordLogicType)}
                className="w-full text-xs px-3/5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none"
              >
                <option value="any">Match Any Keyword (OR logic per word)</option>
                <option value="all">Match All Keywords (AND logic per word)</option>
              </select>
            </div>

            {/* Location Match */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Location Matching Mode</label>
              <select
                value={locationMode}
                onChange={e => setLocationMode(e.target.value as LocationModeType)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none"
              >
                <option value="any">All locations pass (Ignore location filter)</option>
                <option value="contains">Location contains text</option>
                <option value="exact">Location matches text exactly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-natural-text mb-1">Location Text Target</label>
              <input
                type="text"
                placeholder="e.g. Home"
                disabled={locationMode === 'any'}
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg text-natural-text focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Combination Logic (CROSS GROUP) */}
            <div className="sm:col-span-2 pt-2">
              <div className="bg-natural-bg/75 border border-natural-border rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs text-natural-text font-serif font-bold">
                  <BadgeInfo className="w-4 h-4 text-natural-accent" />
                  <span>Rule Class Combination Logic</span>
                </div>
                <p className="text-[11.5px] text-natural-muted leading-relaxed">
                  How should categories (Keywords, Calendars limits, and Locations constraints) combine with each other?
                </p>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-natural-text font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="combinationLogic"
                      value="and"
                      checked={combinationLogic === 'and'}
                      onChange={() => setCombinationLogic('and')}
                      className="accent-natural-accent"
                    />
                    <span>All Met (AND combination)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-natural-text font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="combinationLogic"
                      value="or"
                      checked={combinationLogic === 'or'}
                      onChange={() => setCombinationLogic('or')}
                      className="accent-natural-accent"
                    />
                    <span>Any Met (OR combination)</span>
                  </label>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>

    </div>
  );
}
