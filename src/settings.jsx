import { useState, useEffect } from 'react';
import { patchMe, putGoals } from './api.js';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'SEDENTARY',    sub: 'Little or no exercise' },
  { value: 'light',       label: 'LIGHT',         sub: '1–3 days/week' },
  { value: 'moderate',    label: 'MODERATE',      sub: '3–5 days/week' },
  { value: 'active',      label: 'ACTIVE',        sub: '6–7 days/week' },
  { value: 'very_active', label: 'VERY ACTIVE',   sub: 'Physical job or 2×/day' },
];

const OBJECTIVE_OPTIONS = [
  { value: 'lose_fat',       label: 'LOSE FAT',       sub: '–20% calorie deficit' },
  { value: 'maintain',       label: 'MAINTAIN',        sub: 'At TDEE' },
  { value: 'build_muscle',   label: 'BUILD MUSCLE',    sub: '+300 kcal surplus' },
];

function calcGoals(profile) {
  const { weight: w, height: h, age: a, sex, activity_level, objective } = profile;
  if (!w || !h || !a || !sex) return null;
  const bmr = sex === 'male'
    ? 10 * w + 6.25 * h - 5 * a + 5
    : 10 * w + 6.25 * h - 5 * a - 161;
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = bmr * (mult[activity_level] || 1.55);
  const cal = Math.round(
    objective === 'lose_fat' ? tdee * 0.8 :
    objective === 'build_muscle' ? tdee + 300 : tdee
  );
  const protein = Math.round(w * 2);
  const fat = Math.round((cal * 0.25) / 9);
  const carbs = Math.round((cal - protein * 4 - fat * 9) / 4);
  return { calories: cal, protein, carbs: Math.max(0, carbs), fat };
}

function NumInput({ label, value, onChange, unit, min = 0, step = 1 }) {
  return (
    <div className="settings-field">
      <label className="settings-label">{label}</label>
      <div className="settings-input-wrap">
        <input
          type="number"
          className="settings-input"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value === '' ? '' : +e.target.value)}
        />
        {unit && <span className="settings-unit">{unit}</span>}
      </div>
    </div>
  );
}

export function SettingsPanel({ user, unit, goals, onBack, onSaved }) {
  const [profile, setProfile] = useState({
    weight: '',
    goal_weight: '',
    height: '',
    age: '',
    sex: '',
    activity_level: 'moderate',
    objective: 'maintain',
  });

  const [manualGoals, setManualGoals] = useState({
    calories: 2400,
    protein: 180,
    carbs: 260,
    fat: 75,
    water: 8,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        weight:         user.weight         ?? '',
        goal_weight:    user.goal_weight    ?? '',
        height:         user.height         ?? '',
        age:            user.age            ?? '',
        sex:            user.sex            ?? '',
        activity_level: user.activity_level ?? 'moderate',
        objective:      user.objective      ?? 'maintain',
      });
    }
    if (goals) {
      setManualGoals({
        calories: goals.calories ?? 2400,
        protein:  goals.protein  ?? 180,
        carbs:    goals.carbs    ?? 260,
        fat:      goals.fat      ?? 75,
        water:    goals.water    ?? 8,
      });
    }
  }, [user, goals]);

  const calculated = calcGoals(profile);

  useEffect(() => {
    if (calculated) {
      setManualGoals((g) => ({ ...g, ...calculated }));
    }
  }, [profile.weight, profile.height, profile.age, profile.sex, profile.activity_level, profile.objective]);

  const pSet = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const gSet = (k, v) => setManualGoals((g) => ({ ...g, [k]: v }));

  const displayWeight = (kg) => {
    if (kg === '' || kg === null || kg === undefined) return '';
    return unit === 'lb' ? +(kg * 2.20462).toFixed(1) : kg;
  };
  const toKg = (val) => {
    if (val === '' || val === null) return null;
    return unit === 'lb' ? +(val / 2.20462).toFixed(2) : +val;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profilePayload = {
        weight:         toKg(profile.weight),
        goal_weight:    toKg(profile.goal_weight),
        height:         profile.height !== '' ? +profile.height : null,
        age:            profile.age !== '' ? +profile.age : null,
        sex:            profile.sex || null,
        activity_level: profile.activity_level || null,
        objective:      profile.objective || null,
      };
      const [updatedUser, updatedGoals] = await Promise.all([
        patchMe(profilePayload),
        putGoals(manualGoals),
      ]);
      onSaved(updatedUser, updatedGoals);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <button className="settings-back" onClick={onBack}>← BACK</button>
        <div className="settings-title">SETTINGS</div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">BODY METRICS</div>

        <div className="settings-sex-row">
          {['male', 'female'].map((s) => (
            <button
              key={s}
              className={`settings-sex-btn ${profile.sex === s ? 'settings-sex-active' : ''}`}
              onClick={() => pSet('sex', s)}
            >
              {s === 'male' ? 'MALE' : 'FEMALE'}
            </button>
          ))}
        </div>

        <div className="settings-row-2">
          <NumInput
            label={`CURRENT WEIGHT (${unit.toUpperCase()})`}
            value={displayWeight(profile.weight)}
            onChange={(v) => pSet('weight', toKg(v))}
            step={0.1}
          />
          <NumInput
            label={`GOAL WEIGHT (${unit.toUpperCase()})`}
            value={displayWeight(profile.goal_weight)}
            onChange={(v) => pSet('goal_weight', toKg(v))}
            step={0.1}
          />
        </div>

        <div className="settings-row-2">
          <NumInput label="HEIGHT (CM)" value={profile.height} onChange={(v) => pSet('height', v)} />
          <NumInput label="AGE" value={profile.age} onChange={(v) => pSet('age', v)} min={1} />
        </div>

        <div className="settings-field">
          <label className="settings-label">ACTIVITY LEVEL</label>
          <div className="settings-option-list">
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`settings-option ${profile.activity_level === o.value ? 'settings-option-active' : ''}`}
                onClick={() => pSet('activity_level', o.value)}
              >
                <span className="settings-option-label">{o.label}</span>
                <span className="settings-option-sub">{o.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-label">OBJECTIVE</label>
          <div className="settings-option-row">
            {OBJECTIVE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`settings-obj-btn ${profile.objective === o.value ? 'settings-obj-active' : ''}`}
                onClick={() => pSet('objective', o.value)}
              >
                <span className="settings-obj-label">{o.label}</span>
                <span className="settings-obj-sub">{o.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">
          NUTRITION GOALS
          {calculated && <span className="settings-calculated-badge">AUTO-CALCULATED</span>}
        </div>

        {calculated && (
          <div className="settings-tdee-note">
            Based on your metrics. Edit below to override.
          </div>
        )}

        <div className="settings-row-2">
          <NumInput label="CALORIES (KCAL)" value={manualGoals.calories} onChange={(v) => gSet('calories', v)} />
          <NumInput label="WATER (CUPS)" value={manualGoals.water} onChange={(v) => gSet('water', v)} />
        </div>
        <div className="settings-row-3">
          <NumInput label="PROTEIN (G)" value={manualGoals.protein} onChange={(v) => gSet('protein', v)} />
          <NumInput label="CARBS (G)" value={manualGoals.carbs} onChange={(v) => gSet('carbs', v)} />
          <NumInput label="FAT (G)" value={manualGoals.fat} onChange={(v) => gSet('fat', v)} />
        </div>
      </div>

      <button
        className={`btn-primary btn-wide ${saving ? 'btn-loading' : ''}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'SAVING...' : saved ? 'SAVED ✓' : 'SAVE SETTINGS'}
      </button>
    </div>
  );
}
