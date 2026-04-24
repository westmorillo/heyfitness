import { useState, useEffect, useMemo } from 'react';
import { Ring, Bar, Tab } from './primitives.jsx';
import { DayStrip, HeroTile, SleepTile, WaterTile, WeekTile, StreakTile } from './tiles.jsx';
import { WorkoutPanel } from './workout.jsx';
import { NutritionPanel } from './nutrition.jsx';
import { FeelPanel } from './feel.jsx';
import { OverviewSummary } from './overview.jsx';
import { SettingsPanel } from './settings.jsx';
import { DAYS, GOALS } from './data.js';
import { getToken, clearToken, getMe, patchMe, getLog, getGoals } from './api.js';
import { AuthScreen } from './auth.jsx';
import { LangProvider, useT, useLang } from './LangContext.jsx';
import './styles.css';

function AvatarMenu({ user, onLogout, onSettings }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  const menuItem = (label, action, danger = false) => (
    <button
      onClick={() => { setOpen(false); action(); }}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '10px 16px', background: 'none', border: 'none',
        fontFamily: 'var(--font-display)', fontSize: 11,
        letterSpacing: '0.08em', color: danger ? '#e05' : 'var(--fg-base)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: 'relative' }}>
      <div className="avatar" onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        {user?.username?.slice(0, 2).toUpperCase() || '??'}
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setOpen(false)} />
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
            {menuItem(t('app.menu.settings'), onSettings)}
            {menuItem(t('app.menu.signout'), onLogout, true)}
          </div>
        </>
      )}
    </div>
  );
}

function DesktopDashboard({ unit, user, goals, onLogout, onSettings }) {
  const [tab, setTab] = useState('overview');
  const [activeDay, setActiveDay] = useState(() => DAYS.find((d) => d.isToday).iso);
  const t = useT();

  const TABS = [
    { id: 'overview', label: t('tab.overview') },
    { id: 'train',    label: t('tab.train') },
    { id: 'fuel',     label: t('tab.fuel') },
    { id: 'recover',  label: t('tab.recover') },
    { id: 'feel',     label: t('tab.feel') },
  ];

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
          <AvatarMenu user={user} onLogout={onLogout} onSettings={onSettings} />
        </div>
      </div>

      <DayStrip activeIso={activeDay} onSelect={setActiveDay} />
      <HeroTile activeDay={activeDay} />

      <div style={{ height: 16 }} />

      <div className="tabs">
        {TABS.map((tb) => (
          <Tab key={tb.id} active={tab === tb.id} onClick={() => setTab(tb.id)}>{tb.label}</Tab>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid">
          <div className="grid-col">
            <OverviewSummary unit={unit} date={activeDay} />
          </div>
          <div className="grid-col">
            <div className="grid" style={{ gap: 12 }}>
              <div className="grid-col"><SleepTile /></div>
              <div className="grid-col"><WaterTile date={activeDay} /></div>
            </div>
            <WeekTile />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'train' && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="grid-col"><WorkoutPanel unit={unit} date={activeDay} /></div>
          <div className="grid-col">
            <WeekTile />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'fuel' && (
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
          <div className="grid-col"><NutritionPanel date={activeDay} goals={goals} /></div>
          <div className="grid-col">
            <WaterTile date={activeDay} />
            <StreakTile />
          </div>
        </div>
      )}

      {tab === 'recover' && (
        <div className="grid">
          <div className="grid-col"><SleepTile /></div>
          <div className="grid-col"><WaterTile date={activeDay} /></div>
        </div>
      )}

      {tab === 'feel' && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="grid-col"><FeelPanel date={activeDay} /></div>
          <div className="grid-col">
            <SleepTile />
            <StreakTile />
          </div>
        </div>
      )}
    </div>
  );
}

function MobileDashboard({ unit, user, goals, onLogout, onSettings }) {
  const [tab, setTab] = useState('home');
  const [activeDay, setActiveDay] = useState(() => DAYS.find((d) => d.isToday).iso);
  const visibleDays = DAYS.slice(1, 6);
  const [meals, setMeals] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [water, setWater] = useState(0);
  const t = useT();

  useEffect(() => {
    if (tab !== 'home') return;
    setMeals([]);
    setWorkout(null);
    setWater(0);
    getLog(activeDay)
      .then((log) => {
        if (log.meals?.length) setMeals(log.meals);
        if (log.workout) setWorkout(log.workout);
        if (log.water) setWater(log.water);
      })
      .catch(() => {});
  }, [tab, activeDay]);

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

  const G = goals || GOALS;
  const today = DAYS.find((d) => d.isToday);
  const greetDate = today ? `${today.weekday} · ${today.month} ${today.day}` : 'TODAY';

  const MOBILE_TABS = [
    { id: 'home',  label: t('mtab.home'),  ico: '◐' },
    { id: 'train', label: t('mtab.train'), ico: '▲' },
    { id: 'fuel',  label: t('mtab.fuel'),  ico: '◆' },
    { id: 'feel',  label: t('mtab.feel'),  ico: '❤' },
    { id: 'stats', label: t('mtab.stats'), ico: '≡' },
  ];

  return (
    <div className="m-app">
      <div className="m-header">
        <div>
          <div className="m-greet-eyebrow">{greetDate}</div>
          <div className="m-greet">HEY, {user?.username?.toUpperCase() || ''}.</div>
        </div>
        <div style={{ position: 'relative' }}>
          <AvatarMenu user={user} onLogout={onLogout} onSettings={onSettings} />
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
              <span>{t('home.action.workout')}</span>
            </button>
            <button className="m-action" onClick={() => setTab('fuel')}>
              <span className="m-action-ico">+</span>
              <span>{t('home.action.meal')}</span>
            </button>
          </div>

          <div className="m-card">
            <div className="m-card-head">
              <div>
                <div className="eyebrow">{t('home.fuel.title')}</div>
                <div className="m-card-title">
                  {Math.round(mealTotals.cal)} <span className="m-card-unit">/ {G.calories} KCAL</span>
                </div>
              </div>
              <div className="m-cal-ring">
                <Ring value={mealTotals.cal} max={G.calories} size={56} stroke={6}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-display)' }}>
                    {Math.round((mealTotals.cal / G.calories) * 100)}%
                  </div>
                </Ring>
              </div>
            </div>
            <div className="m-macros">
              <div className="m-macro">
                <div className="m-macro-top"><span>P</span><strong>{Math.round(mealTotals.p)}</strong>/{G.protein}</div>
                <Bar value={mealTotals.p} max={G.protein} color="var(--accent)" height={4} />
              </div>
              <div className="m-macro">
                <div className="m-macro-top"><span>C</span><strong>{Math.round(mealTotals.c)}</strong>/{G.carbs}</div>
                <Bar value={mealTotals.c} max={G.carbs} color="#E8E4DC" height={4} />
              </div>
              <div className="m-macro">
                <div className="m-macro-top"><span>F</span><strong>{Math.round(mealTotals.f)}</strong>/{G.fat}</div>
                <Bar value={mealTotals.f} max={G.fat} color="#8A8A8A" height={4} />
              </div>
            </div>
          </div>

          <div className="m-card m-card-workout">
            <div className="eyebrow">{t('home.upnext')}</div>
            {workout ? (
              <>
                <div className="m-workout-title">{workout.name.split('—')[0].trim()}</div>
                <div className="m-workout-sub">
                  {workout.name.split('—')[1]?.trim() || t('home.training')} · {workout.exercises.length} exercises · ~{workout.duration} min
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
              <div className="m-workout-title" style={{ opacity: 0.4, fontSize: 14 }}>{t('home.noworkout')}</div>
            )}
          </div>

          <div className="m-row">
            <div className="m-card m-card-half">
              <div className="eyebrow">{t('home.water')}</div>
              <div className="m-big-num">{water}<span className="m-big-unit">/{G.water}</span></div>
              <div className="water-cups" style={{ gridTemplateColumns: 'repeat(8, 1fr)', gap: 3, marginTop: 10 }}>
                {Array.from({ length: G.water }).map((_, i) => (
                  <div key={i} className={`cup ${i < water ? 'cup-filled' : ''}`} style={{ borderRadius: 3 }} />
                ))}
              </div>
            </div>
            <div className="m-card m-card-half">
              <div className="eyebrow">{t('home.sleep')}</div>
              <div className="m-big-num" style={{ opacity: 0.35 }}>—</div>
            </div>
          </div>

          <div style={{ height: 20 }} />
        </>
      )}

      {tab === 'train' && (
        <div className="m-train-view" style={{ paddingTop: 8 }}>
          <WorkoutPanel unit={unit} date={activeDay} />
        </div>
      )}

      {tab === 'fuel' && (
        <div className="m-fuel-view" style={{ paddingTop: 8 }}>
          <NutritionPanel date={activeDay} goals={goals} />
        </div>
      )}

      {tab === 'feel' && (
        <div className="m-feel-view" style={{ paddingTop: 8 }}>
          <FeelPanel date={activeDay} />
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
        {MOBILE_TABS.map((tb) => (
          <button
            key={tb.id}
            className={`m-tab ${tab === tb.id ? 'm-tab-active' : ''}`}
            onClick={() => setTab(tb.id)}
          >
            <span className="m-tab-ico">{tb.ico}</span>
            <span className="m-tab-label">{tb.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AppInner() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [unit, setUnit] = useState('kg');
  const [theme, setTheme] = useState('dark');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [goals, setGoals] = useState(null);
  const [view, setView] = useState('dashboard');
  const t = useT();
  const { toggleLang } = useLang();
  const tLang = useT(); // for the lang button label

  useEffect(() => {
    if (!getToken()) { setAuthChecked(true); return; }
    const timeout = setTimeout(() => { clearToken(); setAuthChecked(true); }, 8000);
    getMe()
      .then((u) => { setUser(u); setUnit(u.unit || 'kg'); setTheme(u.theme || 'dark'); })
      .catch(() => { clearToken(); })
      .finally(() => { clearTimeout(timeout); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (!user) return;
    getGoals().then(setGoals).catch(() => {});
  }, [user]);

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
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.1em', color: 'var(--fg-muted)' }}>
        {t('app.loading')}
      </div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={(u) => { setUser(u); setUnit(u.unit || 'kg'); setTheme(u.theme || 'dark'); }} />;

  const handleLogout = () => { clearToken(); setUser(null); };
  const handleSettings = () => setView('settings');

  if (view === 'settings') {
    return (
      <SettingsPanel
        user={user}
        unit={unit}
        goals={goals}
        onBack={() => setView('dashboard')}
        onSaved={(updatedUser, updatedGoals) => {
          setUser(updatedUser);
          setGoals(updatedGoals);
          if (updatedUser.unit) setUnit(updatedUser.unit);
        }}
      />
    );
  }

  const btnStyle = {
    padding: '5px 12px', borderRadius: 6,
    border: '1px solid var(--stroke)',
    background: 'var(--bg-elev)',
    fontFamily: 'var(--font-mono)', fontSize: 11,
    letterSpacing: '0.1em', color: 'var(--fg-muted)',
    cursor: 'pointer',
  };

  return (
    <>
      {!isMobile && (
        <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 200, display: 'flex', gap: 6 }}>
          <button onClick={toggleUnit} style={btnStyle}>{unit.toUpperCase()} ⇌</button>
          <button onClick={toggleTheme} style={btnStyle}>{theme === 'dark' ? '☀' : '☽'}</button>
          <button onClick={toggleLang} style={btnStyle}>{tLang('app.lang')}</button>
        </div>
      )}

      {isMobile
        ? <MobileDashboard unit={unit} user={user} goals={goals} onLogout={handleLogout} onSettings={handleSettings} />
        : <DesktopDashboard unit={unit} user={user} goals={goals} onLogout={handleLogout} onSettings={handleSettings} />
      }
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
