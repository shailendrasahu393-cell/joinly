import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, Heart, Users, MapPin, Shield, Sparkles, CheckCircle } from 'lucide-react'
import { CATEGORIES } from '../utils/constants'

export default function Landing() {
    const navigate = useNavigate()
    const { currentUser } = useAuth()

    useEffect(() => {
      if (currentUser) navigate('/home', { replace: true })
    }, [currentUser, navigate])

    if (currentUser) return null

    return (
        <div className="landing">
            {/* Hero */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-badge">
                        <Sparkles size={14} /> New way to socialize
                    </div>
                    <h1 className="hero-title">
                        Have a plan?<br />
                        <span className="hero-highlight">Find people to join you.</span>
                    </h1>
                    <p className="hero-desc">
                        Movies, food, travel, sports, events, study or just hanging out
                        — create a plan and discover people around your city.
                    </p>
                    <div className="hero-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                            Create a Plan <ArrowRight size={18} />
                        </button>
                        <button className="btn btn-outline btn-lg" onClick={() => navigate('/signup')}>
                            Explore Plans
                        </button>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="section">
                <h2 className="section-title">How JOINLY Works</h2>
                <div className="steps-grid">
                    {[
                        { num: '1', title: 'Create a Plan', desc: 'Already planning something? Post it on JOINLY.', icon: '📝' },
                        { num: '2', title: 'People Discover It', desc: 'Others in your city find and explore your plan.', icon: '🔍' },
                        { num: '3', title: 'Accept & Join', desc: 'Review requests, accept people, and enjoy together.', icon: '🤝' },
                    ].map((step) => (
                        <div key={step.num} className="step-card">
                            <div className="step-icon">{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Popular Activities */}
            <section className="section section-alt">
                <h2 className="section-title">Popular Activities</h2>
                <div className="activities-grid">
                    {CATEGORIES.slice(0, 8).map((cat) => (
                        <div key={cat.id} className="activity-chip">
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why JOINLY */}
            <section className="section">
                <h2 className="section-title">Why JOINLY?</h2>
                <p className="section-desc">
                    Go from <em>"I wish someone could join me"</em> to <em>"Who wants to come?"</em>
                </p>
                <div className="features-grid">
                    {[
                        { icon: Users, title: 'Activity-Focused', desc: 'Not dating, not networking — just finding company for things you already want to do.' },
                        { icon: MapPin, title: 'City-Based', desc: 'Discover plans happening near you. Same city, same vibe.' },
                        { icon: Shield, title: 'Safe & Trusted', desc: 'Meet in public places. Report and block. Your safety matters.' },
                        { icon: CheckCircle, title: 'You Decide', desc: 'Accept or decline requests. Full control over who joins your plan.' },
                    ].map((f) => (
                        <div key={f.title} className="feature-card">
                            <f.icon size={24} style={{ color: 'var(--color-primary)' }} />
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Safety */}
            <section className="section section-alt">
                <div className="safety-box">
                    <Shield size={28} style={{ color: 'var(--color-primary)' }} />
                    <h3>Your Safety Matters</h3>
                    <p>Meet in public places and use your best judgment when meeting someone new.</p>
                    <p>Never share sensitive personal information with people you don't know.</p>
                </div>
            </section>

            {/* CTA */}
            <section className="section cta-section">
                <h2 className="section-title">Your next plan could be better with someone else.</h2>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/signup')}>
                    Get Started <ArrowRight size={18} />
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-logo">JOINLY</div>
                <p>Find people. Join plans. Make memories.</p>
                <p className="footer-about"><a href="/about">About JOINLY</a></p>
              <p className="footer-credit">
                Built with <Heart size={14} fill="currentColor" aria-hidden="true" /> by{' '}
                <a href="https://www.linkedin.com/in/shailendrasahu-/" target="_blank" rel="noreferrer">
                  Shailendra Sahu
                </a>
              </p>
            </footer>

            <style>{`
        .landing { background: var(--color-bg); }

        .hero {
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 20px 40px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 6%, white), color-mix(in srgb, var(--color-secondary) 4%, white));
        }

        .hero-inner { max-width: 600px; text-align: center; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          background: color-mix(in srgb, var(--color-primary) 10%, white);
          color: var(--color-primary);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: 36px;
          font-weight: 800;
          line-height: 1.15;
          color: var(--color-text);
          margin-bottom: 16px;
          letter-spacing: 0;
        }

        .hero-highlight { color: var(--color-primary); }

        .hero-desc {
          font-size: 16px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .section {
          padding: 60px 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-alt {
          background: var(--color-bg-secondary);
          max-width: 100%;
          padding-left: 20px;
          padding-right: 20px;
        }

        .section-alt > * { max-width: 900px; margin-left: auto; margin-right: auto; }

        .section-title {
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 12px;
          color: var(--color-text);
          letter-spacing: 0;
        }

        .section-desc {
          font-size: 16px;
          text-align: center;
          color: var(--color-text-secondary);
          margin-bottom: 32px;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-top: 32px;
        }

        .step-card {
          text-align: center;
          padding: 28px 20px;
          border-radius: var(--radius-lg);
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-light);
        }

        .step-icon { font-size: 36px; margin-bottom: 12px; }
        .step-card h3 { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
        .step-card p { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; }

        .activities-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-top: 24px;
        }

        .activity-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: var(--radius-full);
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          font-size: 14px;
          font-weight: 500;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .feature-card {
          padding: 24px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-light);
          background: var(--color-surface);
        }

        .feature-card h3 { font-size: 16px; font-weight: 700; margin: 12px 0 6px; }
        .feature-card p { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; }

        .safety-box {
          text-align: center;
          padding: 32px 24px;
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
        }

        .safety-box h3 { font-size: 18px; font-weight: 700; margin: 12px 0 8px; }
        .safety-box p { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; }

        .cta-section { text-align: center; padding: 80px 20px; }

        .landing-footer {
          text-align: center;
          padding: 40px 20px;
          border-top: 1px solid var(--color-border-light);
          color: var(--color-text-secondary);
          font-size: 13px;
        }

        .footer-logo {
          font-size: 20px;
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 4px;
        }

        .footer-credit {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 12px;
        }

        .footer-about { margin: 12px 0 0; }

        .footer-about a {
          color: var(--color-primary);
          font-weight: 600;
          text-decoration: none;
        }

        .footer-about a:hover { text-decoration: underline; }

        .footer-credit svg { color: var(--color-primary); }

        .footer-credit a {
          color: var(--color-primary);
          font-weight: 600;
          text-decoration: none;
        }

        .footer-credit a:hover { text-decoration: underline; }

        @media (min-width: 768px) {
          .hero-title { font-size: 48px; }
          .hero-desc { font-size: 18px; }
        }
      `}</style>
        </div>
    )
}
