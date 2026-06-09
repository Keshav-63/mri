import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AnalysisPanel from './components/AnalysisPanel';
import AboutPage from './components/AboutPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import ContactPage from './components/ContactPage';
import { Loader2, Sun, Moon, LogOut } from 'lucide-react';

// ─── Shared Layout Shell (Header + Footer) ────────────────────────────────────
function Shell({ user, onLogout, theme, toggleTheme, currentLang, handleLanguageChange, children }) {
  return (
    <div>
      {/* Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-2)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{
          padding: '0 24px',
          height: '60px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="RadSight AI logo" width="32" height="32" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontWeight: '800', fontSize: '1.18rem', fontFamily: 'Outfit', letterSpacing: '-0.03em', color: '#F0F0F0' }}>
                Rad<span style={{ color: '#EBF542' }}>Sight</span>
              </span>
              <span style={{ fontSize: '0.58rem', fontWeight: '700', color: 'var(--text-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                AI Radiology
              </span>
            </div>
          </a>

          {/* Centre nav links — sits in middle grid cell, always truly centred */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }} className="no-print">
            {[
              { to: '/about',   label: 'About' },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem',
                fontWeight: '600', color: 'var(--text-2)', textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F0F0F0'; e.currentTarget.style.background = 'var(--bg-3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent'; }}
              >{label}</Link>
            ))}
          </nav>

          {/* Right controls — pushed to the right end of their grid cell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            {/* Language selector */}
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select no-print"
              title="Select Language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
              <option value="or">ଓଡ଼ିଆ (Odia)</option>
              <option value="ur">اردو (Urdu)</option>
            </select>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-secondary"
              style={{ padding: '0', borderRadius: '9px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark'
                ? <Sun size={15} style={{ color: '#EBF542' }} />
                : <Moon size={15} style={{ color: 'var(--text-1)' }} />}
            </button>

            {/* Sign Out — only when logged in */}
            {user && (
              <button
                onClick={onLogout}
                className="btn-secondary no-print"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 13px', height: '34px', borderRadius: '9px', fontSize: '0.82rem', fontWeight: '600', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ minHeight: '85vh' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '40px 24px 32px',
        marginTop: '60px',
        color: 'var(--text-3)',
        fontSize: '0.78rem',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '28px', marginBottom: '28px' }}>
            {/* Brand */}
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', fontFamily: 'Outfit', color: '#F0F0F0', marginBottom: '6px' }}>
                Rad<span style={{ color: '#EBF542' }}>Sight</span> AI
              </div>
              <p style={{ maxWidth: '260px', lineHeight: 1.7, color: 'var(--text-3)' }}>
                AI-powered radiology analysis for patients, GPs, and clinics.
              </p>
            </div>
            {/* Links */}
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontWeight: '700', color: 'var(--text-2)', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Product</p>
                {[{ to: '/about', label: 'About' }, { to: '/contact', label: 'Contact' }].map(({ to, label }) => (
                  <div key={to} style={{ marginBottom: '7px' }}>
                    <Link to={to} style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EBF542'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >{label}</Link>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontWeight: '700', color: 'var(--text-2)', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</p>
                {[{ to: '/privacy', label: 'Privacy Policy' }, { to: '/terms', label: 'Terms of Service' }].map(({ to, label }) => (
                  <div key={to} style={{ marginBottom: '7px' }}>
                    <Link to={to} style={{ color: 'var(--text-3)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EBF542'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                    >{label}</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <p>© 2026 RadSight AI. All rights reserved.</p>
            <p>For informational purposes only. Not a substitute for professional medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── /analysis/:reportId route ────────────────────────────────────────────────
function AnalysisRoute({ user, onLogout }) {
  const { reportId } = useParams();
  const navigate = useNavigate();

  // Recover report from localStorage cache
  const report = (() => {
    try {
      const cached = localStorage.getItem(`radsight_report_${reportId}`);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  })();

  // If user not logged in, redirect to auth
  if (!user) return <Navigate to="/" replace />;

  // If report not found in cache, redirect to dashboard
  if (!report) return <Navigate to="/dashboard" replace />;

  return (
    <AnalysisPanel
      user={user}
      report={report}
      onBack={() => navigate('/dashboard')}
    />
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() =>
    localStorage.getItem('radsight_theme') || 'dark'
  );

  const [currentLang, setCurrentLang] = useState(() =>
    localStorage.getItem('radsight_language') || 'en'
  );

  // ── Translation helpers ──────────────────────────────────────────────────
  const triggerGoogleTranslate = (langCode) => {
    let attempts = 0;
    const selectLang = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
      } else if (attempts < 15) {
        attempts++;
        setTimeout(selectLang, 250);
      }
    };
    selectLang();
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem('radsight_language', langCode);

    // Set or clear googtrans cookie
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
    } else {
      document.cookie = 'googtrans=/en/' + langCode + '; path=/;';
      document.cookie = 'googtrans=/en/' + langCode + '; path=/; domain=' + window.location.hostname + ';';
    }

    // Programmatic trigger – fall back to reload (URL preserved by router)
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      window.location.reload(); // URL already contains /analysis/:id so reload restores panel
    }
  };

  // ── Boot: load user & restore language preference ──────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('radsight_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); }
      catch { localStorage.removeItem('radsight_user'); }
    }
    setLoading(false);
  }, []);

  // Restore translation preference on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('radsight_language') || 'en';
    if (savedLang !== 'en') {
      document.cookie = 'googtrans=/en/' + savedLang + '; path=/;';
      document.cookie = 'googtrans=/en/' + savedLang + '; path=/; domain=' + window.location.hostname + ';';
      triggerGoogleTranslate(savedLang);
    }
  }, []);

  // Apply theme class
  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
    localStorage.setItem('radsight_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // ── Auth callbacks ───────────────────────────────────────────────────────
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('radsight_user', JSON.stringify(userData));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('radsight_user');
    navigate('/');
  };

  // ── Navigate to analysis page and cache report ───────────────────────────
  const handleSelectReport = (report) => {
    // Cache report by its ID so /analysis/:id can recover it after a reload
    localStorage.setItem(`radsight_report_${report.id}`, JSON.stringify(report));
    navigate(`/analysis/${report.id}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--bg-primary))',
        color: 'hsl(var(--text-primary))'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <Loader2 size={40} style={{ color: 'hsl(var(--accent-cyan))', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', fontFamily: 'Inter' }}>
            Loading RadSight AI...
          </span>
        </div>
      </div>
    );
  }

  const shellProps = { user, onLogout: handleLogout, theme, toggleTheme, currentLang, handleLanguageChange };

  return (
    <Routes>
      {/* Auth / Landing */}
      <Route path="/" element={
        user
          ? <Navigate to="/dashboard" replace />
          : <Shell {...shellProps}><Auth onAuthSuccess={handleAuthSuccess} /></Shell>
      } />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        !user
          ? <Navigate to="/" replace />
          : <Shell {...shellProps}>
              <Dashboard user={user} onSelectReport={handleSelectReport} />
            </Shell>
      } />

      {/* Analysis page – URL survives translation reload */}
      <Route path="/analysis/:reportId" element={
        <Shell {...shellProps}>
          <AnalysisRoute user={user} onLogout={handleLogout} />
        </Shell>
      } />

      {/* Standard pages */}
      <Route path="/about"   element={<Shell {...shellProps}><AboutPage /></Shell>} />
      <Route path="/privacy" element={<Shell {...shellProps}><PrivacyPage /></Shell>} />
      <Route path="/terms"   element={<Shell {...shellProps}><TermsPage /></Shell>} />
      <Route path="/contact" element={<Shell {...shellProps}><ContactPage /></Shell>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
