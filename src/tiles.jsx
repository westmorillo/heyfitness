import { useState, useEffect } from 'react';
import { Ring, Bar } from './primitives.jsx';
import { DAYS, SLEEP_DATA, WEEK_ACTIVITY, GOALS, loadStreak } from './data.js';
import { getLog, putLog } from './api.js';
import { useT } from './LangContext.jsx';

const TODAY = DAYS.find((d) => d.isToday)?.iso || new Date().toISOString().slice(0, 10);

export function DayStrip({ activeIso, onSelect }) {
  return (
    <div className="day-strip">
      {DAYS.map((d) => (
        <button
          key={d.iso}
          className={`day-btn ${d.iso === activeIso ? 'day-active' : ''} ${d.isToday ? 'day-today' : ''}`}
          onClick={() => onSelect(d.iso)}
        >
          <span className="day-wk">{d.weekday}</span>
          <span className="day-num">{d.day}</span>
          {d.isToday && <span className="day-dot" />}
        </button>
      ))}
    </div>
  );
}

const EMPTY_ACTIVITY = { kcal: 0, activeMin: 0, steps: 0, zone2Min: 0 };

export function HeroTile({ activeDay }) {
  const t = useT();
  const [activity, setActivity] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  const today = DAYS.find((d) => d.isToday);
  const label = activeDay === today?.iso
    ? `${today.month} ${today.day} · ${today.weekday}`
    : DAYS.find((d) => d.iso === activeDay)
      ? `${DAYS.find(d => d.iso === activeDay).month} ${DAYS.find(d => d.iso === activeDay).day} · ${DAYS.find(d => d.iso === activeDay).weekday}`
      : 'TODAY';

  useEffect(() => {
    setActivity(null);
    if (!activeDay) return;
    getLog(activeDay).then((log) => { if (log.activity) setActivity(log.activity); }).catch(() => {});
  }, [activeDay]);

  const startEdit = () => {
    setDraft({ ...(activity || EMPTY_ACTIVITY) });
    setEditing(true);
  };

  const save = () => {
    const saved = { ...draft, kcal: +draft.kcal || 0, activeMin: +draft.activeMin || 0, steps: +draft.steps || 0, zone2Min: +draft.zone2Min || 0 };
    setActivity(saved);
    putLog(activeDay, { activity: saved }).catch(() => {});
    setEditing(false);
  };

  const a = activity || EMPTY_ACTIVITY;
  const fmt = (n) => n ? n.toLocaleString() : '—';

  const stats = [
    { labelKey: 'tile.hero.kcal',      val: activity ? a.kcal.toLocaleString()  : '—' },
    { labelKey: 'tile.hero.activeMin', val: activity ? a.activeMin              : '—' },
    { labelKey: 'tile.hero.steps',     val: activity ? a.steps.toLocaleString() : '—' },
    { labelKey: 'tile.hero.zone2',     val: activity ? `${a.zone2Min} MIN`       : '—' },
  ];

  return (
    <div className="hero-tile">
      <div className="hero-meta">
        <div className="eyebrow">{label}</div>
        <div className="hero-title">{t('tile.hero.title')}</div>
        <div className="hero-sub">{t('tile.hero.sub')}</div>
      </div>

      {!editing ? (
        <div className="hero-stats-wrap">
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.labelKey} className="hero-stat">
                <div className="hero-stat-num">{s.val}</div>
                <div className="hero-stat-label">{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
          <button className="sleep-edit-btn" onClick={startEdit} aria-label="edit activity" style={{ alignSelf: 'flex-start' }}>✎</button>
        </div>
      ) : (
        <div className="hero-edit">
          {[
            { key: 'steps',     labelKey: 'tile.hero.steps',     placeholder: '0' },
            { key: 'kcal',      labelKey: 'tile.hero.kcal',      placeholder: '0' },
            { key: 'activeMin', labelKey: 'tile.hero.activeMin', placeholder: '0' },
            { key: 'zone2Min',  labelKey: 'tile.hero.zone2',     placeholder: '0' },
          ].map(({ key, labelKey, placeholder }) => (
            <div key={key} className="hero-edit-field">
              <label className="sleep-edit-label">{t(labelKey)}</label>
              <input
                className="hero-edit-input"
                type="number"
                inputMode="numeric"
                placeholder={placeholder}
                value={draft[key] || ''}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="hero-edit-actions">
            <button className="btn-ghost-sm" onClick={() => setEditing(false)}>{t('tile.sleep.cancel')}</button>
            <button className="btn-primary" style={{ padding: '8px 20px' }} onClick={save}>{t('tile.sleep.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

const STAGE_META = [
  { k: 'deep',  labelKey: 'tile.sleep.deep',  color: 'var(--accent)' },
  { k: 'rem',   labelKey: 'tile.sleep.rem',   color: '#E8E4DC' },
  { k: 'light', labelKey: 'tile.sleep.light', color: '#8A8A8A' },
  { k: 'awake', labelKey: 'tile.sleep.awake', color: '#3A3A3E' },
];

function calcTotal(bedtime, wake) {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round(mins / 6) / 10;
}

const EMPTY_SLEEP = { bedtime: '23:00', wake: '07:00', total: 8, stages: { deep: 0, rem: 0, light: 0, awake: 0 } };

export function SleepTile({ date }) {
  const t = useT();
  const [sleep, setSleep] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setSleep(null);
    if (!date) return;
    getLog(date).then((log) => { if (log.sleep) setSleep(log.sleep); }).catch(() => {});
  }, [date]);

  const startEdit = () => {
    setDraft(sleep ? { ...sleep, stages: { ...sleep.stages } } : { ...EMPTY_SLEEP, stages: { ...EMPTY_SLEEP.stages } });
    setEditing(true);
  };

  const updateTime = (field, val) => {
    setDraft((d) => {
      const next = { ...d, [field]: val };
      next.total = calcTotal(next.bedtime, next.wake);
      return next;
    });
  };

  const updateStage = (k, val) => {
    setDraft((d) => ({ ...d, stages: { ...d.stages, [k]: Math.max(0, val) } }));
  };

  const save = () => {
    const saved = { ...draft, total: calcTotal(draft.bedtime, draft.wake) };
    setSleep(saved);
    putLog(date, { sleep: saved }).catch(() => {});
    setEditing(false);
  };

  const stagesTotal = draft ? Object.values(draft.stages).reduce((a, b) => a + b, 0) : 0;
  const displayData = sleep || SLEEP_DATA;
  const barTotal = Object.values(displayData.stages).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="tile sleep-tile">
      <div className="tile-head">
        <div>
          <div className="eyebrow">{t('tile.sleep.eyebrow')}</div>
          <div className="tile-title">{t('tile.sleep.title')}</div>
        </div>
        {!editing && (
          <button className="sleep-edit-btn" onClick={startEdit} aria-label="edit sleep">
            ✎
          </button>
        )}
      </div>

      {!editing ? (
        <>
          {sleep ? (
            <>
              <div className="sleep-num-row">
                <div className="sleep-num">{sleep.total}<span className="sleep-unit">h</span></div>
                <div className="sleep-times">
                  <div><em>{sleep.bedtime}</em> → <em>{sleep.wake}</em></div>
                </div>
              </div>
              <div className="sleep-bar">
                {STAGE_META.map((s) => (
                  <div key={s.k} className="sleep-seg"
                    style={{ width: `${(displayData.stages[s.k] / barTotal) * 100}%`, background: s.color }}
                    title={`${t(s.labelKey)}: ${displayData.stages[s.k]}h`}
                  />
                ))}
              </div>
              <div className="sleep-legend">
                {STAGE_META.map((s) => (
                  <div key={s.k} className="sleep-leg-item">
                    <span className="sleep-leg-dot" style={{ background: s.color }} />
                    <span className="sleep-leg-label">{t(s.labelKey)}</span>
                    <span className="sleep-leg-val">{sleep.stages[s.k]}h</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <button className="sleep-empty" onClick={startEdit}>
              <span className="sleep-empty-ico">🌙</span>
              <span>{t('tile.sleep.noData')}</span>
            </button>
          )}
        </>
      ) : (
        <div className="sleep-edit">
          <div className="sleep-edit-times">
            <div className="sleep-edit-field">
              <label className="sleep-edit-label">{t('tile.sleep.bedtime')}</label>
              <input className="sleep-time-input" type="time" value={draft.bedtime}
                onChange={(e) => updateTime('bedtime', e.target.value)} />
            </div>
            <div className="sleep-edit-arrow">→</div>
            <div className="sleep-edit-field">
              <label className="sleep-edit-label">{t('tile.sleep.wake')}</label>
              <input className="sleep-time-input" type="time" value={draft.wake}
                onChange={(e) => updateTime('wake', e.target.value)} />
            </div>
            <div className="sleep-edit-total">
              <span className="sleep-edit-total-num">{calcTotal(draft.bedtime, draft.wake)}</span>
              <span className="sleep-edit-total-unit">h</span>
            </div>
          </div>

          <div className="sleep-edit-phases-head">
            <span className="eyebrow">{t('tile.sleep.phases')}</span>
            <span className="sleep-phases-sum">{stagesTotal.toFixed(1)}h</span>
          </div>
          {STAGE_META.map((s) => (
            <div key={s.k} className="sleep-phase-row">
              <span className="sleep-leg-dot" style={{ background: s.color }} />
              <span className="sleep-phase-label">{t(s.labelKey)}</span>
              <div className="sleep-phase-stepper">
                <button className="stepper-btn" onClick={() => updateStage(s.k, +(draft.stages[s.k] - 0.1).toFixed(1))}>–</button>
                <span className="sleep-phase-val">{draft.stages[s.k].toFixed(1)}</span>
                <button className="stepper-btn" onClick={() => updateStage(s.k, +(draft.stages[s.k] + 0.1).toFixed(1))}>+</button>
              </div>
            </div>
          ))}

          <div className="sleep-edit-actions">
            <button className="btn-ghost-sm" onClick={() => setEditing(false)}>{t('tile.sleep.cancel')}</button>
            <button className="btn-primary" style={{ padding: '8px 20px' }} onClick={save}>{t('tile.sleep.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WaterTile({ date }) {
  const [cups, setCups] = useState(0);
  const t = useT();

  useEffect(() => {
    setCups(0);
    if (!date) return;
    getLog(date).then((log) => setCups(log.water || 0)).catch(() => {});
  }, [date]);

  const handleCup = (i) => {
    const next = i + 1 === cups ? i : i + 1;
    setCups(next);
    if (date) putLog(date, { water: next }).catch(() => {});
  };

  return (
    <div className="tile water-tile">
      <div className="tile-head">
        <div className="eyebrow">{t('tile.water.eyebrow')}</div>
        <div className="tile-title">{t('tile.water.title')}</div>
      </div>
      <div className="water-num">{cups}<span className="tile-unit">{t('tile.water.cups', { n: GOALS.water })}</span></div>
      <div className="water-cups">
        {Array.from({ length: GOALS.water }).map((_, i) => (
          <button
            key={i}
            className={`cup ${i < cups ? 'cup-filled' : ''}`}
            onClick={() => handleCup(i)}
            aria-label={`cup ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function WeekTile() {
  const t = useT();
  const max = Math.max(...WEEK_ACTIVITY.map((w) => w.cal));

  return (
    <div className="tile week-tile">
      <div className="tile-head">
        <div className="eyebrow">{t('tile.week.eyebrow')}</div>
        <div className="tile-title">{t('tile.week.title')}</div>
      </div>
      <div className="week-bars">
        {WEEK_ACTIVITY.map((w, i) => {
          const h = (w.cal / max) * 100;
          const isLast = i === WEEK_ACTIVITY.length - 1;
          return (
            <div key={w.d} className="week-col">
              <div className="week-bar-wrap">
                <div
                  className={`week-bar ${isLast ? 'week-bar-current' : ''}`}
                  style={{ height: `${h}%` }}
                />
                {w.workout && <span className="week-dot" />}
              </div>
              <div className="week-day">{w.d}</div>
            </div>
          );
        })}
      </div>
      <div className="week-foot">
        <div><strong>16,840</strong> <span className="muted">{t('tile.week.kcal')}</span></div>
        <div><strong>4</strong> <span className="muted">{t('tile.week.workouts')}</span></div>
      </div>
    </div>
  );
}

export function StreakTile() {
  const t = useT();
  const [streak, setStreak] = useState(() => loadStreak());

  useEffect(() => {
    const onFocus = () => setStreak(loadStreak());
    window.addEventListener('focus', onFocus);
    window.addEventListener('hf:streak-updated', () => setStreak(loadStreak()));
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('hf:streak-updated', () => setStreak(loadStreak()));
    };
  }, []);

  return (
    <div className="tile streak-tile">
      <div className="tile-head">
        <div className="eyebrow">{t('tile.streak.eyebrow')}</div>
        <div className="tile-title">{t('tile.streak.title')}</div>
      </div>
      <div className="streak-num">{streak.current}<span className="tile-unit">{t('tile.streak.days')}</span></div>
      <div className="streak-sub">{t('tile.streak.pb', { n: streak.best })}</div>
      <div className="streak-grid">
        {streak.last28.map((active, i) => (
          <div key={i} className={`streak-cell ${active ? 'streak-on' : ''}`} />
        ))}
      </div>
    </div>
  );
}
