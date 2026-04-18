import { useState, useMemo } from 'react';
import { Ring, Bar, Slider } from './primitives.jsx';
import { loadMeals, FOOD_DB, GOALS, save } from './data.js';

function MacroBar({ label, value, goal, color }) {
  return (
    <div className="macro-row">
      <div className="macro-row-top">
        <span className="macro-label">{label}</span>
        <span className="macro-val"><strong>{Math.round(value)}</strong>/{goal}g</span>
      </div>
      <Bar value={value} max={goal} color={color} />
    </div>
  );
}

function MealItem({ item, onChange, onRemove }) {
  const cal = Math.round(item.cal * item.portion);
  const p = +(item.p * item.portion).toFixed(1);
  const c = +(item.c * item.portion).toFixed(1);
  const f = +(item.f * item.portion).toFixed(1);

  return (
    <div className="meal-item">
      <div className="meal-item-head">
        <div>
          <div className="meal-item-name">{item.name}</div>
          <div className="meal-item-meta">{item.brand} · {item.portion}× {item.serving}</div>
        </div>
        <div className="meal-item-cal">
          <span className="meal-cal-num">{cal}</span>
          <span className="meal-cal-unit">kcal</span>
        </div>
      </div>
      <Slider value={item.portion} onChange={(v) => onChange({ ...item, portion: v })} />
      <div className="meal-item-macros">
        <span><em>P</em> {p}g</span>
        <span><em>C</em> {c}g</span>
        <span><em>F</em> {f}g</span>
        <button className="meal-remove" onClick={onRemove}>REMOVE</button>
      </div>
    </div>
  );
}

function MealCard({ meal, onUpdateItem, onRemoveItem, onOpenSearch }) {
  const totals = meal.items.reduce(
    (acc, it) => ({ cal: acc.cal + it.cal * it.portion, p: acc.p + it.p * it.portion }),
    { cal: 0, p: 0 }
  );

  return (
    <div className="meal-card">
      <div className="meal-card-head">
        <div>
          <div className="meal-card-title">{meal.name}</div>
          <div className="meal-card-time">{meal.time}</div>
        </div>
        <div className="meal-card-summary">
          {meal.items.length > 0 ? (
            <>
              <span className="big-num">{Math.round(totals.cal)}</span>
              <span className="tiny-label">KCAL · {Math.round(totals.p)}P</span>
            </>
          ) : (
            <span className="empty-text">NOT LOGGED</span>
          )}
        </div>
      </div>
      {meal.items.length > 0 && (
        <div className="meal-items">
          {meal.items.map((it, i) => (
            <MealItem
              key={it.id + i}
              item={it}
              onChange={(next) => onUpdateItem(meal.id, i, next)}
              onRemove={() => onRemoveItem(meal.id, i)}
            />
          ))}
        </div>
      )}
      <button className="add-food-btn" onClick={() => onOpenSearch(meal.id)}>
        + ADD FOOD
      </button>
    </div>
  );
}

function FoodSearch({ open, onClose, onAdd }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    if (!q.trim()) return FOOD_DB.slice(0, 6);
    const t = q.toLowerCase();
    return FOOD_DB.filter((f) => f.name.toLowerCase().includes(t) || f.brand.toLowerCase().includes(t));
  }, [q]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-head">
          <div>
            <div className="eyebrow">ADD FOOD</div>
            <div className="search-title">QUICK LOG</div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32, fontSize: 18 }}>×</button>
        </div>
        <div className="search-input-wrap">
          <input
            className="search-input"
            placeholder="Search foods, brands, recent..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <div className="search-chips">
          {['RECENT', 'FAVORITES', 'CUSTOM', 'SCAN'].map((c) => (
            <button key={c} className={`chip ${c === 'RECENT' ? 'chip-active' : ''}`}>{c}</button>
          ))}
        </div>
        <div className="search-results">
          {results.map((f) => (
            <button key={f.id} className="food-row" onClick={() => onAdd({ ...f, portion: 1 })}>
              <div>
                <div className="food-name">{f.name}</div>
                <div className="food-brand">{f.brand} · {f.serving}</div>
              </div>
              <div className="food-cal">
                <div className="food-cal-num">{f.cal}</div>
                <div className="food-cal-unit">KCAL</div>
              </div>
            </button>
          ))}
          {results.length === 0 && (
            <div className="empty-state">No matches. Try "chicken" or "yogurt".</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NutritionPanel() {
  const [meals, setMeals] = useState(loadMeals);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMealId, setSearchMealId] = useState(null);

  const saveMeals = (next) => { setMeals(next); save('hf_meals', next); };

  const totals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    meals.forEach((m) => m.items.forEach((it) => {
      cal += it.cal * it.portion;
      p += it.p * it.portion;
      c += it.c * it.portion;
      f += it.f * it.portion;
    }));
    return { cal, p, c, f };
  }, [meals]);

  const updateItem = (mealId, idx, next) => {
    saveMeals(meals.map((m) => m.id !== mealId ? m : {
      ...m,
      items: m.items.map((it, i) => i !== idx ? it : next),
    }));
  };

  const removeItem = (mealId, idx) => {
    saveMeals(meals.map((m) => m.id !== mealId ? m : {
      ...m,
      items: m.items.filter((_, i) => i !== idx),
    }));
  };

  const addItem = (food) => {
    saveMeals(meals.map((m) => m.id !== searchMealId ? m : {
      ...m,
      items: [...m.items, food],
    }));
    setSearchOpen(false);
  };

  const remaining = Math.max(0, GOALS.calories - totals.cal);

  return (
    <div className="panel nutrition-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">NUTRITION</div>
          <div className="panel-title">TODAY'S FUEL</div>
        </div>
        <div className="calorie-summary">
          <Ring value={totals.cal} max={GOALS.calories} size={140} stroke={12}>
            <div className="ring-num">{Math.round(remaining)}</div>
            <div className="ring-label">KCAL LEFT</div>
          </Ring>
        </div>
      </div>

      <div className="macro-grid">
        <MacroBar label="PROTEIN" value={totals.p} goal={GOALS.protein} color="var(--accent)" />
        <MacroBar label="CARBS" value={totals.c} goal={GOALS.carbs} color="#E8E4DC" />
        <MacroBar label="FAT" value={totals.f} goal={GOALS.fat} color="#8A8A8A" />
      </div>

      <div className="meal-list">
        {meals.map((m) => (
          <MealCard
            key={m.id}
            meal={m}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onOpenSearch={(id) => { setSearchMealId(id); setSearchOpen(true); }}
          />
        ))}
      </div>

      <FoodSearch open={searchOpen} onClose={() => setSearchOpen(false)} onAdd={addItem} />
    </div>
  );
}
