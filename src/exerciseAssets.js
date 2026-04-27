const EXERCISE_ASSET_GROUPS = [
  {
    slug: 'bench-press',
    aliases: ['Barbell Bench Press', 'Press de Banca Plano', 'Press de Banca'],
  },
  {
    slug: 'incline-bench-press',
    aliases: ['Incline Barbell Press', 'Press de Banca Inclinado'],
  },
  {
    slug: 'dumbbell-bench-press',
    aliases: ['Incline Dumbbell Press', 'Dumbbell Bench Press', 'Press de Banca con Mancuernas'],
  },
  {
    slug: 'push-up',
    aliases: ['Push-Up', 'Flexiones (Push-up)', 'Flexiones', 'Push-ups'],
  },
  {
    slug: 'dumbbell-fly',
    aliases: ['Cable Fly', 'Dumbbell Fly', 'Aperturas con Mancuernas'],
  },
  {
    slug: 'machine-chest-fly',
    aliases: ['Machine Chest Fly', 'Aperturas en Máquina', 'Aperturas en Maquina'],
  },
  {
    slug: 'pull-up',
    aliases: ['Pull-Up', 'Dominadas (Pull-up)', 'Dominadas'],
  },
  {
    slug: 'lat-pulldown',
    aliases: ['Lat Pulldown', 'Jalón al Pecho', 'Jalon al Pecho'],
  },
  {
    slug: 'barbell-row',
    aliases: ['Barbell Row', 'Remo con Barra'],
  },
  {
    slug: 'deadlift',
    aliases: ['Deadlift', 'Peso Muerto Convencional', 'Peso Muerto'],
  },
  {
    slug: 'dumbbell-row',
    aliases: ['Single Arm Row', 'Dumbbell Row', 'Remo con Mancuerna'],
  },
  {
    slug: 'machine-row',
    aliases: ['Seated Cable Row', 'Machine Row', 'Remo en Máquina', 'Remo en Maquina', 'Remo en Polea Baja'],
    preview: true,
  },
  {
    slug: 'hyperextensions',
    aliases: ['Hyperextensions', 'Hiperextensiones', 'Back Extensions'],
    preview: true,
  },
  {
    slug: 'squat',
    aliases: ['Barbell Squat', 'Sentadilla con Barra', 'Sentadilla'],
    preview: true,
  },
  {
    slug: 'front-squat',
    aliases: ['Front Squat', 'Sentadilla Frontal'],
    preview: true,
  },
  {
    slug: 'dumbbell-squat',
    aliases: ['Goblet Squat', 'Dumbbell Squat', 'Sentadilla con Mancuernas'],
    preview: true,
  },
  {
    slug: 'overhead-press',
    aliases: ['Overhead Press', 'Press Militar (OHP)', 'Press Militar'],
  },
  {
    slug: 'hammer-curl-dumbbell',
    aliases: ['Hammer Curl', 'Curl Martillo'],
  },
  {
    slug: 'dumbbell-curl',
    aliases: ['Dumbbell Curl', 'Curl con Mancuernas'],
    guide: null,
  },
  {
    slug: 'concentration-curl-dumbbell',
    aliases: ['Concentration Curl', 'Curl Concentrado', 'Curl de Concentración', 'Curl de Concentracion'],
  },
];

function assetPathFor(slug, filename, value) {
  if (value === null) return null;
  if (value === undefined || value === true) return `/exercises/${slug}/${filename}`;
  return value;
}

function normalizeExerciseName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[().]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export const EXERCISE_ASSETS = Object.fromEntries(
  EXERCISE_ASSET_GROUPS.flatMap(({ slug, aliases, guide, preview }) =>
    aliases.map((name) => [
      name,
      {
        slug,
        guide: assetPathFor(slug, 'guide.png', guide),
        preview: preview === undefined ? null : assetPathFor(slug, 'preview.png', preview),
      },
    ])
  )
);

const EXERCISE_ASSETS_BY_NORMALIZED_NAME = Object.fromEntries(
  Object.entries(EXERCISE_ASSETS).map(([name, asset]) => [normalizeExerciseName(name), asset])
);

export function getExerciseAsset(name) {
  return EXERCISE_ASSETS[name] ?? EXERCISE_ASSETS_BY_NORMALIZED_NAME[normalizeExerciseName(name)] ?? null;
}
