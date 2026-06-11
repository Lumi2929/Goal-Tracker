/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalRule, CalendarEvent, ReminderItem, DayAggregation, PeriodAggregation, ThresholdConditionType } from './types';

/**
 * Utility to format Date as YYYY-MM-DD
 */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Utility to convert string date (T-separated) to a Date object in local timezone
 */
export function parseLocalISO(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Get start of natural week (Monday) and end of natural week (Sunday) for a given Date
 */
export function getNaturalWeekRange(date: Date): { monday: Date; sunday: Date; key: string; label: string } {
  const current = new Date(date.getTime());
  const day = current.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  
  // Distance to Monday
  const distanceToMonday = (day === 0 ? -6 : 1 - day);
  
  const monday = new Date(current.getTime());
  monday.setDate(current.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday.getTime());
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const year = monday.getFullYear();
  
  // Calculate ISO week number or simple unique week key
  // We can use the formatted date of monday as part of the key
  const monStr = formatDateStr(monday);
  const sunStr = formatDateStr(sunday);
  
  // Month names for labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const label = `${months[monday.getMonth()]} ${monday.getDate()} - ${months[sunday.getMonth()]} ${sunday.getDate()}, ${year}`;

  return {
    monday,
    sunday,
    key: `W-${monStr}`,
    label
  };
}

/**
 * Check if calendar name is matched by rule
 */
function calendarMatches(rule: GoalRule, sourceName: string): boolean {
  const calendarLower = sourceName.trim().toLowerCase();
  
  // Excluded check
  if (rule.excludeCalendars.length > 0) {
    const isExcluded = rule.excludeCalendars.some(
      c => c.trim().toLowerCase() === calendarLower
    );
    if (isExcluded) return false;
  }
  
  // Included check
  if (rule.calendars.length > 0) {
    return rule.calendars.some(
      c => c.trim().toLowerCase() === calendarLower
    );
  }
  
  return true; // Accourding to guidelines, if not specified, it passes default inclusion
}

/**
 * Check if keywords match text
 */
function keywordsMatch(rule: GoalRule, title: string, notes: string, location: string): boolean {
  if (rule.keywords.length === 0) return true;
  
  // Normalize both target search content and the keywords list using Unicode NFKC form to support emojis, Chinese symbols and full/half width variations
  const normalizedSearch = `${title || ''} ${notes || ''} ${location || ''}`.normalize('NFKC').toLowerCase();
  const kwList = rule.keywords
    .map(k => k.trim().normalize('NFKC').toLowerCase())
    .filter(k => k.length > 0);
  
  if (kwList.length === 0) return true;
  
  if (rule.keywordLogic === 'any') {
    return kwList.some(k => normalizedSearch.includes(k));
  } else {
    // all
    return kwList.every(k => normalizedSearch.includes(k));
  }
}

/**
 * Check if location matches
 */
function locationMatches(rule: GoalRule, location: string): boolean {
  const locText = rule.locationText.trim().toLowerCase();
  if (locText.length === 0 || rule.locationMode === 'any') {
    return true;
  }
  
  const targetLoc = location.trim().toLowerCase();
  if (rule.locationMode === 'exact') {
    return targetLoc === locText;
  } else {
    // contains
    return targetLoc.includes(locText);
  }
}

/**
 * Validate item combinations based on combinationLogic (AND / OR)
 */
export function isEventOrReminderMatched(
  rule: GoalRule,
  title: string,
  notes: string,
  calendarOrListName: string,
  location: string,
  isReminder: boolean,
  isCompleted: boolean = false
): boolean {
  // Guard for reminders completion state
  if (isReminder && rule.includeOnlyCompletedReminders && !isCompleted) {
    return false;
  }

  const activeFilters = {
    calendar: rule.calendars.length > 0 || rule.excludeCalendars.length > 0,
    keywords: rule.keywords.filter(k => k.trim().length > 0).length > 0,
    location: rule.locationText.trim().length > 0 && rule.locationMode !== 'any'
  };

  const matches = {
    calendar: calendarMatches(rule, calendarOrListName),
    keywords: keywordsMatch(rule, title, notes, location),
    location: locationMatches(rule, location)
  };

  // If no filters are active, matches everything for this source
  const hasActiveFilters = activeFilters.calendar || activeFilters.keywords || activeFilters.location;
  if (!hasActiveFilters) {
    return true;
  }

  if (rule.combinationLogic === 'and') {
    // AND combination: ALL active category filters must be met
    const calOk = !activeFilters.calendar || matches.calendar;
    const kwOk = !activeFilters.keywords || matches.keywords;
    const locOk = !activeFilters.location || matches.location;
    return calOk && kwOk && locOk;
  } else {
    // OR combination: ANY active filter category met
    // If a category is active and it is met, it passes
    const calOk = activeFilters.calendar && matches.calendar;
    const kwOk = activeFilters.keywords && matches.keywords;
    const locOk = activeFilters.location && matches.location;
    return calOk || kwOk || locOk;
  }
}

/**
 * Calculate overlap of event interval with day interval in decimal hours
 */
function getOverlapHours(
  eStartMs: number,
  eEndMs: number,
  dayStartMs: number,
  dayEndMs: number
): number {
  const overlapStart = Math.max(eStartMs, dayStartMs);
  const overlapEnd = Math.min(eEndMs, dayEndMs);
  
  if (overlapEnd > overlapStart) {
    const diffMs = overlapEnd - overlapStart;
    return diffMs / (1000 * 60 * 60); // convert to hours
  }
  return 0;
}

/**
 * Aggregate data for a specified rule over a range of dates
 */
export function calculateGoalProgress(
  rule: GoalRule,
  events: CalendarEvent[],
  reminders: ReminderItem[],
  startDate: Date,
  endDate: Date
): DayAggregation[] {
  const aggregations: { [key: string]: DayAggregation } = {};
  
  // Initialize the dictionary with empty aggregations for all days in range
  const current = new Date(startDate.getTime());
  while (current <= endDate) {
    const dateKey = formatDateStr(current);
    aggregations[dateKey] = {
      dateStr: dateKey,
      value: 0,
      achieved: false,
      contributions: []
    };
    current.setDate(current.getDate() + 1);
  }

  // Filter matched items
  const matchedEvents = (rule.dataSource === 'calendar' || rule.dataSource === 'both')
    ? events.filter(e => isEventOrReminderMatched(rule, e.title, e.notes, e.calendarName, e.location, false))
    : [];

  const matchedReminders = (rule.dataSource === 'reminders' || rule.dataSource === 'both')
    ? reminders.filter(r => isEventOrReminderMatched(rule, r.title, r.notes, r.listName, r.location, true, r.isCompleted))
    : [];

  // 1. Process Calendar Events
  matchedEvents.forEach(event => {
    // All-day check: If isAllDay is true, skip or allocate 24h to the start date
    if (event.isAllDay) {
      const eStart = parseLocalISO(event.startDate).toISOString().substring(0, 10);
      if (aggregations[eStart]) {
        // We configure default behavior: include all-day as 24h to the start date
        aggregations[eStart].value += 24;
        aggregations[eStart].contributions.push({
          type: 'event',
          id: event.id,
          title: event.title,
          originalValue: 24,
          attributedValue: 24,
          annotation: 'All-day event: 24 hours allocated to start date.'
        });
      }
      return;
    }

    const tStart = parseLocalISO(event.startDate);
    const tEnd = parseLocalISO(event.endDate);
    const totalDurationHours = (tEnd.getTime() - tStart.getTime()) / (1000 * 60 * 60);
    
    if (totalDurationHours <= 0) return;

    if (rule.statsMethod === 'count') {
      // Frequency metric: always attributed to start date as 1 count
      const startKey = formatDateStr(tStart);
      if (aggregations[startKey]) {
        aggregations[startKey].value += 1;
        aggregations[startKey].contributions.push({
          type: 'event',
          id: event.id,
          title: event.title,
          originalValue: 1,
          attributedValue: 1,
          annotation: `Attributed 1 count to key start date (${startKey}).`
        });
      }
    } else {
      // statsMethod is 'duration'
      if (rule.crossDayStrategy === 'startDate') {
        const startKey = formatDateStr(tStart);
        if (aggregations[startKey]) {
          aggregations[startKey].value += totalDurationHours;
          aggregations[startKey].contributions.push({
            type: 'event',
            id: event.id,
            title: event.title,
            originalValue: totalDurationHours,
            attributedValue: totalDurationHours,
            annotation: `Attributed full ${totalDurationHours.toFixed(1)}h to start date (All Included in Start Date strategy).`
          });
        }
      } else {
        // 'split' by natural day
        const eStartMs = tStart.getTime();
        const eEndMs = tEnd.getTime();

        // Loop over each day in aggregation
        Object.keys(aggregations).forEach(dateKey => {
          const dayDate = new Date(dateKey + 'T00:00:00');
          const dayStartMs = dayDate.getTime();
          const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

          const overlapHours = getOverlapHours(eStartMs, eEndMs, dayStartMs, dayEndMs);
          if (overlapHours > 0) {
            aggregations[dateKey].value += overlapHours;
            aggregations[dateKey].contributions.push({
              type: 'event',
              id: event.id,
              title: event.title,
              originalValue: totalDurationHours,
              attributedValue: overlapHours,
              annotation: `Split over midnight: ${overlapHours.toFixed(1)}h allocated specifically to ${dateKey}.`
            });
          }
        });
      }
    }
  });

  // 2. Process Reminders (Reminders can only be frequency countable)
  matchedReminders.forEach(rem => {
    // Determine boundary date: completionDate if completed (fall back to dueDate), or dueDate
    // Fallback to today if calendar/reminder date missing
    const dateToUse = rem.isCompleted && rem.completionDate
      ? rem.completionDate
      : (rem.dueDate || new Date().toISOString());

    const tDate = parseLocalISO(dateToUse);
    const dateKey = formatDateStr(tDate);

    if (aggregations[dateKey]) {
      // Reminders always count as 1 event
      aggregations[dateKey].value += 1;
      aggregations[dateKey].contributions.push({
        type: 'reminder',
        id: rem.id,
        title: rem.title,
        originalValue: 1,
        attributedValue: 1,
        annotation: rem.isCompleted 
          ? `Completed reminder counted 1 times (attributed to completion date: ${dateKey}).`
          : `Incomplete reminder with due date (counted 1 times on due date: ${dateKey}).`
      });
    }
  });

  // Convert to array and determine daily achievement for each day
  const resultList = Object.values(aggregations).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  
  if (rule.period === 'daily') {
    resultList.forEach(day => {
      day.achieved = evaluateCondition(day.value, rule.threshold, rule.condition);
    });
  }

  return resultList;
}

/**
 * Check if a metric matches target threshold
 */
export function evaluateCondition(val: number, threshold: number, condition: ThresholdConditionType): boolean {
  if (condition === 'gte') {
    return val >= threshold;
  } else {
    // lt
    return val < threshold;
  }
}

/**
 * Periodically aggregate the daily data into Weekly or Monthly brackets
 */
export function aggregatePeriodically(
  rule: GoalRule,
  dayAggs: DayAggregation[]
): PeriodAggregation[] {
  const result: PeriodAggregation[] = [];

  if (rule.period === 'daily') {
    // For daily rules, each day itself is a period
    return dayAggs.map(day => {
      // format label like "May 30, 2026"
      const dateParts = day.dateStr.split('-');
      const d = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const readableLabel = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

      return {
        periodKey: day.dateStr,
        label: readableLabel,
        value: day.value,
        target: rule.threshold,
        condition: rule.condition,
        achieved: day.achieved,
        days: [day]
      };
    });
  }

  if (rule.period === 'weekly') {
    // Map with weeks
    const weekMap: { [key: string]: { label: string; days: DayAggregation[] } } = {};
    
    dayAggs.forEach(day => {
      const parts = day.dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const weekRange = getNaturalWeekRange(d);
      
      if (!weekMap[weekRange.key]) {
        weekMap[weekRange.key] = {
          label: weekRange.label,
          days: []
        };
      }
      weekMap[weekRange.key].days.push(day);
    });

    Object.keys(weekMap).sort().forEach(wKey => {
      const { label, days } = weekMap[wKey];
      // Sum values across the week
      const totalValue = days.reduce((sum, d) => sum + d.value, 0);
      const isAchieved = evaluateCondition(totalValue, rule.threshold, rule.condition);
      
      result.push({
        periodKey: wKey,
        label,
        value: totalValue,
        target: rule.threshold,
        condition: rule.condition,
        achieved: isAchieved,
        days: days.sort((a,b) => a.dateStr.localeCompare(b.dateStr))
      });
    });

    return result;
  }

  if (rule.period === 'monthly') {
    // Map with months
    const monthMap: { [key: string]: { label: string; days: DayAggregation[] } } = {};
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    dayAggs.forEach(day => {
      const parts = day.dateStr.split('-');
      const year = parts[0];
      const monthNum = Number(parts[1]) - 1;
      const key = `${year}-${String(monthNum + 1).padStart(2,'0')}`;
      const label = `${months[monthNum]} ${year}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          label,
          days: []
        };
      }
      monthMap[key].days.push(day);
    });

    Object.keys(monthMap).sort().forEach(mKey => {
      const { label, days } = monthMap[mKey];
      const totalValue = days.reduce((sum, d) => sum + d.value, 0);
      const isAchieved = evaluateCondition(totalValue, rule.threshold, rule.condition);

      result.push({
        periodKey: mKey,
        label,
        value: totalValue,
        target: rule.threshold,
        condition: rule.condition,
        achieved: isAchieved,
        days: days.sort((a,b) => a.dateStr.localeCompare(b.dateStr))
      });
    });

    return result;
  }

  return [];
}
