# HeyFitness — Codex Context

One-stop reference for AI assistants and developers. Read this before touching any file.
When modifying the codebase, update the relevant section here.

## What This App Is

**HeyFitness** is a health and fitness tracker dashboard.

- Frontend SPA built with React and Vite.
- Users authenticate before using the app.
- User data is stored through the API, not directly in app state.
- The UI has no URL router; navigation is state-driven.
- The visual system is custom CSS, with no external UI component library.

## Stack

- React 19 + Vite 8.
- JavaScript only, no TypeScript.
- Custom global CSS in `src/styles.css`.
- API client in `src/api.js`.
- JWT token stored in `localStorage` as `hf_token`.
- Language preference stored in `localStorage` as `hf_lang`.
- Workout routines can be customized and stored in `localStorage` as `hf_routines`.

## Live App And Repo

- Live URL: `https://health.heywetsu.cloud`
- Repo: `github.com/westmorillo/heyfitness`
- VPS: `187.127.21.4` as `root`
- Frontend image: `ghcr.io/westmorillo/heyfitness:latest`
- Server image: `ghcr.io/westmorillo/heyfitness-server:latest`

## File Map

```text
/
├── src/
│   ├── main.jsx         # React entry point, mounts <App />
│   ├── App.jsx          # Auth gate, theme, responsive layout, tab navigation
│   ├── api.js           # HTTP client, auth token helpers, API calls
│   ├── auth.jsx         # Login/register screen
│   ├── data.js          # Static data, defaults, routine localStorage helpers
│   ├── exerciseAssets.js # Exercise name -> instructional image mapping
│   ├── i18n.js          # Translation dictionaries and t() function
│   ├── LangContext.jsx  # LangProvider, useT(), useLang()
│   ├── primitives.jsx   # Ring, Bar, Slider, Stepper, Tab, SliderLine
│   ├── tiles.jsx        # DayStrip, dashboard tiles, water/sleep/week/streak cards
│   ├── overview.jsx     # HOME panel: daily workout + nutrition summary
│   ├── workout.jsx      # TRAIN panel: routines, exercises, sets, rest timer
│   ├── nutrition.jsx    # FUEL panel: meals, macros, foods, custom foods
│   ├── feel.jsx         # FEEL panel: mood, symptoms, energy, sleep quality
│   ├── settings.jsx     # Profile, body metrics, goals
│   └── styles.css       # Global styles and dark/light themes
├── public/
│   ├── exercises/       # Exercise guide images served as static assets
│   ├── favicon.svg
│   └── icons.svg
├── server/              # API server code
├── Dockerfile           # Frontend build -> nginx container
├── Dockerfile.server    # API server container
├── nginx.conf           # Frontend nginx config
└── .github/workflows/
    └── deploy.yml       # Build/push images and deploy to VPS
```

## Screens And Tabs

| Tab | Component | File | Description |
|-----|-----------|------|-------------|
| HOME | `OverviewSummary` | `overview.jsx` | Daily workout and nutrition summary |
| TRAIN | `WorkoutPanel` | `workout.jsx` | Routines, exercises, sets, reps, weights |
| FUEL | `NutritionPanel` | `nutrition.jsx` | Meals, macros, food search, custom foods |
| FEEL | `FeelPanel` | `feel.jsx` | Mood, symptoms, energy, sleep quality, notes |
| Settings | `SettingsPanel` | `settings.jsx` | Profile, body metrics, goals |
| Auth | `AuthScreen` | `auth.jsx` | Login/register |

Desktop uses sidebar navigation. Mobile uses bottom tab navigation. Both layouts are handled in `App.jsx`.

## Authentication

`auth.jsx` lets users log in or register with username and password.

- `login()` and `register()` return `{ user, token }`.
- The JWT is stored in `localStorage` under `hf_token`.
- On reload, `App.jsx` calls `getMe()` to restore the session.
- Invalid/expired tokens are cleared and the login screen is shown.

All API calls go through `src/api.js`.

## API Client

Base URL is `VITE_API_URL`, defaulting to `/api`.

Key exports in `src/api.js`:

```text
getToken()
setToken(token)
clearToken()
login(username, password)
register(username, password)
getMe()
patchMe(data)
getLog(date)
putLog(date, data)
getGoals()
putGoals(data)
getFoods()
postFood(food)
deleteFood(id)
```

Daily app data is read and written through `getLog(date)` and `putLog(date, data)`.

## Data Flow

```text
User picks date in DayStrip
        ↓
App.jsx updates activeDate
        ↓
Panels receive date prop
        ↓
Panels call getLog(activeDate)
        ↓
User edits data
        ↓
Panels call putLog(activeDate, { field })
```

All panels re-fetch when the selected date changes.

## LocalStorage Keys

| Key | Owner | Content |
|-----|-------|---------|
| `hf_token` | `api.js` | JWT auth token |
| `hf_lang` | `LangContext.jsx` | Active language: `en` or `es` |
| `hf_routines` | `data.js` | Custom workout routines |

Workout logs, meals, feel data, water, user profile, goals, and custom foods live in the API.

## Core Components

### `App.jsx`

Responsibilities:

- Auth gate.
- Fetch current user and goals.
- Manage `activeDate`.
- Manage `theme` and `unit`.
- Choose desktop or mobile dashboard based on viewport.
- Render `DayStrip`.
- Open settings.

Important state:

| State | Description |
|-------|-------------|
| `user` | Current logged-in user |
| `authChecked` | Whether auth restore has completed |
| `unit` | Weight unit: `kg` or `lb` |
| `theme` | `dark` or `light` |
| `isMobile` | Viewport detection |
| `goals` | Nutrition/water goals |
| `view` | Active panel |
| `activeDate` | Selected ISO date |

### `workout.jsx`

TRAIN panel.

Internal components:

- `RestTimer`: 90s countdown with +15s and skip.
- `AddExerciseSheet`: searchable exercise modal grouped by muscle.
- `ExerciseCard`: collapsible exercise card with sets table.
- `RoutinePicker`: starts predefined or empty workouts.

Behavior:

- If no workout exists, the user chooses a routine or starts empty.
- Selecting a routine creates a workout object and starts the timer.
- Weight and reps are edited through `Stepper`.
- Completing a set starts the rest timer.
- Finishing a workout stores duration and summary values.
- Changes are auto-saved with a short debounce via `putLog(date, { workout })`.

Exercise image guides:

- Static image files live under `public/exercises/<exercise-slug>/guide.png`.
- Mapping lives in `src/exerciseAssets.js`.
- `AddExerciseSheet` can show thumbnails when a guide exists.
- `ExerciseCard` can show the guide image when expanded.
- Current pilot format is documented in `public/exercises/README.md`.

### `nutrition.jsx`

FUEL panel.

Internal components:

- `MacroBar`: macro progress bar.
- `MealCard`: meal container.
- `MealItem`: food row with portion slider and remove button.
- `FoodSearch`: searchable modal with recent/custom foods and new food form.

Behavior:

- Four meals: breakfast, lunch, snack, dinner.
- Food search includes bundled foods and API custom foods.
- Custom foods are saved with `postFood()`.
- Custom foods can be deleted with `deleteFood()`.
- Portions are adjusted from 0.1x to 3x.
- Meals are saved with `putLog(date, { meals })`.

### `feel.jsx`

FEEL panel.

Feel shape:

```js
{
  mood: 'ok',
  dig: { bloating: false, gas: false, reflux: false, cramps: false, nausea: false, none: true },
  oth: { headache: false, fatigue: false, 'brain fog': false, 'skin rash': false, 'joint pain': false, none: true },
  energy: 5,
  sleepQ: 5,
  notes: ''
}
```

Behavior:

- Mood, digestive symptoms, other symptoms, energy, sleep quality, and notes.
- Selecting `none` clears other symptoms in that group.
- Selecting another symptom disables `none`.
- Saves with `putLog(date, { feel })`.

### `overview.jsx`

HOME summary.

- Reads daily workout and nutrition with `getLog(date)`.
- Shows workout duration, sets, volume, calories, macros, and meals.
- Shows empty states when data is missing.

### `tiles.jsx`

Dashboard tiles:

| Component | Data source |
|-----------|-------------|
| `DayStrip` | Static `DAYS` from `data.js` |
| `HeroTile` | Static mock data |
| `SleepTile` | Static `SLEEP_DATA` |
| `WaterTile` | API `getLog/putLog` |
| `WeekTile` | Static `WEEK_ACTIVITY` |
| `StreakTile` | Static mock data |

Sleep, week, and streak are still mock/static unless wired to the API later.

### `settings.jsx`

Settings panel.

- User profile, body metrics, nutrition goals.
- Uses Mifflin-St Jeor to estimate TDEE when metrics are complete.
- Activity multipliers:
  - sedentary: 1.2
  - light: 1.375
  - moderate: 1.55
  - active: 1.725
  - very active: 1.9
- Objectives:
  - lose fat: TDEE x 0.8
  - maintain: TDEE
  - build muscle: TDEE + 300
- Protein is based on 2 g/kg bodyweight.
- Fat is 25% of calories.
- Carbs are remaining calories.
- Saves with `patchMe(profile)` and `putGoals(goals)`.

### `data.js`

Static constants and defaults:

| Export | Description |
|--------|-------------|
| `DAYS` | 7-day date strip centered on today |
| `GOALS` | Default nutrition/water/sleep/steps goals |
| `DEFAULT_WORKOUT` | Sample workout |
| `DEFAULT_ROUTINES` | Push, Pull, Legs, Upper, Full Body |
| `DEFAULT_MEALS` | Sample meals |
| `EMPTY_MEALS` | Empty meal template |
| `DEFAULT_FEEL` | Empty feel log |
| `FOOD_DB` | Bundled sample foods |
| `SLEEP_DATA` | Static sleep sample |
| `WEEK_ACTIVITY` | Static weekly sample |
| `loadRoutines()` | Reads `hf_routines` or returns defaults |
| `saveRoutines()` | Writes `hf_routines` |

### `primitives.jsx`

Low-level reusable UI:

| Component | Description |
|-----------|-------------|
| `Ring` | Circular SVG progress with center slot |
| `Bar` | Horizontal progress bar |
| `Slider` | Pointer/touch slider |
| `SliderLine` | Labeled 0-10 slider |
| `Stepper` | Plus/minus numeric control |
| `Tab` | Tab button |

No API calls here.

## Internationalization

Supported languages:

- English: `en`
- Spanish: `es`

Files:

- `src/i18n.js`: translation dictionaries and `t(lang, key, vars)`.
- `src/LangContext.jsx`: `LangProvider`, `useT()`, `useLang()`.

How to use:

```jsx
import { useT, useLang } from './LangContext.jsx';

function MyComponent() {
  const t = useT();
  const { lang, toggleLang } = useLang();

  return <button onClick={toggleLang}>{t('app.lang')}</button>;
}
```

Rules:

- Default language is Spanish.
- UI strings should use `t('key')`.
- Add every new key to both `translations.en` and `translations.es`.
- `t()` falls back to English and then the raw key.
- Data keys remain English and language-neutral.
- Display labels are translated at render time.

## Styling

`src/styles.css` is the single global stylesheet.

Conventions:

- CSS custom properties on `:root`.
- Dark/light themes via `[data-theme="dark"]` and `[data-theme="light"]` on `<html>`.
- Mobile-first responsive design.
- Desktop breakpoint is around 768px.
- Component styles are grouped with comment headers.
- No CSS modules.
- No external UI libraries.

## Exercise Image Assets

Exercise images are static files in `public/exercises`.

Current convention:

```text
public/exercises/<exercise-slug>/guide.png
```

Pilot image format:

- Wide 16:9 PNG.
- One complete instructional poster per exercise.
- Five movement steps left to right.
- Spanish title and step copy baked into the image.
- Clean white/off-white background.
- Original manga-inspired HeyFitness athlete style.
- No existing characters, logos, or brand marks.

Map exercise names to assets in `src/exerciseAssets.js`.

Use stable English exercise names in app data. Use Spanish instructional copy inside generated guide images.

## Dependency Graph

```text
main.jsx
└── App.jsx
    ├── auth.jsx          -> api.js
    ├── tiles.jsx         -> api.js, data.js, primitives.jsx
    ├── overview.jsx      -> api.js, data.js, primitives.jsx
    ├── workout.jsx       -> api.js, data.js, primitives.jsx, exerciseAssets.js
    ├── nutrition.jsx     -> api.js, data.js, primitives.jsx
    ├── feel.jsx          -> api.js, data.js, primitives.jsx
    ├── settings.jsx      -> api.js
    ├── api.js            (leaf)
    ├── data.js           (leaf)
    └── primitives.jsx    (leaf)
```

## Adding A New Panel

1. Create `src/mypanel.jsx`.
2. Export `MyPanel({ date, goals })`.
3. Load daily data with `getLog(date)` inside `useEffect([date])`.
4. Save daily data with `putLog(date, { myField })`.
5. Import and render it in both desktop and mobile dashboard flows in `App.jsx`.
6. Add tab/navigation entries in both layouts.
7. Add any visible text to `src/i18n.js`.
8. Update this `AGENTS.md`.

## Coding Conventions

- Components in PascalCase.
- Source files in camelCase unless an existing file uses another convention.
- Prefer existing component and CSS patterns.
- Keep global CSS organized under feature headers.
- Do not add a UI library unless the user explicitly asks.
- Keep data model keys language-neutral, usually English.
- Use `api.js` for all API calls.
- Use `data.js` for static defaults and sample data.
- Update `AGENTS.md` when changing architecture, data flow, deploy, or major feature behavior.

## Local Development Commands

```bash
npm run dev      # Vite dev server -> http://localhost:5173
npm run build    # Production build -> dist/
npm run preview  # Preview production build -> http://localhost:4173
```

Docker local:

```bash
docker build -t heyfitness .
docker run -p 3001:80 heyfitness
```

## CI/CD And Deploy

Push to `main` triggers GitHub Actions.

Pipeline:

```text
git push origin main
        |
        v
.github/workflows/deploy.yml
        |
        |- checkout repo
        |- login to GHCR with GITHUB_TOKEN
        |- build/push frontend image from Dockerfile
        |- build/push server image from Dockerfile.server
        |- SSH into VPS
        |- write .env on VPS
        |- docker pull images
        |- docker compose up -d
        |- docker image prune -f
```

Frontend container:

- Built from `Dockerfile`.
- `node:20-alpine` builds the app.
- `nginx:alpine` serves `dist/`.
- Internal port 80.
- Host port 3001 on VPS.

Server container:

- Built from `Dockerfile.server`.
- Internal port 3000.

VPS nginx proxies:

```text
health.heywetsu.cloud:443 -> localhost:3001
```

VPS layout:

```text
/root/heyfitness/
├── docker-compose.yml   # lives on VPS only
└── .env                 # written by pipeline
```

Required GitHub secrets:

| Secret | Used for |
|--------|----------|
| `VPS_HOST` | SSH target IP |
| `VPS_USER` | SSH user |
| `VPS_SSH_KEY` | Private SSH key |
| `POSTGRES_PASSWORD` | VPS `.env` |
| `JWT_SECRET` | VPS `.env` |

`GITHUB_TOKEN` is automatic for GHCR.

Manual deploy if Actions is down:

```bash
docker build -t ghcr.io/westmorillo/heyfitness:latest .
docker push ghcr.io/westmorillo/heyfitness:latest

ssh root@187.127.21.4
cd /root/heyfitness
docker pull ghcr.io/westmorillo/heyfitness:latest
docker compose up -d
```

## Infrastructure Files

| File | Description |
|------|-------------|
| `Dockerfile` | Frontend multi-stage build and nginx serve |
| `Dockerfile.server` | API server container |
| `nginx.conf` | SPA fallback, gzip, cache headers |
| `.github/workflows/deploy.yml` | Automated deploy pipeline |
| `.dockerignore` | Docker build exclusions |

