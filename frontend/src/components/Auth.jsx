import React, { useState } from 'react';
import { Lock, Mail, User, ShieldAlert, CheckCircle, Brain, Eye, Activity, Zap } from 'lucide-react';


const features = [
  { icon: Brain,    label: 'AI Radiology Analysis',  desc: 'Gemma 3N (via NVIDIA) reads MRI, CT & X-ray with specialist-level accuracy' },
  { icon: Eye,      label: 'Visual Finding Overlays', desc: 'Bounding boxes highlight every abnormality directly on your scan image' },
  { icon: Activity, label: 'Clinical + Patient View', desc: 'Dual-mode report: formal clinical findings and plain-English explanations' },
  { icon: Zap,      label: 'AI Chat Assistant',       desc: 'Ask any question about your report and get instant AI-powered answers' },
];

export default function Auth({ onAuthSuccess }) {
  const [isSignUp,   setIsSignUp]   = useState(false);
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [fullName,   setFullName]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [focused,    setFocused]    = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
    const payload  = isSignUp ? { email, password, full_name: fullName } : { email, password };
    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Authentication failed.'); }
      const userData = await res.json();
      if (isSignUp) { setSuccessMsg('Account created! Redirecting…'); setTimeout(() => onAuthSuccess(userData), 1400); }
      else { onAuthSuccess(userData); }
    } catch (err) { setError(err.message || 'An error occurred.'); }
    finally { setLoading(false); }
  };

  const switchTab = (v) => { setIsSignUp(v); setError(''); setSuccessMsg(''); };

  const inputStyle = (field) => ({
    paddingLeft: '42px', height: '46px', fontSize: '0.88rem',
    border: `1px solid ${focused === field ? 'var(--accent)' : 'var(--border)'}`,
    boxShadow: focused === field ? '0 0 0 3px rgba(235,245,66,0.1)' : 'none',
    transition: 'all 0.2s ease', borderRadius: '10px',
    background: 'var(--bg-2)',
  });

  return (
    <div style={{ display: 'flex', minHeight: '92vh' }}>

      {/* LEFT — Hero */}
      <div style={{
        flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 50px', borderRight: '1px solid var(--border)',
        background: 'var(--bg-2)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderRadius: '0 0 100% 0', opacity: 0.4, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderRadius: '100% 0 0 0', opacity: 0.4, pointerEvents: 'none' }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '44px' }}>
          <img src="/logo.png" alt="RadSight AI logo" width="54" height="54" />
          <div>
            <div style={{ fontSize: '1.7rem', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1 }}>
              Rad<span style={{ color: 'var(--accent)' }}>Sight</span> AI
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '4px' }}>
              Intelligent Radiology
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: '2.2rem', lineHeight: 1.2, fontWeight: '800', fontFamily: 'Outfit', color: 'var(--text-1)', marginBottom: '14px', letterSpacing: '-0.03em' }}>
          Your scan,<br/>
          <span style={{ color: 'var(--accent)' }}>decoded instantly.</span>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '40px', maxWidth: '360px' }}>
          Upload any MRI, CT, or X-ray and receive a specialist-grade clinical report with AI-powered explanations — in seconds, not days.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', gap: '13px', alignItems: 'flex-start' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-1)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Powered by badge */}
        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', width: 'fit-content' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-glow 2s infinite' }}/>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '700', letterSpacing: '0.05em' }}>
            Powered by NVIDIA · Google Gemma 3N
          </span>
        </div>
      </div>

      {/* RIGHT — Auth Form */}
      <div style={{ flex: '1 1 340px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px 40px', background: 'var(--bg-1)' }}>
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '380px' }}>

          {/* Tab pills */}
          <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {[{ label: 'Sign In', val: false }, { label: 'Create Account', val: true }].map(({ label, val }) => (
              <button key={label} onClick={() => switchTab(val)}
                style={{ flex: 1, padding: '9px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontFamily: 'Nunito Sans', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s ease',
                  background: isSignUp === val ? 'var(--accent)' : 'transparent',
                  color: isSignUp === val ? '#000' : 'var(--text-2)',
                }}>
                {label}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Outfit', color: 'var(--text-1)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: '0.83rem', marginBottom: '24px' }}>
            {isSignUp ? 'Start analysing scans for free.' : 'Sign in to your radiology portal.'}
          </p>

          {/* Alerts */}
          {error && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', padding: '11px 13px', borderRadius: '9px', color: '#F87171', fontSize: '0.82rem', marginBottom: '16px' }}>
              <ShieldAlert size={15} style={{ flexShrink: 0 }} />{error}
            </div>
          )}
          {successMsg && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)', padding: '11px 13px', borderRadius: '9px', color: '#6EE7B7', fontSize: '0.82rem', marginBottom: '16px' }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />{successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: '700', letterSpacing: '0.03em' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                  <input type="text" required placeholder="Dr. Jane Smith" className="glass-input"
                    style={inputStyle('name')} value={fullName} onChange={e => setFullName(e.target.value)}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: '700', letterSpacing: '0.03em' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input type="email" required placeholder="you@example.com" className="glass-input"
                  style={inputStyle('email')} value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: '700', letterSpacing: '0.03em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input type="password" required placeholder="••••••••" className="glass-input"
                  style={inputStyle('pass')} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')} onBlur={() => setFocused('')} />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', height: '46px', fontSize: '0.9rem', marginTop: '6px', borderRadius: '10px' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Processing…
                </span>
              ) : isSignUp ? 'Create Account →' : 'Sign In →'}
            </button>
          </form>

          <p style={{ color: 'var(--text-3)', fontSize: '0.7rem', textAlign: 'center', marginTop: '20px', lineHeight: 1.6 }}>
            For research and informational purposes only.<br/>Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
