import { useState, useEffect, useMemo } from 'react';
import { Stepper } from './primitives.jsx';
import { getLog, putLog } from './api.js';
import { loadRoutines, recordWorkoutDay } from './data.js';
import { useT } from './LangContext.jsx';
import { getExerciseAsset } from './exerciseAssets.js';

const EXERCISE_DB = [
  { id: 'x1',  name: 'Barbell Bench Press',     muscle: 'Chest' },
  { id: 'x2',  name: 'Incline Dumbbell Press',   muscle: 'Chest' },
  { id: 'x3',  name: 'Incline Barbell Press',    muscle: 'Chest' },
  { id: 'x4',  name: 'Cable Fly',                muscle: 'Chest' },
  { id: 'x5',  name: 'Push-Up',                  muscle: 'Chest' },
  { id: 'x6',  name: 'Dips',                     muscle: 'Chest' },
  { id: 'x7',  name: 'Barbell Squat',            muscle: 'Legs' },
  { id: 'x8',  name: 'Romanian Deadlift',        muscle: 'Legs' },
  { id: 'x9',  name: 'Leg Press',               muscle: 'Legs' },
  { id: 'x10', name: 'Leg Curl',                muscle: 'Legs' },
  { id: 'x11', name: 'Leg Extension',           muscle: 'Legs' },
  { id: 'x12', name: 'Calf Raise',              muscle: 'Legs' },
  { id: 'x13', name: 'Bulgarian Split Squat',   muscle: 'Legs' },
  { id: 'x14', name: 'Goblet Squat',            muscle: 'Legs' },
  { id: 'x15', name: 'Hip Thrust',              muscle: 'Legs' },
  { id: 'x16', name: 'Pull-Up',                 muscle: 'Back' },
  { id: 'x17', name: 'Barbell Row',             muscle: 'Back' },
  { id: 'x18', name: 'Lat Pulldown',            muscle: 'Back' },
  { id: 'x19', name: 'Seated Cable Row',        muscle: 'Back' },
  { id: 'x20', name: 'Deadlift',               muscle: 'Back' },
  { id: 'x21', name: 'Single Arm Row',          muscle: 'Back' },
  { id: 'x22', name: 'Overhead Press',          muscle: 'Shoulders' },
  { id: 'x23', name: 'Lateral Raise',           muscle: 'Shoulders' },
  { id: 'x24', name: 'Face Pull',               muscle: 'Shoulders' },
  { id: 'x25', name: 'Arnold Press',            muscle: 'Shoulders' },
  { id: 'x26', name: 'Rear Delt Fly',           muscle: 'Shoulders' },
  { id: 'x27', name: 'Barbell Curl',            muscle: 'Arms' },
  { id: 'x28', name: 'Dumbbell Curl',           muscle: 'Arms' },
  { id: 'x29', name: 'Hammer Curl',             muscle: 'Arms' },
  { id: 'x30', name: 'Concentration Curl',      muscle: 'Arms' },
  { id: 'x31', name: 'Tricep Pushdown',         muscle: 'Arms' },
  { id: 'x32', name: 'Skull Crusher',           muscle: 'Arms' },
  { id: 'x33', name: 'Overhead Tricep Ext.',    muscle: 'Arms' },
  { id: 'x34', name: 'Plank',                   muscle: 'Core' },
  { id: 'x35', name: 'Ab Crunch',               muscle: 'Core' },
  { id: 'x36', name: 'Russian Twist',           muscle: 'Core' },
  { id: 'x37', name: 'Hanging Leg Raise',       muscle: 'Core' },
  // --- Catálogo español ---
  { id: 'x38', name: 'Press de Banca Plano',          muscle: 'Chest',      equipment: 'Barra',      type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x39', name: 'Press de Banca Inclinado',      muscle: 'Chest',      equipment: 'Mancuernas', type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x40', name: 'Flexiones (Push-up)',            muscle: 'Chest',      equipment: 'Ninguno',    type: 'Calistenia',   level: 'Básico' },
  { id: 'x41', name: 'Aperturas con Mancuernas',      muscle: 'Chest',      equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x42', name: 'Fondos en Paralelas (Dips)',    muscle: 'Chest',      equipment: 'Barras',     type: 'Calistenia',   level: 'Intermedio' },
  { id: 'x43', name: 'Dominadas (Pull-up)',            muscle: 'Back',       equipment: 'Barra',      type: 'Calistenia',   level: 'Intermedio' },
  { id: 'x44', name: 'Remo con Barra',                muscle: 'Back',       equipment: 'Barra',      type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x45', name: 'Jalón al Pecho',                muscle: 'Back',       equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x46', name: 'Remo en Polea Baja',            muscle: 'Back',       equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x47', name: 'Peso Muerto Convencional',      muscle: 'Back',       equipment: 'Barra',      type: 'Fuerza',       level: 'Avanzado' },
  { id: 'x48', name: 'Press Militar (OHP)',            muscle: 'Shoulders',  equipment: 'Barra',      type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x49', name: 'Elevaciones Laterales',         muscle: 'Shoulders',  equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x50', name: 'Press Arnold',                  muscle: 'Shoulders',  equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x51', name: 'Elevaciones Frontales',         muscle: 'Shoulders',  equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x52', name: 'Face Pull',                     muscle: 'Shoulders',  equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x53', name: 'Curl con Barra',                muscle: 'Arms',       equipment: 'Barra',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x54', name: 'Curl Martillo',                 muscle: 'Arms',       equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x55', name: 'Curl en Polea',                 muscle: 'Arms',       equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x56', name: 'Curl Concentrado',              muscle: 'Arms',       equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x57', name: 'Curl en Banco Scott',           muscle: 'Arms',       equipment: 'Barra',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x58', name: 'Extensión de Tríceps (Polea)',  muscle: 'Arms',       equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x59', name: 'Press Francés',                 muscle: 'Arms',       equipment: 'Barra',      type: 'Hipertrofia',  level: 'Intermedio' },
  { id: 'x60', name: 'Patada de Tríceps',             muscle: 'Arms',       equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x61', name: 'Dips en Banco',                 muscle: 'Arms',       equipment: 'Banco',      type: 'Calistenia',   level: 'Básico' },
  { id: 'x62', name: 'Extensión sobre la Cabeza',     muscle: 'Arms',       equipment: 'Mancuernas', type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x63', name: 'Sentadilla con Barra',          muscle: 'Legs',       equipment: 'Barra',      type: 'Fuerza',       level: 'Avanzado' },
  { id: 'x64', name: 'Prensa de Piernas',             muscle: 'Legs',       equipment: 'Máquina',    type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x65', name: 'Extensión de Cuádriceps',       muscle: 'Legs',       equipment: 'Máquina',    type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x66', name: 'Sentadilla Búlgara',            muscle: 'Legs',       equipment: 'Mancuernas', type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x67', name: 'Zancadas (Lunges)',              muscle: 'Legs',       equipment: 'Mancuernas', type: 'Funcional',    level: 'Básico' },
  { id: 'x68', name: 'Curl Femoral Tumbado',          muscle: 'Legs',       equipment: 'Máquina',    type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x69', name: 'Peso Muerto Rumano',            muscle: 'Legs',       equipment: 'Barra',      type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x70', name: 'Hip Thrust',                    muscle: 'Legs',       equipment: 'Barra',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x71', name: 'Patada de Glúteo en Polea',     muscle: 'Legs',       equipment: 'Polea',      type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x72', name: 'Buenos Días (Good Morning)',    muscle: 'Legs',       equipment: 'Barra',      type: 'Fuerza',       level: 'Intermedio' },
  { id: 'x73', name: 'Elevación de Talones de Pie',   muscle: 'Legs',       equipment: 'Máquina',    type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x74', name: 'Elevación de Talones Sentado',  muscle: 'Legs',       equipment: 'Máquina',    type: 'Hipertrofia',  level: 'Básico' },
  { id: 'x75', name: 'Plancha (Plank)',               muscle: 'Core',       equipment: 'Ninguno',    type: 'Estabilidad',  level: 'Básico' },
  { id: 'x76', name: 'Crunch Abdominal',              muscle: 'Core',       equipment: 'Ninguno',    type: 'Calistenia',   level: 'Básico' },
  { id: 'x77', name: 'Elevación de Piernas Colgado',  muscle: 'Core',       equipment: 'Barra',      type: 'Calistenia',   level: 'Intermedio' },
  { id: 'x78', name: 'Rueda Abdominal (Ab Wheel)',    muscle: 'Core',       equipment: 'Rueda',      type: 'Estabilidad',  level: 'Avanzado' },
  { id: 'x79', name: 'Mountain Climbers',             muscle: 'Core',       equipment: 'Ninguno',    type: 'Cardio/Core',  level: 'Básico' },
  { id: 'x80', name: 'Russian Twist',                 muscle: 'Core',       equipment: 'Ninguno',    type: 'Calistenia',   level: 'Básico' },
  { id: 'x81', name: 'Burpees',                       muscle: 'Full Body',  equipment: 'Ninguno',    type: 'Cardio',       level: 'Intermedio' },
  { id: 'x82', name: 'Box Jump',                      muscle: 'Full Body',  equipment: 'Caja',       type: 'Pliométrico',  level: 'Intermedio' },
  { id: 'x83', name: 'Kettlebell Swing',              muscle: 'Full Body',  equipment: 'Kettlebell', type: 'Funcional',    level: 'Intermedio' },
  { id: 'x84', name: 'Battle Ropes',                  muscle: 'Full Body',  equipment: 'Cuerdas',    type: 'Cardio',       level: 'Básico' },
  { id: 'x85', name: 'Salto a la Comba',              muscle: 'Full Body',  equipment: 'Comba',      type: 'Cardio',       level: 'Básico' },
  { id: 'x86', name: "Farmer's Walk",                 muscle: 'Full Body',  equipment: 'Mancuernas', type: 'Funcional',    level: 'Básico' },
  { id: 'x87', name: 'Clean & Press',                 muscle: 'Full Body',  equipment: 'Barra',      type: 'Olímpico',     level: 'Avanzado' },
];

function RestTimer({ running, seconds, onComplete, onCancel }) {
  const [remaining, setRemaining] = useState(seconds);
  const t = useT();

  useEffect(() => { setRemaining(seconds); }, [seconds, running]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { onComplete?.(); return; }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, running, onComplete]);

  if (!running) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / seconds) * 100;

  return (
    <div className="rest-timer">
      <div className="rest-timer-bar" style={{ width: `${pct}%` }} />
      <div className="rest-timer-inner">
        <div>
          <div className="rest-label">{t('workout.rest.label')}</div>
          <div className="rest-time">{mm}:{ss}</div>
        </div>
        <div className="rest-actions">
          <button className="btn-ghost-sm" onClick={() => setRemaining((r) => r + 15)}>+15s</button>
          <button className="btn-ghost-sm" onClick={onCancel}>{t('workout.rest.skip')}</button>
        </div>
      </div>
    </div>
  );
}

function AddExerciseSheet({ onAdd, onClose }) {
  const [q, setQ] = useState('');
  const t = useT();

  const filtered = q.trim()
    ? EXERCISE_DB.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    : EXERCISE_DB;

  const grouped = {};
  filtered.forEach((e) => {
    if (!grouped[e.muscle]) grouped[e.muscle] = [];
    grouped[e.muscle].push(e);
  });

  return (
    <div className="add-ex-overlay" onClick={onClose}>
      <div className="add-ex-sheet" onClick={(ev) => ev.stopPropagation()}>
        <div className="add-ex-head">
          <div className="eyebrow">{t('workout.addEx.title')}</div>
          <button className="btn-ghost-sm" onClick={onClose}>✕</button>
        </div>
        <input
          className="add-ex-search"
          placeholder={t('workout.addEx.search')}
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          autoFocus
        />
        <div className="add-ex-list">
          {Object.entries(grouped).map(([muscle, exs]) => (
            <div key={muscle}>
              <div className="add-ex-muscle">{t(`muscle.${muscle}`)}</div>
              {exs.map((ex) => {
                const asset = getExerciseAsset(ex.name);
                const thumb = asset?.preview || asset?.guide;
                return (
                  <button key={ex.id} className="add-ex-item" onClick={() => onAdd(ex)}>
                    {thumb && (
                      <img
                        className="add-ex-thumb"
                        src={thumb}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <span>{ex.name}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, onToggleSet, onUpdateSet, onAddSet, onStartRest, unit }) {
  const [expanded, setExpanded] = useState(true);
  const t = useT();
  const asset = getExerciseAsset(ex.name);
  const completed = ex.sets.filter((s) => s.done).length;
  const volume = ex.sets.reduce((acc, s) => acc + (s.done ? s.weight * s.reps : 0), 0);
  const allDone = completed === ex.sets.length && ex.sets.length > 0;

  return (
    <div className={`exercise-card ${allDone ? 'exercise-card-done' : ''}`}>
      <div className="exercise-head" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="exercise-name">{ex.name}</div>
          <div className="exercise-meta">
            <span>{t('workout.setsCount', { done: completed, total: ex.sets.length })}</span>
            {volume > 0 && <><span className="dot" /><span>{t('workout.volText', { vol: volume.toLocaleString(), unit })}</span></>}
            {ex.pr && <><span className="dot" /><span className="pr">{t('workout.prText', { pr: ex.pr, unit })}</span></>}
          </div>
        </div>
        <div className="exercise-chev">{expanded ? '–' : '+'}</div>
      </div>

      {expanded && (
        <div className="sets-table">
          {asset?.guide && (
            <img
              className="exercise-guide"
              src={asset.guide}
              alt={`${ex.name} guide`}
              loading="lazy"
            />
          )}
          <div className="sets-header">
            <span>{t('workout.col.set')}</span>
            <span>{t('workout.col.weight', { unit })}</span>
            <span>{t('workout.col.reps')}</span>
            <span />
          </div>
          {ex.sets.map((s, i) => (
            <div key={i} className={`set-row ${s.done ? 'set-done' : ''}`}>
              <span className="set-num">{i + 1}</span>
              <Stepper value={s.weight} onChange={(v) => onUpdateSet(ex.id, i, 'weight', v)} step={2.5} />
              <Stepper value={s.reps} onChange={(v) => onUpdateSet(ex.id, i, 'reps', v)} step={1} />
              <button
                className={`set-check ${s.done ? 'set-check-done' : ''}`}
                onClick={() => { onToggleSet(ex.id, i); if (!s.done) onStartRest(); }}
                aria-label="toggle set"
              >
                {s.done ? '✓' : ''}
              </button>
            </div>
          ))}
          <button className="add-set" onClick={() => onAddSet(ex.id)}>{t('workout.addSet')}</button>
        </div>
      )}
    </div>
  );
}

function RoutinePicker({ onStart }) {
  const routines = loadRoutines();
  const t = useT();

  const startRoutine = (routine) => {
    const now = Date.now();
    onStart({
      name: `${routine.name} — ${routine.subtitle}`,
      routineId: routine.id,
      startedAt: now,
      exercises: routine.exercises.map((e, i) => ({
        id: `e${i}-${now}`,
        name: e.name,
        targetSets: e.sets.length,
        sets: e.sets.map((s) => ({ ...s, done: false })),
        pr: null,
      })),
    });
  };

  const startEmpty = () => {
    onStart({
      name: t('workout.emptyName'),
      routineId: null,
      startedAt: Date.now(),
      exercises: [],
    });
  };

  return (
    <div className="routine-picker">
      <div className="panel-head" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">{t('workout.eyebrow')}</div>
          <div className="panel-title">{t('workout.chooseRoutine')}</div>
        </div>
      </div>

      <div className="routine-grid">
        {routines.map((r) => (
          <div key={r.id} className="routine-card" onClick={() => startRoutine(r)}>
            <div className="routine-card-name">{r.name}</div>
            <div className="routine-card-sub">{r.subtitle}</div>
            <div className="routine-card-exes">
              {r.exercises.slice(0, 3).map((e, i) => (
                <div key={i} className="routine-card-ex">{e.name}</div>
              ))}
              {r.exercises.length > 3 && (
                <div className="routine-card-ex routine-card-more">
                  {t('workout.moreExes', { n: r.exercises.length - 3 })}
                </div>
              )}
            </div>
            <div className="routine-card-meta">
              {t('workout.routineMeta', {
                exes: r.exercises.length,
                sets: r.exercises.reduce((a, e) => a + e.sets.length, 0),
              })}
            </div>
          </div>
        ))}
      </div>

      <button className="add-exercise-btn" onClick={startEmpty}>
        {t('workout.startEmpty')}
      </button>
    </div>
  );
}

function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0
  );

  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(
      () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WorkoutPanel({ unit = 'kg', date }) {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [restRunning, setRestRunning] = useState(false);
  const [showAddEx, setShowAddEx] = useState(false);
  const elapsed = useElapsed(workout?.startedAt);
  const t = useT();

  useEffect(() => {
    setWorkout(null);
    setLoading(true);
    setFinished(false);
    if (!date) { setLoading(false); return; }
    getLog(date)
      .then((log) => {
        if (log.workout) {
          setWorkout(log.workout);
          if (log.workout.finishedAt) setFinished(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    if (!workout || !date) return;
    const timer = setTimeout(() => putLog(date, { workout }).catch(() => {}), 600);
    return () => clearTimeout(timer);
  }, [workout, date]);

  const toggleSet = (exId, idx) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id !== exId ? e : {
          ...e,
          sets: e.sets.map((s, i) => i !== idx ? s : { ...s, done: !s.done }),
        }
      ),
    }));

  const updateSet = (exId, idx, field, val) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id !== exId ? e : {
          ...e,
          sets: e.sets.map((s, i) => i !== idx ? s : { ...s, [field]: val }),
        }
      ),
    }));

  const addSet = (exId) =>
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) => {
        if (e.id !== exId) return e;
        const last = e.sets[e.sets.length - 1] || { weight: 0, reps: 10 };
        return { ...e, sets: [...e.sets, { weight: last.weight, reps: last.reps, done: false }] };
      }),
    }));

  const addExercise = (ex) => {
    const now = Date.now();
    setWorkout((w) => ({
      ...w,
      exercises: [...w.exercises, {
        id: `e${now}`,
        name: ex.name,
        targetSets: 3,
        sets: [
          { weight: 0, reps: 10, done: false },
          { weight: 0, reps: 10, done: false },
          { weight: 0, reps: 10, done: false },
        ],
        pr: null,
      }],
    }));
    setShowAddEx(false);
  };

  const finishWorkout = () => {
    const durationMin = workout.startedAt
      ? Math.max(1, Math.round((Date.now() - workout.startedAt) / 60000))
      : 0;
    setWorkout((w) => ({ ...w, finishedAt: Date.now(), duration: durationMin }));
    recordWorkoutDay(date);
    setFinished(true);
  };

  const totals = useMemo(() => {
    if (!workout) return { sets: 0, done: 0, vol: 0 };
    let sets = 0, done = 0, vol = 0;
    workout.exercises.forEach((e) => {
      sets += e.sets.length;
      e.sets.forEach((s) => { if (s.done) { done++; vol += s.weight * s.reps; } });
    });
    return { sets, done, vol };
  }, [workout]);

  if (loading) {
    return (
      <div className="panel workout-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">{t('workout.eyebrow')}</div>
            <div className="panel-title">{t('workout.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="panel workout-panel">
        <RoutinePicker onStart={(w) => setWorkout(w)} />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="panel workout-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">{t('workout.completed')}</div>
            <div className="panel-title">{workout.name}</div>
          </div>
        </div>
        <div className="workout-summary">
          <div className="workout-summary-stats">
            <div className="stat">
              <div className="stat-num">{workout.duration ?? 0}<span className="stat-unit">MIN</span></div>
              <div className="stat-label">{t('workout.duration')}</div>
            </div>
            <div className="stat">
              <div className="stat-num">{totals.done}<span className="stat-unit">/{totals.sets}</span></div>
              <div className="stat-label">{t('workout.setsDone')}</div>
            </div>
            <div className="stat">
              <div className="stat-num">{totals.vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
              <div className="stat-label">{t('workout.volume')}</div>
            </div>
          </div>
          <div className="workout-summary-exes">
            {workout.exercises.map((e) => (
              <div key={e.id} className="workout-summary-ex">
                <div className="exercise-name" style={{ fontSize: 13 }}>{e.name}</div>
                <div className="exercise-meta">
                  {e.sets.filter((s) => s.done).length}/{e.sets.length} sets
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary btn-wide" onClick={() => setFinished(false)}>
            {t('workout.editWorkout')}
          </button>
          <button
            className="add-exercise-btn"
            style={{ marginTop: 10 }}
            onClick={() => { setWorkout(null); setFinished(false); }}
          >
            {t('workout.startNew')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel workout-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">{t('workout.activeSession')}</div>
          <div className="panel-title">{workout.name}</div>
        </div>
        <div className="panel-stats">
          <div className="stat">
            <div className="stat-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>{elapsed}</div>
            <div className="stat-label">{t('workout.elapsed')}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{totals.done}<span className="stat-unit">/{totals.sets}</span></div>
            <div className="stat-label">{t('workout.sets')}</div>
          </div>
          <div className="stat">
            <div className="stat-num">{totals.vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
            <div className="stat-label">{t('workout.volume')}</div>
          </div>
        </div>
      </div>

      <RestTimer
        running={restRunning}
        seconds={90}
        onComplete={() => setRestRunning(false)}
        onCancel={() => setRestRunning(false)}
      />

      <div className="exercise-list">
        {workout.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            unit={unit}
            onToggleSet={toggleSet}
            onUpdateSet={updateSet}
            onAddSet={addSet}
            onStartRest={() => setRestRunning(true)}
          />
        ))}
      </div>

      {workout.exercises.length === 0 && (
        <div className="empty-state">{t('workout.noExercises')}</div>
      )}

      <button className="add-exercise-btn" onClick={() => setShowAddEx(true)}>
        {t('workout.addExercise')}
      </button>
      <button className="btn-primary btn-wide" onClick={finishWorkout}>
        {t('workout.finishWorkout')}
      </button>

      {showAddEx && <AddExerciseSheet onAdd={addExercise} onClose={() => setShowAddEx(false)} />}
    </div>
  );
}
