export const EXERCISE_ASSETS = {
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
