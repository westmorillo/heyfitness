import { useState, useEffect, useMemo } from 'react';
import { Stepper } from './primitives.jsx';
import { getLog, putLog } from './api.js';
import { loadRoutines } from './data.js';

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
  { id: 'x30', name: 'Tricep Pushdown',         muscle: 'Arms' },
  { id: 'x31', name: 'Skull Crusher',           muscle: 'Arms' },
  { id: 'x32', name: 'Overhead Tricep Ext.',    muscle: 'Arms' },
  { id: 'x33', name: 'Plank',                   muscle: 'Core' },
  { id: 'x34', name: 'Ab Crunch',               muscle: 'Core' },
  { id: 'x35', name: 'Russian Twist',           muscle: 'Core' },
  { id: 'x36', name: 'Hanging Leg Raise',       muscle: 'Core' },
];

function RestTimer({ running, seconds, onComplete, onCancel }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => { setRemaining(seconds); }, [seconds, running]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { onComplete?.(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
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
          <div className="rest-label">RESTING</div>
          <div className="rest-time">{mm}:{ss}</div>
        </div>
        <div className="rest-actions">
          <button className="btn-ghost-sm" onClick={() => setRemaining((r) => r + 15)}>+15s</button>
          <button className="btn-ghost-sm" onClick={onCancel}>SKIP</button>
        </div>
      </div>
    </div>
  );
}

function AddExerciseSheet({ onAdd, onClose }) {
  const [q, setQ] = useState('');

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
          <div className="eyebrow">ADD EXERCISE</div>
          <button className="btn-ghost-sm" onClick={onClose}>✕</button>
        </div>
        <input
          className="add-ex-search"
          placeholder="SEARCH..."
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          autoFocus
        />
        <div className="add-ex-list">
          {Object.entries(grouped).map(([muscle, exs]) => (
            <div key={muscle}>
              <div className="add-ex-muscle">{muscle.toUpperCase()}</div>
              {exs.map((ex) => (
                <button key={ex.id} className="add-ex-item" onClick={() => onAdd(ex)}>
                  {ex.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, onToggleSet, onUpdateSet, onAddSet, onStartRest, unit }) {
  const [expanded, setExpanded] = useState(true);
  const completed = ex.sets.filter((s) => s.done).length;
  const volume = ex.sets.reduce((acc, s) => acc + (s.done ? s.weight * s.reps : 0), 0);
  const allDone = completed === ex.sets.length && ex.sets.length > 0;

  return (
    <div className={`exercise-card ${allDone ? 'exercise-card-done' : ''}`}>
      <div className="exercise-head" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="exercise-name">{ex.name}</div>
          <div className="exercise-meta">
            <span>{completed}/{ex.sets.length} SETS</span>
            {volume > 0 && <><span className="dot" /><span>{volume.toLocaleString()} {unit} VOL</span></>}
            {ex.pr && <><span className="dot" /><span className="pr">PR {ex.pr}{unit}</span></>}
          </div>
        </div>
        <div className="exercise-chev">{expanded ? '–' : '+'}</div>
      </div>

      {expanded && (
        <div className="sets-table">
          <div className="sets-header">
            <span>SET</span>
            <span>WEIGHT ({unit})</span>
            <span>REPS</span>
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
          <button className="add-set" onClick={() => onAddSet(ex.id)}>+ ADD SET</button>
        </div>
      )}
    </div>
  );
}

function RoutinePicker({ onStart }) {
  const routines = loadRoutines();

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
      name: 'EMPTY WORKOUT',
      routineId: null,
      startedAt: Date.now(),
      exercises: [],
    });
  };

  return (
    <div className="routine-picker">
      <div className="panel-head" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">TRAINING</div>
          <div className="panel-title">CHOOSE ROUTINE</div>
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
                <div className="routine-card-ex routine-card-more">+{r.exercises.length - 3} more</div>
              )}
            </div>
            <div className="routine-card-meta">
              {r.exercises.length} exercises · {r.exercises.reduce((a, e) => a + e.sets.length, 0)} sets
            </div>
          </div>
        ))}
      </div>

      <button className="add-exercise-btn" onClick={startEmpty}>
        + START EMPTY WORKOUT
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
    const t = setInterval(
      () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))),
      1000,
    );
    return () => clearInterval(t);
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
    const t = setTimeout(() => putLog(date, { workout }).catch(() => {}), 600);
    return () => clearTimeout(t);
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
          <div><div className="eyebrow">TRAINING</div><div className="panel-title">LOADING...</div></div>
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
            <div className="eyebrow">COMPLETED</div>
            <div className="panel-title">{workout.name}</div>
          </div>
        </div>
        <div className="workout-summary">
          <div className="workout-summary-stats">
            <div className="stat">
              <div className="stat-num">{workout.duration ?? 0}<span className="stat-unit">MIN</span></div>
              <div className="stat-label">DURATION</div>
            </div>
            <div className="stat">
              <div className="stat-num">{totals.done}<span className="stat-unit">/{totals.sets}</span></div>
              <div className="stat-label">SETS DONE</div>
            </div>
            <div className="stat">
              <div className="stat-num">{totals.vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
              <div className="stat-label">VOLUME</div>
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
          <button
            className="add-exercise-btn"
            style={{ marginTop: 16 }}
            onClick={() => { setWorkout(null); setFinished(false); }}
          >
            + START NEW WORKOUT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel workout-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">ACTIVE SESSION</div>
          <div className="panel-title">{workout.name}</div>
        </div>
        <div className="panel-stats">
          <div className="stat">
            <div className="stat-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>{elapsed}</div>
            <div className="stat-label">ELAPSED</div>
          </div>
          <div className="stat">
            <div className="stat-num">{totals.done}<span className="stat-unit">/{totals.sets}</span></div>
            <div className="stat-label">SETS</div>
          </div>
          <div className="stat">
            <div className="stat-num">{totals.vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
            <div className="stat-label">VOLUME</div>
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
        <div className="empty-state">No exercises yet. Add one below.</div>
      )}

      <button className="add-exercise-btn" onClick={() => setShowAddEx(true)}>+ ADD EXERCISE</button>
      <button className="btn-primary btn-wide" onClick={finishWorkout}>FINISH WORKOUT</button>

      {showAddEx && <AddExerciseSheet onAdd={addExercise} onClose={() => setShowAddEx(false)} />}
    </div>
  );
}
