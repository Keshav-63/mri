import React, { useState } from 'react';
import { Mail, MessageSquare, Clock, Send } from 'lucide-react';

const channels = [
  {
    icon: Mail,
    title: 'General Enquiries',
    detail: 'hello@radsight.ai',
    href: 'mailto:hello@radsight.ai',
  },
  {
    icon: MessageSquare,
    title: 'Technical Support',
    detail: 'support@radsight.ai',
    href: 'mailto:support@radsight.ai',
  },
  {
    icon: Clock,
    title: 'Response Time',
    detail: 'Within 24 hours on business days',
    href: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState('');

  const fieldStyle = (name) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', fontSize: '0.88rem',
    borderRadius: '10px', background: 'var(--bg-3)',
    border: `1px solid ${focused === name ? '#EBF542' : 'var(--border)'}`,
    boxShadow: focused === name ? '0 0 0 3px rgba(235,245,66,0.09)' : 'none',
    color: 'var(--text-1)', outline: 'none',
    transition: 'all 0.2s ease',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '60px 24px' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontSize: '0.7rem', fontWeight: '700', color: '#EBF542',
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '16px',
          padding: '5px 14px', borderRadius: '9999px',
          background: 'rgba(235,245,66,0.07)', border: '1px solid rgba(235,245,66,0.18)'
        }}>
          Get in Touch
        </div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: '800',
          fontFamily: 'Outfit', letterSpacing: '-0.04em',
          color: '#F0F0F0', lineHeight: 1.1, marginBottom: '14px'
        }}>
          We'd love to hear from you
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
          Have a question, feedback, or a partnership idea? Drop us a message and we'll get back to you within one business day.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>

        {/* Contact channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {channels.map(({ icon: Icon, title, detail, href }) => (
            <div key={title} className="glass-panel" style={{ padding: '20px 22px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={17} style={{ color: '#EBF542' }} />
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '4px' }}>{title}</p>
                {href
                  ? <a href={href} style={{ color: '#F0F0F0', fontSize: '0.88rem', textDecoration: 'none', fontWeight: '600' }}>{detail}</a>
                  : <p style={{ color: '#F0F0F0', fontSize: '0.88rem', fontWeight: '600' }}>{detail}</p>
                }
              </div>
            </div>
          ))}

          <div className="glass-panel" style={{ padding: '20px 22px' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px' }}>Privacy & Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="mailto:privacy@radsight.ai" style={{ color: 'var(--text-2)', fontSize: '0.85rem', textDecoration: 'none' }}>privacy@radsight.ai</a>
              <a href="mailto:legal@radsight.ai" style={{ color: 'var(--text-2)', fontSize: '0.85rem', textDecoration: 'none' }}>legal@radsight.ai</a>
            </div>
          </div>
        </div>

        {/* Contact form */}
        {sent ? (
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '14px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Send size={22} style={{ color: '#EBF542' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F0F0F0' }}>Message sent!</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              Thanks for reaching out. We'll get back to you within one business day.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</label>
                <input
                  required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                  placeholder="Your name" style={fieldStyle('name')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  placeholder="you@example.com" style={fieldStyle('email')}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subject</label>
              <input
                required value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                onFocus={() => setFocused('subject')} onBlur={() => setFocused('')}
                placeholder="How can we help?" style={fieldStyle('subject')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Message</label>
              <textarea
                required rows={5} value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                onFocus={() => setFocused('message')} onBlur={() => setFocused('')}
                placeholder="Tell us more…"
                style={{ ...fieldStyle('message'), resize: 'vertical', minHeight: '120px', fontFamily: 'inherit' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.9rem' }}>
              <Send size={15} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
