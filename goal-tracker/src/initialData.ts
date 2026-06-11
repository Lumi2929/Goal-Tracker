/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoalRule, CalendarEvent, ReminderItem } from './types';

export const DEFAULT_GOAL_RULES: GoalRule[] = [
  {
    id: 'rule-sleep',
    name: 'Get Enough Sleep',
    dataSource: 'calendar',
    keywords: ['Sleep', 'Bedtime', 'Nightly Rest'],
    keywordLogic: 'any',
    calendars: ['Health', 'Personal'],
    excludeCalendars: [],
    locationText: '',
    locationMode: 'any',
    combinationLogic: 'and',
    statsMethod: 'duration',
    period: 'daily',
    crossDayStrategy: 'startDate', // Sleep is best counted on its start date
    threshold: 8, // 8 hours
    condition: 'gte',
    includeOnlyCompletedReminders: false,
  },
  {
    id: 'rule-entertainment',
    name: 'Control Entertainment Limit',
    dataSource: 'calendar',
    keywords: ['Netflix', 'Gaming', 'Xbox', 'Youtube Session', 'Instagram Binge'],
    keywordLogic: 'any',
    calendars: ['Personal', 'Entertainment'],
    excludeCalendars: ['Work'],
    locationText: '',
    locationMode: 'any',
    combinationLogic: 'and',
    statsMethod: 'duration',
    period: 'daily',
    crossDayStrategy: 'split', // Split across midnight
    threshold: 2.5, // max 2.5 hours
    condition: 'lt',
    includeOnlyCompletedReminders: false,
  },
  {
    id: 'rule-exercise',
    name: 'Exercise Frequency',
    dataSource: 'both',
    keywords: ['Gym', 'Workout', 'Run', 'Exercise', 'Swim', 'Yoga'],
    keywordLogic: 'any',
    calendars: ['Health', 'Fitness'],
    excludeCalendars: [],
    locationText: '',
    locationMode: 'any',
    combinationLogic: 'and',
    statsMethod: 'count',
    period: 'weekly',
    crossDayStrategy: 'split',
    threshold: 3, // 3 times per week
    condition: 'gte',
    includeOnlyCompletedReminders: true, // Only completed exercises counted
  },
  {
    id: 'rule-dental',
    name: 'Flossing Habits',
    dataSource: 'reminders',
    keywords: ['Floss', 'Dental', 'Teeth'],
    keywordLogic: 'any',
    calendars: ['Personal', 'Health'],
    excludeCalendars: [],
    locationText: 'Home',
    locationMode: 'contains', // Flossing must occur with location 'Home'
    combinationLogic: 'and',
    statsMethod: 'count',
    period: 'monthly',
    crossDayStrategy: 'split',
    threshold: 8, // 8 times completed at Home per month
    condition: 'gte',
    includeOnlyCompletedReminders: true,
  }
];

// Let's create clean calendar events running from May 18 to June 2, 2026.
// Current date: 2026-05-30
export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  // SLEEP EVENTS (Usually overnight, 22:30 or 23:00 to 06:30 or 07:00)
  {
    id: 'sleep-19',
    title: 'Sleep Nightly Rest',
    notes: 'Feeling good.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-18T22:30:00',
    endDate: '2026-05-19T06:30:00', // 8 hours fully attributed to May 18 because of 'startDate' strategy
    isAllDay: false,
  },
  {
    id: 'sleep-20',
    title: 'Sleep',
    notes: 'Late night read.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-19T23:30:00',
    endDate: '2026-05-20T06:30:00', // 7 hours (Sleep goal threshold is 8h, so May 19 is a missed day ❌)
    isAllDay: false,
  },
  {
    id: 'sleep-21',
    title: 'Nightly Rest Sleep',
    notes: 'Sleep tracker active.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-20T22:00:00',
    endDate: '2026-05-21T07:00:00', // 9 hours (✅ Achieved May 20)
    isAllDay: false,
  },
  {
    id: 'sleep-22',
    title: 'Sleep',
    notes: 'Usual hours.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-21T22:30:00',
    endDate: '2026-05-22T06:30:00', // 8 hours (✅ Achieved May 21)
    isAllDay: false,
  },
  {
    id: 'sleep-23',
    title: 'Weekend Sleep',
    notes: 'Relaxing weekend shift.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-22T23:00:00',
    endDate: '2026-05-23T07:30:00', // 8.5 hours (✅ Achieved May 22)
    isAllDay: false,
  },
  {
    id: 'sleep-24',
    title: 'Late Sleep Session',
    notes: 'Stayed up watching movies.',
    calendarName: 'Health',
    location: 'Home',
    startDate: '2026-05-23T23:50:00',
    endDate: '2026-05-24T05:50:00', // 6 hours (❌ Missed May 23)
    isAllDay: false,
  },
  {
    id: 'sleep-25',
    title: 'Sleep',
    notes: 'Early night.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-24T21:30:00',
    endDate: '2026-05-25T06:30:00', // 9 hours (✅ Achieved May 24)
    isAllDay: false,
  },
  {
    id: 'sleep-26',
    title: 'Sleep',
    notes: 'Usual sleep cycle.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-25T22:30:00',
    endDate: '2026-05-26T06:35:00', // 8.08 hours (✅ Achieved May 25)
    isAllDay: false,
  },
  {
    id: 'sleep-27',
    title: 'Sleep',
    notes: 'Routine sleeping hours.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-26T22:30:00',
    endDate: '2026-05-27T06:30:00', // 8 hours (✅ Achieved May 26)
    isAllDay: false,
  },
  {
    id: 'sleep-28',
    title: 'Short Sleep Night',
    notes: 'Woke up early for a meeting.',
    calendarName: 'Health',
    location: 'Hotel',
    startDate: '2026-05-27T23:30:00',
    endDate: '2026-05-28T05:30:00', // 6 hours (❌ Missed May 27)
    isAllDay: false,
  },
  {
    id: 'sleep-29',
    title: 'Sleep',
    notes: 'Rebounding from short night.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-28T22:00:00',
    endDate: '2026-05-29T06:45:00', // 8.75 hours (✅ Achieved May 28)
    isAllDay: false,
  },
  {
    id: 'sleep-30',
    title: 'Sleep',
    notes: 'Routine sleep check.',
    calendarName: 'Health',
    location: 'Home Bedroom',
    startDate: '2026-05-29T22:30:00',
    endDate: '2026-05-30T06:30:00', // 8 hours (✅ Achieved May 29)
    isAllDay: false,
  },

  // ENTERTAINMENT EVENTS (Demoing the Midnight Splitting)
  // Rule limit is 2.5 hours. Must be LT (<) 2.5 hours to achieve (✅).
  {
    id: 'ent-1',
    title: 'Netflix: Stranger Things',
    notes: 'Binge session',
    calendarName: 'Entertainment',
    location: 'Living Room',
    startDate: '2026-05-19T21:00:00',
    endDate: '2026-05-19T23:00:00', // 2 hours (✅ Achieved because 2 < 2.5)
    isAllDay: false,
  },
  {
    id: 'ent-2',
    title: 'Gaming with Friends Xbox',
    notes: 'Co-op match',
    calendarName: 'Entertainment',
    location: 'Online',
    startDate: '2026-05-21T18:00:00',
    endDate: '2026-05-21T21:30:00', // 3.5 hours (❌ Failed Entertainment goal on May 21: 3.5 >= 2.5)
    isAllDay: false,
  },
  {
    id: 'ent-3',
    title: 'Netflix Movie Night',
    notes: 'Spans midnight, showing split calculation! 22:30 to 01:30 is 3 hours total.',
    calendarName: 'Entertainment',
    location: 'Home Screen',
    startDate: '2026-05-25T22:30:00',
    endDate: '2026-05-26T01:30:00', 
    // Spans midnight:
    // May 25 gets 22:30 to 24:00 (1.5 hours) => ✅ under 2.5 hours!
    // May 26 gets 00:00 to 01:30 (1.5 hours) => ✅ under 2.5 hours!
    // This perfectly demonstrates splitting. If not split and attributed to May 25, May 25 would be 3.0h (❌) and May 26 would be 0h (✅).
    // Let's verify how splitting works here.
    isAllDay: false,
  },
  {
    id: 'ent-4',
    title: 'Minecraft Gaming Session',
    notes: 'Long adventure.',
    calendarName: 'Entertainment',
    location: 'Home Room',
    startDate: '2026-05-28T14:00:00',
    endDate: '2026-05-28T18:00:00', // 4 hours (❌ Failed May 28)
    isAllDay: false,
  },
  {
    id: 'ent-5',
    title: 'Youtube Session',
    notes: 'Tech tutorials.',
    calendarName: 'Entertainment',
    location: 'Office',
    startDate: '2026-05-29T10:00:00',
    endDate: '2026-05-29T11:00:00', // 1 hour (✅ Achieved)
    isAllDay: false,
  },

  // EXERCISES: WEEKLY FREQUENCY GOAL (Weekly, >= 3 items)
  // Let's seed fitness events & reminders
  {
    id: 'ex-1',
    title: 'Morning Gym Workout',
    notes: 'Leg day.',
    calendarName: 'Fitness',
    location: 'Gold\'s Gym',
    startDate: '2026-05-18T07:00:00',
    endDate: '2026-05-18T08:30:00', // Week of May 18-24 (Workout 1)
    isAllDay: false,
  },
  {
    id: 'ex-2',
    title: 'Park Run 5k',
    notes: 'Good cardio.',
    calendarName: 'Health',
    location: 'Central Park',
    startDate: '2026-05-20T18:00:00',
    endDate: '2026-05-20T18:45:00', // Week of May 18-24 (Workout 2)
    isAllDay: false,
  },
  {
    id: 'ex-3',
    title: 'Evening Swim Practice',
    notes: 'Laps.',
    calendarName: 'Fitness',
    location: 'Rec Center Pool',
    startDate: '2026-05-25T19:00:00',
    endDate: '2026-05-25T20:00:00', // Week of May 25-31 (Workout 1)
    isAllDay: false,
  },
  {
    id: 'ex-4',
    title: 'Yoga Flow',
    notes: 'Stretching and core.',
    calendarName: 'Fitness',
    location: 'Yoga Studio',
    startDate: '2026-05-27T08:00:00',
    endDate: '2026-05-27T09:00:00', // Week of May 25-31 (Workout 2)
    isAllDay: false,
  }
];

export const DEFAULT_REMINDERS: ReminderItem[] = [
  // Gym reminder (Week of May 25-31 - counts as Workout 3)
  {
    id: 'rem-ex-1',
    title: 'Heavy Lift Workout Gym',
    notes: 'Deadlifts and bench.',
    listName: 'Health',
    location: 'Downtown Gym',
    dueDate: '2026-05-29T17:00:00',
    completionDate: '2026-05-29T18:15:00',
    isCompleted: true, // Completed! This will be Workout #3 for Week of May 25-31, satisfying the rule threshold (>= 3 exercises)
  },
  {
    id: 'rem-ex-2',
    title: 'Yoga Practice',
    notes: 'Morning mindfulness.',
    listName: 'Health',
    location: 'Living Room',
    dueDate: '2026-05-24T09:00:00',
    completionDate: null,
    isCompleted: false, // Incomplete! Should not count since rule is 'includeOnlyCompletedReminders: true'
  },

  // Flossing Habits - Monthly goal, threshold >= 8 completed times in location 'Home'
  {
    id: 'floss-1',
    title: 'Dental Hygiene Floss',
    notes: 'Nightly flossing.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-18T22:00:00',
    completionDate: '2026-05-18T22:05:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-2',
    title: 'Teeth Floss',
    notes: 'Keep dentist happy.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-19T22:00:00',
    completionDate: '2026-05-19T22:02:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-3',
    title: 'Floss Teeth',
    notes: 'Clean.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-20T22:10:00',
    completionDate: '2026-05-20T22:15:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-4',
    title: 'Daily Flossing Habits',
    notes: 'Clean spacing.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-21T21:45:00',
    completionDate: '2026-05-21T21:46:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-5',
    title: 'Teeth hygiene floss',
    notes: '',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-22T22:00:00',
    completionDate: '2026-05-22T22:30:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-6',
    title: 'Floss teeth',
    notes: '',
    listName: 'Personal',
    location: 'Office', // Location is Office! Should NOT count because rule specifies Location Matching "Home"
    dueDate: '2026-05-23T14:00:00',
    completionDate: '2026-05-23T14:05:00',
    isCompleted: true, // Matches "Teeth" keyword but location does NOT match "Home"
  },
  {
    id: 'floss-7',
    title: 'Dental Flossing Session',
    notes: 'Quick clean.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-25T22:00:00',
    completionDate: '2026-05-25T22:02:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-8',
    title: 'Floss',
    notes: '',
    listName: 'Personal',
    location: 'Home Bed',
    dueDate: '2026-05-26T22:15:00',
    completionDate: '2026-05-26T22:16:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-9',
    title: 'Floss Teeth Check',
    notes: 'Check-up prep.',
    listName: 'Personal',
    location: 'Home Bathroom',
    dueDate: '2026-05-27T22:00:00',
    completionDate: '2026-05-27T22:04:00',
    isCompleted: true, // +1
  },
  {
    id: 'floss-10',
    title: 'Quick floss',
    notes: 'At work.',
    listName: 'Personal',
    location: 'Travel Hotel', // Location is Travel Hotel, does not contain "Home"
    dueDate: '2026-05-28T22:00:00',
    completionDate: '2026-05-28T22:05:00',
    isCompleted: true, // Doesn't match Home location filter
  },
  {
    id: 'floss-11',
    title: 'Dental floss teeth',
    notes: 'Bed hygiene routines.',
    listName: 'Personal',
    location: 'Home Bedroom',
    dueDate: '2026-05-29T22:30:00',
    completionDate: '2026-05-29T22:33:00',
    isCompleted: true, // +1 (Already 9 completed flossing events matching 'Home')
  }
];
