import { useState, useEffect } from 'react';
import { SliderLine } from './primitives.jsx';
import { DEFAULT_FEEL } from './data.js';
import { getLog, putLog } from './api.js';

const TODAY = new Date().toISOString().slice(0, 10);

const MOODS = [
  { id: 'drained', label: 'DRAINED', ico: '😮‍💨' },
  { id: 'low', label: 'LOW', ico: '😕' },
  { id: 'ok', label: 'OK', ico: '😐' },
  { id: 'good', label: 'GOOD', ico: '🙂' },
  { id: 'fire', label: 'ON FIRE', ico: '⚡' },
];

const DIGESTIVE = ['BLOATING', 'GAS', 'REFLUX', 'CRAMPS', 'NAUSEA', 'NONE'];
const OTHER_SYM = ['HEADACHE', 'FATIGUE', 'BRAIN FOG', 'SKIN RASH', 'JOINT PAIN', 'NONE'];

function SymptomChip({ label, state, onClick }) {
  const cls = state === 'bad' ? 'sym-chip sym-bad' : state === 'good' ? 'sym-chip sym-good' : 'sym-chip';
  return <button className={cls} onClick={onClick}>{label}</button>;
}

export function FeelPanel() {
  const [feel, setFeel] = useState(DEFAULT_FEEL);

  useEffect(() => {
    getLog(TODAY).then((log) => { if (log.feel) setFeel(log.feel); }).catch(() => {});
  }, []);

  const update = (patch) => {
    const next = { ...feel, ...patch };
    setFeel(next);
    putLog(TODAY, { feel: next }).catch(() => {});
  };

  const toggleSym = (field, map, k) => {
    const next = { ...map };
    if (k === 'NONE') {
      if (next.NONE === 'good') delete next.NONE;
      else { Object.keys(next).forEach((x) => delete next[x]); next.NONE = 'good'; }
    } else {
      delete next.NONE;
      if (next[k] === 'bad') delete next[k];
      else next[k] = 'bad';
    }
    update({ [field]: next });
  };

  const today = new Date();
  const dayLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
    + ' · ' + today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <div className="panel feel-panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">{dayLabel}</div>
          <div className="panel-title">HOW DO YOU FEEL?</div>
        </div>
      </div>

      <div className="feel-group">
        <div className="feel-group-label">OVERALL STATE</div>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood-btn ${feel.mood === m.id ? 'mood-active' : ''}`}
              onClick={() => update({ mood: m.id })}
            >
              <span className="mood-ico">{m.ico}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="feel-group">
        <div className="feel-group-label">DIGESTIVE SYMPTOMS</div>
        <div className="sym-grid">
          {DIGESTIVE.map((s) => (
            <SymptomChip key={s} label={s} state={feel.dig[s]} onClick={() => toggleSym('dig', feel.dig, s)} />
          ))}
        </div>
        <div className="feel-group-label feel-sublabel">OTHER SYMPTOMS</div>
        <div className="sym-grid">
          {OTHER_SYM.map((s) => (
            <SymptomChip key={s} label={s} state={feel.oth[s]} onClick={() => toggleSym('oth', feel.oth, s)} />
          ))}
        </div>
      </div>

      <div className="feel-group">
        <SliderLine label="ENERGY LEVEL" value={feel.energy} onChange={(v) => update({ energy: v })} />
        <SliderLine label="SLEEP QUALITY" value={feel.sleepQ} onChange={(v) => update({ sleepQ: v })} />
      </div>

      <div className="feel-group">
        <div className="feel-group-label">NOTES (OPTIONAL)</div>
        <textarea
          className="feel-notes"
          placeholder="e.g. 'heavy feeling after lunch, drank a lot of coffee…'"
          value={feel.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>

      <div className="ai-insight">
        <div className="ai-insight-head">AI · PATTERN ANALYSIS (LAST 14 DAYS)</div>
        <div className="ai-insight-list">
          <div className="ai-item">
            <span className="ai-dot" />
            <div>
              <strong>Possible lactose sensitivity</strong> — gas and bloating appeared 4/5 times after meals containing dairy.
              <div className="ai-chip">72% correlation</div>
            </div>
          </div>
          <div className="ai-item">
            <span className="ai-dot" />
            <div>
              <strong>Sleep → energy link</strong> — your energy score drops an average of 2.3 pts when sleep score is below 6.
            </div>
          </div>
          <div className="ai-item">
            <span className="ai-dot" />
            <div>
              <strong>High-carb days</strong> show no significant digestive symptoms — no red flags so far.
            </div>
          </div>
        </div>
      </div>

      <button className="btn-primary btn-wide">SAVE &amp; ANALYZE ↗</button>
    </div>
  );
}
