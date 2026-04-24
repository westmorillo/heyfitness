import { useState, useMemo, useEffect } from 'react';
import { Ring, Bar, Slider } from './primitives.jsx';
import { EMPTY_MEALS, FOOD_DB, GOALS } from './data.js';
import { getLog, putLog, getFoods, postFood, patchFood, deleteFood } from './api.js';
import { useT } from './LangContext.jsx';


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
  const t = useT();
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
        <button className="meal-remove" onClick={onRemove}>{t('nutrition.remove')}</button>
      </div>
    </div>
  );
}

function MealCard({ meal, onUpdateItem, onRemoveItem, onOpenSearch }) {
  const t = useT();
  const totals = meal.items.reduce(
    (acc, it) => ({ cal: acc.cal + it.cal * it.portion, p: acc.p + it.p * it.portion }),
    { cal: 0, p: 0 }
  );
  // Translate meal name if a key exists, otherwise show as-is
  const mealName = t(`meal.${meal.name}`) === `meal.${meal.name}` ? meal.name : t(`meal.${meal.name}`);

  return (
    <div className="meal-card">
      <div className="meal-card-head">
        <div>
          <div className="meal-card-title">{mealName}</div>
          <div className="meal-card-time">{meal.time}</div>
        </div>
        <div className="meal-card-summary">
          {meal.items.length > 0 ? (
            <>
              <span className="big-num">{Math.round(totals.cal)}</span>
              <span className="tiny-label">KCAL · {Math.round(totals.p)}P</span>
            </>
          ) : (
            <span className="empty-text">{t('nutrition.notLogged')}</span>
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
        {t('nutrition.addFood')}
      </button>
    </div>
  );
}

const EMPTY_FORM = { name: '', brand: '', serving: '1 serving', cal: '', p: '', c: '', f: '' };

function FoodSearch({ open, onClose, onAdd }) {
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState('RECENT');
  const [customFoods, setCustomFoods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = creating, string = editing food id
  const [saving, setSaving] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!open) { setQ(''); setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); return; }
    getFoods().then(setCustomFoods).catch(() => {});
  }, [open]);

  const handleEdit = (food) => {
    setEditingId(food.id);
    setForm({
      name:    food.name,
      brand:   food.brand   || '',
      serving: food.serving || '1 serving',
      cal:     String(food.cal),
      p:       String(food.p || 0),
      c:       String(food.c || 0),
      f:       String(food.f || 0),
    });
    setShowForm(true);
  };

  const allFoods = useMemo(() => {
    const custom = customFoods.map((f) => ({ ...f, isCustom: true }));
    return activeTab === 'CUSTOM' ? custom : [...FOOD_DB, ...custom];
  }, [customFoods, activeTab]);

  const results = useMemo(() => {
    if (!q.trim()) return allFoods.slice(0, 8);
    const term = q.toLowerCase();
    return allFoods.filter((f) => f.name.toLowerCase().includes(term) || (f.brand || '').toLowerCase().includes(term));
  }, [q, allFoods]);

  const handleDelete = async (id) => {
    try {
      await deleteFood(id);
      setCustomFoods((prev) => prev.filter((f) => f.id !== id));
    } catch {}
  };

  const handleSaveFood = async () => {
    if (!form.name || !form.cal) return;
    setSaving(true);
    try {
      const payload = {
        name:    form.name,
        brand:   form.brand,
        serving: form.serving,
        cal: +form.cal,
        p:  +(form.p || 0),
        c:  +(form.c || 0),
        f:  +(form.f || 0),
      };
      if (editingId) {
        const updated = await patchFood(editingId, payload);
        setCustomFoods((prev) => prev.map((f) => f.id === editingId ? updated : f));
      } else {
        const saved = await postFood(payload);
        setCustomFoods((prev) => [saved, ...prev]);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setActiveTab('CUSTOM');
    } catch {}
    setSaving(false);
  };

  const fSet = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-head">
          <div>
            <div className="eyebrow">{t('nutrition.search.eyebrow')}</div>
            <div className="search-title">{t('nutrition.search.title')}</div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32, fontSize: 18 }}>×</button>
        </div>

        {!showForm ? (
          <>
            <div className="search-input-wrap">
              <input
                className="search-input"
                placeholder={t('nutrition.search.placeholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
            </div>
            <div className="search-chips">
              <button
                className={`chip ${activeTab === 'RECENT' ? 'chip-active' : ''}`}
                onClick={() => setActiveTab('RECENT')}
              >
                {t('nutrition.tab.recent')}
              </button>
              <button
                className={`chip ${activeTab === 'CUSTOM' ? 'chip-active' : ''}`}
                onClick={() => setActiveTab('CUSTOM')}
              >
                {t('nutrition.tab.custom')}
              </button>
              <button className="chip chip-add" onClick={() => setShowForm(true)}>
                {t('nutrition.newFood')}
              </button>
            </div>
            <div className="search-results">
              {results.map((f) => (
                <div key={f.id} className="food-row-wrap">
                  <button className="food-row" onClick={() => onAdd({ ...f, portion: 1 })}>
                    <div>
                      <div className="food-name">
                        {f.name}
                        {f.isCustom && <span className="food-custom-badge">{t('nutrition.customBadge')}</span>}
                      </div>
                      <div className="food-brand">{f.brand} · {f.serving}</div>
                    </div>
                    <div className="food-cal">
                      <div className="food-cal-num">{f.cal}</div>
                      <div className="food-cal-unit">{t('nutrition.kcal')}</div>
                    </div>
                  </button>
                  {f.isCustom && (
                    <>
                      <button className="food-edit-btn" onClick={() => handleEdit(f)} title="Edit">✎</button>
                      <button className="food-delete-btn" onClick={() => handleDelete(f.id)} title="Delete">×</button>
                    </>
                  )}
                </div>
              ))}
              {results.length === 0 && (
                <div className="empty-state">{t('nutrition.noResults')}</div>
              )}
            </div>
          </>
        ) : (
          <div className="new-food-form">
            <div className="new-food-form-title">{editingId ? t('nutrition.form.titleEdit') : t('nutrition.form.title')}</div>
            <div className="nff-row">
              <div className="nff-field nff-wide">
                <label className="nff-label">{t('nutrition.form.name')}</label>
                <input className="nff-input" value={form.name} onChange={(e) => fSet('name', e.target.value)} placeholder={t('nutrition.form.namePh')} />
              </div>
            </div>
            <div className="nff-row">
              <div className="nff-field nff-wide">
                <label className="nff-label">{t('nutrition.form.brand')}</label>
                <input className="nff-input" value={form.brand} onChange={(e) => fSet('brand', e.target.value)} placeholder={t('nutrition.form.brandPh')} />
              </div>
              <div className="nff-field">
                <label className="nff-label">{t('nutrition.form.serving')}</label>
                <input className="nff-input" value={form.serving} onChange={(e) => fSet('serving', e.target.value)} placeholder={t('nutrition.form.servingPh')} />
              </div>
            </div>
            <div className="nff-row">
              <div className="nff-field">
                <label className="nff-label">{t('nutrition.form.kcal')}</label>
                <input className="nff-input" type="number" min="0" value={form.cal} onChange={(e) => fSet('cal', e.target.value)} />
              </div>
              <div className="nff-field">
                <label className="nff-label">{t('nutrition.form.protein')}</label>
                <input className="nff-input" type="number" min="0" value={form.p} onChange={(e) => fSet('p', e.target.value)} />
              </div>
              <div className="nff-field">
                <label className="nff-label">{t('nutrition.form.carbs')}</label>
                <input className="nff-input" type="number" min="0" value={form.c} onChange={(e) => fSet('c', e.target.value)} />
              </div>
              <div className="nff-field">
                <label className="nff-label">{t('nutrition.form.fat')}</label>
                <input className="nff-input" type="number" min="0" value={form.f} onChange={(e) => fSet('f', e.target.value)} />
              </div>
            </div>
            <div className="nff-actions">
              <button className="nff-cancel" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>
                {t('nutrition.form.cancel')}
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveFood}
                disabled={saving || !form.name || !form.cal}
              >
                {saving ? t('nutrition.form.saving') : editingId ? t('nutrition.form.saveEdit') : t('nutrition.form.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function NutritionPanel({ date, goals }) {
  const [meals, setMeals] = useState(EMPTY_MEALS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMealId, setSearchMealId] = useState(null);
  const t = useT();

  const G = goals || GOALS;

  useEffect(() => {
    setMeals(EMPTY_MEALS);
    if (!date) return;
    getLog(date).then((log) => { if (log.meals?.length) setMeals(log.meals); }).catch(() => {});
  }, [date]);

  const saveMeals = (next) => { setMeals(next); if (date) putLog(date, { meals: next }).catch(() => {}); };

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

  const remaining = Math.max(0, G.calories - totals.cal);

  return (
    <div className="panel nutrition-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">{t('nutrition.eyebrow')}</div>
          <div className="panel-title">{t('nutrition.title')}</div>
        </div>
        <div className="calorie-summary">
          <Ring value={totals.cal} max={G.calories} size={140} stroke={12}>
            <div className="ring-num">{Math.round(remaining)}</div>
            <div className="ring-label">{t('nutrition.kcalLeft')}</div>
          </Ring>
        </div>
      </div>

      <div className="macro-grid">
        <MacroBar label={t('nutrition.protein')} value={totals.p} goal={G.protein} color="var(--accent)" />
        <MacroBar label={t('nutrition.carbs')}   value={totals.c} goal={G.carbs}   color="#E8E4DC" />
        <MacroBar label={t('nutrition.fat')}     value={totals.f} goal={G.fat}     color="#8A8A8A" />
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
