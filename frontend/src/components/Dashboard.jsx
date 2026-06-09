import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Calendar, HardDrive, AlertTriangle, Brain, Activity, ChevronRight } from 'lucide-react';

const Spinner = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="#EBF542" strokeWidth="2" strokeLinecap="round"
    style={{ animation: 'spin 1.1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const getSeverity = (report) => {
  const f = report.analysis_result?.findings || [];
  if (!f.length) return { color: '#A0A0A0', label: 'Analysed', bg: '#2A2A2A' };
  const s = Math.max(...f.map(x => x.severity || 1));
  if (s >= 4) return { color: '#F87171', label: 'High',     bg: 'rgba(248,113,113,0.08)' };
  if (s >= 3) return { color: '#FBBF24', label: 'Moderate', bg: 'rgba(251,191,36,0.08)' };
  return         { color: '#6EE7B7', label: 'Mild',     bg: 'rgba(110,231,183,0.08)' };
};

export default function Dashboard({ user, onSelectReport }) {
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive,  setDragActive]  = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);

  useEffect(() => { fetchReports(); }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/reports?user_id=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch reports.');
      setReports(await res.json() || []);
    } catch { setUploadError('Could not reach the backend. Please check the server is running.'); }
    finally { setLoading(false); }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = async (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) await handleFileUpload(e.dataTransfer.files[0]); };
  const handleFileInput = async (e) => { if (e.target.files?.[0]) await handleFileUpload(e.target.files[0]); };

  const handleFileUpload = async (file) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      setUploadError('Unsupported format. Use PDF, JPG, PNG, or WEBP.'); return;
    }
    setUploading(true); setUploadError(''); setUploadPct(0);
    const prog = setInterval(() => setUploadPct(p => p < 82 ? p + Math.random() * 9 : p), 450);
    const form = new FormData();
    form.append('file', file); form.append('user_id', user.id);
    try {
      const res = await fetch('http://localhost:8000/api/analyze', { method: 'POST', body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Analysis failed.'); }
      clearInterval(prog); setUploadPct(100);
      const created = await res.json();
      setTimeout(() => onSelectReport(created), 400);
    } catch (err) { clearInterval(prog); setUploadError(err.message || 'Upload failed.'); }
    finally { setUploading(false); setUploadPct(0); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this report?')) return;
    try {
      await fetch(`http://localhost:8000/api/reports/${id}?user_id=${user.id}`, { method: 'DELETE' });
      setReports(r => r.filter(x => x.id !== id));
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const fmtSize = (b) => { if (!b) return '—'; const k = b / 1024; return k < 1024 ? `${k.toFixed(1)} KB` : `${(k/1024).toFixed(1)} MB`; };
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '36px 24px' }} className="animate-fade-in">

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '-0.03em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '4px' }}>
            Radiology Dashboard
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
            Welcome back, <strong style={{ color: '#F0F0F0' }}>{user.full_name || user.email}</strong>
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {[
            { label: 'Total Scans', val: reports.length, icon: FileText },
            { label: 'Analysed',    val: reports.filter(r => r.analysis_result).length, icon: Brain },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="glass-panel" style={{ padding: '12px 18px', minWidth: '120px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color: '#EBF542' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit', color: '#F0F0F0', lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: '1px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>

        {/* Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Upload size={15} style={{ color: '#EBF542' }} />
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#F0F0F0' }}>Upload New Scan</h2>
          </div>

          {/* Drop zone */}
          <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
            style={{
              borderRadius: '16px', position: 'relative', overflow: 'hidden',
              border: `2px dashed ${dragActive ? '#EBF542' : uploading ? 'rgba(235,245,66,0.3)' : 'var(--border)'}`,
              background: dragActive ? 'rgba(235,245,66,0.04)' : 'var(--bg-3)',
              transition: 'all 0.2s ease',
              minHeight: '200px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '32px 20px',
              cursor: uploading ? 'wait' : 'pointer'
            }}>
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                <Brain size={40} style={{ color: '#EBF542', animation: 'pulse-glow 1.5s infinite' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#F0F0F0', fontWeight: '700', marginBottom: '4px' }}>AI Analysing Scan…</h3>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Processing structures, findings & generating report</p>
                </div>
                <div style={{ width: '100%', height: '3px', background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadPct}%`, background: '#EBF542', borderRadius: '9999px', transition: 'width 0.35s ease' }}/>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#EBF542', fontWeight: '700' }}>{Math.round(uploadPct)}%</span>
              </div>
            ) : (
              <>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(235,245,66,0.07)', border: '1px solid rgba(235,245,66,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Upload size={22} style={{ color: '#EBF542' }} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#F0F0F0', marginBottom: '5px' }}>
                  {dragActive ? 'Drop to analyse' : 'Drag & drop your scan'}
                </h3>
                <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: '18px' }}>
                  MRI · CT · X-ray · PDF, JPG, PNG, WEBP
                </p>
                <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', fontSize: '0.85rem', padding: '9px 20px', borderRadius: '9px' }}>
                  Browse Files
                  <input type="file" style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileInput} />
                </label>
              </>
            )}
          </div>

          {uploadError && (
            <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', padding: '11px 13px', borderRadius: '10px', color: '#F87171', fontSize: '0.8rem', lineHeight: 1.5 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />{uploadError}
            </div>
          )}

          {/* Format tags */}
          <div className="glass-panel" style={{ padding: '13px 15px' }}>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px' }}>Supported Inputs</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {['MRI Scans', 'CT Scans', 'X-Ray', 'DICOM PDF', 'Radiology PDFs'].map(f => (
                <span key={f} style={{ fontSize: '0.7rem', padding: '3px 9px', borderRadius: '9999px', background: 'rgba(235,245,66,0.06)', border: '1px solid rgba(235,245,66,0.14)', color: '#EBF542', fontWeight: '600' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Reports list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Activity size={15} style={{ color: '#EBF542' }} />
              <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#F0F0F0' }}>Previous Reports</h2>
            </div>
            {reports.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: '600' }}>{reports.length} report{reports.length !== 1 ? 's' : ''}</span>}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
          ) : reports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '56px 20px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-4)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FileText size={24} style={{ color: 'var(--text-3)' }} />
              </div>
              <h3 style={{ fontSize: '0.95rem', color: '#F0F0F0', fontWeight: '700', marginBottom: '5px' }}>No reports yet</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', maxWidth: '230px', margin: '0 auto' }}>
                Upload your first scan on the left to generate an AI-powered report.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reports.map((report) => {
                const { color, label, bg } = getSeverity(report);
                const studyName = report.analysis_result?.study_name || report.analysis_result?.scan_type || report.file_name || 'MRI Analysis';
                const findingsCount = report.analysis_result?.findings?.length || 0;
                return (
                  <div key={report.id} onClick={() => onSelectReport(report)}
                    className="glass-panel-interactive"
                    style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '13px', borderRadius: '14px' }}>
                    {/* Icon */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: bg, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Brain size={18} style={{ color }} />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <h4 style={{ color: '#F0F0F0', fontSize: '0.87rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {studyName}
                        </h4>
                        <span style={{ fontSize: '0.63rem', padding: '2px 7px', borderRadius: '9999px', background: bg, color, border: `1px solid ${color}30`, fontWeight: '700', flexShrink: 0 }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={10} />{fmtDate(report.created_at)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <HardDrive size={10} />{fmtSize(report.file_size)}
                        </span>
                        {findingsCount > 0 && (
                          <span style={{ fontSize: '0.7rem', color: '#EBF542', fontWeight: '700' }}>
                            {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
                      <button className="btn-secondary" onClick={(e) => handleDelete(report.id, e)}
                        style={{ padding: '6px', borderRadius: '7px', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)', width: '30px', height: '30px' }}
                        title="Delete">
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={15} style={{ color: 'var(--text-3)', alignSelf: 'center' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
