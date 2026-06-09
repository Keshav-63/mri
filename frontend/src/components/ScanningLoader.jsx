import React, { useState, useEffect } from 'react';

const PHRASES = [
  'Initializing neural scan protocols…',
  'Mapping cortical surface geometry…',
  'Analysing white matter diffusion tensors…',
  'Detecting signal intensity anomalies…',
  'Calibrating T1 and T2 weighted parameters…',
  'Segmenting anatomical structures…',
  'Cross-referencing clinical biomarkers…',
  'Reconstructing volumetric model…',
  'Scanning for perfusion irregularities…',
  'Evaluating axial slice morphology…',
  'Identifying lesion boundaries…',
  'Computing Hounsfield unit distribution…',
  'Tracing neural pathway integrity…',
  'Validating DICOM metadata…',
  'Measuring tissue density gradients…',
  'Detecting contrast enhancement patterns…',
  'Localising findings to anatomical atlas…',
  'Running spectroscopy pattern analysis…',
  'Evaluating cerebrovascular flow…',
  'Checking for mass effect signatures…',
  'Quantifying fluid-attenuated inversion recovery…',
  'Aligning sequences to reference templates…',
  'Mapping diffusion tensor imaging data…',
  'Assessing bone marrow signal characteristics…',
  'Identifying synovial joint irregularities…',
  'Scanning hepatic parenchymal texture…',
  'Evaluating pulmonary interstitium…',
  'Tracing spinal cord signal changes…',
  'Detecting meniscal tear patterns…',
  'Measuring ventricular chamber dimensions…',
  'Quantifying cross-sectional area distribution…',
  'Applying deep radiological pattern recognition…',
  'Correlating multi-planar reconstructions…',
  'Identifying enhancing nodular foci…',
  'Performing voxel-based morphometry…',
  'Evaluating gadolinium uptake kinetics…',
  'Mapping susceptibility-weighted imaging data…',
  'Detecting microhemorrhage signatures…',
  'Computing apparent diffusion coefficient…',
  'Generating radiological impression…',
  'Scoring severity and confidence indices…',
  'Compiling clinical findings summary…',
  'Localising abnormalities to scan coordinates…',
  'Synthesising patient-friendly explanation…',
  'Computing bounding box coordinates…',
  'Cross-checking against reference anatomy…',
  'Finalising structured diagnostic report…',
  'Verifying output schema integrity…',
  'Preparing clinical recommendations…',
  'Assembling AI-powered analysis report…',
];

export default function ScanningLoader({ visible, progress }) {
  const [displayText, setDisplayText] = useState('');
  const [textOpacity, setTextOpacity] = useState(1);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  // Typewriter loop
  useEffect(() => {
    if (!visible) { setDisplayText(''); return; }

    let cancelled = false;
    let typer = null;
    let t1 = null;
    let t2 = null;

    const typePhrase = (idx) => {
      if (cancelled) return;
      const phrase = PHRASES[idx % PHRASES.length];
      let charIdx = 0;
      setDisplayText('');
      setTextOpacity(1);

      typer = setInterval(() => {
        if (cancelled) { clearInterval(typer); return; }
        charIdx++;
        setDisplayText(phrase.slice(0, charIdx));
        if (charIdx >= phrase.length) {
          clearInterval(typer);
          // Hold → fade out → next phrase
          t1 = setTimeout(() => {
            if (cancelled) return;
            setTextOpacity(0);
            t2 = setTimeout(() => {
              if (!cancelled) typePhrase(idx + 1);
            }, 320);
          }, 950);
        }
      }, 28);
    };

    typePhrase(Math.floor(Math.random() * PHRASES.length));

    return () => {
      cancelled = true;
      clearInterval(typer);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6, 6, 6, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px 36px',
        maxWidth: '460px',
        width: '100%',
      }}>

        {/* ── Logo with orbital rings ── */}
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 44px' }}>

          {/* Outer dashed decorative ring */}
          <div style={{
            position: 'absolute',
            width: 152, height: 152,
            top: -28, left: -28,
            borderRadius: '50%',
            border: '1px dashed rgba(235,245,66,0.12)',
            pointerEvents: 'none',
          }} />

          {/* Outer orbital spinner (slow, reverse) */}
          <div style={{
            position: 'absolute',
            width: 152, height: 152,
            top: -28, left: -28,
            animation: 'spin 9s linear infinite reverse',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: -3, left: '50%', marginLeft: -3,
              width: 6, height: 6,
              borderRadius: '50%',
              background: 'rgba(235,245,66,0.5)',
              boxShadow: '0 0 6px 1px rgba(235,245,66,0.25)',
            }} />
          </div>

          {/* Inner solid ring */}
          <div style={{
            position: 'absolute',
            width: 126, height: 126,
            top: -15, left: -15,
            borderRadius: '50%',
            border: '1px solid rgba(235,245,66,0.20)',
            pointerEvents: 'none',
          }} />

          {/* Inner orbital spinner (fast, forward) */}
          <div style={{
            position: 'absolute',
            width: 126, height: 126,
            top: -15, left: -15,
            animation: 'spin 3s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: -4, left: '50%', marginLeft: -4,
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#EBF542',
              boxShadow: '0 0 12px 3px rgba(235,245,66,0.55)',
            }} />
          </div>

          {/* Logo image */}
          <img
            src="/logo.svg"
            alt="RadSight AI"
            width={96}
            height={96}
            style={{
              display: 'block',
              animation: 'logo-breathe 2.6s ease-in-out infinite',
            }}
          />
        </div>

        {/* ── Brand label ── */}
        <div style={{
          fontSize: '0.65rem',
          fontWeight: '700',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: '24px',
          fontFamily: 'Outfit, sans-serif',
        }}>
          Rad<span style={{ color: 'rgba(235,245,66,0.7)' }}>Sight</span> AI &nbsp;·&nbsp; Analysing
        </div>

        {/* ── Typewriter text ── */}
        <div style={{
          minHeight: '2.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: textOpacity,
          transition: 'opacity 0.32s ease',
        }}>
          <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '1.05rem',
            fontWeight: '600',
            color: '#EBF542',
            letterSpacing: '-0.01em',
          }}>
            {displayText}
          </span>
          {/* Blinking block cursor */}
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '1.05em',
            background: '#EBF542',
            marginLeft: '3px',
            verticalAlign: 'text-bottom',
            borderRadius: '1px',
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.08s',
            flexShrink: 0,
          }} />
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginTop: '40px' }}>
          <div style={{
            width: '100%',
            height: '2px',
            background: 'rgba(235,245,66,0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(235,245,66,0.6) 0%, #EBF542 100%)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 10px rgba(235,245,66,0.45)',
            }} />
          </div>
          <div style={{
            marginTop: '12px',
            fontSize: '0.68rem',
            color: 'rgba(235,245,66,0.5)',
            fontWeight: '700',
            letterSpacing: '0.06em',
          }}>
            {Math.round(progress)}%
          </div>
        </div>

      </div>
    </div>
  );
}
