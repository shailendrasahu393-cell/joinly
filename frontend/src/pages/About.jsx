import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import { ArrowLeft, Heart, ShieldCheck, Sparkles, LockKeyhole, Code2, Users, MapPin, ExternalLink } from 'lucide-react'

const developer = {
    name: 'Shailendra Sahu',
    url: 'https://www.linkedin.com/in/shailendrasahu-/'
}

const Section = ({ id, icon: Icon, title, children }) => (
    <section id={id} className="about-section">
        <div className="about-section-heading">
            <span className="about-icon"><Icon size={19} /></span>
            <h2>{title}</h2>
        </div>
        <div className="about-section-body">{children}</div>
    </section>
)

export default function About() {
    const { hash } = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [hash])

    return (
        <div className="page">
            <MobileHeader title="About JOINLY" showBack />
            <main className="page-content about-page">
                <header className="about-hero">
                    <button className="about-back-button" onClick={() => navigate('/')}><ArrowLeft size={16} /> Back</button>
                    <div className="about-logo">JOINLY</div>
                    <p className="about-kicker">Find people. Join plans. Make memories.</p>
                    <h1>Plans are better together.</h1>
                    <p>JOINLY helps you turn an activity you already want to do into a shared plan with people nearby.</p>
                </header>

                <Section icon={Sparkles} title="Why JOINLY?">
                    <p>Sometimes you have a plan but nobody to go with. JOINLY makes it easier to find company for movies, food, travel, sports, events, study sessions, hobbies, and casual hangouts.</p>
                    <div className="about-benefits">
                        <div><Users size={18} /><strong>Activity-first</strong><span>Connect around a real plan, not awkward small talk.</span></div>
                        <div><MapPin size={18} /><strong>Local discovery</strong><span>Find activities and people in your city.</span></div>
                        <div><ShieldCheck size={18} /><strong>You stay in control</strong><span>Hosts review requests and decide who joins.</span></div>
                    </div>
                </Section>

                <Section icon={Code2} title="Built for JOINLY">
                    <p>JOINLY is built as a modern web app with a React frontend, a FastAPI backend, and Firebase services for authentication and realtime data.</p>
                    <div className="tech-list">
                        <span>React 19</span><span>Vite</span><span>React Router</span><span>Axios</span><span>FastAPI</span><span>Python</span><span>Firebase Auth</span><span>Cloud Firestore</span><span>Lucide React</span><span>Render</span>
                    </div>
                </Section>

                <Section id="privacy" icon={LockKeyhole} title="Privacy Policy">
                    <p>We collect the profile information you choose to provide, such as your name, username, city, interests, bio, and avatar, so JOINLY can show your profile and help people discover relevant plans.</p>
                    <p>Authentication is handled by Firebase Authentication. Profile, plan, join request, notification, and messaging data is stored using Firebase services and accessed through the app's authenticated flows. The backend verifies Firebase ID tokens before protected API operations.</p>
                    <p>We do not sell your personal information. Other signed-in users may see information you make part of your public profile and plans. You can edit your profile or contact the developer for account-related help.</p>
                </Section>

                <Section id="terms" icon={ShieldCheck} title="Terms & Community Guidelines">
                    <p>By using JOINLY, you agree to provide accurate information, respect other members, and use the app only for lawful personal activities.</p>
                    <ul>
                        <li>Do not harass, threaten, impersonate, scam, or discriminate against anyone.</li>
                        <li>Do not share private information belonging to another person without permission.</li>
                        <li>Hosts should describe plans honestly. Members should send requests only when they genuinely intend to participate.</li>
                        <li>JOINLY is a planning and connection tool, not a guarantee that another person, plan, venue, or event is safe or available.</li>
                    </ul>
                    <p>Use your judgment, meet in public places, tell someone you trust about your plans, and stop communicating or report a user if something feels unsafe.</p>
                </Section>

                <Section icon={Heart} title="Made with care">
                    <p>JOINLY is developed by <a className="about-link" href={developer.url} target="_blank" rel="noreferrer">{developer.name}</a> to make everyday plans feel a little more social.</p>
                    <a className="about-contact" href={developer.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Connect with the developer</a>
                    <p className="about-bug-note">Found a bug? <a className="about-link" href="mailto:shailendrasahu393@gmail.com">Mail us</a></p>
                </Section>

                <p className="about-footer">JOINLY · Version 1.0</p>
            </main>
            <style>{`
                .about-page { max-width: 820px; padding-bottom: 48px; }
                .about-hero { padding: 18px 0 30px; border-bottom: 1px solid var(--color-border-light); }
                .about-back-button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; margin-bottom: 20px; border: 0; background: transparent; color: var(--color-text-secondary); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
                .about-back-button:hover { color: var(--color-primary); }
                .about-logo { color: var(--color-primary); font-size: 14px; font-weight: 800; letter-spacing: 1.5px; }
                .about-kicker { margin: 8px 0 24px; color: var(--color-text-secondary); font-size: 13px; }
                .about-hero h1 { margin: 0 0 10px; font-size: clamp(28px, 5vw, 42px); line-height: 1.12; }
                .about-hero p:last-child { max-width: 570px; margin: 0; color: var(--color-text-secondary); font-size: 16px; line-height: 1.65; }
                .about-section { scroll-margin-top: 76px; padding: 28px 0; border-bottom: 1px solid var(--color-border-light); }
                .about-section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
                .about-section-heading h2 { margin: 0; font-size: 19px; }
                .about-icon { display: inline-flex; padding: 9px; color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, white); border-radius: var(--radius-sm); }
                .about-section-body { color: var(--color-text-secondary); font-size: 14px; line-height: 1.7; }
                .about-section-body p { margin: 0 0 12px; }
                .about-section-body p:last-child { margin-bottom: 0; }
                .about-benefits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
                .about-benefits div { display: flex; flex-direction: column; gap: 5px; padding: 15px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-bg-secondary); }
                .about-benefits svg { color: var(--color-primary); }
                .about-benefits strong { color: var(--color-text); font-size: 14px; }
                .about-benefits span { font-size: 12px; line-height: 1.5; }
                .tech-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
                .tech-list span { padding: 6px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text); background: var(--color-surface); font-size: 12px; font-weight: 600; }
                .about-section-body ul { margin: 8px 0 14px; padding-left: 20px; }
                .about-section-body li { margin-bottom: 7px; }
                .about-link, .about-contact { color: var(--color-primary); font-weight: 700; }
                .about-contact { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; margin-top: 4px; }
                .about-footer { margin: 28px 0 0; text-align: center; color: var(--color-text-tertiary); font-size: 12px; }
                @media (max-width: 600px) {
                    .about-page { padding-top: 0; }
                    .about-hero { padding-top: 24px; }
                    .about-back-button { display: none; }
                    .about-benefits { grid-template-columns: 1fr; }
                    .about-section { padding: 24px 0; }
                }
            `}</style>
        </div>
    )
}