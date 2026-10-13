// src/components/AppNavigation.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { path: '/',            label: 'Home' },
  { path: '/simulator',  label: 'Simulator' },
  { path: '/protocol-lab',label: 'Protocol Lab' },
  { path: '/experiments',label: 'Experiments' },
  { path: '/theory',     label: 'Theory & Exam' },
  { path: '/guide',      label: 'Guide' },
];

export function AppNavigation() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === location.key;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);



  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(7,13,26,0.95)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(56,189,248,0.1)' : 'none',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#000',
          }}>N</div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Net<span style={{ color: '#22d3ee' }}>Vista</span>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 8 }}>ARQ</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul style={{ display: 'flex', gap: 4, listStyle: 'none', alignItems: 'center' }}
            className="nav-desktop">
          {NAV_LINKS.map(link => (
            <li key={link.path}>
              <Link to={link.path} style={{
                padding: '6px 14px', borderRadius: 8,
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
                color: location.pathname === link.path ? '#22d3ee' : '#94a3b8',
                background: location.pathname === link.path ? 'rgba(34,211,238,0.1)' : 'transparent',
                border: location.pathname === link.path ? '1px solid rgba(34,211,238,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-expanded={open}
          onClick={() => setOpenAt(open ? null : location.key)}
          style={{ background: 'none', border: 'none', color: '#f0f9ff', fontSize: 24, cursor: 'pointer' }}
          aria-label="Toggle navigation">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: 'rgba(7,13,26,0.98)', borderTop: '1px solid rgba(56,189,248,0.1)',
          padding: '16px 24px',
        }}>
          {NAV_LINKS.map(link => (
            <Link key={link.path} to={link.path} style={{
              display: 'block', padding: '12px 0',
              color: location.pathname === link.path ? '#22d3ee' : '#94a3b8',
              textDecoration: 'none', fontWeight: 500,
              borderBottom: '1px solid rgba(56,189,248,0.05)',
            }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .nav-desktop { display: none !important; } }
        @media (min-width: 769px) { .nav-hamburger { display: none !important; } }
      `}</style>
    </nav>
  );
}
