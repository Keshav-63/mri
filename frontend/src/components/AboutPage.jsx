import React from 'react';
import { Brain, Shield, Zap, Globe, Activity, Eye } from 'lucide-react';

const pillars = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    desc: 'Powered by Gemini 2.5 Flash, RadSight AI reads MRI, CT, and X-ray scans with specialist-level accuracy, surfacing findings in seconds.',
  },
  {
    icon: Eye,
    title: 'Visual Overlays',
    desc: 'Every finding is mapped directly onto your scan with bounding-box overlays so clinicians and patients can see exactly what the AI detected.',
  },
  {
    icon: Activity,
    title: 'Dual-Mode Reports',
    desc: 'One scan produces two views: a formal clinical report for specialists and a plain-English explanation patients can actually understand.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Scans are processed ephemerally. We do not sell, share, or use your medical data for model training without explicit consent.',
  },
  {
    icon: Zap,
    title: 'Instant Turnaround',
    desc: 'Analysis completes in under 30 seconds — eliminating the days-long wait common in traditional radiology workflows.',
  },
  {
    icon: Globe,
    title: '12 Languages',
    desc: 'Reports are accessible in English plus 11 major Indian languages, removing language barriers for patients across the country.',
  },
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }} className="animate-fade-in">

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontSize: '0.7rem', fontWeight: '700', color: '#EBF542',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: '16px',
          padding: '5px 14px', borderRadius: '9999px',
          background: 'rgba(235,245,66,0.07)', border: '1px solid rgba(235,245,66,0.18)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EBF542', display: 'inline-block', animation: 'pulse-glow 2s infinite' }}/>
          About RadSight AI
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800',
          fontFamily: 'Outfit', letterSpacing: '-0.04em',
          color: '#F0F0F0', lineHeight: 1.1, marginBottom: '20px'
        }}>
          Radiology intelligence,<br />
          <span style={{ color: '#EBF542' }}>built for everyone.</span>
        </h1>
        <p style={{
          color: 'var(--text-2)', fontSize: '1.05rem',
          maxWidth: '580px', margin: '0 auto', lineHeight: 1.7
        }}>
          RadSight AI brings specialist-grade radiology analysis to patients, general practitioners,
          and clinics that don't have instant access to radiologists.
        </p>
      </div>

      {/* Mission */}
      <div className="glass-panel" style={{ padding: '36px 40px', marginBottom: '48px', borderLeft: '3px solid #EBF542' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', color: '#F0F0F0', marginBottom: '12px' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '0.95rem' }}>
          Diagnostic delays kill. In India alone, the radiologist-to-population ratio is critically low.
          RadSight AI was built to bridge that gap — giving anyone with a scan image a meaningful,
          AI-generated clinical interpretation they can share with their doctor, understand themselves,
          and act on faster.
        </p>
      </div>

      {/* Pillars */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit', color: '#F0F0F0', marginBottom: '24px', textAlign: 'center' }}>
        What We Do
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px', marginBottom: '60px'
      }}>
        {pillars.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-panel" style={{ padding: '24px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <Icon size={18} style={{ color: '#EBF542' }} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#F0F0F0', marginBottom: '8px' }}>{title}</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', lineHeight: 1.7 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)',
        borderRadius: '14px', padding: '24px 28px'
      }}>
        <p style={{ color: '#FBBF24', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Medical Disclaimer
        </p>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.7 }}>
          RadSight AI is an educational and informational tool. It does not replace the judgement of a qualified
          medical professional. Always consult a licensed physician or radiologist before making any medical decisions.
        </p>
      </div>
    </div>
  );
}
