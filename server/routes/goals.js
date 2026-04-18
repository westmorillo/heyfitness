const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM goals WHERE user_id = $1', [req.user.id]);
    res.json(rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/', async (req, res) => {
  const { calories, protein, carbs, fat, water, sleep, steps } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO goals (user_id, calories, protein, carbs, fat, water, sleep, steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         calories = COALESCE($2, goals.calories),
         protein = COALESCE($3, goals.protein),
         carbs = COALESCE($4, goals.carbs),
         fat = COALESCE($5, goals.fat),
         water = COALESCE($6, goals.water),
         sleep = COALESCE($7, goals.sleep),
         steps = COALESCE($8, goals.steps)
       RETURNING *`,
      [req.user.id, calories, protein, carbs, fat, water, sleep, steps]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
