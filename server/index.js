require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/foods', require('./routes/foods'));

const requireAuth = require('./middleware/auth');

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, username, unit, theme, weight, goal_weight, height, age, sex,
              activity_level, objective, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.patch('/api/me', requireAuth, async (req, res) => {
  const { unit, theme, weight, goal_weight, height, age, sex, activity_level, objective } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET
        unit           = COALESCE($2,  unit),
        theme          = COALESCE($3,  theme),
        weight         = COALESCE($4,  weight),
        goal_weight    = COALESCE($5,  goal_weight),
        height         = COALESCE($6,  height),
        age            = COALESCE($7,  age),
        sex            = COALESCE($8,  sex),
        activity_level = COALESCE($9,  activity_level),
        objective      = COALESCE($10, objective)
       WHERE id = $1
       RETURNING id, username, unit, theme, weight, goal_weight, height, age, sex, activity_level, objective`,
      [req.user.id, unit, theme, weight, goal_weight, height, age, sex, activity_level, objective]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.query(sql);
    console.log(`Migration OK: ${file}`);
  }
}

const PORT = process.env.PORT || 3000;
runMigrations()
  .then(() => app.listen(PORT, () => console.log(`Server on :${PORT}`)))
  .catch(err => { console.error('Migration failed:', err); process.exit(1); });
