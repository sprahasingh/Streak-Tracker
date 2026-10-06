import { Link, Route, Routes } from "react-router-dom";

function TodayPage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Steady home"><span className="brand-mark">s</span><span>steady</span></Link>
        <span className="topbar-note">A little progress, every day.</span>
      </header>
      <section className="welcome-card" aria-labelledby="welcome-title">
        <p className="eyebrow">YOUR DAILY PRACTICE</p>
        <h1 id="welcome-title">Make today count.</h1>
        <p className="welcome-copy">A focused space for the habits and goals that move you forward.</p>
        <div className="foundation-note"><span className="status-dot" /> Your consistency workspace is ready to take shape.</div>
      </section>
      <footer className="page-footer">Built for steady progress, not perfect days.</footer>
    </main>
  );
}

export default function App() {
  return <Routes><Route path="*" element={<TodayPage />} /></Routes>;
}
