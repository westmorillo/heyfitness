import { useState, useEffect, useMemo } from 'react';
import { Ring, Bar } from './primitives.jsx';
import { EMPTY_MEALS, GOALS } from './data.js';
import { getLog } from './api.js';

const TODAY = new Date().toISOString().slice(0, 10);

function MacroBar({ label, value, goal, color }) {
  return (
    <div className="macro-row">
      <div className="macro-row-top">
        <span className="macro-label">{label}</span>
        <span className="macro-val"><strong>{Math.round(value)}</strong>/{goal}g</span>
      </div>
      <Bar value={value} max={goal} color={color} />
    </div>
  );
}

export function OverviewSummary({ unit = 'lb' }) {
  const [workout, setWorkout] = useState(null);
  const [meals, setMeals] = useState(EMPTY_MEALS);

  useEffect(() => {
    getLog(TODAY).then((log) => {
      if (log.workout) setWorkout(log.workout);
      if (log.meals?.length) setMeals(log.meals);
    }).catch(() => {});
  }, []);

  const done = workout ? workout.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) : 0;
  const total = workout ? workout.exercises.reduce((a, e) => a + e.sets.length, 0) : 0;
  const vol = workout ? workout.exercises.reduce(
    (a, e) => a + e.sets.reduce((b, s) => b + (s.done ? s.weight * s.reps : 0), 0),
    0
  ) : 0;

  const { cal, p, c, f } = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    meals.forEach((m) => m.items.forEach((it) => {
      cal += it.cal * it.portion;
      p += it.p * it.portion;
      c += it.c * it.portion;
      f += it.f * it.portion;
    }));
    return { cal, p, c, f };
  }, [meals]);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">SESSION SUMMARY</div>
            <div className="panel-title">{workout ? workout.name : 'NO SESSION YET'}</div>
          </div>
          {workout && (
            <div className="panel-stats">
              <div className="stat">
                <div className="stat-num">{workout.duration}<span className="stat-unit">MIN</span></div>
                <div className="stat-label">ELAPSED</div>
              </div>
              <div className="stat">
                <div className="stat-num">{done}<span className="stat-unit">/{total}</span></div>
                <div className="stat-label">SETS</div>
              </div>
              <div className="stat">
                <div className="stat-num">{vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
                <div className="stat-label">VOLUME</div>
              </div>
            </div>
          )}
        </div>
        {workout ? (
          <div className="overview-list">
            {workout.exercises.map((e) => {
              const d = e.sets.filter((s) => s.done).length;
              return (
                <div key={e.id} className="overview-row">
                  <div>
                    <div className="overview-row-name">{e.name}</div>
                    <div className="overview-row-meta">{d}/{e.targetSets} SETS · PR {e.pr}{unit}</div>
                  </div>
                  <div className="overview-progress">
                    <div className="overview-progress-bar">
                      <div className="overview-progress-fill" style={{ width: `${(d / e.targetSets) * 100}%` }} />
                    </div>
                    <span>{Math.round((d / e.targetSets) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No workout logged for today.</div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">NUTRITION SUMMARY</div>
            <div className="panel-title">TODAY'S FUEL</div>
          </div>
          <div className="calorie-summary">
            <Ring value={cal} max={GOALS.calories} size={120} stroke={10}>
              <div className="ring-num">{Math.round(cal)}</div>
              <div className="ring-label">/ {GOALS.calories} KCAL</div>
            </Ring>
          </div>
        </div>
        <div className="macro-grid">
          <MacroBar label="PROTEIN" value={p} goal={GOALS.protein} color="var(--accent)" />
          <MacroBar label="CARBS" value={c} goal={GOALS.carbs} color="#E8E4DC" />
          <MacroBar label="FAT" value={f} goal={GOALS.fat} color="#8A8A8A" />
        </div>
        <div className="overview-list">
          {meals.map((m) => {
            const mc = m.items.reduce((a, it) => a + it.cal * it.portion, 0);
            return (
              <div key={m.id} className="overview-row">
                <div>
                  <div className="overview-row-name">
                    {m.name} <span className="overview-row-time">· {m.time}</span>
                  </div>
                  <div className="overview-row-meta">
                    {m.items.length > 0 ? `${m.items.length} item${m.items.length > 1 ? 's' : ''}` : 'Not logged'}
                  </div>
                </div>
                <div className="overview-kcal">
                  {m.items.length > 0 ? (
                    <><strong>{Math.round(mc)}</strong><span>KCAL</span></>
                  ) : (
                    <span className="empty-text">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
