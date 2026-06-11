/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SampleSheet {
  id: string;
  name: string;
  filename: string;
  headers: string[];
  rows: Array<Record<string, any>>;
  suggestedMapping: Record<string, string[]>;
}

export const SAMPLE_SHEETS: SampleSheet[] = [
  {
    id: 'sheet-sleep',
    name: 'Sleep & Nightly Rest Journal',
    filename: 'sleep_journal_exports.xlsx',
    headers: ['Sleep Name', 'Notes', 'Sleep Log Start', 'Sleep Log End', 'Calendar Group', 'Matched Location'],
    suggestedMapping: {
      title: ['Sleep Name'],
      startDate: ['Sleep Log Start'],
      endDate: ['Sleep Log End'],
      duration: [],
      notes: ['Notes'],
      calendarName: ['Calendar Group'],
      location: ['Matched Location'],
      isCompleted: []
    },
    rows: [
      { 'Sleep Name': 'Sleep Nightly Rest', 'Notes': 'Feeling good.', 'Sleep Log Start': '2026-05-18 22:30', 'Sleep Log End': '2026-05-19 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Late night read.', 'Sleep Log Start': '2026-05-19 23:30', 'Sleep Log End': '2026-05-20 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Nightly Rest Sleep', 'Notes': 'Sleep tracker active.', 'Sleep Log Start': '2026-05-20 22:00', 'Sleep Log End': '2026-05-21 07:00', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Usual hours.', 'Sleep Log Start': '2026-05-21 22:30', 'Sleep Log End': '2026-05-22 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Weekend Sleep', 'Notes': 'Relaxing weekend shift.', 'Sleep Log Start': '2026-05-22 23:00', 'Sleep Log End': '2026-05-23 07:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Late Sleep Session', 'Notes': 'Stayed up watching movies.', 'Sleep Log Start': '2026-05-23 23:50', 'Sleep Log End': '2026-05-24 05:50', 'Calendar Group': 'Health', 'Matched Location': 'Home' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Early night.', 'Sleep Log Start': '2026-05-24 21:30', 'Sleep Log End': '2026-05-25 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Usual sleep cycle.', 'Sleep Log Start': '2026-05-25 22:30', 'Sleep Log End': '2026-05-26 06:35', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Routine sleeping hours.', 'Sleep Log Start': '2026-05-26 22:30', 'Sleep Log End': '2026-05-27 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Short Sleep Night', 'Notes': 'Woke up early for a meeting.', 'Sleep Log Start': '2026-05-27 23:30', 'Sleep Log End': '2026-05-28 05:30', 'Calendar Group': 'Health', 'Matched Location': 'Hotel' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Rebounding from short night.', 'Sleep Log Start': '2026-05-28 22:00', 'Sleep Log End': '2026-05-29 06:45', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' },
      { 'Sleep Name': 'Sleep', 'Notes': 'Routine sleep check.', 'Sleep Log Start': '2026-05-29 22:30', 'Sleep Log End': '2026-05-30 06:30', 'Calendar Group': 'Health', 'Matched Location': 'Home Bedroom' }
    ]
  },
  {
    id: 'sheet-all',
    name: 'Unified Life Log (All-in-One Journal)',
    filename: 'universal_tracking_log.csv',
    headers: ['Topic name', 'Description', 'Planned Start', 'Planned End', 'Label List', 'Physical Location', 'Finished Flag'],
    suggestedMapping: {
      title: ['Topic name'],
      startDate: ['Planned Start'],
      endDate: ['Planned End'],
      duration: [],
      notes: ['Description'],
      calendarName: ['Label List'],
      location: ['Physical Location'],
      isCompleted: ['Finished Flag']
    },
    rows: [
      // SLEEP
      { 'Topic name': 'Sleep Nightly Rest', 'Description': 'Feeling good.', 'Planned Start': '2026-05-18 22:30', 'Planned End': '2026-05-19 06:30', 'Label List': 'Health', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Sleep', 'Description': 'Late night read.', 'Planned Start': '2026-05-19 23:30', 'Planned End': '2026-05-20 06:30', 'Label List': 'Health', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Nightly Rest Sleep', 'Description': 'Sleep tracker active.', 'Planned Start': '2026-05-20 22:00', 'Planned End': '2026-05-21 07:00', 'Label List': 'Health', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Sleep', 'Description': 'Routine sleep cycle.', 'Planned Start': '2026-05-25 22:30', 'Planned End': '2026-05-26 06:35', 'Label List': 'Health', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Sleep', 'Description': 'Routine sleep check.', 'Planned Start': '2026-05-29 22:30', 'Planned End': '2026-05-30 06:30', 'Label List': 'Health', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' },
      
      // ENTERTAINMENT
      { 'Topic name': 'Netflix: Stranger Things', 'Description': 'Binge session', 'Planned Start': '2026-05-19 21:00', 'Planned End': '2026-05-19 23:00', 'Label List': 'Entertainment', 'Physical Location': 'Living Room', 'Finished Flag': 'True' },
      { 'Topic name': 'Gaming with Friends Xbox', 'Description': 'Co-op match', 'Planned Start': '2026-05-21 18:00', 'Planned End': '2026-05-21 21:30', 'Label List': 'Entertainment', 'Physical Location': 'Online', 'Finished Flag': 'True' },
      { 'Topic name': 'Netflix Movie Night', 'Description': 'Spans midnight, showing split calculation! 22:30 to 01:30 is 3 hours total.', 'Planned Start': '2026-05-25 22:30', 'Planned End': '2026-05-26 01:30', 'Label List': 'Entertainment', 'Physical Location': 'Home Screen', 'Finished Flag': 'True' },
      { 'Topic name': 'Minecraft Gaming Session', 'Description': 'Long adventure.', 'Planned Start': '2026-05-28 14:00', 'Planned End': '2026-05-28 18:00', 'Label List': 'Entertainment', 'Physical Location': 'Home Room', 'Finished Flag': 'True' },
      { 'Topic name': 'Youtube Session', 'Description': 'Tech tutorials.', 'Planned Start': '2026-05-29 10:00', 'Planned End': '2026-05-29 11:00', 'Label List': 'Entertainment', 'Physical Location': 'Office', 'Finished Flag': 'True' },
      
      // FITNESS WORKOUTS
      { 'Topic name': 'Morning Gym Workout', 'Description': 'Leg day.', 'Planned Start': '2026-05-18 07:00', 'Planned End': '2026-05-18 08:30', 'Label List': 'Fitness', 'Physical Location': "Gold's Gym", 'Finished Flag': 'True' },
      { 'Topic name': 'Park Run 5k', 'Description': 'Good cardio.', 'Planned Start': '2026-05-20 18:00', 'Planned End': '2026-05-20 18:45', 'Label List': 'Health', 'Physical Location': 'Central Park', 'Finished Flag': 'True' },
      { 'Topic name': 'Evening Swim Practice', 'Description': 'Laps.', 'Planned Start': '2026-05-25 19:00', 'Planned End': '2026-05-25 20:00', 'Label List': 'Fitness', 'Physical Location': 'Rec Center Pool', 'Finished Flag': 'True' },
      { 'Topic name': 'Yoga Flow', 'Description': 'Stretching and core.', 'Planned Start': '2026-05-27 08:00', 'Planned End': '2026-05-27 09:00', 'Label List': 'Fitness', 'Physical Location': 'Yoga Studio', 'Finished Flag': 'True' },
      { 'Topic name': 'Heavy Lift Workout Gym', 'Description': 'Deadlifts and bench.', 'Planned Start': '2026-05-29 17:00', 'Planned End': '2026-05-29 18:15', 'Label List': 'Health', 'Physical Location': 'Downtown Gym', 'Finished Flag': 'True' },

      // REMINDERS - FLOSSING
      { 'Topic name': 'Dental Hygiene Floss', 'Description': 'Nightly flossing.', 'Planned Start': '2026-05-18 22:00', 'Planned End': '2026-05-18 22:05', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Teeth Floss', 'Description': 'Keep dentist happy.', 'Planned Start': '2026-05-19 22:00', 'Planned End': '2026-05-19 22:02', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Floss Teeth', 'Description': 'Clean.', 'Planned Start': '2026-05-20 22:10', 'Planned End': '2026-05-20 22:15', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Daily Flossing Habits', 'Description': 'Clean spacing.', 'Planned Start': '2026-05-21 21:45', 'Planned End': '2026-05-21 21:46', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Teeth hygiene floss', 'Description': '', 'Planned Start': '2026-05-22 22:00', 'Planned End': '2026-05-22 22:30', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Floss teeth', 'Description': '', 'Planned Start': '2026-05-23 14:00', 'Planned End': '2026-05-23 14:05', 'Label List': 'Personal', 'Physical Location': 'Office', 'Finished Flag': 'True' },
      { 'Topic name': 'Dental Flossing Session', 'Description': 'Quick clean.', 'Planned Start': '2026-05-25 22:00', 'Planned End': '2026-05-25 22:02', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Floss', 'Description': '', 'Planned Start': '2026-05-26 22:15', 'Planned End': '2026-05-26 22:16', 'Label List': 'Personal', 'Physical Location': 'Home Bed', 'Finished Flag': 'True' },
      { 'Topic name': 'Floss Teeth Check', 'Description': 'Check-up prep.', 'Planned Start': '2026-05-27 22:00', 'Planned End': '2026-05-27 22:04', 'Label List': 'Personal', 'Physical Location': 'Home Bathroom', 'Finished Flag': 'True' },
      { 'Topic name': 'Quick floss', 'Description': 'At work.', 'Planned Start': '2026-05-28 22:00', 'Planned End': '2026-05-28 22:05', 'Label List': 'Personal', 'Physical Location': 'Travel Hotel', 'Finished Flag': 'True' },
      { 'Topic name': 'Dental floss teeth', 'Description': 'Bed hygiene routines.', 'Planned Start': '2026-05-29 22:30', 'Planned End': '2026-05-29 22:33', 'Label List': 'Personal', 'Physical Location': 'Home Bedroom', 'Finished Flag': 'True' }
    ]
  },
  {
    id: 'sheet-fitness',
    name: 'Cardio & Strength Log',
    filename: 'fitness_routines_may.xls',
    headers: ['Workout Type', 'Duration Mins', 'Log Date', 'Gym Name', 'Done Symbol'],
    suggestedMapping: {
      title: ['Workout Type'],
      startDate: ['Log Date'],
      endDate: [],
      duration: ['Duration Mins'],
      notes: ['Duration Mins'],
      calendarName: [],
      location: ['Gym Name'],
      isCompleted: ['Done Symbol']
    },
    rows: [
      { 'Workout Type': 'Morning Gym Workout', 'Duration Mins': '90 mins', 'Log Date': '2026-05-18 07:00', 'Gym Name': "Gold's Gym", 'Done Symbol': '✓' },
      { 'Workout Type': 'Park Run 5k', 'Duration Mins': '45 mins', 'Log Date': '2026-05-20 18:00', 'Gym Name': 'Central Park', 'Done Symbol': '✓' },
      { 'Workout Type': 'Evening Swim Practice', 'Duration Mins': '60 mins', 'Log Date': '2026-05-25 19:00', 'Gym Name': 'Rec Center Pool', 'Done Symbol': '✓' },
      { 'Workout Type': 'Yoga Flow', 'Duration Mins': '60 mins', 'Log Date': '2026-05-27 08:00', 'Gym Name': 'Yoga Studio', 'Done Symbol': '✓' },
      { 'Workout Type': 'Heavy Lift Workout Gym', 'Duration Mins': '75 mins', 'Log Date': '2026-05-29 17:002', 'Gym Name': 'Downtown Gym', 'Done Symbol': '✓' }
    ]
  }
];
