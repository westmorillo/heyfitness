import { useState, useEffect } from 'react';
import { Ring, Bar } from './primitives.jsx';
import { DAYS, SLEEP_DATA, WEEK_ACTIVITY, GOALS } from './data.js';
import { getLog, putLog } from './api.js';

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
  const today = DAYS.find((d) => d.isToday);
  const label = activeDay === today?.iso
    ? `${today.month} ${today.day} · ${today.weekday}`
    : DAYS.find((d) => d.iso === activeDay)
      ? `${DAYS.find(d => d.iso === activeDay).month} ${DAYS.find(d => d.iso === activeDay).day} · ${DAYS.find(d => d.iso === activeDay).weekday}`
      : 'TODAY';

  const stats = [
    { label: 'KCAL BURNED', val: 642 },
    { label: 'ACTIVE MIN', val: 78 },
    { label: 'STEPS', val: '8,412' },
    { label: 'ZONE 2', val: '34 MIN' },
  ];

  return (
    <div className="hero-tile">
      <div className="hero-meta">
        <div className="eyebrow">{label}</div>
        <div className="hero-title">ON TRACK.</div>
        <div className="hero-sub">You're 84% to your daily movement goal. One workout down, one meal to go.</div>
      </div>
      <div className="hero-stats">
        {stats.map((s) => (
          <div key={s.label} className="hero-stat">
            <div className="hero-stat-num">{s.val}</div>
            <div className="hero-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SleepTile() {
  const total = Object.values(SLEEP_DATA.stages).reduce((a, b) => a + b, 0);
  const stages = [
    { k: 'deep', label: 'DEEP', val: SLEEP_DATA.stages.deep, color: 'var(--accent)' },
    { k: 'rem', label: 'REM', val: SLEEP_DATA.stages.rem, color: '#E8E4DC' },
    { k: 'light', label: 'LIGHT', val: SLEEP_DATA.stages.light, color: '#8A8A8A' },
    { k: 'awake', label: 'AWAKE', val: SLEEP_DATA.stages.awake, color: '#3A3A3E' },
  ];
  return (
    <div className="tile sleep-tile">
      <div className="tile-head">
        <div className="eyebrow">LAST NIGHT</div>
        <div className="tile-title">SLEEP</div>
      </div>
      <div className="sleep-num-row">
        <div className="sleep-num">{SLEEP_DATA.last}<span className="sleep-unit">h</span></div>
        <div className="sleep-times">
          <div><em>{SLEEP_DATA.bedtime}</em> → <em>{SLEEP_DATA.wake}</em></div>
          <div className="muted">avg {SLEEP_DATA.avg}h / 7d</div>
        </div>
      </div>
      <div className="sleep-bar">
        {stages.map((s) => (
          <div
            key={s.k}
            className="sleep-seg"
            style={{ width: `${(s.val / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.val}h`}
          />
        ))}
      </div>
      <div className="sleep-legend">
        {stages.map((s) => (
          <div key={s.k} className="sleep-leg-item">
            <span className="sleep-leg-dot" style={{ background: s.color }} />
            <span className="sleep-leg-label">{s.label}</span>
            <span className="sleep-leg-val">{s.val}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaterTile({ date }) {
  const [cups, setCups] = useState(0);

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
        <div className="eyebrow">HYDRATION</div>
        <div className="tile-title">WATER</div>
      </div>
      <div className="water-num">{cups}<span className="tile-unit">/ {GOALS.water} CUPS</span></div>
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
  const max = Math.max(...WEEK_ACTIVITY.map((w) => w.cal));
  return (
    <div className="tile week-tile">
      <div className="tile-head">
        <div className="eyebrow">PAST 7 DAYS</div>
        <div className="tile-title">MOVEMENT</div>
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
        <div><strong>16,840</strong> <span className="muted">KCAL TOTAL</span></div>
        <div><strong>4</strong> <span className="muted">WORKOUTS</span></div>
      </div>
    </div>
  );
}

export function StreakTile() {
  return (
    <div className="tile streak-tile">
      <div className="tile-head">
        <div className="eyebrow">CONSISTENCY</div>
        <div className="tile-title">STREAK</div>
      </div>
      <div className="streak-num">12<span className="tile-unit">DAYS</span></div>
      <div className="streak-sub">Personal best: 21 days</div>
      <div className="streak-grid">
        {Array.from({ length: 28 }).map((_, i) => {
          const active = i < 12 || (i >= 14 && i < 20);
          return <div key={i} className={`streak-cell ${active ? 'streak-on' : ''}`} />;
        })}
      </div>
    </div>
  );
}
