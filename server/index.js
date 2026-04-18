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

const requireAuth = require('./middleware/auth');

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, unit, theme, created_at FROM users WHERE id = $1',
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
  const { unit, theme } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE users SET
        unit = COALESCE($2, unit),
        theme = COALESCE($3, theme)
       WHERE id = $1
       RETURNING id, username, unit, theme`,
      [req.user.id, unit, theme]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

async function runMigrations() {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
  await db.query(sql);
  console.log('Migrations OK');
}

const PORT = process.env.PORT || 3000;
runMigrations()
  .then(() => app.listen(PORT, () => console.log(`Server on :${PORT}`)))
  .catch(err => { console.error('Migration failed:', err); process.exit(1); });
