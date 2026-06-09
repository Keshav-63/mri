import React from 'react';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you create an account, we collect your name and email address. When you upload a scan, we temporarily process the image or PDF file to generate an AI-powered radiology report. We also collect basic usage logs (request timestamps, file sizes) to maintain service reliability.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your scan files are used solely to generate your report. They are not permanently stored on our servers beyond the retention period described below, are not sold to third parties, and are not used to train AI models without your explicit written consent. Your account information is used to authenticate you and associate reports with your profile.`,
  },
  {
    title: '3. Data Retention',
    body: `Scan files are retained for 90 days after upload to allow you to revisit reports. After 90 days they are permanently deleted. You may request earlier deletion at any time by contacting us. Account data is retained until you delete your account.`,
  },
  {
    title: '4. Third-Party Services',
    body: `We use Google's Gemini API to perform AI analysis of your scans. Your scan data is transmitted to Google's API under their data processing terms. We use Supabase for database and authentication infrastructure. We do not use advertising networks or analytics trackers.`,
  },
  {
    title: '5. Data Security',
    body: `All data is transmitted over TLS/HTTPS. Passwords are hashed using bcrypt and are never stored in plaintext. Access to production databases is restricted to authorised personnel only. We conduct periodic security reviews.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at privacy@radsight.ai. We will respond within 30 days. You may also request a copy of all data we hold about you in a portable format.`,
  },
  {
    title: '7. Children\'s Privacy',
    body: `RadSight AI is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have inadvertently collected such information, we will delete it promptly.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the site. Continued use of the service after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Shield size={20} style={{ color: '#EBF542' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '-0.03em', color: '#F0F0F0' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Last updated: June 2026</p>
        </div>
      </div>

      <p style={{ color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '40px', fontSize: '0.9rem' }}>
        RadSight AI ("we", "us", "our") is committed to protecting your privacy. This policy explains what
        data we collect, how we use it, and the rights you have over it.
      </p>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {sections.map(({ title, body }, i) => (
          <div key={title} style={{
            padding: '28px 0',
            borderBottom: i < sections.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#F0F0F0', marginBottom: '10px' }}>{title}</h2>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: '0.88rem' }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="glass-panel" style={{ marginTop: '40px', padding: '24px 28px' }}>
        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.7 }}>
          Questions about this policy? Reach us at{' '}
          <a href="mailto:privacy@radsight.ai" style={{ color: '#EBF542', textDecoration: 'none' }}>privacy@radsight.ai</a>
        </p>
      </div>
    </div>
  );
}
