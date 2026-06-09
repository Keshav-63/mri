import React from 'react';
import { FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using RadSight AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. These terms apply to all users, including visitors, registered users, and contributors.`,
  },
  {
    title: '2. Description of Service',
    body: `RadSight AI provides AI-powered analysis of radiology images including MRI, CT, and X-ray scans. The Service generates automated reports intended for informational and educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.`,
  },
  {
    title: '3. Medical Disclaimer',
    body: `The AI-generated reports produced by RadSight AI are not medical diagnoses and should not be treated as such. Always consult a qualified and licensed healthcare professional before making any medical decision. RadSight AI expressly disclaims any liability arising from reliance on the Service's output in place of professional medical consultation.`,
  },
  {
    title: '4. Eligibility',
    body: `You must be at least 18 years old to create an account. By using the Service, you represent and warrant that you meet this requirement. Use of the Service on behalf of a minor requires parental or guardian consent.`,
  },
  {
    title: '5. User Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at support@radsight.ai if you suspect unauthorised access. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '6. Acceptable Use',
    body: `You agree not to: upload scan files belonging to another person without their explicit consent; attempt to reverse-engineer or extract model weights from the Service; use the Service for any unlawful purpose; or submit content that is fraudulent, harmful, or misleading. Violation may result in immediate account termination.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All software, designs, trademarks, and content on the platform are the intellectual property of RadSight AI. You may not copy, distribute, or create derivative works without prior written permission. The AI-generated report content is provided to you under a limited, non-exclusive, non-transferable licence for personal use.`,
  },
  {
    title: '8. Limitation of Liability',
    body: `To the maximum extent permitted by law, RadSight AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claims shall not exceed the amount you paid for the Service in the 12 months preceding the claim.`,
  },
  {
    title: '9. Modifications',
    body: `We may update these Terms at any time. Material changes will be communicated with at least 14 days' notice via email or in-app notification. Continued use after the effective date constitutes acceptance. If you do not agree to the updated terms, you must stop using the Service.`,
  },
  {
    title: '10. Governing Law',
    body: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Rajasthan, India.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '60px 24px' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(235,245,66,0.08)', border: '1px solid rgba(235,245,66,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <FileText size={20} style={{ color: '#EBF542' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', letterSpacing: '-0.03em', color: '#F0F0F0' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Last updated: June 2026</p>
        </div>
      </div>

      <p style={{ color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '40px', fontSize: '0.9rem' }}>
        Please read these Terms of Service carefully before using RadSight AI. They govern your access to
        and use of our platform and services.
      </p>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
          Questions about these terms? Contact us at{' '}
          <a href="mailto:legal@radsight.ai" style={{ color: '#EBF542', textDecoration: 'none' }}>legal@radsight.ai</a>
        </p>
      </div>
    </div>
  );
}
