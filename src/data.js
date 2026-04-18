function buildDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arr = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    arr.push({
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      isToday: i === 0,
    });
  }
  return arr;
}

export const DAYS = buildDays();

export const FOOD_DB = [
  { id: 'f1', name: 'Greek Yogurt', brand: 'Fage 0%', serving: 'cup', cal: 120, p: 22, c: 8, f: 0 },
  { id: 'f2', name: 'Chicken Breast', brand: 'Grilled, skinless', serving: '100g', cal: 165, p: 31, c: 0, f: 3.6 },
  { id: 'f3', name: 'Brown Rice', brand: 'Cooked', serving: 'cup', cal: 216, p: 5, c: 45, f: 1.8 },
  { id: 'f4', name: 'Avocado', brand: 'Medium', serving: '1 whole', cal: 234, p: 3, c: 12, f: 21 },
  { id: 'f5', name: 'Eggs', brand: 'Large, whole', serving: '2 eggs', cal: 155, p: 13, c: 1, f: 11 },
  { id: 'f6', name: 'Almonds', brand: 'Raw', serving: '30g', cal: 174, p: 6, c: 6, f: 15 },
  { id: 'f7', name: 'Protein Shake', brand: 'Whey, 1 scoop', serving: 'scoop', cal: 120, p: 24, c: 3, f: 1.5 },
  { id: 'f8', name: 'Banana', brand: 'Medium', serving: '1 whole', cal: 105, p: 1, c: 27, f: 0.3 },
  { id: 'f9', name: 'Oats', brand: 'Rolled, dry', serving: '50g', cal: 190, p: 7, c: 32, f: 3 },
  { id: 'f10', name: 'Salmon', brand: 'Atlantic, cooked', serving: '100g', cal: 208, p: 20, c: 0, f: 13 },
  { id: 'f11', name: 'Sweet Potato', brand: 'Baked', serving: '1 medium', cal: 103, p: 2, c: 24, f: 0.2 },
  { id: 'f12', name: 'Olive Oil', brand: 'Extra virgin', serving: '1 tbsp', cal: 119, p: 0, c: 0, f: 14 },
];

export const DEFAULT_WORKOUT = {
  name: 'PUSH DAY — CHEST & TRI',
  startedAt: '18:24',
  duration: 42,
  exercises: [
    {
      id: 'e1',
      name: 'Barbell Bench Press',
      targetSets: 4,
      sets: [
        { weight: 135, reps: 10, done: true },
        { weight: 155, reps: 8, done: true },
        { weight: 175, reps: 6, done: true },
        { weight: 185, reps: 5, done: false },
      ],
      pr: 195,
    },
    {
      id: 'e2',
      name: 'Incline Dumbbell Press',
      targetSets: 3,
      sets: [
        { weight: 60, reps: 12, done: true },
        { weight: 65, reps: 10, done: false },
        { weight: 65, reps: 10, done: false },
      ],
      pr: 75,
    },
    {
      id: 'e3',
      name: 'Cable Tricep Pushdown',
      targetSets: 3,
      sets: [
        { weight: 50, reps: 15, done: false },
        { weight: 55, reps: 12, done: false },
        { weight: 60, reps: 10, done: false },
      ],
      pr: 70,
    },
  ],
};

export const DEFAULT_MEALS = [
  {
    id: 'm1',
    name: 'BREAKFAST',
    time: '07:40',
    items: [
      { ...FOOD_DB[8], portion: 1 },
      { ...FOOD_DB[4], portion: 1 },
      { ...FOOD_DB[7], portion: 0.5 },
    ],
  },
  {
    id: 'm2',
    name: 'LUNCH',
    time: '12:15',
    items: [
      { ...FOOD_DB[1], portion: 1.5 },
      { ...FOOD_DB[2], portion: 1 },
      { ...FOOD_DB[3], portion: 0.5 },
    ],
  },
  {
    id: 'm3',
    name: 'SNACK',
    time: '15:30',
    items: [
      { ...FOOD_DB[0], portion: 1 },
      { ...FOOD_DB[5], portion: 1 },
    ],
  },
  { id: 'm4', name: 'DINNER', time: '19:00', items: [] },
];

export const GOALS = {
  calories: 2400,
  protein: 180,
  carbs: 260,
  fat: 75,
  water: 8,
  sleep: 8,
  steps: 10000,
};

export const SLEEP_DATA = {
  last: 7.4,
  avg: 7.8,
  stages: { deep: 1.2, rem: 1.8, light: 4.1, awake: 0.3 },
  bedtime: '23:18',
  wake: '06:42',
};

export const WEEK_ACTIVITY = [
  { d: 'MON', cal: 2310, workout: true },
  { d: 'TUE', cal: 2180, workout: false },
  { d: 'WED', cal: 2440, workout: true },
  { d: 'THU', cal: 2020, workout: false },
  { d: 'FRI', cal: 2390, workout: true },
  { d: 'SAT', cal: 2610, workout: false },
  { d: 'SUN', cal: 1890, workout: true },
];

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function loadWorkout() { return load('hf_workout', DEFAULT_WORKOUT); }
export function loadMeals() { return load('hf_meals', DEFAULT_MEALS); }
export function loadWater() { return load('hf_water', 5); }
export function loadFeel() {
  return load('hf_feel', { mood: 'ok', dig: { GAS: 'bad', NONE: 'good' }, oth: {}, energy: 6, sleepQ: 7, notes: '' });
}
export function loadUnit() { return load('hf_unit', 'lb'); }
export function loadTheme() { return load('hf_theme', 'dark'); }
