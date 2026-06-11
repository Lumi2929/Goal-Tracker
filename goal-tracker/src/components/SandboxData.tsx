/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent, ReminderItem } from '../types';
import { SAMPLE_SHEETS, SampleSheet } from '../utils/sampleSheets';
import { processRawRows, FieldMapping, IngestionOptions } from '../utils/sheetProcessor';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  Sliders, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Database, 
  Trash2, 
  Calendar, 
  CheckSquare, 
  ChevronRight,
  Settings,
  X
} from 'lucide-react';

interface SandboxDataProps {
  events: CalendarEvent[];
  setEvents: (evs: CalendarEvent[]) => void;
  reminders: ReminderItem[];
  setReminders: (rems: ReminderItem[]) => void;
  resetToDefaults: () => void;
}

export default function SandboxData({
  events,
  setEvents,
  reminders,
  setReminders,
  resetToDefaults
}: SandboxDataProps) {
  // Ingestor Tab navigation: mapping inputs, log reports, dataset tables
  const [panelTab, setPanelTab] = useState<'upload' | 'inspect'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileType, setUploadedFileType] = useState<'template' | 'local_path' | 'uploaded' | ''>('');
  
  // Real File Upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(null);

  // Simulation Path Inputs
  const [localFilePath, setLocalFilePath] = useState<string>('');
  const [isLoadingPath, setIsLoadingPath] = useState<boolean>(false);

  // Spreadsheet Data Arrays
  const [rawRows, setRawRows] = useState<Array<Record<string, any>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Field Mapping Rules Settings (Persisted in LocalStorage)
  const [mapping, setMapping] = useState<FieldMapping>(() => {
    const defaultMap = {
      title: ['Topic name'],
      startDate: ['Planned Start'],
      endDate: ['Planned End'],
      duration: [],
      notes: ['Description'],
      calendarName: ['Label List'],
      location: ['Physical Location'],
      isCompleted: ['Finished Flag']
    };
    try {
      const saved = localStorage.getItem('ingestion_mapping');
      if (saved) {
        return { ...defaultMap, ...JSON.parse(saved) };
      }
    } catch (_) {}
    return defaultMap;
  });

  // Processing Settings Options
  const [options, setOptions] = useState<IngestionOptions>(() => {
    const defaultOpts = {
      dateFormat: 'auto',
      importMode: 'both' as const,
      defaultCalendarName: 'Personal'
    };
    try {
      const saved = localStorage.getItem('ingestion_options');
      if (saved) {
        return { ...defaultOpts, ...JSON.parse(saved) };
      }
    } catch (_) {}
    return defaultOpts;
  });

  // Run status report logs (row parse failures, warnings)
  const [rowStatusLog, setRowStatusLog] = useState<Array<{ rowIndex: number; title: string; success: boolean; error?: string }>>([]);

  // Load a specified simulated template sheet automatically on mount if no sheet is loaded yet
  useEffect(() => {
    const savedFileName = localStorage.getItem('ingestion_file_name');
    const savedFileType = localStorage.getItem('ingestion_file_type') as any;
    const savedRows = localStorage.getItem('ingestion_raw_rows');
    const savedHeaders = localStorage.getItem('ingestion_headers');

    if (savedFileName && savedRows && savedHeaders) {
      setUploadedFileName(savedFileName);
      setUploadedFileType(savedFileType || 'template');
      setRawRows(JSON.parse(savedRows));
      setHeaders(JSON.parse(savedHeaders));
    } else {
      // First timer loads the default All-in-One Life Log template
      loadSampleTemplate(SAMPLE_SHEETS[1]);
    }
  }, []);

  // Save changes to localStorage to restore configurations on reload
  useEffect(() => {
    localStorage.setItem('ingestion_mapping', JSON.stringify(mapping));
  }, [mapping]);

  useEffect(() => {
    localStorage.setItem('ingestion_options', JSON.stringify(options));
  }, [options]);

  // Reactive processing loop: re-execute row parsing instantly on mapping/options shifts!
  useEffect(() => {
    if (rawRows.length > 0) {
      triggerBatchVerification();
    }
  }, [rawRows, mapping, options]);

  // Performs calculation transformation maps and writes directly into App state hooks
  const triggerBatchVerification = () => {
    const requiredTitleMapped = mapping.title.length > 0;
    const requiredStartMapped = mapping.startDate.length > 0;

    if (!requiredTitleMapped || !requiredStartMapped) {
      // Missing required binds, statistics cannot run
      setRowStatusLog([]);
      return;
    }

    const result = processRawRows(rawRows, mapping, options);
    setEvents(result.events);
    setReminders(result.reminders);
    setRowStatusLog(result.rowStatus);
    
    // Cache raw dataset in storage for session persistence
    localStorage.setItem('ingestion_raw_rows', JSON.stringify(rawRows));
    localStorage.setItem('ingestion_headers', JSON.stringify(headers));
    localStorage.setItem('ingestion_file_name', uploadedFileName);
    localStorage.setItem('ingestion_file_type', uploadedFileType);
  };

  // Automated column matching deductive engine
  const autoSuggestMapping = (headerList: string[]) => {
    const newMap: FieldMapping = {
      title: [],
      startDate: [],
      endDate: [],
      duration: [],
      notes: [],
      calendarName: [],
      location: [],
      isCompleted: []
    };

    headerList.forEach(h => {
      const lower = h.toLowerCase().trim();
      if (lower.match(/^(title|name|subject|topic|task|event|activity|exercise|workout)$/)) {
        newMap.title.push(h);
      } else if (lower.match(/^(start|startdate|plannedstart|scheduled|due|duedate|start time|timestamp|log date)$/)) {
        newMap.startDate.push(h);
      } else if (lower.match(/^(end|enddate|plannedend|finish|completion|end time|completeddate|completiondate)$/)) {
        newMap.endDate.push(h);
      } else if (lower.match(/^(duration|duration mins|duration hours|mins|minutes|hours|time spent|length|span|hours slept)$/)) {
        newMap.duration.push(h);
      } else if (lower.match(/^(notes|description|summary|desc|details|extra)$/)) {
        newMap.notes.push(h);
      } else if (lower.match(/^(calendar|list|category|group|label|listname|calendarname)$/)) {
        newMap.calendarName.push(h);
      } else if (lower.match(/^(location|place|room|site|gym|address)$/)) {
        newMap.location.push(h);
      } else if (lower.match(/^(completed|iscompleted|status|finished|done|flag|checked)$/)) {
        newMap.isCompleted.push(h);
      }
    });

    setMapping(newMap);
  };

  // Loader handlers for simulated offline templates
  const loadSampleTemplate = (sheet: SampleSheet) => {
    setRawRows(sheet.rows);
    setHeaders(sheet.headers);
    setUploadedFileName(sheet.name);
    setUploadedFileType('template');
    setMapping(sheet.suggestedMapping);
    setParseError(null);
    currentFileRef.current = null;
  };

  // Real browser file reader loader
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessRealFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessRealFile(file);
  };

  const handleProcessRealFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    // Special fence validation for native Apple Numbers files
    if (ext === '.numbers') {
      setParseError(
        "Direct translation of native Apple Numbers (.numbers) format is unsupported due to Apple's binary file fences. Please open your Numbers application, select File > Export To > Excel or CSV, and upload the exported file instead!"
      );
      setRawRows([]);
      setHeaders([]);
      setUploadedFileName(file.name);
      setUploadedFileType('uploaded');
      return;
    }

    const isCsv = ext === '.csv' || file.type === 'text/csv' || file.type === 'text/plain';
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let workbook;
        if (isCsv) {
          const text = e.target?.result as string;
          workbook = XLSX.read(text, { type: 'string' });
        } else {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        if (!workbook || workbook.SheetNames.length === 0) {
          throw new Error("No worksheets found inside the spreadsheet document.");
        }

        const activeSheetName = workbook.SheetNames[0];
        const activeSheet = workbook.Sheets[activeSheetName];
        const parsedJson = XLSX.utils.sheet_to_json(activeSheet, { defval: '' }) as Array<Record<string, any>>;

        if (parsedJson.length === 0) {
          throw new Error("The uploaded sheet document is completely blank.");
        }

        // Aggregate unique column mapping lists
        const keys = new Set<string>();
        parsedJson.forEach(row => {
          Object.keys(row).forEach(k => keys.add(k));
        });
        const headerList = Array.from(keys);

        setRawRows(parsedJson);
        setHeaders(headerList);
        setUploadedFileName(file.name);
        setUploadedFileType('uploaded');
        setParseError(null);
        currentFileRef.current = file;

        // Automatically configure suggestions mapping binds
        autoSuggestMapping(headerList);
      } catch (err: any) {
        setParseError(`Spreadsheet parsing failure: ${err.message || err}`);
        setRawRows([]);
        setHeaders([]);
      }
    };

    if (isCsv) {
      reader.readAsText(file, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Desktop Local System Path loading simulation
  const handleLoadSimulatedPath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localFilePath.trim()) {
      setParseError("Please enter a simulated local file system path.");
      return;
    }

    setIsLoadingPath(true);
    setTimeout(() => {
      // Pick template matching path keyword keywords, or fallback to Life Log default
      let matchSheet = SAMPLE_SHEETS[1]; // Comprehensive log
      const pathLower = localFilePath.toLowerCase();
      if (pathLower.includes('sleep') || pathLower.includes('rest')) {
        matchSheet = SAMPLE_SHEETS[0];
      } else if (pathLower.includes('fitness') || pathLower.includes('gym') || pathLower.includes('cardio') || pathLower.includes('workout')) {
        matchSheet = SAMPLE_SHEETS[2];
      }

      setRawRows(matchSheet.rows);
      setHeaders(matchSheet.headers);
      setUploadedFileName(localFilePath.trim());
      setUploadedFileType('local_path');
      setMapping(matchSheet.suggestedMapping);
      setParseError(null);
      setIsLoadingPath(false);
      currentFileRef.current = null;
    }, 750); // Simulates standard desktop direct I/O read timings
  };

  // Manual Trigger Refresh Action: satisfies "Point 2 Refresh & Point 5 Sync mechanism"
  const handleManualRefresh = () => {
    if (currentFileRef.current) {
      handleProcessRealFile(currentFileRef.current);
    } else if (uploadedFileType === 'local_path') {
      loadSimulatedPathRefresh(uploadedFileName);
    } else if (uploadedFileType === 'template') {
      // Find matching template and reload
      const match = SAMPLE_SHEETS.find(s => s.name === uploadedFileName) || SAMPLE_SHEETS[1];
      loadSampleTemplate(match);
    } else {
      setParseError("No active spreadsheet reference to refresh. Please select a spreadsheet or load a template/file path.");
    }
  };

  const loadSimulatedPathRefresh = (path: string) => {
    setIsLoadingPath(true);
    setTimeout(() => {
      let matchSheet = SAMPLE_SHEETS[1];
      const pathLower = path.toLowerCase();
      if (pathLower.includes('sleep') || pathLower.includes('rest')) {
        matchSheet = SAMPLE_SHEETS[0];
      } else if (pathLower.includes('fitness') || pathLower.includes('gym') || pathLower.includes('cardio') || pathLower.includes('workout')) {
        matchSheet = SAMPLE_SHEETS[2];
      }
      setRawRows(matchSheet.rows);
      setHeaders(matchSheet.headers);
      setParseError(null);
      setIsLoadingPath(false);
    }, 400);
  };

  // Checkbox toggles for standard field column mapping binds
  const handleToggleColumnMapping = (standardField: keyof FieldMapping, column: string) => {
    setMapping(prev => {
      const currentList = prev[standardField] || [];
      const updatedList = currentList.includes(column)
        ? currentList.filter(c => c !== column)
        : [...currentList, column];
      
      return {
        ...prev,
        [standardField]: updatedList
      };
    });
  };

  // Restore defaults clean action
  const handleRestoreSystemDefaults = () => {
    if (window.confirm("Verify: This will wipe out active uploaded spreadsheet maps and restore default seed files?")) {
      resetToDefaults();
      localStorage.removeItem('ingestion_file_name');
      localStorage.removeItem('ingestion_file_type');
      localStorage.removeItem('ingestion_raw_rows');
      localStorage.removeItem('ingestion_headers');
      localStorage.removeItem('ingestion_mapping');
      localStorage.removeItem('ingestion_options');
      // Force reload UI
      window.location.reload();
    }
  };

  // Validate status mapping requirements
  const requiredTitleMapped = mapping.title.length > 0;
  const requiredStartMapped = mapping.startDate.length > 0;
  const isCorrectlyMapped = requiredTitleMapped && requiredStartMapped;

  const totalLoaded = rawRows.length;
  const successCount = rowStatusLog.filter(x => x.success).length;
  const failCount = rowStatusLog.filter(x => !x.success).length;

  return (
    <div className="space-y-8" id="sandbox-data-container">
      
      {/* 1. COMPREHENSIVE CONTROL HEADER */}
      <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_4px_12px_rgba(107,112,92,0.015)]">
        <div className="space-y-1.5 text-left flex-grow">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold font-serif text-natural-text">
              Spreadsheet Ingestion Workspace
            </h2>
            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-natural-accent-soft/20 text-natural-accent font-mono rounded">
              v2.0 Native
            </span>
          </div>
          <p className="text-xs text-natural-muted max-w-2xl leading-relaxed">
            Upload CSV/Excel spreadsheets, map custom columns directly to standard database parameters, and analyze life habit goals in real-time. Native Apple EventKit data sources are automatically simulated on core calculations.
          </p>
        </div>

        <div className="flex gap-2.5 flex-wrap self-stretch md:self-auto justify-end">
          <button
            onClick={handleManualRefresh}
            id="btn-manual-refresh"
            className="px-4 py-2.5 bg-natural-accent hover:bg-natural-accent/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all flex items-center gap-1.5 border-none select-none"
            title="Re-read current data state files dynamically"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
            <span>Refresh Database Data</span>
          </button>
          
          <button
            onClick={handleRestoreSystemDefaults}
            id="btn-restore-defaults"
            className="px-4 py-2.5 bg-[#FFF0F0] border border-[#FFCCD5] text-status-off-text hover:bg-status-off-bg/50 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* 2. TAB TOGGLE BARS */}
      <div className="flex border-b border-natural-border" id="tab-toggle-bar">
        <button
          onClick={() => setPanelTab('upload')}
          className={`px-6 py-3 font-serif font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            panelTab === 'upload'
              ? 'border-natural-accent text-natural-text font-bold'
              : 'border-transparent text-natural-muted hover:text-natural-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Ingestion & Field Mapping</span>
        </button>

        <button
          onClick={() => setPanelTab('inspect')}
          className={`px-6 py-3 font-serif font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            panelTab === 'inspect'
              ? 'border-natural-accent text-natural-text font-bold'
              : 'border-transparent text-natural-muted hover:text-natural-text'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Active Database Inspector ({events.length} evs, {reminders.length} rems)</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* 3. COHESIVE TAB PANELS                                      */}
      {/* ========================================================== */}
      {panelTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left transition-all">
          
          {/* LEFT 5 ROWS: INGESTION CONTROLS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* FILE SELECTOR BOX */}
            <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold font-serif text-natural-text flex items-center gap-2">
                <FileText className="w-4 h-4 text-natural-accent" />
                <span>1. Attach Habit Spreadsheet</span>
              </h3>

              {/* Drag/Drop Dropzone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-natural-accent-soft/30 hover:border-natural-accent rounded-[20px] bg-natural-bg/30 p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="mx-auto w-10 h-10 rounded-full bg-natural-accent/10 flex items-center justify-center text-natural-accent group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-natural-text">
                    Drag & Drop workbook file here, or <span className="text-natural-accent underline">browse</span>
                  </p>
                  <p className="text-[10px] text-natural-muted">
                    Supports Excel (.xlsx, .xls), CSV (.csv) or Numbers
                  </p>
                </div>
                <input
                  type="file"
                  id="spreadsheet-file-picker"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv, .xlsx, .xls, .numbers"
                  className="hidden"
                />
              </div>

              {/* Simulating Local Desktop File Paths */}
              <div className="pt-4 border-t border-natural-border/60">
                <form onSubmit={handleLoadSimulatedPath} className="space-y-2.5">
                  <label htmlFor="sim-filepath-field" className="block text-[11px] font-bold text-natural-accent uppercase tracking-widest font-mono">
                    Or Specify Desktop Local File Path
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="sim-filepath-field"
                      placeholder="e.g. /Users/apple/Documents/sleep_tracker_2026.csv"
                      value={localFilePath}
                      onChange={e => setLocalFilePath(e.target.value)}
                      className="flex-grow text-xs px-3.5 py-2.5 border border-natural-border rounded-xl bg-natural-bg/50 text-natural-text focus:outline-none focus:border-natural-accent-soft transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingPath}
                      className="px-3.5 py-2.5 bg-natural-accent-soft hover:bg-natural-accent text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer select-none disabled:opacity-50"
                    >
                      {isLoadingPath ? 'Reading...' : 'Load'}
                    </button>
                  </div>
                  <p className="text-[10px] text-natural-muted leading-relaxed">
                    Loads mock structures matching path keywords &quot;sleep&quot;, &quot;fitness&quot; or &quot;dental&quot;, satisfying desktop file points.
                  </p>
                </form>
              </div>



            </div>

            {/* ERROR / FILE PARSE STATUS */}
            {parseError && (
              <div className="bg-status-off-bg/40 border border-status-off-border rounded-[20px] p-5 flex gap-3 text-status-off-text leading-relaxed">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-xs flex justify-between items-center">
                    <span>Spreadsheet Error Warning</span>
                    <button onClick={() => setParseError(null)} className="p-0.5 hover:bg-status-off-bg hover:text-status-off-text rounded transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                  <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{parseError}</p>
                </div>
              </div>
            )}

            {/* INGESTION METRICS SUMMARY */}
            {totalLoaded > 0 && (
              <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-4 font-sans">
                <h3 className="text-xs font-bold text-natural-accent uppercase tracking-widest font-mono">
                  Active Spreadsheet Metadata
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-xs bg-natural-bg/50 p-4 rounded-xl border border-natural-border/50">
                  <div>
                    <span className="text-natural-muted font-mono text-[10px] block">DOCUMENT NAME</span>
                    <span className="font-bold text-natural-text break-all">{uploadedFileName}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted font-mono text-[10px] block">SOURCE METHOD</span>
                    <span className="font-bold text-natural-text capitalize">{uploadedFileType.replace('_', ' ')}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-natural-muted font-mono text-[10px] block">COLUMNS FOUND</span>
                    <span className="font-bold text-natural-text">{headers.length} headers</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-natural-muted font-mono text-[10px] block">TOTAL ROWS LOGGED</span>
                    <span className="font-bold text-natural-text">{totalLoaded} entries</span>
                  </div>
                </div>

                {isCorrectlyMapped ? (
                  <div className="bg-status-ok-bg/30 border border-status-ok-border/30 rounded-xl p-3.5 flex items-start gap-2.5 text-status-ok-text text-xs leading-relaxed">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Mapping Status: Fully Validated</span>
                      <p className="text-[11px] text-natural-muted">
                        Headers checked out! Parsed successfully {successCount} rows ({failCount} errors). Data fully synchronized into rules dashboard.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600" />
                    <div>
                      <span className="font-bold block text-orange-800">Required Column Mappings Missing</span>
                      <p className="text-[11px] text-orange-700">
                        You MUST config-map at least one column to <strong>Title</strong> and <strong>Start Date</strong> standard fields below to support calendar calculations!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PROCESSING PARSING SETTINGS */}
            <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-5 text-xs">
              <h3 className="font-bold font-serif text-natural-text flex items-center gap-2 text-sm pt-0.5">
                <Settings className="w-4 h-4 text-natural-accent" />
                <span>2. Global Ingestion Settings</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1.5 font-mono">Date and Time Parse Format</label>
                  <select
                    value={options.dateFormat || 'auto'}
                    onChange={e => setOptions(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-white text-natural-text focus:outline-none"
                  >
                    <option value="auto">Auto-Detect & Infer (Standard Formats / Excel Serial Numbers)</option>
                    <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm (e.g., 2026-05-30 22:30)</option>
                    <option value="MM/DD/YYYY HH:mm">MM/DD/YYYY HH:mm (e.g., 05/30/2026 22:30)</option>
                    <option value="DD-MM-YYYY HH:mm">DD-MM-YYYY HH:mm (e.g., 30-05-2026 22:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1.5 font-mono">Simulated Allocation Mode</label>
                  <select
                    value={options.importMode || 'both'}
                    onChange={e => setOptions(prev => ({ ...prev, importMode: e.target.value as any }))}
                    className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-white text-natural-text focus:outline-none"
                  >
                    <option value="both">Both Event & Reminder representation (Highly Recommended)</option>
                    <option value="calendar">Strict Device Calendar Events only</option>
                    <option value="reminders">Strict Device Reminders list registers only</option>
                  </select>
                  <p className="text-[10px] text-natural-muted mt-1 font-sans leading-relaxed">
                    Generates synchronized virtual copies so existing calendar stats and reminder lists compute cleanly in tandem under current dashboard rules.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-widest mb-1.5 font-mono">Default Fallback Calendar/List name</label>
                  <input
                    type="text"
                    value={options.defaultCalendarName || ''}
                    onChange={e => setOptions(prev => ({ ...prev, defaultCalendarName: e.target.value }))}
                    placeholder="e.g. Health"
                    className="w-full text-xs px-3 py-2 border border-natural-border rounded-xl bg-white text-natural-text focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 7 ROWS: FIELD MAPPING LAYOUTS */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-6">
              
              <div className="flex justify-between items-center pb-4 border-b border-natural-border">
                <div className="text-left space-y-0.5">
                  <h3 className="font-bold font-serif text-natural-text text-md">
                    3. Column Header Binding Config
                  </h3>
                  <p className="text-xs text-natural-muted leading-relaxed">
                    Map workbook headers into the analytical schema. Check multiple columns as targets if keywords cover both at once!
                  </p>
                </div>
              </div>

              {headers.length === 0 ? (
                <div className="text-center py-16 text-natural-muted italic text-xs space-y-2">
                  <Sliders className="w-8 h-8 mx-auto stroke-1 text-natural-accent-soft" />
                  <p>Spreadsheet headers will reflect here when uploaded.</p>
                </div>
              ) : (
                <div className="space-y-6" id="standard-fields-map">

                  {/* 1. TITLE (REQUIRED) */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                        <span className="dot bg-natural-accent w-2 h-2 rounded-full"></span>
                        Event / Reminder Title
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 border border-red-100 rounded text-serif font-sans ml-1">Required</span>
                      </span>
                      {mapping.title.length === 0 && (
                        <span className="text-[10px] text-red-600 font-semibold font-mono">⚠️ Required Field unmapped!</span>
                      )}
                    </div>
                    <p className="text-[11px] text-natural-muted">What the event or checking task is called. Determines rule keyword matches.</p>
                    
                    {/* Multi-Select Checks columns */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('title', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.title.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.title?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. START DATE (REQUIRED) */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                        <span className="dot bg-natural-accent w-2 h-2 rounded-full"></span>
                        Date & Time / Due Date
                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 border border-red-100 rounded text-serif font-sans ml-1">Required</span>
                      </span>
                      {mapping.startDate.length === 0 && (
                        <span className="text-[10px] text-red-600 font-semibold font-mono">⚠️ Required Field unmapped!</span>
                      )}
                    </div>
                    <p className="text-[11px] text-natural-muted">Start timestamp of Sleep or Cardio session, or due timeframe of dental logs.</p>
                    
                    {/* Multi-Select Checks columns */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('startDate', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.startDate.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.startDate?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. END DATE */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      End Date & Time / Completion Date
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">End of sleep metrics or completion timestamp. Used for Split calculations.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('endDate', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.endDate.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.endDate?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* EVENT DURATION (OPTIONAL) */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      Event Duration
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional / Precedence</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Map a column representing session duration (e.g., "90 mins", "8 hours", "1.5" or "08:15"). Takes precedence to calculate accurate event ends.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('duration', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.duration && mapping.duration.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.duration?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. NOTES */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      Description or Notes
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Summary notes or comments. Evaluated by rule keywords logic is matched.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('notes', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.notes.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.notes?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. CALENDAR / LIST NAME */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      Calendar / Reminders List Group
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Groups categories. Binds filters like &apos;Health&apos;, &apos;Fitness&apos;, or &apos;Personal&apos; lists.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('calendarName', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.calendarName.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.calendarName?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6. LOCATION */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      Physical Location text
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Saves physical addresses or venues (e.g., &apos;Home Bathroom&apos;, &apos;Gold&apos;s Gym&apos;).</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('location', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.location.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.location?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 7. IS COMPLETED */}
                  <div className="p-4 border border-natural-border bg-natural-bg/10 rounded-2xl relative space-y-2.5">
                    <span className="text-xs font-bold font-serif text-natural-text flex items-center gap-1.5">
                      <span className="dot bg-natural-accent-soft w-2 h-2 rounded-full"></span>
                      Completed status (T/F)
                      <span className="text-[10px] bg-natural-bg text-natural-muted px-1.5 py-0.5 border border-natural-border rounded font-sans ml-1">Optional</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Checks off reminders completion. If unmapped, row items default as Completed: True.</p>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {headers.map(h => (
                        <button
                          key={h}
                          onClick={() => handleToggleColumnMapping('isCompleted', h)}
                          className={`px-3 py-1.5 rounded-full text-[11px] border transition-all cursor-pointer font-sans flex items-center gap-1 ${
                            mapping.isCompleted.includes(h)
                              ? 'bg-natural-accent text-white border-natural-accent font-semibold'
                              : 'bg-white text-natural-muted border-natural-border hover:text-natural-text'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={mapping.isCompleted?.includes(h) ?? false}
                            readOnly
                            className="mr-0.5 h-3 w-3 accent-white rounded border-white pointer-events-none"
                          />
                          <span>{h}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* PARSE REPORT LOGS LISTING */}
            {rowStatusLog.length > 0 && (
              <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-natural-border/30">
                  <h3 className="text-xs font-bold text-natural-accent uppercase tracking-widest font-mono flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-status-ok-text" />
                    <span>Row Transition Conversion Diagnostics ({successCount}/{totalLoaded} ok)</span>
                  </h3>
                  {failCount > 0 && (
                    <span className="text-[10px] bg-status-off-bg text-status-off-text px-2 py-0.5 font-bold rounded-full font-mono animate-pulse">
                      {failCount} errors logged
                    </span>
                  )}
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
                  {rowStatusLog.map((log) => (
                    <div
                      key={log.rowIndex}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 text-left leading-relaxed ${
                        log.success
                          ? 'border-natural-border/50 bg-natural-bg/25 text-natural-text'
                          : 'border-status-off-border/40 bg-status-off-bg/20 text-status-off-text'
                      }`}
                    >
                      {log.success ? (
                        <span className="p-0.5 bg-status-ok-bg/30 text-status-ok-text rounded-full text-[9px] font-bold font-mono">✓</span>
                      ) : (
                        <span className="p-0.5 bg-status-off-bg/60 text-status-off-text rounded-full text-[9px] font-bold font-mono">✕</span>
                      )}
                      <div className="space-y-0.5 flex-grow">
                        <span className="font-bold text-[11px] block">
                          Row #{log.rowIndex}: {log.title}
                        </span>
                        {!log.success && (
                          <p className="text-[10px] text-status-off-text/90 italic font-mono">{log.error}</p>
                        )}
                        {log.success && (
                          <span className="text-[9px] text-[#A5A58D] font-mono italic">Import status verified.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* PANEL TAB 2: ACTIVE DATABASE INSPECTOR */}
      {panelTab === 'inspect' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left transition-all">
          
          {/* COLUMN 1: PARSED EVENTS */}
          <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-natural-border">
              <Calendar className="w-5 h-5 text-natural-accent" />
              <div className="flex-grow">
                <span className="font-bold font-serif text-natural-text text-sm block">Unified Calendar Database Registers</span>
                <span className="text-[10px] text-natural-muted font-mono">{events.length} logs fully mapped</span>
              </div>
            </div>

            <div className="max-h-120 overflow-y-auto space-y-2.5 pr-1">
              {events.map((ev, index) => {
                const sDate = new Date(ev.startDate);
                const eDate = new Date(ev.endDate);
                const diffHours = ((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60)).toFixed(1);

                return (
                  <div key={ev.id || index} className="border border-natural-border/60 rounded-xl p-4 bg-natural-bg/20 flex justify-between items-start hover:border-natural-accent-soft/30 hover:bg-natural-bg/40 transition-all text-xs">
                    <div className="space-y-1.5 flex-grow text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-status-ok-bg border border-status-ok-border/30 text-status-ok-text rounded">
                          {ev.calendarName}
                        </span>
                        <h4 className="font-bold text-natural-text font-serif text-xs leading-tight">{ev.title}</h4>
                      </div>
                      
                      {ev.notes && (
                        <p className="text-[11px] text-natural-muted bg-white p-2 border border-natural-border/30 rounded-xl font-serif leading-relaxed whitespace-pre-wrap">
                          {ev.notes}
                        </p>
                      )}
                      
                      <div className="text-[10px] text-natural-muted space-y-0.5 font-mono">
                        <p>🕒 ST: {ev.startDate.replace('T', ' ')} </p>
                        <p>🕒 EN: {ev.endDate.replace('T', ' ')} ({diffHours} hours duration)</p>
                        {ev.location && <p>📍 {ev.location}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {events.length === 0 && (
                <div className="text-center py-16 text-natural-muted italic text-xs space-y-2">
                  <Calendar className="w-8 h-8 mx-auto stroke-1 text-natural-accent-soft" />
                  <p>No calendar records parsed. Complete necessary required field configurations.</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: PARSED REMINDERS */}
          <div className="bg-natural-surface border border-natural-border rounded-[24px] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-natural-border">
              <CheckSquare className="w-5 h-5 text-natural-accent" />
              <div className="flex-grow">
                <span className="font-bold font-serif text-natural-text text-sm block">Unified Reminders Database Registers</span>
                <span className="text-[10px] text-natural-muted font-mono">{reminders.length} logs fully mapped</span>
              </div>
            </div>

            <div className="max-h-120 overflow-y-auto space-y-2.5 pr-1">
              {reminders.map((rem, index) => {
                return (
                  <div key={rem.id || index} className="border border-natural-border/60 rounded-xl p-4 bg-natural-bg/20 flex justify-between items-start hover:border-natural-accent-soft/30 hover:bg-natural-bg/40 transition-all text-xs">
                    <div className="space-y-1.5 flex-grow text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-status-ok-bg border border-status-ok-border/30 text-status-ok-text rounded-full">
                          {rem.listName}
                        </span>
                        <h4 className={`font-bold font-serif text-xs leading-tight ${rem.isCompleted ? 'line-through text-natural-muted' : 'text-natural-text'}`}>
                          {rem.title}
                        </h4>
                        {rem.isCompleted ? (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-status-ok-bg text-status-ok-text border border-status-ok-border/30 rounded">COMPLETED</span>
                        ) : (
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded">PENDING</span>
                        )}
                      </div>

                      {rem.notes && (
                        <p className="text-[11px] text-natural-muted bg-white p-2 border border-natural-border/30 rounded-xl font-serif leading-relaxed whitespace-pre-wrap">
                          {rem.notes}
                        </p>
                      )}

                      <div className="text-[10px] text-natural-muted space-y-0.5 font-mono">
                        {rem.dueDate && <p>📅 DUE Date: {rem.dueDate.replace('T', ' ')}</p>}
                        {rem.isCompleted && rem.completionDate && (
                          <p className="text-status-ok-text font-semibold">✓ DONE Date: {rem.completionDate.replace('T', ' ')}</p>
                        )}
                        {rem.location && <p>📍 {rem.location}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {reminders.length === 0 && (
                <div className="text-center py-16 text-natural-muted italic text-xs space-y-2">
                  <CheckSquare className="w-8 h-8 mx-auto stroke-1 text-natural-accent-soft" />
                  <p>No reminder records parsed. Complete necessary required field configurations.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
