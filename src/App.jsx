import { useState, useEffect, useMemo } from 'react';
import { Ring, Bar, Tab } from './primitives.jsx';
import { DayStrip, HeroTile, SleepTile, WaterTile, WeekTile, StreakTile } from './tiles.jsx';
import { WorkoutPanel } from './workout.jsx';
import { NutritionPanel } from './nutrition.jsx';
import { FeelPanel } from './feel.jsx';
import { OverviewSummary } from './overview.jsx';
import { DAYS, GOALS } from './data.js';
import { getLog } from './api.js';
import { getToken, clearToken, getMe, patchMe } from './api.js';
import { AuthScreen } from './auth.jsx';
import './styles.css';

const TABS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'train', label: 'TRAIN' },
  { id: 'fuel', label: 'FUEL' },
  { id: 'recover', label: 'RECOVER' },
  { id: 'feel', label: 'FEEL' },
];

function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div
        className="avatar"
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: 'pointer' }}
      >
        {user?.username?.slice(0, 2).toUpperCase() || '??'}
      </div>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 299 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
            background: 'var(--bg-elev)', border: '1px solid var(--stroke)',
            borderRadius: 8, minWidth: 160, padding: '8px 0',
          }}>
            <div style={{
              padding: '8px 16px 10px',
              fontFamily: 'var(--font-display)', fontSize: 11,
              letterSpacing: '0.08em', color: 'var(--fg-muted)',
              borderBottom: '1px solid var(--stroke)',
            }}>
              {user?.username?.toUpperCase()}
            </div>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', background: 'none', border: 'none',
                fontFamily: 'var(--font-display)', fontSize: 11,
                letterSpacing: '0.08em', color: 'var(--fg-base)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              SIGN OUT
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DesktopDashboard({ unit, user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [activeDay, setActiveDay] = useState(() => DAYS.find((d) => d.isToday).iso);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>H</span></div>
          <div className="brand-name">HEYFITNESS<span className="brand-dot">.</span></div>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="Search">⌕</button>
          <button className="icon-btn" title="Notifications">◔</button>
          <AvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>

      <DayStrip activeIso={activeDay} onSelect={setActiveDay} />
      <HeroTile activeDay={activeDay} />

      <div style={{ height: 16 }} />

      <div className="tabs">
        {TABS.map((t) => (
          <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Tab>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid">
          <div className="grid-col">
            <OverviewSummary unit={unit} />
          </div>
          <div className="grid-col">
            <div className="grid" style={{ gap: 12 }}>
              <div className="grid-col"><SleepTile /></div>
              <div className="grid-col"><WaterTile /></div>
            </div>
            <WeekTile />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'train' && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="grid-col"><WorkoutPanel unit={unit} /></div>
          <div className="grid-col">
            <WeekTile />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'fuel' && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="grid-col"><NutritionPanel /></div>
          <div className="grid-col">
            <WaterTile />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'recover' && (
        <div className="grid">
          <div className="grid-col"><SleepTile /></div>
          <div className="grid-col"><WaterTile /></div>
        </div>
      )}

      {tab === 'feel' && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="grid-col"><FeelPanel /></div>
          <div className="grid-col">
            <SleepTile />
            <StreakTile />
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDashboard({ unit, user, onLogout }) {
  const [tab, setTab] = useState('home');
  const [activeDay, setActiveDay] = useState(() => DAYS.find((d) => d.isToday).iso);
  const visibleDays = DAYS.slice(1, 6);
  const [meals, setMeals] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [water, setWater] = useState(0);

  const TODAY_ISO = DAYS.find((d) => d.isToday)?.iso || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getLog(TODAY_ISO)
      .then((log) => {
        if (log.meals?.length) setMeals(log.meals);
        if (log.workout) setWorkout(log.workout);
        if (log.water) setWater(log.water);
      })
      .catch(() => {});
  }, [TODAY_ISO]);

  const mealTotals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    meals.forEach((m) => m.items.forEach((it) => {
      cal += it.cal * it.portion;
      p += it.p * it.portion;
      c += it.c * it.portion;
      f += it.f * it.portion;
    }));
    return { cal, p, c, f };
  }, [meals]);

  const today = DAYS.find((d) => d.isToday);
  const greetDate = today ? `${today.weekday} · ${today.month} ${today.day}` : 'TODAY';

  return (
    <div className="m-app">
      <div className="m-header">
        <div>
          <div className="m-greet-eyebrow">{greetDate}</div>
          <div className="m-greet">HEY, {user?.username?.toUpperCase() || ''}.</div>
        </div>
        <div style={{ position: 'relative' }}>
          <AvatarMenu user={user} onLogout={onLogout} />
        </div>
      </div>

      {tab === 'home' && (
        <>
          <div className="m-day-strip">
            {visibleDays.map((d) => (
              <button
                key={d.iso}
                className={`m-day ${d.iso === activeDay ? 'm-day-active' : ''}`}
                onClick={() => setActiveDay(d.iso)}
              >
                <span className="m-day-wk">{d.weekday.slice(0, 1)}</span>
                <span className="m-day-num">{d.day}</span>
              </button>
            ))}
          </div>

          <div className="m-actions">
            <button className="m-action m-action-primary" onClick={() => setTab('train')}>
              <span className="m-action-ico">⏵</span>
              <span>START WORKOUT</span>
            </button>
            <button className="m-action" onClick={() => setTab('fuel')}>
              <span className="m-action-ico">+</span>
              <span>LOG MEAL</span>
            </button>
          </div>

          <div className="m-card">
            <div className="m-card-head">
              <div>
                <div className="eyebrow">TODAY'S FUEL</div>
                <div className="m-card-title">
                  {Math.round(mealTotals.cal)} <span className="m-card-unit">/ {GOALS.calories} KCAL</span>
                </div>
              </div>
              <div className="m-cal-ring">
                <Ring value={mealTotals.cal} max={GOALS.calories} size={56} stroke={6}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-display)' }}>
                    {Math.round((mealTotals.cal / GOALS.calories) * 100)}%
                  </div>
                </Ring>
              </div>
            </div>
            <div className="m-macros">
              <div className="m-macro">
                <div className="m-macro-top"><span>P</span><strong>{Math.round(mealTotals.p)}</strong>/{GOALS.protein}</div>
                <Bar value={mealTotals.p} max={GOALS.protein} color="var(--accent)" height={4} />
              </div>
              <div className="m-macro">
                <div className="m-macro-top"><span>C</span><strong>{Math.round(mealTotals.c)}</strong>/{GOALS.carbs}</div>
                <Bar value={mealTotals.c} max={GOALS.carbs} color="#E8E4DC" height={4} />
              </div>
              <div className="m-macro">
                <div className="m-macro-top"><span>F</span><strong>{Math.round(mealTotals.f)}</strong>/{GOALS.fat}</div>
                <Bar value={mealTotals.f} max={GOALS.fat} color="#8A8A8A" height={4} />
              </div>
            </div>
          </div>

          <div className="m-card m-card-workout">
            <div className="eyebrow">UP NEXT</div>
            {workout ? (
              <>
                <div className="m-workout-title">{workout.name.split('—')[0].trim()}</div>
                <div className="m-workout-sub">
                  {workout.name.split('—')[1]?.trim() || 'Training'} · {workout.exercises.length} exercises · ~{workout.duration} min
                </div>
                <div className="m-workout-exes">
                  {workout.exercises.map((e) => (
                    <div key={e.id} className="m-ex-row">
                      <span className="m-ex-name">{e.name}</span>
                      <span className="m-ex-sets">{e.targetSets}×</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="m-workout-title" style={{ opacity: 0.4, fontSize: 14 }}>NO WORKOUT LOGGED</div>
            )}
          </div>

          <div className="m-row">
            <div className="m-card m-card-half">
              <div className="eyebrow">WATER</div>
              <div className="m-big-num">{water}<span className="m-big-unit">/{GOALS.water}</span></div>
              <div className="water-cups" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginTop: 10 }}>
                {Array.from({ length: GOALS.water }).map((_, i) => (
                  <div key={i} className={`cup ${i < water ? 'cup-filled' : ''}`} style={{ borderRadius: 3 }} />
                ))}
              </div>
            </div>
            <div className="m-card m-card-half">
              <div className="eyebrow">SLEEP</div>
              <div className="m-big-num" style={{ opacity: 0.35 }}>—</div>
            </div>
          </div>

          <div style={{ height: 20 }} />
        </>
      )}

      {tab === 'train' && (
        <div className="m-train-view" style={{ paddingTop: 8 }}>
          <WorkoutPanel unit={unit} />
        </div>
      )}

      {tab === 'fuel' && (
        <div className="m-fuel-view" style={{ paddingTop: 8 }}>
          <NutritionPanel />
        </div>
      )}

      {tab === 'feel' && (
        <div className="m-feel-view" style={{ paddingTop: 8 }}>
          <FeelPanel />
        </div>
      )}

      {tab === 'stats' && (
        <div className="m-stats-view" style={{ paddingTop: 8 }}>
          <WeekTile />
          <div style={{ height: 12 }} />
          <StreakTile />
          <div style={{ height: 12 }} />
          <SleepTile />
        </div>
      )}

      <div className="m-tabbar">
        {[
          { id: 'home', label: 'HOME', ico: '◐' },
          { id: 'train', label: 'TRAIN', ico: '▲' },
          { id: 'fuel', label: 'FUEL', ico: '◆' },
          { id: 'feel', label: 'FEEL', ico: '❤' },
          { id: 'stats', label: 'STATS', ico: '≡' },
        ].map((t) => (
          <button
            key={t.id}
            className={`m-tab ${tab === t.id ? 'm-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="m-tab-ico">{t.ico}</span>
            <span className="m-tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [unit, setUnit] = useState('kg');
  const [theme, setTheme] = useState('dark');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    if (!getToken()) { setAuthChecked(true); return; }
    const timeout = setTimeout(() => { clearToken(); setAuthChecked(true); }, 8000);
    getMe()
      .then((u) => { setUser(u); setUnit(u.unit || 'kg'); setTheme(u.theme || 'dark'); })
      .catch(() => { clearToken(); })
      .finally(() => { clearTimeout(timeout); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    patchMe({ theme: next }).catch(() => {});
  };
  const toggleUnit = () => {
    const next = unit === 'lb' ? 'kg' : 'lb';
    setUnit(next);
    patchMe({ unit: next }).catch(() => {});
  };

  if (!authChecked) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.1em', color: 'var(--fg-muted)' }}>CARGANDO...</div>
    </div>
  );
  if (!user) return <AuthScreen onLogin={(u) => { setUser(u); setUnit(u.unit || 'kg'); setTheme(u.theme || 'dark'); }} />;

  const handleLogout = () => { clearToken(); setUser(null); };

  return (
    <>
      {!isMobile && (
        <div style={{
          position: 'fixed', top: 12, right: 16, zIndex: 200,
          display: 'flex', gap: 6,
        }}>
          <button
            onClick={toggleUnit}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--stroke)',
              background: 'var(--bg-elev)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.1em', color: 'var(--fg-muted)',
              cursor: 'pointer',
            }}
          >
            {unit.toUpperCase()} ⇌
          </button>
          <button
            onClick={toggleTheme}
            style={{
              padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--stroke)',
              background: 'var(--bg-elev)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.1em', color: 'var(--fg-muted)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? '☀' : '☽'}
          </button>
        </div>
      )}

      {isMobile
        ? <MobileDashboard unit={unit} user={user} onLogout={handleLogout} />
        : <DesktopDashboard unit={unit} user={user} onLogout={handleLogout} />
      }
    </>
  );
}
