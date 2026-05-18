import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

const FEATURES = [
  {
    icon: '☁️',
    title: 'Secure File Storage',
    desc: 'Upload files up to 500MB securely. Access them anytime, from anywhere. Your data never touches our servers unencrypted.',
  },
  {
    icon: '📊',
    title: 'Real-Time Metering',
    desc: 'Every upload, download, and API call is tracked instantly. View daily and monthly breakdowns with analytics charts.',
  },
  {
    icon: '💳',
    title: 'Usage-Based Billing',
    desc: 'Pay only for what you use. Automatic monthly invoices with itemized charges across Free, Standard, and Enterprise plans.',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    desc: 'Login alerts, invoice emails, daily digests, and weekly reports. Full control over what you receive.',
  },
  {
    icon: '🔗',
    title: 'File Sharing',
    desc: 'Generate shareable links with 1-hour expiry. Anyone can download — no account required.',
  },
  {
    icon: '🛡️',
    title: 'Multi-Tenant Isolation',
    desc: 'Each user\'s data is strictly isolated. Role-based access control with full admin oversight.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    highlight: false,
    features: [
      '5 GB free storage',
      '1 GB free uploads/month',
      '1 GB free downloads/month',
      '1,000 free API calls/month',
      '$0.023/GB after free tier',
    ],
  },
  {
    name: 'Standard',
    price: 'Pay as you go',
    period: '',
    highlight: true,
    features: [
      'No free allowances',
      '$0.023/GB storage',
      '$0.008/GB uploads',
      '$0.090/GB downloads',
      '$0.0004 per 1K API calls',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Volume pricing',
    period: '',
    highlight: false,
    features: [
      'No free allowances',
      '$0.018/GB storage',
      '$0.006/GB uploads',
      '$0.070/GB downloads',
      '$0.0003 per 1K API calls',
    ],
  },
]

const STATS = [
  { value: '5 GB', label: 'Free Storage' },
  { value: '500 MB', label: 'Max File Size' },
  { value: '3 Plans', label: 'Pricing Tiers' },
  { value: '99.9%', label: 'Uptime' }
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, sans-serif', color: '#1f2937' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1e3a5f' }}>CloudStore</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAuthenticated ? (
            <Link to="/dashboard" style={btnStyle(true)}>Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" style={btnStyle(false)}>Sign In</Link>
              <Link to="/register" style={btnStyle(true)}>Get Started Free</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        padding: '80px 40px 60px',
        maxWidth: 900, margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#eff6ff', color: '#2563eb',
          fontSize: 13, fontWeight: 600, padding: '4px 14px',
          borderRadius: 20, marginBottom: 24, letterSpacing: 0.5
        }}>
          Multi-Tenant Cloud Object Storage
        </div>
        <h1 style={{
          fontSize: 52, fontWeight: 800, lineHeight: 1.15,
          color: '#1e3a5f', margin: '0 0 20px',
        }}>
          Store. Manage. <span style={{ color: '#2563eb' }}>Scale.</span>
        </h1>
        <p style={{
          fontSize: 20, color: '#6b7280', lineHeight: 1.6,
          maxWidth: 640, margin: '0 auto 36px',
        }}>
          Enterprise-grade file storage with real-time usage metering,
          usage-based billing, and email notifications — built on microservices.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={btnStyle(true, true)}>Start for Free →</Link>
          <Link to="/login" style={btnStyle(false, true)}>Sign In</Link>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{
        background: '#1e3a5f',
        padding: '32px 40px',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24, textAlign: 'center',
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: '#93c5fd' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '72px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>
          Everything you need
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 48 }}>
          Built for developers and teams who need reliable cloud storage infrastructure.
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: 24, borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#fff',
              transition: 'box-shadow 0.2s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a5f', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#f8fafc', padding: '72px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>
            How it works
          </h2>
          <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 48 }}>
            Three simple steps to get started
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { step: '01', title: 'Create Account', desc: 'Register for free. No credit card required. Start on the Free plan with 5 GB storage.' },
              { step: '02', title: 'Upload Files', desc: 'Upload files directly to cloud storage via presigned URLs. Fast, secure, and scalable.' },
              { step: '03', title: 'Track & Pay', desc: 'Monitor real-time usage. Get monthly invoices automatically. Pay only for what you use.' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#2563eb', color: '#fff',
                  fontSize: 18, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>{s.step}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e3a5f', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '72px 40px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#1e3a5f', marginBottom: 8 }}>
          Simple, transparent pricing
        </h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 16, marginBottom: 48 }}>
          Pay only for what you use. No hidden fees.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {PLANS.map(p => (
            <div key={p.name} style={{
              padding: 28, borderRadius: 12,
              border: p.highlight ? '2px solid #2563eb' : '1px solid #e5e7eb',
              background: p.highlight ? '#eff6ff' : '#fff',
              position: 'relative',
            }}>
              {p.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#2563eb', color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                }}>MOST POPULAR</div>
              )}
              <div style={{ fontWeight: 700, fontSize: 18, color: '#1e3a5f', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: p.highlight ? '#2563eb' : '#1f2937', marginBottom: 20 }}>
                {p.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}>{p.period}</span>
              </div>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: 14, color: '#374151' }}>
                  <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
              <Link to="/register" style={{
                ...btnStyle(p.highlight),
                display: 'block', textAlign: 'center', marginTop: 20, textDecoration: 'none',
              }}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: '#1e3a5f',
        padding: '64px 40px', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Ready to get started?
        </h2>
        <p style={{ color: '#93c5fd', fontSize: 18, marginBottom: 32 }}>
          Join CloudStore today. Free tier available — no credit card required.
        </p>
        <Link to="/register" style={btnStyle(true, true)}>Create Free Account →</Link>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 13, color: '#9ca3af',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
          <span style={{ fontWeight: 600, color: '#1e3a5f' }}>CloudStore</span>
          <span>— Cloud Object Storage Platform</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/login" style={{ color: '#6b7280', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: '#6b7280', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>

    </div>
  )
}

function btnStyle(primary, large = false) {
  return {
    display: 'inline-block',
    padding: large ? '14px 28px' : '8px 18px',
    borderRadius: 8,
    fontSize: large ? 16 : 14,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    border: primary ? 'none' : '1px solid #d1d5db',
    background: primary ? '#2563eb' : '#fff',
    color: primary ? '#fff' : '#374151',
  }
}