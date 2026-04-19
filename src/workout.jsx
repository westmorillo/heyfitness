import { useState, useEffect, useMemo } from 'react';
import { Stepper } from './primitives.jsx';
import { getLog, putLog } from './api.js';


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

function ExerciseCard({ ex, onToggleSet, onUpdateSet, onStartRest, unit }) {
  const [expanded, setExpanded] = useState(true);
  const completed = ex.sets.filter((s) => s.done).length;
  const volume = ex.sets.reduce((acc, s) => acc + (s.done ? s.weight * s.reps : 0), 0);

  return (
    <div className="exercise-card">
      <div className="exercise-head" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="exercise-name">{ex.name}</div>
          <div className="exercise-meta">
            <span>{completed}/{ex.targetSets} SETS</span>
            <span className="dot" />
            <span>{volume.toLocaleString()} {unit} VOL</span>
            <span className="dot" />
            <span className="pr">PR {ex.pr}{unit}</span>
          </div>
        </div>
        <div className="exercise-chev">{expanded ? '–' : '+'}</div>
      </div>
      {expanded && (
        <div className="sets-table">
          <div className="sets-header">
            <span>SET</span>
            <span>WEIGHT</span>
            <span>REPS</span>
            <span />
          </div>
          {ex.sets.map((s, i) => (
            <div key={i} className={`set-row ${s.done ? 'set-done' : ''}`}>
              <span className="set-num">{i + 1}</span>
              <Stepper value={s.weight} onChange={(v) => onUpdateSet(ex.id, i, 'weight', v)} step={5} />
              <Stepper value={s.reps} onChange={(v) => onUpdateSet(ex.id, i, 'reps', v)} step={1} />
              <button
                className={`set-check ${s.done ? 'set-check-done' : ''}`}
                onClick={() => {
                  onToggleSet(ex.id, i);
                  if (!s.done) onStartRest();
                }}
                aria-label="toggle set"
              >
                {s.done ? '✓' : ''}
              </button>
            </div>
          ))}
          <button className="add-set">+ ADD SET</button>
        </div>
      )}
    </div>
  );
}

export function WorkoutPanel({ unit = 'lb', date }) {
  const [workout, setWorkout] = useState(null);
  const [restRunning, setRestRunning] = useState(false);

  useEffect(() => {
    setWorkout(null);
    if (!date) return;
    getLog(date).then((log) => { if (log.workout) setWorkout(log.workout); }).catch(() => {});
  }, [date]);

  useEffect(() => {
    if (!workout || !date) return;
    const t = setTimeout(() => putLog(date, { workout }).catch(() => {}), 600);
    return () => clearTimeout(t);
  }, [workout, date]);

  const toggleSet = (exId, idx) => {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id !== exId ? e : {
          ...e,
          sets: e.sets.map((s, i) => i !== idx ? s : { ...s, done: !s.done }),
        }
      ),
    }));
  };

  const updateSet = (exId, idx, field, val) => {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id !== exId ? e : {
          ...e,
          sets: e.sets.map((s, i) => i !== idx ? s : { ...s, [field]: val }),
        }
      ),
    }));
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

  if (!workout) {
    return (
      <div className="panel workout-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">TRAINING</div>
            <div className="panel-title">NO SESSION YET</div>
          </div>
        </div>
        <div className="empty-state">No workout logged for today.</div>
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
            <div className="stat-num">{workout.duration}<span className="stat-unit">MIN</span></div>
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
            onStartRest={() => setRestRunning(true)}
          />
        ))}
      </div>

      <button className="btn-primary btn-wide">FINISH WORKOUT</button>
    </div>
  );
}
