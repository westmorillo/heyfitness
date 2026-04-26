export const EXERCISE_ASSETS = {
  'Barbell Bench Press': {
    slug: 'bench-press',
    guide: '/exercises/bench-press/guide.png',
  },
  'Press de Banca Plano': {
    slug: 'bench-press',
    guide: '/exercises/bench-press/guide.png',
  },
  'Incline Barbell Press': {
    slug: 'incline-bench-press',
    guide: '/exercises/incline-bench-press/guide.png',
  },
  'Press de Banca Inclinado': {
    slug: 'incline-bench-press',
    guide: '/exercises/incline-bench-press/guide.png',
  },
  'Dumbbell Bench Press': {
    slug: 'dumbbell-bench-press',
    guide: '/exercises/dumbbell-bench-press/guide.png',
  },
  'Press de Banca con Mancuernas': {
    slug: 'dumbbell-bench-press',
    guide: '/exercises/dumbbell-bench-press/guide.png',
  },
  'Push-Up': {
    slug: 'push-up',
    guide: '/exercises/push-up/guide.png',
  },
  'Flexiones (Push-up)': {
    slug: 'push-up',
    guide: '/exercises/push-up/guide.png',
  },
  'Cable Fly': {
    slug: 'dumbbell-fly',
    guide: '/exercises/dumbbell-fly/guide.png',
  },
  'Aperturas con Mancuernas': {
    slug: 'dumbbell-fly',
    guide: '/exercises/dumbbell-fly/guide.png',
  },
  'Machine Chest Fly': {
    slug: 'machine-chest-fly',
    guide: '/exercises/machine-chest-fly/guide.png',
  },
  'Aperturas en Máquina': {
    slug: 'machine-chest-fly',
    guide: '/exercises/machine-chest-fly/guide.png',
  },
  'Hammer Curl': {
    slug: 'hammer-curl-dumbbell',
    guide: '/exercises/hammer-curl-dumbbell/guide.png',
  },
  'Dumbbell Curl': {
    slug: 'dumbbell-curl',
    guide: null,
  },
  'Concentration Curl': {
    slug: 'concentration-curl-dumbbell',
    guide: '/exercises/concentration-curl-dumbbell/guide.png',
  },
};

export function getExerciseAsset(name) {
  return EXERCISE_ASSETS[name] ?? null;
}
