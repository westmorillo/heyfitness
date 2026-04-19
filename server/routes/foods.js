const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, brand, serving, cal, p, c, f FROM custom_foods WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/', async (req, res) => {
  const { name, brand = '', serving = '1 serving', cal, p = 0, c = 0, f = 0 } = req.body;
  if (!name || !cal) return res.status(400).json({ error: 'name y cal son requeridos' });
  try {
    const { rows } = await db.query(
      `INSERT INTO custom_foods (user_id, name, brand, serving, cal, p, c, f)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, brand, serving, cal, p, c, f`,
      [req.user.id, name, brand, serving, cal, p, c, f]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM custom_foods WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
