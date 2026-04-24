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

export function HeroTile({ activeDay }) {
  const t = useT();
  const today = DAYS.find((d) => d.isToday);
  const label = activeDay === today?.iso
    ? `${today.month} ${today.day} · ${today.weekday}`
    : DAYS.find((d) => d.iso === activeDay)
      ? `${DAYS.find(d => d.iso === activeDay).month} ${DAYS.find(d => d.iso === activeDay).day} · ${DAYS.find(d => d.iso === activeDay).weekday}`
      : 'TODAY';

  const stats = [
    { labelKey: 'tile.hero.kcal',      val: 642 },
    { labelKey: 'tile.hero.activeMin', val: 78 },
    { labelKey: 'tile.hero.steps',     val: '8,412' },
    { labelKey: 'tile.hero.zone2',     val: '34 MIN' },
  ];

  return (
    <div className="hero-tile">
      <div className="hero-meta">
        <div className="eyebrow">{label}</div>
        <div className="hero-title">{t('tile.hero.title')}</div>
        <div className="hero-sub">{t('tile.hero.sub')}</div>
      </div>
      <div className="hero-stats">
        {stats.map((s) => (
          <div key={s.labelKey} className="hero-stat">
            <div className="hero-stat-num">{s.val}</div>
            <div className="hero-stat-label">{t(s.labelKey)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SleepTile() {
  const t = useT();
  const total = Object.values(SLEEP_DATA.stages).reduce((a, b) => a + b, 0);
  const stages = [
    { k: 'deep',  labelKey: 'tile.sleep.deep',  val: SLEEP_DATA.stages.deep,  color: 'var(--accent)' },
    { k: 'rem',   labelKey: 'tile.sleep.rem',   val: SLEEP_DATA.stages.rem,   color: '#E8E4DC' },
    { k: 'light', labelKey: 'tile.sleep.light', val: SLEEP_DATA.stages.light, color: '#8A8A8A' },
    { k: 'awake', labelKey: 'tile.sleep.awake', val: SLEEP_DATA.stages.awake, color: '#3A3A3E' },
  ];

  return (
    <div className="tile sleep-tile">
      <div className="tile-head">
        <div className="eyebrow">{t('tile.sleep.eyebrow')}</div>
        <div className="tile-title">{t('tile.sleep.title')}</div>
      </div>
      <div className="sleep-num-row">
        <div className="sleep-num">{SLEEP_DATA.last}<span className="sleep-unit">h</span></div>
        <div className="sleep-times">
          <div><em>{SLEEP_DATA.bedtime}</em> → <em>{SLEEP_DATA.wake}</em></div>
          <div className="muted">{t('tile.sleep.avg', { avg: SLEEP_DATA.avg })}</div>
        </div>
      </div>
      <div className="sleep-bar">
        {stages.map((s) => (
          <div
            key={s.k}
            className="sleep-seg"
            style={{ width: `${(s.val / total) * 100}%`, background: s.color }}
            title={`${t(s.labelKey)}: ${s.val}h`}
          />
        ))}
      </div>
      <div className="sleep-legend">
        {stages.map((s) => (
          <div key={s.k} className="sleep-leg-item">
            <span className="sleep-leg-dot" style={{ background: s.color }} />
            <span className="sleep-leg-label">{t(s.labelKey)}</span>
            <span className="sleep-leg-val">{s.val}h</span>
          </div>
        ))}
      </div>
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
