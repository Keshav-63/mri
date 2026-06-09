import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  ArrowLeft, FileText, MessageSquare, AlertCircle,
  HelpCircle, User, Stethoscope, Volume2, VolumeX,
  ChevronRight, ShieldAlert, CheckCircle, ListChecks,
  ClipboardList, AlertTriangle, MapPin, Calendar,
  Layers, Crosshair, Send
} from 'lucide-react';

// ─── Markdown helpers ──────────────────────────────────────────────────────────
function parseInlineMarkdown(text) {
  if (!text) return '';
  const tokenRegex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const splitParts = text.split(tokenRegex);
  return splitParts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={idx} className="chat-inline-code">{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={idx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    return part;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;

  const flushList = (key) => {
    if (currentList.length > 0) {
      const Tag = listType === 'ul' ? 'ul' : 'ol';
      elements.push(
        <Tag key={key} style={{ paddingLeft: '20px', listStyleType: listType === 'ul' ? 'disc' : 'decimal', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {currentList.map((item, idx) => (
            <li key={idx} style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>{parseInlineMarkdown(item)}</li>
          ))}
        </Tag>
      );
      currentList = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) { flushList(`lf-${i}`); elements.push(<h3 key={`h3-${i}`} style={{ fontSize: '1.05rem', fontWeight: 'bold', marginTop: '12px', marginBottom: '6px' }}>{parseInlineMarkdown(trimmed.slice(4))}</h3>); continue; }
    if (trimmed.startsWith('## ')) { flushList(`lf-${i}`); elements.push(<h2 key={`h2-${i}`} style={{ fontSize: '1.15rem', fontWeight: 'bold', marginTop: '14px', marginBottom: '8px' }}>{parseInlineMarkdown(trimmed.slice(3))}</h2>); continue; }
    if (trimmed.startsWith('# ')) { flushList(`lf-${i}`); elements.push(<h1 key={`h1-${i}`} style={{ fontSize: '1.3rem', fontWeight: 'bold', marginTop: '16px', marginBottom: '10px' }}>{parseInlineMarkdown(trimmed.slice(2))}</h1>); continue; }
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (isBullet) { if (listType !== 'ul') { flushList(`lf-${i}`); listType = 'ul'; } currentList.push(trimmed.slice(2)); }
    else if (numMatch) { if (listType !== 'ol') { flushList(`lf-${i}`); listType = 'ol'; } currentList.push(numMatch[2]); }
    else {
      flushList(`lf-${i}`);
      if (trimmed === '') elements.push(<div key={`sp-${i}`} style={{ height: '8px' }} />);
      else elements.push(<p key={`p-${i}`} style={{ margin: '4px 0', fontSize: '0.88rem', lineHeight: '1.5' }}>{parseInlineMarkdown(line)}</p>);
    }
  }
  flushList('lf-end');
  return elements;
}

// ─── Severity colour helper ────────────────────────────────────────────────────
const severityColor = (s) => {
  if (s >= 4) return 'hsl(0,84%,60%)';
  if (s >= 3) return 'hsl(38,92%,50%)';
  return 'hsl(142,72%,45%)';
};
const severityLabel = (s) => {
  if (s >= 5) return 'Critical';
  if (s >= 4) return 'High';
  if (s >= 3) return 'Moderate';
  if (s >= 2) return 'Mild';
  return 'Minimal';
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 14, color = 'hsl(var(--accent-cyan))' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 1.5s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Section header helper ─────────────────────────────────────────────────────
const SectionHead = ({ icon: Icon, label, color = 'hsl(var(--accent-cyan))' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
    <Icon size={16} style={{ color, flexShrink: 0 }} />
    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--text-primary))', margin: 0 }}>{label}</h3>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AnalysisPanel({ user, report, onBack }) {
  const reportData = report?.analysis_result || {};

  // Guard: show error state if analysis result is missing or malformed
  const hasData = reportData && (reportData.scan_type || reportData.findings || reportData.impression);

  const patientName = user?.full_name || reportData.patient_name || 'Patient';
  const scanType    = reportData.scan_type  || 'Radiology Scan';
  const studyName   = reportData.study_name || scanType;
  const seriesName  = reportData.series_name || '—';
  const studyDate   = reportData.study_date  || '—';
  const reportDate  = new Date(report?.created_at || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Tab: 'patient' | 'clinical'
  const [activeTab, setActiveTab] = useState('patient');
  const [activeFinding, setActiveFinding] = useState(0); // first finding active by default
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const patientCanvasRef = useRef(null);
  const chatBottomRef = useRef(null);
  const uploadedImageRef = useRef(null);

  // ── Pre-load uploaded scan image ─────────────────────────────────────────
  useEffect(() => {
    if (reportData.uploaded_image_base64) {
      const img = new Image();
      img.src = reportData.uploaded_image_base64;
      img.onload = () => { uploadedImageRef.current = img; drawMRI(); };
    }
  }, [reportData.uploaded_image_base64]);

  // ── Fetch chat history ───────────────────────────────────────────────────
  useEffect(() => { if (report?.id) fetchChatHistory(); }, [report?.id]);

  // ── Redraw canvas on state change ────────────────────────────────────────
  useEffect(() => { drawMRI(); }, [activeFinding, zoom, pan]);

  // ── Scroll chat to bottom ────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Cancel TTS on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);

  // ── Fetch chat from Supabase ─────────────────────────────────────────────
  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages').select('*')
        .eq('report_id', report.id).order('created_at', { ascending: true });
      if (error) throw error;
      setChatMessages(data.map(m => ({ role: m.sender, content: m.content })) || []);
    } catch (err) { console.error('Chat history error:', err.message); }
  };

  // ── Pan / Zoom handlers ──────────────────────────────────────────────────
  const handleMouseDown = (e) => { if (e.button !== 0) return; setIsDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e) => { if (!isDragging) return; setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e) => { e.preventDefault(); const d = 0.05; const next = e.deltaY < 0 ? zoom * (1 + d) : zoom * (1 - d); setZoom(Math.max(0.5, Math.min(4, next))); };
  const handleTouchStart = (e) => { if (e.touches.length === 1) { setIsDragging(true); setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }); } };
  const handleTouchMove = (e) => { if (!isDragging || e.touches.length !== 1) return; setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y }); };

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  // ── Canvas: draw highlights ──────────────────────────────────────────────
  const drawPatientHighlights = (ctx, w, h, activeF) => {
    if (!findings.length) return;

    findings.forEach((f, idx) => {
      if (!f.coordinates) return;

      // Clamp all values to [0, 100] and enforce a minimum visible box size
      const cx = Math.min(Math.max(f.coordinates.x || 0, 0), 95);
      const cy = Math.min(Math.max(f.coordinates.y || 0, 0), 95);
      const cw = Math.min(Math.max(f.coordinates.width  || 10, 5), 100 - cx);
      const ch = Math.min(Math.max(f.coordinates.height || 10, 5), 100 - cy);

      const rx = (cx / 100) * w;
      const ry = (cy / 100) * h;
      const rw = (cw / 100) * w;
      const rh = (ch / 100) * h;

      // Centre of the bounding box — used for the crosshair dot
      const mx = rx + rw / 2;
      const my = ry + rh / 2;

      const isActive = activeF === idx;
      const color    = isActive ? '#06b6d4' : '#ef4444';
      const fillAlpha = isActive ? '38' : '1a'; // hex alpha

      // Bounding rectangle
      ctx.shadowColor = color;
      ctx.shadowBlur  = isActive ? 22 : 10;
      ctx.strokeStyle = color;
      ctx.lineWidth   = isActive ? 3 : 1.5;
      ctx.setLineDash(isActive ? [] : [5, 4]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Fill tint
      ctx.fillStyle = color + fillAlpha;
      ctx.fillRect(rx, ry, rw, rh);

      // Crosshair dot at centre — helps when box is small
      ctx.beginPath();
      ctx.arc(mx, my, isActive ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label — placed above box; clamp so it doesn't fall off the top edge
      const labelY = ry > 18 ? ry - 7 : ry + rh + 14;
      ctx.fillStyle = color;
      ctx.font = `bold ${isActive ? 11 : 10}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText((f.label || 'Finding').toUpperCase(), rx, labelY);
    });
  };

  const drawMRI = () => {
    const canvas = patientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Use the canvas's actual CSS display size for accurate pixel mapping
    const rect   = canvas.getBoundingClientRect();
    const dpr    = window.devicePixelRatio || 1;
    // Only resize if necessary to avoid flicker
    if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
      canvas.width  = Math.round(rect.width  * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
    }
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (uploadedImageRef.current) {
      ctx.drawImage(uploadedImageRef.current, 0, 0, w, h);
      drawPatientHighlights(ctx, w, h, activeFinding);
    } else {
      // Placeholder grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan Uploaded — Awaiting Render', w / 2, h / 2 - 10);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Markings overlay active on upload', w / 2, h / 2 + 15);
    }

    ctx.restore();
  };

  // ── Chat ─────────────────────────────────────────────────────────────────
  const submitChat = async (messageOverride) => {
    const userMsg = (messageOverride || chatInput).trim();
    if (!userMsg || chatLoading) return;
    setChatInput('');
    setChatLoading(true);
    const updated = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updated);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_data: reportData, message_history: updated, new_message: userMsg })
      });
      if (!res.ok) throw new Error('Chat API failed');
      supabase.from('chat_messages').insert({ report_id: report.id, user_id: report.user_id, sender: 'user', content: userMsg }).then(({ error }) => { if (error) console.error(error.message); });
      const reader = res.body.getReader();
      const dec = new TextDecoder('utf-8');
      let done = false, reply = '';
      setChatMessages(prev => [...prev, { role: 'ai', content: '' }]);
      while (!done) {
        const { value, done: rd } = await reader.read();
        done = rd;
        if (value) { reply += dec.decode(value, { stream: !done }); setChatMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: reply }; return u; }); }
      }
      supabase.from('chat_messages').insert({ report_id: report.id, user_id: report.user_id, sender: 'ai', content: reply }).then(({ error }) => { if (error) console.error(error.message); });
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please make sure the backend is running.' }]);
    } finally { setChatLoading(false); }
  };

  const handleChatSubmit = (e) => { e.preventDefault(); submitChat(); };
  const handleQuestionClick = (q) => { submitChat(q); };

  // ── Data with fallbacks — normalise every array and finding shape ───────
  const keyPoints       = Array.isArray(reportData.key_points)       ? reportData.key_points       : [];
  const nextSteps       = Array.isArray(reportData.next_steps)       ? reportData.next_steps       : Array.isArray(reportData.recommendations) ? reportData.recommendations : [];
  const questionsToAsk  = Array.isArray(reportData.questions_to_ask) ? reportData.questions_to_ask : [];
  const safetyNotes     = Array.isArray(reportData.safety_notes)     ? reportData.safety_notes     : [];
  const impression      = Array.isArray(reportData.impression)       ? reportData.impression       : [];
  const recommendations = Array.isArray(reportData.recommendations)  ? reportData.recommendations  : [];

  // Normalise each finding so no field is ever null / undefined
  const findings = (Array.isArray(reportData.findings) ? reportData.findings : [])
    .filter(f => f && typeof f === 'object')
    .map(f => ({
      label:       f.label      || 'Finding',
      category:    f.category   || '—',
      details:     f.details    || '',
      slices:      f.slices     || '—',
      severity:    typeof f.severity   === 'number' ? f.severity   : 1,
      confidence:  typeof f.confidence === 'number' ? f.confidence : 0,
      views:       Array.isArray(f.views) ? f.views : (f.views ? [f.views] : []),
      coordinates: f.coordinates && typeof f.coordinates === 'object' ? f.coordinates : null,
    }));

  // ── Error state — analysis data is missing or could not be parsed ────────
  if (!hasData) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px' }}>
        <button className="btn-secondary" onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px', padding: '8px 14px', borderRadius: '10px' }}>
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <div style={{
          borderRadius: '16px', border: '1px solid rgba(248,113,113,0.25)',
          background: 'rgba(248,113,113,0.05)', padding: '36px 32px', textAlign: 'center'
        }}>
          <AlertCircle size={40} style={{ color: '#F87171', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#F0F0F0', marginBottom: '10px' }}>
            Report data unavailable
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '20px' }}>
            The AI analysis result for this report is missing or could not be parsed.
            This can happen if the scan analysis failed or returned an unexpected format.
            Please go back and try uploading the scan again.
          </p>
          <button className="btn-primary" onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', fontSize: '0.88rem', borderRadius: '10px' }}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── PRINT-ONLY HEADER ─────────────────────────────────────────────── */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #333', paddingBottom: '16px', pageBreakAfter: 'avoid' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#000', fontWeight: 'bold', marginBottom: '4px' }}>RadSight AI — Clinical Radiology Report</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px', color: '#333', fontSize: '0.9rem' }}>
          <div><strong>Patient:</strong> {patientName}</div>
          <div><strong>Study:</strong> {studyName}</div>
          <div><strong>Series:</strong> {seriesName}</div>
          <div><strong>Scan Date:</strong> {studyDate}</div>
          <div><strong>Report Date:</strong> {reportDate}</div>
          <div><strong>Report ID:</strong> {report.id?.substring(0, 8) ?? '—'}</div>
        </div>
      </div>

      {/* ── SCREEN LAYOUT ─────────────────────────────────────────────────── */}
      <div className="portal-container animate-fade-in">

        {/* Top Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '24px' }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="btn-secondary" onClick={onBack}
              style={{ padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={15} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', color: 'hsl(var(--text-primary))', margin: 0 }}>{studyName}</h1>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', marginTop: '2px' }}>
                {seriesName !== '—' ? `${seriesName} · ` : ''}{scanType} · {patientName}
              </p>
            </div>
          </div>
          <button onClick={() => window.print()} className="btn-primary"
            style={{ padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', height: '38px', fontSize: '0.85rem' }}>
            <FileText size={15} /> Download Report
          </button>
        </div>

        {/* ── REPORT METADATA CARD ── */}
        <div className="glass-panel no-print" style={{ padding: '16px 22px', marginBottom: '22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            { icon: User, label: 'Patient', val: patientName },
            { icon: Layers, label: 'Study', val: studyName },
            { icon: Crosshair, label: 'Series', val: seriesName },
            { icon: Calendar, label: 'Scan Date', val: studyDate },
            { icon: Calendar, label: 'Report Date', val: reportDate },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon size={11} />{label}
              </span>
              <span style={{ fontSize: '0.88rem', color: 'hsl(var(--text-primary))', fontWeight: '600' }}>{val}</span>
            </div>
          ))}
        </div>

        <div className="portal-grid">

          {/* ════════════════════════════════════════════════════════
              COLUMN 1 — Patient Scan Viewport
          ════════════════════════════════════════════════════════ */}
          <div className="column-viewports no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Patient Scan · Markings Active
                </span>
                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                  Finding {(activeFinding ?? 0) + 1}/{findings.length}
                </span>
              </div>

              {/* Canvas */}
              <div
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp} onWheel={handleWheel}
                style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-glass)', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
              >
                <canvas ref={patientCanvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

                {/* Zoom controls */}
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '4px', background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(4px)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(4, z + 0.25)); }} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', height: '22px' }}>+</button>
                  <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.25)); }} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px', height: '22px' }}>−</button>
                  <button onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); }} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', height: '22px' }}>↺</button>
                </div>

                {/* Active finding badge */}
                {findings[activeFinding] && (
                  <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '6px', padding: '4px 8px', backdropFilter: 'blur(6px)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: '600' }}>
                      ● {findings[activeFinding].label}
                    </span>
                  </div>
                )}
              </div>

              {/* Finding nav pills */}
              {findings.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {findings.map((f, idx) => (
                    <button key={idx} onClick={() => setActiveFinding(idx)}
                      style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${activeFinding === idx ? '#06b6d4' : 'var(--border-glass)'}`, background: activeFinding === idx ? 'rgba(6,182,212,0.1)' : 'transparent', color: activeFinding === idx ? '#06b6d4' : 'hsl(var(--text-muted))', cursor: 'pointer', transition: 'var(--transition-smooth)', fontWeight: activeFinding === idx ? '700' : '400' }}>
                      {idx + 1}. {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info tip */}
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'start' }}>
              <AlertCircle size={16} style={{ color: 'hsl(var(--accent-cyan))', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.78rem', lineHeight: '1.5' }}>
                Tap a finding pill above to highlight its exact location on the scan. Scroll to zoom, drag to pan.
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════
              COLUMN 2 — Report Document
          ════════════════════════════════════════════════════════ */}
          <div className="column-details" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Tab Switcher */}
            <div className="tabs-container no-print">
              <button className={`tab-btn ${activeTab === 'patient' ? 'active' : ''}`} onClick={() => setActiveTab('patient')}>
                For Patients
              </button>
              <button className={`tab-btn ${activeTab === 'clinical' ? 'active' : ''}`} onClick={() => setActiveTab('clinical')}>
                Clinical View
              </button>
            </div>

            {/* ── FOR PATIENTS TAB ─────────────────────────────── */}
            {activeTab === 'patient' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Summary */}
                <div className="dicom-report-document" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <SectionHead icon={Stethoscope} label="Explanation for Patients" color="hsl(var(--accent-indigo))" />
                    <button onClick={() => speakText(reportData.layman_explanation?.summary)} className="btn-secondary no-print"
                      style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      {speaking ? 'Stop' : 'Read Aloud'}
                    </button>
                  </div>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.7', borderLeft: '3px solid hsl(var(--accent-indigo))', paddingLeft: '14px' }}>
                    {reportData.layman_explanation?.summary || 'The scan shows findings which are summarised below.'}
                  </p>
                </div>

                {/* Key Points */}
                {keyPoints.length > 0 && (
                  <div className="dicom-report-document" style={{ padding: '22px' }}>
                    <SectionHead icon={CheckCircle} label="Key Points" color="hsl(var(--accent-cyan))" />
                    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0 }}>
                      {keyPoints.map((pt, i) => (
                        <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ minWidth: '22px', height: '22px', borderRadius: '50%', background: 'hsl(var(--accent-cyan) / 0.15)', border: '1px solid hsl(var(--accent-cyan) / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'hsl(var(--accent-cyan))', flexShrink: 0, marginTop: '1px' }}>
                            {i + 1}
                          </span>
                          <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.88rem', lineHeight: '1.55' }}>{pt}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Findings on Imaging */}
                <div className="dicom-report-document" style={{ padding: '22px' }}>
                  <SectionHead icon={MapPin} label="Findings Shown on Imaging" color="hsl(0,84%,60%)" />
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginBottom: '12px' }}>
                    Tap a finding to jump to its slice and see it highlighted on the image.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {findings.map((f, idx) => {
                      const isActive = activeFinding === idx;
                      return (
                        <div key={idx} onClick={() => setActiveFinding(idx)}
                          className={`dicom-localized-finding ${isActive ? 'active' : ''}`}
                          style={{ padding: '14px 16px', cursor: 'pointer', borderRadius: '12px', transition: 'var(--transition-smooth)', border: `1px solid ${isActive ? 'rgba(6,182,212,0.3)' : 'var(--border-glass)'}`, background: isActive ? 'rgba(6,182,212,0.06)' : 'transparent' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: isActive ? 'hsl(var(--accent-cyan))' : 'hsl(var(--text-primary))', fontWeight: '600', fontSize: '0.9rem' }}>
                              {isActive ? '● ' : '○ '}{f.label}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>Slice {f.slices}</span>
                              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: `${severityColor(f.severity)}22`, color: severityColor(f.severity), fontWeight: '700', border: `1px solid ${severityColor(f.severity)}44` }}>
                                {severityLabel(f.severity)}
                              </span>
                            </div>
                          </div>
                          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.45', margin: 0 }}>
                            {reportData.layman_explanation?.findings?.find(lf => lf.title?.toLowerCase().includes((f.label || '').split(' ')[0].toLowerCase()))?.explanation || f.details}
                          </p>
                          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                            <span>Show on image · slice {f.slices}</span>
                            <span>Confidence: {f.confidence}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Next Steps */}
                {nextSteps.length > 0 && (
                  <div className="dicom-report-document" style={{ padding: '22px' }}>
                    <SectionHead icon={ListChecks} label="Recommended Next Steps" color="hsl(142,72%,45%)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                      {nextSteps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <ChevronRight size={15} style={{ color: 'hsl(142,72%,45%)', flexShrink: 0, marginTop: '3px' }} />
                          <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.87rem', lineHeight: '1.5' }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Questions to Ask */}
                {questionsToAsk.length > 0 && (
                  <div className="dicom-report-document no-print" style={{ padding: '22px' }}>
                    <SectionHead icon={HelpCircle} label="Questions You May Want to Ask Your Doctor" color="hsl(var(--accent-indigo))" />
                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', marginBottom: '12px' }}>
                      Tap any question to send it directly to the AI assistant below.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {questionsToAsk.map((q, i) => (
                        <button key={i} onClick={() => handleQuestionClick(q)}
                          style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(139,92,246,0.05)', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: '1.4', cursor: 'pointer', transition: 'var(--transition-smooth)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.05)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; }}
                        >
                          <Send size={13} style={{ color: 'hsl(var(--accent-indigo))', flexShrink: 0, marginTop: '2px' }} />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── CLINICAL VIEW TAB ─────────────────────────────── */}
            {activeTab === 'clinical' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Clinical Summary */}
                <div className="dicom-report-document" style={{ padding: '22px' }}>
                  <div className="dicom-report-document__eyebrow" style={{ marginBottom: '6px' }}>Clinical Summary</div>
                  <h2 style={{ fontSize: '1.3rem', color: 'hsl(var(--text-primary))', marginBottom: '12px' }}>{studyName}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                    {[
                      { label: 'Patient', val: patientName },
                      { label: 'Series', val: seriesName },
                      { label: 'Scan Date', val: studyDate },
                      { label: 'Report ID', val: report.id?.substring(0, 8) ?? '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="dicom-report-meta-card">
                        <dt>{label}</dt><dd>{val}</dd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Findings */}
                <div className="dicom-report-document" style={{ padding: '22px' }}>
                  <SectionHead icon={ClipboardList} label="Findings" color="hsl(var(--accent-cyan))" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {findings.map((f, idx) => (
                      <div key={idx} onClick={() => setActiveFinding(idx)}
                        style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${activeFinding === idx ? 'rgba(6,182,212,0.3)' : 'var(--border-glass)'}`, background: activeFinding === idx ? 'rgba(6,182,212,0.05)' : 'rgba(255,255,255,0.01)', cursor: 'pointer', transition: 'var(--transition-smooth)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.88rem', color: 'hsl(var(--text-primary))' }}>✓ {f.label}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', color: 'hsl(var(--accent-cyan))', border: '1px solid rgba(6,182,212,0.2)' }}>Slice {f.slices}</span>
                            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '10px', background: `${severityColor(f.severity)}22`, color: severityColor(f.severity), border: `1px solid ${severityColor(f.severity)}44`, fontWeight: '700' }}>
                              {f.severity}/5 · {severityLabel(f.severity)}
                            </span>
                          </div>
                        </div>
                        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.83rem', lineHeight: '1.5', marginBottom: '8px' }}>{f.details}</p>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                          <span>Category: {f.category}</span>
                          <span>Views: {Array.isArray(f.views) ? f.views.join(', ') : f.views}</span>
                          <span>Confidence: {f.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impression */}
                {impression.length > 0 && (
                  <div className="dicom-report-document" style={{ padding: '22px' }}>
                    <SectionHead icon={Stethoscope} label="Impression" color="hsl(var(--accent-violet))" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {impression.map((imp, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'hsl(var(--accent-violet))', fontWeight: 'bold', flexShrink: 0 }}>▪</span>
                          <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.87rem', lineHeight: '1.5' }}>{imp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Recommendations */}
                {recommendations.length > 0 && (
                  <div className="dicom-report-document" style={{ padding: '22px' }}>
                    <SectionHead icon={ListChecks} label="Recommendations" color="hsl(142,72%,45%)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recommendations.map((rec, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <ChevronRight size={14} style={{ color: 'hsl(var(--accent-cyan))', flexShrink: 0, marginTop: '3px' }} />
                          <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.86rem', lineHeight: '1.5' }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── SAFETY SECTION (always visible) ────────────────── */}
            <div style={{ borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)', padding: '18px' }}>
              <SectionHead icon={ShieldAlert} label="Medical AI Disclaimer & Safety" color="hsl(0,84%,60%)" />

              {safetyNotes.length > 0 && (
                <>
                  <p style={{ color: 'hsl(0,84%,60%)', fontSize: '0.78rem', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={13} /> Seek urgent care if you experience:
                  </p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                    {safetyNotes.map((note, i) => (
                      <li key={i} style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.82rem', display: 'flex', gap: '8px', lineHeight: '1.45' }}>
                        <span style={{ color: 'hsl(0,84%,60%)' }}>•</span>{note}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.78rem', lineHeight: '1.55' }}>
                <strong style={{ color: 'hsl(0,84%,60%)' }}>Important: </strong>
                {reportData.disclaimer || 'This is an AI-generated imaging explanation and is not a diagnosis. It does not replace evaluation by a qualified clinician or formal radiologist review. A human radiologist should confirm all findings using the complete study.'}
              </p>
            </div>

          </div>{/* end column-details */}

        </div>{/* end portal-grid */}
      </div>{/* end portal-container */}

      {/* ════════════════════════════════════════════════════════
          COLUMN 3 — AI Chat (outside grid, fixed sidebar)
      ════════════════════════════════════════════════════════ */}
      <div className="column-chat no-print">
        <div className="glass-panel" style={{ padding: '0px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '16px 18px 0' }}>
            <h2 style={{ fontSize: '1.1rem', color: 'hsl(var(--text-primary))', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'hsl(var(--accent-indigo))' }} />
              RadSight Assistant
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', marginBottom: '10px' }}>
              Ask anything about this report — powered by AI.
            </p>
          </div>

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '260px', marginBottom: '10px' }}>
            {chatMessages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--text-muted))', gap: '8px', padding: '20px' }}>
                <HelpCircle size={28} />
                <p style={{ fontSize: '0.82rem', textAlign: 'center' }}>No messages yet. Ask a question below or tap one of the suggested questions in the report!</p>
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isUser ? <User size={9} /> : <Stethoscope size={9} />}
                      {isUser ? 'You' : 'RadSight Assistant'}
                    </span>
                    <div className={`dicom-chat-bubble ${isUser ? 'user' : 'ai'}`}>
                      {renderMarkdown(msg.content)}
                    </div>
                  </div>
                );
              })
            )}
            {chatLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', marginBottom: '3px' }}>RadSight is thinking…</span>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '10px 14px', borderRadius: '4px 14px 14px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Spinner size={13} />
                  <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>Generating answer…</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Dynamic suggestion pills */}
          {chatMessages.length === 0 && findings.length > 0 && (
            <div style={{ padding: '0 14px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Questions</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                {[
                  `What does "${findings[0]?.label}" mean?`,
                  findings[1] ? `How serious is "${findings[1]?.label}"?` : null,
                  'What should I avoid doing?',
                  'Do I need surgery?',
                ].filter(Boolean).map((q, i) => (
                  <button key={i} onClick={() => handleQuestionClick(q)} className="chat-suggestion-pill">{q}</button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input */}
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px', padding: '0 14px 14px', marginTop: 'auto' }}>
            <input
              type="text" className="glass-input"
              placeholder="Ask about findings, treatment…"
              value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              style={{ height: '38px', fontSize: '0.82rem' }}
            />
            <button type="submit" className="btn-primary" disabled={!chatInput.trim() || chatLoading}
              style={{ width: '70px', height: '38px', fontSize: '0.82rem', flexShrink: 0 }}>
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
