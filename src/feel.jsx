import { useState, useEffect } from 'react';
import { SliderLine } from './primitives.jsx';
import { DEFAULT_FEEL } from './data.js';
import { getLog, putLog } from './api.js';
import { useT } from './LangContext.jsx';

// Data keys — these are stored in the API (feel.dig / feel.oth objects).
// DO NOT translate these arrays; only their display labels are translated via t().
const DIGESTIVE = ['BLOATING', 'GAS', 'REFLUX', 'CRAMPS', 'NAUSEA', 'NONE'];
const OTHER_SYM  = ['HEADACHE', 'FATIGUE', 'BRAIN FOG', 'SKIN RASH', 'JOINT PAIN', 'NONE'];

// Mood ids are also data keys stored in feel.mood.
const MOODS = [
  { id: 'drained', ico: '😮‍💨' },
  { id: 'low',     ico: '😕' },
  { id: 'ok',      ico: '😐' },
  { id: 'good',    ico: '🙂' },
  { id: 'fire',    ico: '⚡' },
];

function SymptomChip({ label, state, onClick }) {
  const cls = state === 'bad' ? 'sym-chip sym-bad' : state === 'good' ? 'sym-chip sym-good' : 'sym-chip';
  return <button className={cls} onClick={onClick}>{label}</button>;
}

export function FeelPanel({ date }) {
  const [feel, setFeel] = useState(DEFAULT_FEEL);
  const t = useT();

  useEffect(() => {
    setFeel(DEFAULT_FEEL);
    if (!date) return;
    getLog(date).then((log) => { if (log.feel) setFeel(log.feel); }).catch(() => {});
  }, [date]);

  const update = (patch) => {
    const next = { ...feel, ...patch };
    setFeel(next);
    if (date) putLog(date, { feel: next }).catch(() => {});
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
          <div className="panel-title">{t('feel.title')}</div>
        </div>
      </div>

      <div className="feel-group">
        <div className="feel-group-label">{t('feel.overallState')}</div>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood-btn ${feel.mood === m.id ? 'mood-active' : ''}`}
              onClick={() => update({ mood: m.id })}
            >
              <span className="mood-ico">{m.ico}</span>
              <span className="mood-label">{t(`feel.mood.${m.id}`)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="feel-group">
        <div className="feel-group-label">{t('feel.digestive')}</div>
        <div className="sym-grid">
          {DIGESTIVE.map((s) => (
            <SymptomChip
              key={s}
              label={t(`feel.sym.${s}`)}
              state={feel.dig[s]}
              onClick={() => toggleSym('dig', feel.dig, s)}
            />
          ))}
        </div>
        <div className="feel-group-label feel-sublabel">{t('feel.other')}</div>
        <div className="sym-grid">
          {OTHER_SYM.map((s) => (
            <SymptomChip
              key={s}
              label={t(`feel.sym.${s}`)}
              state={feel.oth[s]}
              onClick={() => toggleSym('oth', feel.oth, s)}
            />
          ))}
        </div>
      </div>

      <div className="feel-group">
        <SliderLine label={t('feel.energy')} value={feel.energy} onChange={(v) => update({ energy: v })} />
        <SliderLine label={t('feel.sleepQ')} value={feel.sleepQ} onChange={(v) => update({ sleepQ: v })} />
      </div>

      <div className="feel-group">
        <div className="feel-group-label">{t('feel.notes')}</div>
        <textarea
          className="feel-notes"
          placeholder={t('feel.notesPh')}
          value={feel.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>

      <div className="ai-insight">
        <div className="ai-insight-head">{t('feel.aiTitle')}</div>
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

      <button className="btn-primary btn-wide">{t('feel.saveAnalyze')}</button>
    </div>
  );
}
