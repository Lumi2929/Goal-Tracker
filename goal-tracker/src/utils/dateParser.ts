/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Parses dynamic raw data from spreadsheet cells (Excel serialize number or various string dates)
 * and returns a standard JS Date object, or null if unparseable.
 */
export function parseSpreadsheetDate(value: any, specifiedFormat?: string): Date | null {
  if (value === undefined || value === null) return null;
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  const valStr = String(value).trim();
  if (!valStr) return null;

  // Handle Excel Serial Date values
  if (/^\d+(\.\d+)?$/.test(valStr)) {
    const num = Number(valStr);
    // Excel date range check: 30000 to 60000 corresponds to raw spreadsheet dates around 1980 - 2060
    if (num > 30000 && num < 60000) {
      const dateMs = (num - 25569) * 86400 * 1000;
      // SheetJS timezone adjustment
      const d = new Date(dateMs);
      if (!isNaN(d.getTime())) {
        // Adjust for browser timezone offset to keep date uniform
        return d;
      }
    }
    // Unix epoch timestamp compatibility
    if (num > 1000000000 && num < 2000000000) {
      const d = new Date(num * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Handle Specified Formats (e.g. YYYY-MM-DD, MM/DD/YYYY)
  if (specifiedFormat && specifiedFormat !== 'auto') {
    try {
      const parsed = parseCustomDate(valStr, specifiedFormat);
      if (parsed) return parsed;
    } catch {
      // Fallback to auto if custom mapping parser fails
    }
  }

  // Automatic Inference
  
  // 1. ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or YYYY/MM/DD HH:mm
  const isoMatch = valStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (isoMatch) {
    const [_, y, m, d, hh, mm, ss] = isoMatch;
    const year = parseInt(y);
    const month = parseInt(m) - 1;
    const day = parseInt(d);
    const hours = hh ? parseInt(hh) : 0;
    const mins = mm ? parseInt(mm) : 0;
    const secs = ss ? parseInt(ss) : 0;
    const date = new Date(year, month, day, hours, mins, secs);
    if (!isNaN(date.getTime())) return date;
  }

  // 2. US Slate format: MM/DD/YYYY or MM-DD-YYYY
  const usMatch = valStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (usMatch) {
    const [_, m, d, y, hh, mm, ss] = usMatch;
    const year = parseInt(y);
    const month = parseInt(m) - 1;
    const day = parseInt(d);
    const hours = hh ? parseInt(hh) : 0;
    const mins = mm ? parseInt(mm) : 0;
    const secs = ss ? parseInt(ss) : 0;
    const date = new Date(year, month, day, hours, mins, secs);
    if (!isNaN(date.getTime())) return date;
  }

  // 3. Dot format (EU): DD.MM.YYYY
  const euMatch = valStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (euMatch) {
    const [_, d, m, y, hh, mm, ss] = euMatch;
    const year = parseInt(y);
    const month = parseInt(m) - 1;
    const day = parseInt(d);
    const hours = hh ? parseInt(hh) : 0;
    const mins = mm ? parseInt(mm) : 0;
    const secs = ss ? parseInt(ss) : 0;
    const date = new Date(year, month, day, hours, mins, secs);
    if (!isNaN(date.getTime())) return date;
  }

  // Normal JS Date.parse as catch-all
  const parsedTime = Date.parse(valStr);
  if (!isNaN(parsedTime)) {
    return new Date(parsedTime);
  }

  return null;
}

/**
 * Standard utility to parse date using format template
 */
function parseCustomDate(str: string, format: string): Date | null {
  const digits = str.match(/\d+/g);
  if (!digits) return null;
  
  const formatParts = format.match(/[A-Za-z]+/g);
  if (!formatParts || formatParts.length !== digits.length) return null;

  let year = new Date().getFullYear();
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  for (let i = 0; i < formatParts.length; i++) {
    const part = formatParts[i].toUpperCase();
    const val = parseInt(digits[i]);
    
    if (part.includes('Y')) {
      year = val < 100 ? (val < 70 ? 2000 + val : 1900 + val) : val;
    } else if (part.includes('M')) {
      month = val - 1;
    } else if (part.includes('D')) {
      day = val;
    } else if (part.includes('H')) {
      hours = val;
    } else if (part.includes('M')) {
      minutes = val;
    } else if (part.includes('S')) {
      seconds = val;
    }
  }

  const d = new Date(year, month, day, hours, minutes, seconds);
  return isNaN(d.getTime()) ? null : d;
}
