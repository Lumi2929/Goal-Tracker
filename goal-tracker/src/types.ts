/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DataSourceType = 'calendar' | 'reminders' | 'both';
export type KeywordLogicType = 'any' | 'all';
export type CombinationLogicType = 'and' | 'or';
export type StatsMethodType = 'duration' | 'count';
export type PeriodType = 'daily' | 'weekly' | 'monthly';
export type CrossDayStrategyType = 'split' | 'startDate';
export type ThresholdConditionType = 'gte' | 'lt';
export type LocationModeType = 'contains' | 'exact' | 'any';

export interface GoalRule {
  id: string;
  name: string;
  dataSource: DataSourceType;
  keywords: string[];
  keywordLogic: KeywordLogicType;
  calendars: string[];        // include these Calendars/Lists
  excludeCalendars: string[]; // exclude these Calendars/Lists
  locationText: string;
  locationMode: LocationModeType;
  combinationLogic: CombinationLogicType; // Logic across fields (e.g. (Keywords) AND/OR (Calendar) AND/OR (Location))
  statsMethod: StatsMethodType;
  period: PeriodType;
  crossDayStrategy: CrossDayStrategyType;
  threshold: number; // Duration in hours or total count
  condition: ThresholdConditionType; // gte: >=, lt: <
  includeOnlyCompletedReminders: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  notes: string;
  calendarName: string;
  location: string;
  startDate: string; // ISO String (UTC/Local representation)
  endDate: string;   // ISO String (UTC/Local representation)
  isAllDay: boolean;
}

export interface ReminderItem {
  id: string;
  title: string;
  notes: string;
  listName: string; // Matches 'calendarName' configuration in rule logic
  location: string;
  dueDate: string | null;  // ISO String
  completionDate: string | null; // ISO String
  isCompleted: boolean;
}

export interface DayAggregation {
  dateStr: string; // YYYY-MM-DD
  value: number;   // Duration in hours or frequency count
  achieved: boolean;
  contributions: Array<{
    type: 'event' | 'reminder';
    id: string;
    title: string;
    originalValue: number; // raw duration in hours or count (1)
    attributedValue: number; // duration attributed to this day after split/start date rules
    annotation: string; // text explaining attribution strategy
  }>;
}

export interface PeriodAggregation {
  periodKey: string; // "YYYY-MM-DD" or "YYYY-W[W]" or "YYYY-MM"
  label: string;      // Human-readable label (e.g. "May 30, 2026", "Week 22, 2026", "May 2026")
  value: number;      // Aggregated value (sum of days or total for period)
  target: number;     // Threshold
  condition: ThresholdConditionType;
  achieved: boolean;
  days: DayAggregation[];
}
