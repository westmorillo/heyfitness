import { useState, useEffect, useRef, useCallback } from 'react';

export function Stepper({ value, onChange, step = 1, min = 0 }) {
  const [draft, setDraft] = useState(null);

  const commit = (raw) => {
    const n = parseFloat(raw);
    if (!isNaN(n)) onChange(Math.max(min, n));
    setDraft(null);
  };

  return (
    <div className="stepper">
      <button
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="decrease"
      >–</button>
      <input
        className="stepper-val"
        type="number"
        inputMode="decimal"
        value={draft !== null ? draft : value}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => { setDraft(String(value)); e.target.select(); }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { commit(e.target.value); e.target.blur(); } }}
      />
      <button
        className="stepper-btn"
        onClick={() => onChange(value + step)}
        aria-label="increase"
      >+</button>
    </div>
  );
}

export function Ring({ value, max, size = 120, stroke = 10, color = 'var(--accent)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const offset = c * (1 - pct);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--stroke-subtle)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.2,.9,.2,1)' }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Bar({ value, max, color = 'var(--accent)', height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="bar-track" style={{ height }}>
      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Slider({ value, onChange, min = 0.25, max = 4, step = 0.25 }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const onPoint = useCallback((e) => {
    const t = trackRef.current;
    if (!t) return;
    const rect = t.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const raw = min + pct * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, Number(snapped.toFixed(2)))));
  }, [min, max, step, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => onPoint(e);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, onPoint]);

  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      ref={trackRef}
      className="slider-track"
      onMouseDown={(e) => { setDragging(true); onPoint(e); }}
      onTouchStart={(e) => { setDragging(true); onPoint(e); }}
    >
      <div className="slider-fill" style={{ width: `${pct}%` }} />
      <div className="slider-thumb" style={{ left: `${pct}%` }} />
    </div>
  );
}

export function Tab({ active, onClick, children }) {
  return (
    <button className={`tab ${active ? 'tab-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function SliderLine({ label, value, onChange, max = 10 }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const onPt = useCallback((e) => {
    const r = trackRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const pct = Math.max(0, Math.min(1, x / r.width));
    onChange(Math.round(pct * max));
  }, [max, onChange]);

  useEffect(() => {
    if (!drag) return;
    const mv = (e) => onPt(e);
    const up = () => setDrag(false);
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv); window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', mv); window.removeEventListener('touchend', up);
    };
  }, [drag, onPt]);

  const pct = (value / max) * 100;
  return (
    <div className="feel-slider-row">
      <div className="feel-slider-label">{label}</div>
      <div className="feel-slider-track-wrap">
        <span className="feel-slider-min">0</span>
        <div
          ref={trackRef}
          className="feel-slider-track"
          onMouseDown={(e) => { setDrag(true); onPt(e); }}
          onTouchStart={(e) => { setDrag(true); onPt(e); }}
        >
          <div className="feel-slider-fill" style={{ width: `${pct}%` }} />
          <div className="feel-slider-thumb" style={{ left: `${pct}%` }} />
        </div>
        <span className="feel-slider-max">{max}</span>
        <span className="feel-slider-val">{value}</span>
      </div>
    </div>
  );
}
