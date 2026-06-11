/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarEvent, ReminderItem } from '../types';
import { parseSpreadsheetDate } from './dateParser';

export interface FieldMapping {
  title: string[];         // multiple allowed
  startDate: string[];     // multiple allowed
  endDate: string[];       // multiple allowed
  duration: string[];      // mapping of a column to a duration (e.g. 'Duration Mins' or 'Slept Hours')
  notes: string[];         // multiple allowed
  calendarName: string[];  // multiple allowed
  location: string[];      // multiple allowed
  isCompleted: string[];   // multiple allowed
}

export interface IngestionOptions {
  dateFormat: string; // 'auto' or custom format standard
  importMode: 'both' | 'calendar' | 'reminders';
  defaultCalendarName: string;
}

/**
 * Normalizes boolean or completion status values from spreadsheet row text cells
 */
function evaluateBoolValue(val: any): boolean {
  if (val === undefined || val === null) return true; // Default to true if not specified
  if (typeof val === 'boolean') return val;
  const str = String(val).trim().toLowerCase();
  if (!str) return true;
  return ['true', 'yes', '1', 'y', '✓', 'completed', 'done', 'checked', 'active', 'finished'].includes(str);
}

/**
 * Extracts and combines values for a standard field from multiple possible mapped row columns
 */
function extractMappedField(row: Record<string, any>, columns: string[], joiner: string = ' | '): string {
  if (!columns || columns.length === 0) return '';
  const values = columns
    .map(col => row[col])
    .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
    .map(val => String(val).trim());
  
  return values.join(joiner);
}

export interface ProcessResult {
  events: CalendarEvent[];
  reminders: ReminderItem[];
  rowStatus: Array<{
    rowIndex: number;
    title: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Parses varied duration strings into decimal hours.
 * Supports:
 * - Simple numbers: "8" -> 8 hours, "1.5" -> 1.5 hours
 * - Time format: "08:15" -> 8.25 hours, "1:30" -> 1.5 hours, "0:45" -> 0.75 hours
 * - Verbose minutes/hours: "90m" -> 1.5 hours, "1.5h" -> 1.5 hours, "45 mins" -> 0.75 hours, "1h 30m" -> 1.5 hours
 */
export function parseDurationToHours(val: string): number | null {
  if (!val) return null;
  const clean = val.trim().toLowerCase();
  if (!clean) return null;

  // 1. Check if it's a simple number (e.g. "8" or "1.5")
  const num = Number(clean);
  if (!isNaN(num)) {
    return num; // Default to hours
  }

  // 2. Format "HH:MM" or "HH:MM:SS" (e.g. "08:15" or "1:30")
  const hhmmMatch = clean.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (hhmmMatch) {
    const hours = parseInt(hhmmMatch[1], 10);
    const minutes = parseInt(hhmmMatch[2], 10);
    const seconds = hhmmMatch[3] ? parseInt(hhmmMatch[3], 10) : 0;
    return hours + (minutes / 60) + (seconds / 3600);
  }

  // 3. Mixed formats like "1h 30m" or "2 hours 15 mins" or "90m" or "45 mins" or "1.5h"
  let totalHours = 0;
  let matchesFound = false;

  // Find hours: e.g. "1.5h", "2 hours", "2 h", "2hrs"
  const hoursMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  if (hoursMatch) {
    totalHours += parseFloat(hoursMatch[1]);
    matchesFound = true;
  }

  // Find minutes: e.g. "30m", "15 mins", "15 minutes", "15 min"
  const minutesMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);
  if (minutesMatch) {
    totalHours += parseFloat(minutesMatch[1]) / 60;
    matchesFound = true;
  }

  // Find seconds: e.g. "30s", "30 secs", "30 seconds"
  const secondsMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)/);
  if (secondsMatch) {
    totalHours += parseFloat(secondsMatch[1]) / 3600;
    matchesFound = true;
  }

  if (matchesFound) {
    return totalHours;
  }

  return null;
}

/**
 * Transforms raw excel / csv rows into standard events and reminders arrays
 */
export function processRawRows(
  rawRows: Array<Record<string, any>>,
  mapping: FieldMapping,
  options: IngestionOptions
): ProcessResult {
  const events: CalendarEvent[] = [];
  const reminders: ReminderItem[] = [];
  const rowStatus: ProcessResult['rowStatus'] = [];

  rawRows.forEach((row, idx) => {
    try {
      // 1. Extract required and optional text strings (multiple column combinations joined)
      const title = extractMappedField(row, mapping.title, ' | ');
      const notes = extractMappedField(row, mapping.notes, '\n');
      const calendarName = extractMappedField(row, mapping.calendarName, ' ') || options.defaultCalendarName || 'Health';
      const location = extractMappedField(row, mapping.location, ', ');

      // 2. Completion evaluation
      const isCompletedText = extractMappedField(row, mapping.isCompleted, ' ');
      const isCompleted = mapping.isCompleted.length > 0 ? evaluateBoolValue(isCompletedText) : true;

      // 3. Date & time parsing
      const rawStartVal = extractMappedField(row, mapping.startDate, ' ');
      const rawEndVal = extractMappedField(row, mapping.endDate, ' ');
      const rawDurationVal = mapping.duration ? extractMappedField(row, mapping.duration, ' ') : '';

      if (!rawStartVal) {
        rowStatus.push({
          rowIndex: idx + 1,
          title: title || `Row ${idx + 1}`,
          success: false,
          error: 'Required field "Start Date" is blank or unmapped.'
        });
        return;
      }

      const parsedStart = parseSpreadsheetDate(rawStartVal, options.dateFormat);
      if (!parsedStart) {
        rowStatus.push({
          rowIndex: idx + 1,
          title: title || `Row ${idx + 1}`,
          success: false,
          error: `Could not parse start date string value: "${rawStartVal}"`
        });
        return;
      }

      // Check if duration mapping can be successfully parsed.
      const parsedDurationHours = parseDurationToHours(rawDurationVal);
      
      let parsedEnd: Date | null = null;
      let endISO: string;
      if (parsedDurationHours !== null && !isNaN(parsedDurationHours)) {
        parsedEnd = new Date(parsedStart.getTime() + parsedDurationHours * 60 * 60 * 1000);
        endISO = parsedEnd.toISOString().substring(0, 19);
      } else {
        parsedEnd = rawEndVal ? parseSpreadsheetDate(rawEndVal, options.dateFormat) : null;
        endISO = parsedEnd 
          ? parsedEnd.toISOString().substring(0, 19) 
          : new Date(parsedStart.getTime() + 60 * 60 * 1000).toISOString().substring(0, 19);
      }

      // Ensure stable ISO string serialization
      const startISO = parsedStart.toISOString().substring(0, 19); // YYYY-MM-DDTHH:mm:ss

      // 4. Instantiate output structures based on importMode
      const rowIdStr = `row-${idx}-${Date.now()}`;

      if (options.importMode === 'calendar' || options.importMode === 'both') {
        const ev: CalendarEvent = {
          id: `ev-${rowIdStr}`,
          title: title || `Imported Row #${idx + 1}`,
          notes,
          calendarName,
          location,
          startDate: startISO,
          endDate: endISO,
          isAllDay: false
        };
        events.push(ev);
      }

      if (options.importMode === 'reminders' || options.importMode === 'both') {
        const rem: ReminderItem = {
          id: `rem-${rowIdStr}`,
          title: title || `Imported Row #${idx + 1}`,
          notes,
          listName: calendarName,
          location,
          dueDate: startISO,
          completionDate: isCompleted ? (parsedEnd ? endISO : startISO) : null,
          isCompleted
        };
        reminders.push(rem);
      }

      rowStatus.push({
        rowIndex: idx + 1,
        title: title || `Row ${idx + 1}`,
        success: true
      });

    } catch (e: any) {
      rowStatus.push({
        rowIndex: idx + 1,
        title: `Row ${idx + 1}`,
        success: false,
        error: e.message || 'Fatal conversion error'
      });
    }
  });

  return { events, reminders, rowStatus };
}
