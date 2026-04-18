# HeyFitness — Claude Context

## ¿Qué es esta app?
**HeyFitness** es un health & fitness tracker dashboard. SPA 100% frontend, sin backend ni base de datos — todo persiste en `localStorage` del browser.

## Stack técnico
- **React 19** + **Vite 8**, JavaScript (sin TypeScript)
- Sin librerías de UI externas — componentes propios con CSS custom
- Sin router (no hay rutas URL, la navegación es por estado)

## Estructura de archivos clave

```
src/
├── App.jsx          # Componente raíz: decide Desktop vs Mobile + navegación entre tabs
├── data.js          # Datos mock y helpers de localStorage
├── primitives.jsx   # Componentes base: Ring (anillo progress), Bar, Tab
├── tiles.jsx        # Cards del dashboard: HeroTile, SleepTile, WaterTile, WeekTile, StreakTile
├── workout.jsx      # Panel TRAIN: ejercicios, series, pesos, PRs
├── nutrition.jsx    # Panel FUEL: comidas, macros (calorías, proteína, carbs, grasas)
├── feel.jsx         # Panel FEEL: bienestar, energía, digestión, notas
├── overview.jsx     # Panel HOME: resumen general del día
└── styles.css       # Estilos principales (~36KB), tema dark/light
```

## Pantallas / tabs
- **HOME** — resumen del día (calorías, pasos, streaks, sueño, agua)
- **TRAIN** — entrenamientos y ejercicios
- **FUEL** — nutrición y macros
- **FEEL** — bienestar subjetivo
- *(RECOVER en desktop)* — sueño y agua

Responsive: `DesktopDashboard` para pantallas grandes, `MobileDashboard` para móvil.

## Persistencia (localStorage)
| Key | Contenido |
|-----|-----------|
| `hf_workout` | Entrenamientos del día |
| `hf_meals` | Comidas registradas |
| `hf_water` | Vasos de agua |
| `hf_feel` | Bienestar/estado del día |
| `hf_unit` | Unidad de peso: `"lb"` o `"kg"` |
| `hf_theme` | Tema: `"dark"` o `"light"` |

## Deploy
- **Dominio:** `health.heywetsu.cloud`
- **VPS:** `187.127.21.4` (root)
- **Contenedor Docker:** `ghcr.io/westmorillo/heyfitness:latest`
- **Puerto interno:** 80 (nginx en el container) → host 3001 → Nginx VPS → 443 HTTPS
- **Repo:** `github.com/westmorillo/heyfitness`

## CI/CD
Push a `main` → GitHub Actions → build imagen Docker → push a GHCR → SSH al VPS → `docker compose up -d`

Secrets de GitHub requeridos: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

## Archivos de infraestructura
| Archivo | Descripción |
|---------|-------------|
| `Dockerfile` | Multi-stage: node:20-alpine build + nginx:alpine serve |
| `nginx.conf` | Config nginx del container (SPA routing + gzip + cache headers) |
| `.github/workflows/deploy.yml` | Pipeline de deploy automático |
| `.dockerignore` | Excluye node_modules, dist, .git, .claude |

## Convenciones de código
- Componentes en PascalCase, archivos en camelCase
- CSS en `styles.css` global (no CSS modules)
- Datos mockeados en `data.js`, fáciles de reemplazar por una API real en el futuro

## Comandos útiles
```bash
npm run dev      # Dev server en localhost:5173
npm run build    # Build de producción → dist/
npm run preview  # Preview del build en localhost:4173

# Docker local
docker build -t heyfitness .
docker run -p 3001:80 heyfitness
```
