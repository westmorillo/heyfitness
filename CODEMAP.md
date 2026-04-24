# CODEMAP — HeyFitness

> One-stop reference for AI assistants and developers. Read this before touching any file.
> When you modify the codebase, update the relevant section here.

---

## What this app is

**HeyFitness** is a health & fitness tracker dashboard. 100% frontend SPA — no backend, no database. All persistence is via a REST API (`/api/*`) with a JWT token stored in `localStorage`. Users must log in before using any feature.

**Stack:** React 19 + Vite 8, JavaScript (no TypeScript), custom CSS (no UI library), no client-side router.

**Live URL:** `https://health.heywetsu.cloud`
**Repo:** `github.com/westmorillo/heyfitness`

---

## File map

```
/
├── src/
│   ├── main.jsx         # React entry point — mounts <App /> to #root
│   ├── App.jsx          # Root: auth gate, theme, responsive layout, tab navigation
│   ├── api.js           # HTTP client — all API calls go through here
│   ├── data.js          # Static constants, mock data, localStorage helpers (routines)
│   ├── i18n.js          # Translation dictionaries (en + es) and t() function
│   ├── LangContext.jsx  # React context: LangProvider, useT(), useLang()
│   ├── primitives.jsx   # Low-level UI: Ring, Bar, Slider, Stepper, Tab, SliderLine
│   ├── tiles.jsx        # Dashboard cards: DayStrip, HeroTile, SleepTile, WaterTile, WeekTile, StreakTile
│   ├── auth.jsx         # Login / register screen
│   ├── overview.jsx     # HOME panel: daily summary (workout + nutrition)
│   ├── workout.jsx      # TRAIN panel: exercises, sets, rest timer, routine picker
│   ├── nutrition.jsx    # FUEL panel: meals, macros, food search, custom foods
│   ├── feel.jsx         # FEEL panel: mood, symptoms, energy slider
│   ├── settings.jsx     # Settings panel: profile, body metrics, nutrition goals
│   └── styles.css       # Global styles (~36 KB), dark/light theme
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── Dockerfile           # Multi-stage: Node build → nginx serve (port 80)
├── Dockerfile.server    # Node API server container (port 3000)
├── nginx.conf           # SPA fallback + gzip + 1-year cache headers
└── .github/workflows/
    └── deploy.yml       # Push to main → build images → push GHCR → deploy VPS via SSH
```

---

## Features — qué hace cada pantalla y cómo funciona

### 🔐 Autenticación (`auth.jsx`)
- El usuario crea una cuenta o inicia sesión con usuario + contraseña.
- Al autenticarse, el servidor devuelve un JWT que se guarda en `localStorage` (`hf_token`).
- Al recargar, `App.jsx` llama a `getMe()` con ese token para restaurar la sesión automáticamente.
- Si el token es inválido o expira, se limpia y se muestra la pantalla de login.

---

### 🏠 HOME / RESUMEN (`overview.jsx` + `MobileDashboard` en `App.jsx`)

**Desktop:** tab "OVERVIEW" — muestra dos paneles lado a lado.  
**Mobile:** tab "INICIO" — muestra cards apiladas con acciones rápidas.

**Qué muestra:**
- **Resumen de sesión:** nombre del entrenamiento del día, duración, series completadas, volumen total.
- **Resumen nutricional:** calorías consumidas vs meta (anillo), barras de macros (proteína, carbos, grasa), listado de comidas del día.
- **Acciones rápidas (mobile):** botones "INICIAR ENTRENO" y "REGISTRAR COMIDA" que llevan directo a los paneles correspondientes.
- **Agua y sueño (mobile):** mini-cards con vasos de agua del día y slot de sueño.

**Cómo funciona:**
- Lee el log del día seleccionado via `getLog(date)`.
- Si no hay datos, muestra estados vacíos ("SIN SESIÓN HOY", "Sin registrar").
- Se actualiza automáticamente cada vez que el usuario cambia la fecha en el `DayStrip`.

---

### 💪 ENTRENO (`workout.jsx`)

**Cómo se usa:**
1. Al abrir el panel sin entreno activo, aparece el **RoutinePicker**: 5 rutinas pre-definidas (Push, Pull, Piernas, Tren Superior, Full Body) y la opción "ENTRENO EN BLANCO".
2. Al seleccionar una rutina, se crea el objeto de workout y arranca el **timer de sesión**.
3. Por cada ejercicio se muestra una tabla de series con peso y reps editables via `Stepper`.
4. Al completar una serie (✓), se activa el **timer de descanso** (90 seg con +15s y saltar).
5. Se puede agregar ejercicios extra con **"+ AGREGAR EJERCICIO"** — abre un modal buscable con 36 ejercicios en 6 grupos musculares.
6. Al pulsar **"FINALIZAR ENTRENO"** se guarda duración, series y volumen total.
7. La pantalla de resumen final muestra stats y permite editar o iniciar uno nuevo.

**Auto-guardado:** cada cambio (peso, reps, completar serie) dispara un `putLog` con 600ms de debounce.

**Rutinas disponibles:**
| Rutina | Grupos musculares |
|--------|-------------------|
| Push Day | Pecho, Hombros, Tríceps |
| Pull Day | Espalda, Bíceps |
| Leg Day | Cuádriceps, Isquiotibiales, Glúteos |
| Upper Body | Pecho, Espalda, Brazos |
| Full Body | Completo |

**Grupos musculares en el buscador:** Pecho, Piernas, Espalda, Hombros, Brazos, Core (36 ejercicios en total).

---

### 🥗 NUTRICIÓN (`nutrition.jsx`)

**Cómo se usa:**
1. El panel muestra 4 comidas del día: Desayuno, Almuerzo, Merienda, Cena.
2. Cada comida tiene un botón **"+ AGREGAR COMIDA"** que abre el buscador.
3. En el buscador se puede buscar por nombre o marca en la **base de datos de 12 alimentos** incluidos.
4. Tab **RECIENTES:** muestra los alimentos de la DB + los custom del usuario.
5. Tab **PERSONALIZADOS:** solo los alimentos creados por el usuario.
6. **"+ NUEVO ALIMENTO":** formulario para crear un alimento custom con nombre, marca, porción, kcal, proteína, carbos, grasa — se guarda en el servidor via `postFood()`.
7. Dentro de cada comida, cada alimento tiene un **slider de porción** (0.1x – 3x) para ajustar cantidades.
8. Botón **ELIMINAR** para sacar un alimento de la comida.

**Qué calcula automáticamente:**
- Calorías totales del día (anillo con "KCAL REST.")
- Barras de progreso de proteína, carbos y grasa vs metas del usuario
- Totales por comida (kcal + proteína)

**Auto-guardado:** cada cambio dispara `putLog(date, { meals })` inmediatamente.

---

### 🧠 ESTADO / FEEL (`feel.jsx`)

**Cómo se usa:**
1. **Estado general:** 5 botones de mood con emoji — Agotado, Bajo, Normal, Bien, En llamas.
2. **Síntomas digestivos:** chips togglables — Hinchazón, Gases, Reflujo, Calambres, Náuseas, Ninguno.
3. **Otros síntomas:** chips togglables — Dolor de cabeza, Fatiga, Niebla mental, Sarpullido, Dolor articular, Ninguno.
4. **Nivel de energía:** slider 1–10.
5. **Calidad del sueño:** slider 1–10.
6. **Notas libres:** textarea opcional.
7. **Análisis IA (mock):** sección estática que muestra patrones de los últimos 14 días (pendiente de implementación real).

**Comportamiento de síntomas:**
- Seleccionar "NINGUNO" limpia todos los demás.
- Seleccionar cualquier síntoma cuando "NINGUNO" está activo lo desactiva automáticamente.
- Un síntoma ya activo se desactiva al pulsarlo de nuevo (toggle).

**Auto-guardado:** cada interacción dispara `putLog(date, { feel })` inmediatamente.

---

### 😴 SUEÑO (`SleepTile` en `tiles.jsx`)

> ⚠️ Actualmente muestra **datos estáticos mock** (`SLEEP_DATA` en `data.js`). Pendiente conexión con API real.

**Qué muestra:**
- Horas de sueño de la noche anterior (ej. 7.4h)
- Hora de acostarse y despertar
- Promedio de los últimos 7 días
- Barra visual segmentada por fases: Profundo, REM, Ligero, Despierto
- Leyenda con horas por fase

---

### 💧 AGUA (`WaterTile` en `tiles.jsx`)

**Cómo se usa:**
- Grid de vasos (por defecto 8) — cada vaso es un botón.
- Clic en un vaso lo marca como lleno. Clic en el último vaso lleno lo desmarca.
- Se guarda el conteo via `putLog(date, { water: n })`.
- Se carga el conteo del día seleccionado via `getLog(date)`.

---

### 📊 STATS (`WeekTile` + `StreakTile` en `tiles.jsx`)

> ⚠️ Actualmente muestran **datos estáticos mock**. Pendiente conexión con API real.

**WeekTile — Movimiento últimos 7 días:**
- Gráfico de barras con calorías quemadas por día.
- Puntos indicadores de días con entrenamiento.
- Footer con total de kcal y número de entrenos.

**StreakTile — Racha de consistencia:**
- Número de días consecutivos activos.
- Récord personal.
- Grid de 28 días (4 semanas) con días activos marcados.

---

### ⚙️ AJUSTES (`settings.jsx`)

**Cómo se usa:**
- Acceso desde el menú del avatar (desktop y mobile).

**Métricas corporales:**
- Selección de sexo (Hombre / Mujer).
- Peso actual y peso objetivo (se muestra en la unidad activa: kg o lb).
- Altura (cm) y edad.
- Nivel de actividad: Sedentario / Ligero / Moderado / Activo / Muy activo.
- Objetivo: Perder grasa / Mantener / Ganar músculo.

**Metas nutricionales:**
- Se calculan automáticamente con la fórmula **Mifflin-St Jeor** cuando hay métricas completas.
- El badge "AUTO-CALCULADO" aparece cuando el cálculo está activo.
- Se pueden editar manualmente para sobreescribir el cálculo.
- Campos: Calorías, Agua, Proteína, Carbos, Grasa.

**Cómo guarda:** `patchMe(profile)` + `putGoals(goals)` en paralelo con `Promise.all`. El callback `onSaved` actualiza el estado global en `App.jsx`.

---

### 🗓️ DayStrip (`tiles.jsx`)

Barra de selección de fecha que aparece en la parte superior de ambos layouts (desktop y mobile).
- Muestra 7 días centrados en hoy (3 anteriores + hoy + 3 siguientes).
- El día activo se resalta; hoy tiene un punto indicador.
- Al cambiar el día, **todos los paneles re-fetchean** sus datos automáticamente.

---

### 🌐 Idioma (`LangContext.jsx` + `i18n.js`)

- **Idioma por defecto:** Español.
- **Toggle:** botón en el top-right del desktop que muestra el código del idioma alternativo (ES / EN).
- **Persistencia:** se guarda en `localStorage` bajo `hf_lang`. Sobrevive recargas de página.
- **Cobertura:** todos los textos visibles de la UI (labels, botones, placeholders, mensajes de error, nombres de pestañas, etc.).
- Los datos almacenados en el servidor siempre son en inglés (neutral); solo cambia la capa visual.

---

## Panels / screens

| Tab | Component | File | Description |
|-----|-----------|------|-------------|
| HOME | `OverviewSummary` | `overview.jsx` | Daily workout + nutrition summary |
| TRAIN | `WorkoutPanel` | `workout.jsx` | Log exercises, sets, reps, weights |
| FUEL | `NutritionPanel` | `nutrition.jsx` | Log meals, track macros |
| FEEL | `FeelPanel` | `feel.jsx` | Mood, symptoms, energy, sleep quality |
| *(desktop only)* | `SleepTile`, `WaterTile` | `tiles.jsx` | Sleep stats + water tracker |
| Settings | `SettingsPanel` | `settings.jsx` | Profile, body metrics, goals |
| Auth | `AuthScreen` | `auth.jsx` | Login / register |

Responsive: `DesktopDashboard` (sidebar nav) and `MobileDashboard` (bottom tab nav) are both exported from `App.jsx`.

---

## Core files in detail

### `api.js` — HTTP client
All API calls go here. Everything else imports from this file.

```
getToken() / setToken(t) / clearToken()  →  localStorage key: hf_token

login(username, password)   →  POST /auth/login   → { user, token }
register(username, password) → POST /auth/register → { user, token }
getMe()                     →  GET  /me
patchMe(data)               →  PATCH /me
getLog(date)                →  GET  /logs/{date}   → { workout, meals, feel, water }
putLog(date, data)          →  PUT  /logs/{date}
getGoals()                  →  GET  /goals
putGoals(data)              →  PUT  /goals
getFoods()                  →  GET  /foods
postFood(food)              →  POST /foods
deleteFood(id)              →  DELETE /foods/{id}
```

Base URL: `VITE_API_URL` env var, defaults to `/api`.

---

### `data.js` — Static data & constants

| Export | Type | Description |
|--------|------|-------------|
| `DAYS` | array[7] | Last 7 days relative to today `{ iso, weekday, day, month, isToday }` |
| `GOALS` | object | Default nutrition goals `{ cal:2400, p:180, c:260, f:75, water:8, sleep:8, steps:10000 }` |
| `DEFAULT_WORKOUT` | object | Sample push-day workout (bench, incline, tricep pushdown) |
| `DEFAULT_ROUTINES` | array[5] | Pre-built routines: Push, Pull, Leg, Upper Body, Full Body |
| `DEFAULT_MEALS` | array[4] | Meal templates with times (breakfast, lunch, snack, dinner) |
| `EMPTY_MEALS` | array[4] | Same structure as DEFAULT_MEALS but with no items |
| `DEFAULT_FEEL` | object | Empty feel log `{ mood, dig, oth, energy, sleepQ, notes }` |
| `FOOD_DB` | array[12] | Sample food items with macro data |
| `SLEEP_DATA` | object | Sample sleep stats (duration, stages, bedtime, wake) |
| `WEEK_ACTIVITY` | array[7] | Sample weekly calorie/workout data for WeekTile |
| `loadRoutines()` | fn | Read `hf_routines` from localStorage or return DEFAULT_ROUTINES |
| `saveRoutines(r)` | fn | Write to `hf_routines` in localStorage |

**localStorage keys owned by data.js:** `hf_routines`

---

### `primitives.jsx` — UI building blocks

| Component | Props | Description |
|-----------|-------|-------------|
| `Ring` | `value, max, size, stroke, children` | Circular SVG progress with center slot |
| `Bar` | `value, max, color` | Horizontal progress bar |
| `Slider` | `value, onChange, min, max, step` | Draggable range slider (mouse + touch) |
| `SliderLine` | `label, value, onChange, min, max` | Labeled slider for 0–10 ratings |
| `Stepper` | `min, value, onChange` | +/− buttons with numeric input |
| `Tab` | `label, active, onClick` | Single tab button |

No state except `Slider`/`SliderLine` (drag tracking). No API calls. No localStorage.

---

### `App.jsx` — Root component

**Responsibilities:**
- Auth gate: shows `AuthScreen` if no valid token
- Fetches current user (`getMe`) and goals (`getGoals`) on mount
- Manages `activeDate` (ISO string) — passed as `date` prop to all panels
- Controls `theme` (dark/light) and `unit` (kg/lb)
- Renders `DesktopDashboard` or `MobileDashboard` based on viewport width
- `DayStrip` at the top of both layouts — user picks a date → all panels re-fetch

**Key state:**

| State | Type | Description |
|-------|------|-------------|
| `user` | object\|null | Current logged-in user |
| `authChecked` | bool | Whether auth state has been resolved |
| `unit` | `'kg'`\|`'lb'` | Weight unit preference |
| `theme` | `'dark'`\|`'light'` | Color theme |
| `isMobile` | bool | Viewport detection |
| `goals` | object | Nutrition goals from API |
| `view` | string | Active panel: `'dashboard'`, `'settings'`, etc. |
| `activeDate` | string | ISO date currently selected in DayStrip |

---

### `workout.jsx` — TRAIN panel

**Exported:** `WorkoutPanel({ date, goals })`

**Key sub-components (all internal):**
- `RestTimer` — 90s countdown with pause/skip
- `AddExerciseSheet` — searchable modal with 36 exercises in 6 muscle groups
- `ExerciseCard` — exercise row with collapsible sets table
- `RoutinePicker` — loads a DEFAULT_ROUTINES entry

**Key state:**
- `workout` — full workout object `{ name, duration, exercises: [{ id, name, sets: [{ weight, reps, done }] }] }`
- `finished` — bool, set to true on `finishWorkout()`
- `restRunning` — bool, controls `RestTimer` visibility
- `showAddEx` — bool, controls `AddExerciseSheet` visibility

**API:** `getLog(date)` on mount, `putLog(date, { workout })` on any change.

---

### `nutrition.jsx` — FUEL panel

**Exported:** `NutritionPanel({ date, goals })`

**Key sub-components (all internal):**
- `MacroBar` — single macro progress bar
- `MealCard` — meal container (breakfast/lunch/snack/dinner)
- `MealItem` — single food item with portion slider + remove button
- `FoodSearch` — modal with search, custom foods tab, new food form

**Key state:**
- `meals` — array[4] of meal objects (mirrors `EMPTY_MEALS` structure)
- `searchOpen` + `searchMealId` — food search modal controls
- Inside `FoodSearch`: `q`, `activeTab`, `customFoods`, `showForm`, `form`, `saving`

**API:** `getLog/putLog` for meals, `getFoods/postFood/deleteFood` for custom foods.

---

### `feel.jsx` — FEEL panel

**Exported:** `FeelPanel({ date })`

**Feel object shape:**
```js
{
  mood: 'ok',            // 'drained' | 'low' | 'ok' | 'good' | 'fire'
  dig: { bloating: false, gas: false, reflux: false, cramps: false, nausea: false, none: true },
  oth: { headache: false, fatigue: false, 'brain fog': false, 'skin rash': false, 'joint pain': false, none: true },
  energy: 5,             // 1–10
  sleepQ: 5,             // 1–10
  notes: ''
}
```

**API:** `getLog(date)` on mount, `putLog(date, { feel })` on every change.

---

### `settings.jsx` — Settings panel

**Exported:** `SettingsPanel({ user, unit, goals, onBack, onSaved })`

**TDEE calculation (`calcGoals`):**
- Formula: Mifflin-St Jeor BMR
- Activity multipliers: sedentary 1.2 / light 1.375 / moderate 1.55 / active 1.725 / very_active 1.9
- Objectives: `lose_fat` = TDEE × 0.8 / `maintain` = TDEE / `build_muscle` = TDEE + 300
- Protein = 2 g/kg body weight, Fat = 25% of calories, Carbs = remainder

**API:** `patchMe(profile)` + `putGoals(manualGoals)` saved together on submit.

---

### `tiles.jsx` — Dashboard cards

| Component | Props | Data source |
|-----------|-------|-------------|
| `DayStrip` | `activeIso, onSelect` | Static (DAYS from data.js) |
| `HeroTile` | `activeDay` | Static mock data |
| `SleepTile` | none | Static `SLEEP_DATA` |
| `WaterTile` | `date` | API: `getLog/putLog` |
| `WeekTile` | none | Static `WEEK_ACTIVITY` |
| `StreakTile` | none | Static mock data |

---

## Dependency graph

```
main.jsx
└── App.jsx
    ├── auth.jsx          → api.js
    ├── tiles.jsx         → api.js, data.js, primitives.jsx
    ├── overview.jsx      → api.js, data.js, primitives.jsx
    ├── workout.jsx       → api.js, data.js, primitives.jsx
    ├── nutrition.jsx     → api.js, data.js, primitives.jsx
    ├── feel.jsx          → api.js, data.js, primitives.jsx
    ├── settings.jsx      → api.js
    ├── api.js            (leaf)
    ├── data.js           (leaf)
    └── primitives.jsx    (leaf)
```

**Core utilities imported by almost everything:** `api.js` (8 files), `data.js` (7 files), `primitives.jsx` (5 files).

---

## Data flow

```
User picks date in DayStrip (App.jsx)
       ↓ activeDate prop
All panels → getLog(activeDate) on useEffect → render data
User edits → putLog(activeDate, { field }) → local state update
```

All panels re-fetch when `date` prop changes. State lives in the API/server, not in React context.

---

## localStorage keys

| Key | Owner | Content |
|-----|-------|---------|
| `hf_token` | `api.js` | JWT auth token |
| `hf_routines` | `data.js` | Custom workout routines array |
| `hf_lang` | `LangContext.jsx` | Active language: `'en'` or `'es'` |

> All other data (meals, workout, feel, water, user profile, goals) lives in the API, not localStorage.

---

## i18n (Internationalization)

**Supported languages:** English (`en`) and Spanish (`es`).  
**No external library** — custom lightweight system with ~2 files.

### Key files

| File | Role |
|------|------|
| `src/i18n.js` | All translation strings for both languages + `t(lang, key, vars)` function |
| `src/LangContext.jsx` | React context, `LangProvider`, `useT()` hook, `useLang()` hook |

### How to use in a component

```jsx
import { useT, useLang } from './LangContext.jsx';

function MyComponent() {
  const t = useT();                        // get translation function
  const { lang, toggleLang } = useLang();  // get lang + toggle (only needed for switcher UI)

  return (
    <div>
      <h1>{t('some.key')}</h1>
      <p>{t('some.key.with.var', { n: 5 })}</p>  {/* → "You have 5 items" */}
      <button onClick={toggleLang}>{t('app.lang')}</button>
    </div>
  );
}
```

### How `t()` works

1. Looks up `key` in the current language dictionary.
2. Falls back to English if the key is missing in the current language.
3. Falls back to the raw key string if not found in English either (visible as a debugging aid).
4. Replaces `{varName}` placeholders with values from the `vars` object.

### Language toggle

- **Default language:** Spanish (`es`).
- **Desktop:** button in the top-right corner (next to theme/unit toggles). Shows the *other* language code (`EN` when current is Spanish, `ES` when current is English).
- **Mobile:** no dedicated button yet — can be added to `AvatarMenu` if needed.
- Persists in `localStorage` under `hf_lang`.

### Adding a new string

1. Add the key to **both** `translations.en` and `translations.es` in `src/i18n.js`.
2. Use `t('your.new.key')` in the component.
3. Keys use dot notation grouped by component/feature (e.g., `workout.finishWorkout`, `feel.sym.BLOATING`).

### Adding a new language

1. Add a matching key object `translations.<code>` in `src/i18n.js`.
2. Update `SUPPORTED` array in `src/LangContext.jsx`.
3. Add a toggle target in `toggleLang()` function.

### Data keys vs display labels

Some arrays double as both data storage keys and display labels (e.g., symptom names in `feel.jsx`, mood IDs). **The data keys are always English** and are never translated — only the display labels rendered in JSX use `t()`. This keeps the API data model language-neutral.

Examples:
- `DIGESTIVE = ['BLOATING', 'GAS', ...]` — stored as-is in `feel.dig` object
- Display: `t('feel.sym.BLOATING')` → `'BLOATING'` (en) or `'HINCHAZÓN'` (es)
- Meal names: `EMPTY_MEALS[0].name = 'BREAKFAST'` — stored in API as-is
- Display: `t('meal.BREAKFAST')` → `'BREAKFAST'` (en) or `'DESAYUNO'` (es)

---

## Styles (`styles.css`)

Single global stylesheet (~36 KB). No CSS modules. Conventions:
- CSS custom properties on `:root` for theme tokens (colors, spacing, radius)
- Dark/light theme via `[data-theme="dark"]` and `[data-theme="light"]` on `<html>`
- Mobile-first, breakpoint at ~768px for desktop layout
- Component styles grouped by file/feature with comment headers

---

## Adding a new panel

1. Create `src/mypanel.jsx` — export `MyPanel({ date, goals })`
2. Use `getLog(date)` in `useEffect([date])` to load data
3. Use `putLog(date, { myField: ... })` to save
4. Import and add to both `DesktopDashboard` and `MobileDashboard` in `App.jsx`
5. Add a `Tab` entry in both layouts
6. Update this CODEMAP

---

## CI/CD & deploy

### How a deploy happens

Every push to `main` triggers the pipeline automatically. No manual steps needed.

```
git push origin main
        │
        ▼
GitHub Actions  (.github/workflows/deploy.yml)
        │
        ├─ 1. Checkout repo
        │
        ├─ 2. Log in to GHCR (GitHub Container Registry)
        │       uses GITHUB_TOKEN (automatic, no secret needed)
        │
        ├─ 3. Build & push frontend image
        │       Dockerfile  →  ghcr.io/<owner>/heyfitness:latest
        │
        ├─ 4. Build & push server image
        │       Dockerfile.server  →  ghcr.io/<owner>/heyfitness-server:latest
        │
        └─ 5. SSH into VPS → deploy
                cd /root/heyfitness
                write .env file (POSTGRES_PASSWORD, JWT_SECRET)
                docker pull both images
                docker compose up -d      ← zero-downtime rolling restart
                docker image prune -f     ← cleanup old layers
```

### Images

| Image | Dockerfile | Registry tag |
|-------|------------|-------------|
| Frontend (nginx + React build) | `Dockerfile` | `ghcr.io/<owner>/heyfitness:latest` |
| API server (Node.js) | `Dockerfile.server` | `ghcr.io/<owner>/heyfitness-server:latest` |

### VPS layout

```
/root/heyfitness/
├── docker-compose.yml   ← lives on VPS only (not in this repo)
└── .env                 ← written by the pipeline on every deploy
```

The `docker-compose.yml` on the VPS wires both containers together:
- Frontend container: internal port 80 → host port 3001
- Server container: internal port 3000 (API)
- VPS nginx (host) proxies `health.heywetsu.cloud:443` → `localhost:3001`

### Dockerfile internals

**Frontend (`Dockerfile`) — multi-stage:**
1. `node:20-alpine` — runs `npm ci` + `npm run build` → produces `/app/dist`
2. `nginx:alpine` — copies `dist/` to `/usr/share/nginx/html`, copies `nginx.conf`
3. Exposes port 80

**`nginx.conf` behavior:**
- Gzip compression for JS/CSS/JSON/SVG (min 1 KB)
- 1-year immutable cache headers for all static assets (`.js`, `.css`, images, fonts)
- SPA fallback: all unknown paths → `index.html` (required for client-side routing)

### Required GitHub secrets

| Secret | Used for |
|--------|----------|
| `VPS_HOST` | SSH target IP (`187.127.21.4`) |
| `VPS_USER` | SSH user (`root`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |
| `POSTGRES_PASSWORD` | Written to `.env` on VPS |
| `JWT_SECRET` | Written to `.env` on VPS |

`GITHUB_TOKEN` is automatic — no setup needed for GHCR push.

### Deploying manually (if Actions is down)

```bash
# 1. Build and push images locally
docker build -t ghcr.io/<owner>/heyfitness:latest .
docker push ghcr.io/<owner>/heyfitness:latest

# 2. SSH into VPS and restart
ssh root@187.127.21.4
cd /root/heyfitness
docker pull ghcr.io/<owner>/heyfitness:latest
docker compose up -d
```

### Local dev (no Docker needed)

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview build → http://localhost:4173
```
