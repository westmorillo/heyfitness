import { useState } from 'react';
import { login, register, setToken } from './api.js';

export function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) {
      return setError('Las contraseñas no coinciden');
    }
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const { token, user } = await fn(username.trim(), password);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Error al conectar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--bg-elev)', borderRadius: 16,
        border: '1px solid var(--stroke)', padding: '36px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--accent)', marginBottom: 16,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: '#000' }}>H</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '0.05em' }}>
            HEYFITNESS<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-base)', borderRadius: 8, padding: 4 }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em',
                fontWeight: 600,
                background: mode === m ? 'var(--bg-elev)' : 'transparent',
                color: mode === m ? 'var(--fg)' : 'var(--fg-muted)',
              }}
            >
              {m === 'login' ? 'INGRESAR' : 'REGISTRARSE'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
              USUARIO
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required autoFocus autoComplete="username"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--stroke)', background: 'var(--bg-base)',
                color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--stroke)', background: 'var(--bg-base)',
                color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg-muted)', display: 'block', marginBottom: 6 }}>
                CONFIRMAR
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required autoComplete="new-password"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--stroke)', background: 'var(--bg-base)',
                  color: 'var(--fg)', fontFamily: 'var(--font-sans)', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)',
              color: '#ff8080', fontFamily: 'var(--font-mono)', fontSize: 11,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: '12px 0', borderRadius: 10,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--accent)', color: '#000',
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 13, letterSpacing: '0.08em',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '...' : mode === 'login' ? 'ENTRAR' : 'CREAR CUENTA'}
          </button>
        </form>
      </div>
    </div>
  );
}
