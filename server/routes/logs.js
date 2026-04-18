const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/:date', async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Fecha inválida' });
  try {
    const { rows } = await db.query(
      'SELECT workout, meals, water, feel, sleep, steps, calories_burned FROM daily_logs WHERE user_id = $1 AND date = $2',
      [req.user.id, date]
    );
    res.json(rows[0] || { workout: null, meals: [], water: 0, feel: null, sleep: null, steps: 0, calories_burned: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:date', async (req, res) => {
  const { date } = req.params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Fecha inválida' });
  const { workout, meals, water, feel, sleep, steps, calories_burned } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO daily_logs (user_id, date, workout, meals, water, feel, sleep, steps, calories_burned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, date) DO UPDATE SET
         workout = COALESCE($3, daily_logs.workout),
         meals = COALESCE($4, daily_logs.meals),
         water = COALESCE($5, daily_logs.water),
         feel = COALESCE($6, daily_logs.feel),
         sleep = COALESCE($7, daily_logs.sleep),
         steps = COALESCE($8, daily_logs.steps),
         calories_burned = COALESCE($9, daily_logs.calories_burned)
       RETURNING *`,
      [req.user.id, date,
        workout !== undefined ? JSON.stringify(workout) : null,
        meals !== undefined ? JSON.stringify(meals) : null,
        water !== undefined ? water : null,
        feel !== undefined ? JSON.stringify(feel) : null,
        sleep !== undefined ? JSON.stringify(sleep) : null,
        steps !== undefined ? steps : null,
        calories_burned !== undefined ? calories_burned : null]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
