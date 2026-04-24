import { useState, useEffect, useMemo } from 'react';
import { Ring, Bar } from './primitives.jsx';
import { EMPTY_MEALS, GOALS } from './data.js';
import { getLog } from './api.js';
import { useT } from './LangContext.jsx';


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

export function OverviewSummary({ unit = 'lb', date }) {
  const [workout, setWorkout] = useState(null);
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const t = useT();

  useEffect(() => {
    setWorkout(null);
    setMeals(EMPTY_MEALS);
    if (!date) return;
    getLog(date).then((log) => {
      if (log.workout) setWorkout(log.workout);
      if (log.meals?.length) setMeals(log.meals);
    }).catch(() => {});
  }, [date]);

  const done  = workout ? workout.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) : 0;
  const total = workout ? workout.exercises.reduce((a, e) => a + e.sets.length, 0) : 0;
  const vol   = workout ? workout.exercises.reduce(
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
            <div className="eyebrow">{t('overview.sessionEyebrow')}</div>
            <div className="panel-title">{workout ? workout.name : t('overview.noSession')}</div>
          </div>
          {workout && (
            <div className="panel-stats">
              <div className="stat">
                <div className="stat-num">{workout.duration}<span className="stat-unit">MIN</span></div>
                <div className="stat-label">{t('overview.elapsed')}</div>
              </div>
              <div className="stat">
                <div className="stat-num">{done}<span className="stat-unit">/{total}</span></div>
                <div className="stat-label">{t('overview.sets')}</div>
              </div>
              <div className="stat">
                <div className="stat-num">{vol.toLocaleString()}<span className="stat-unit">{unit.toUpperCase()}</span></div>
                <div className="stat-label">{t('overview.volume')}</div>
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
                    <div className="overview-row-meta">{d}/{e.targetSets} {t('overview.sets')} · PR {e.pr}{unit}</div>
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
          <div className="empty-state">{t('overview.noWorkout')}</div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">{t('overview.nutritionEyebrow')}</div>
            <div className="panel-title">{t('overview.nutritionTitle')}</div>
          </div>
          <div className="calorie-summary">
            <Ring value={cal} max={GOALS.calories} size={120} stroke={10}>
              <div className="ring-num">{Math.round(cal)}</div>
              <div className="ring-label">/ {GOALS.calories} KCAL</div>
            </Ring>
          </div>
        </div>
        <div className="macro-grid">
          <MacroBar label={t('nutrition.protein')} value={p} goal={GOALS.protein} color="var(--accent)" />
          <MacroBar label={t('nutrition.carbs')}   value={c} goal={GOALS.carbs}   color="#E8E4DC" />
          <MacroBar label={t('nutrition.fat')}     value={f} goal={GOALS.fat}     color="#8A8A8A" />
        </div>
        <div className="overview-list">
          {meals.map((m) => {
            const mc = m.items.reduce((a, it) => a + it.cal * it.portion, 0);
            const count = m.items.length;
            const mealName = t(`meal.${m.name}`) === `meal.${m.name}` ? m.name : t(`meal.${m.name}`);
            return (
              <div key={m.id} className="overview-row">
                <div>
                  <div className="overview-row-name">
                    {mealName} <span className="overview-row-time">· {m.time}</span>
                  </div>
                  <div className="overview-row-meta">
                    {count > 0
                      ? `${count} ${count === 1 ? t('overview.item') : t('overview.items')}`
                      : t('overview.notLogged')}
                  </div>
                </div>
                <div className="overview-kcal">
                  {count > 0 ? (
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
