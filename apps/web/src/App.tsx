import { useMemo, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

type Habit = { id: string; name: string; icon: string; hue: string; streak: number; done: boolean; detail: string; goal?: string };
const defaults: Habit[] = [
  { id: "dsa", name: "DSA practice", icon: "⌘", hue: "lilac", streak: 18, done: false, detail: "Solve a little, learn a lot.", goal: "120 problems" },
  { id: "mern", name: "MERN study", icon: "◈", hue: "mint", streak: 11, done: false, detail: "Build something with what you learn.", goal: "Advanced React" },
  { id: "core", name: "Core CS", icon: "▤", hue: "peach", streak: 8, done: false, detail: "Make the fundamentals stick.", goal: "Complete DBMS" },
  { id: "jobs", name: "Job applications", icon: "↗", hue: "blue", streak: 4, done: false, detail: "One thoughtful application is progress." },
];
const nav = [{ to: "/", icon: "◷", label: "Today" }, { to: "/dashboard", icon: "▦", label: "Overview" }, { to: "/history", icon: "▧", label: "History" }, { to: "/goals", icon: "◎", label: "Goals" }, { to: "/achievements", icon: "✳", label: "Awards" }];

function todayLabel() { return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date()); }
function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try { const saved = localStorage.getItem("steady-habits"); return saved ? JSON.parse(saved) as Habit[] : defaults; } catch { return defaults; }
  });
  const update = (next: Habit[]) => { setHabits(next); localStorage.setItem("steady-habits", JSON.stringify(next)); };
  return { habits, update };
}
function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <div className="app-frame">
    <aside className="sidebar"><Link to="/" className="wordmark"><span className="logo-glyph">s</span><span>steady<span className="wordmark-dot">.</span></span></Link>
      <div className="side-caption">YOUR SPACE</div><nav className="side-nav" aria-label="Main navigation">{nav.map((item) => <Link key={item.to} to={item.to} className={`nav-link ${location.pathname === item.to ? "active" : ""}`}><span className="nav-icon">{item.icon}</span>{item.label}{item.to === "/" && <span className="nav-live" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="quote-mark">“</div><p>Small steps, repeated, become a way forward.</p><span>YOUR DAILY REMINDER</span></div>
      <Link to="/settings" className={`settings-link ${location.pathname === "/settings" ? "active" : ""}`}><span className="nav-icon">⚙</span>Settings</Link>
    </aside>
    <main className="main-area"><header className="mobile-header"><Link to="/" className="wordmark"><span className="logo-glyph">s</span><span>steady<span className="wordmark-dot">.</span></span></Link><span className="avatar">S</span></header>{children}</main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.slice(0, 5).map(item => <Link key={item.to} to={item.to} className={location.pathname === item.to ? "active" : ""}><span>{item.icon}</span><small>{item.label}</small></Link>)}</nav>
  </div>;
}

function Today() {
  const { habits, update } = useHabits();
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [journal, setJournal] = useState(() => localStorage.getItem("steady-journal") ?? "");
  const complete = habits.filter(h => h.done).length;
  const percent = habits.length ? Math.round(100 * complete / habits.length) : 0;
  const toggle = (id: string) => update(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  const noteChange = (id: string, detail: string) => update(habits.map(h => h.id === id ? { ...h, detail } : h));
  return <div className="content-wrap today-view">
    <div className="page-top"><div><div className="date-label"><span className="date-dot" />{todayLabel()}</div><h1>Today, <em>gently.</em></h1><p className="page-intro">A few small promises to yourself. Start anywhere.</p></div><button className="icon-button profile-button" aria-label="Profile">S</button></div>
    <section className="daily-overview" aria-label="Today's progress"><div className="overview-copy"><span className="section-kicker">YOUR DAILY RHYTHM</span><h2>{complete === habits.length && habits.length ? "You showed up for yourself." : complete ? "A good start is already a start." : "Make room for what matters."}</h2><p>{complete === habits.length && habits.length ? "Today is yours. Take a moment to feel good about that." : `${habits.length - complete} ${habits.length - complete === 1 ? "practice" : "practices"} left whenever you're ready.`}</p></div><div className="progress-ring" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><div><strong>{complete}<span>/{habits.length}</span></strong><small>DONE</small></div></div><div className="overview-footer"><span>{complete === habits.length && habits.length ? "✦ Perfectly present today" : `${percent}% of today's intentions`}</span><span>{complete} completed</span></div></section>
    <div className="section-heading"><div><span className="section-kicker">YOUR PRACTICES</span><h2>What matters today</h2></div><button className="text-action" onClick={() => alert("Category management arrives with the next product phase.")}>＋ Add a practice</button></div>
    <section className="habit-list" aria-label="Daily practices">{habits.map((habit, i) => <article className={`habit-card ${habit.done ? "is-done" : ""}`} key={habit.id} style={{ animationDelay: `${i * 55}ms` }}>
      <button className={`habit-check ${habit.done ? "checked" : ""}`} onClick={() => toggle(habit.id)} aria-label={`${habit.done ? "Mark incomplete" : "Mark complete"}: ${habit.name}`} aria-pressed={habit.done}>{habit.done && <span>✓</span>}</button>
      <div className={`habit-symbol ${habit.hue}`}>{habit.icon}</div><div className="habit-main"><div className="habit-title-row"><h3>{habit.name}</h3>{habit.goal && <span className="goal-tag"><span>◎</span>{habit.goal}</span>}</div><p>{habit.detail || "Add a note about today's progress"}</p></div>
      <div className="habit-streak"><span className="flame">♨</span><strong>{habit.streak}</strong><small>DAY STREAK</small></div><button className="note-button" onClick={() => setOpenNote(openNote === habit.id ? null : habit.id)}>{habit.detail.startsWith("Add a note") ? "Add note" : "Details"}<span>↗</span></button>
      {openNote === habit.id && <div className="note-editor"><label htmlFor={`note-${habit.id}`}>A note for today</label><textarea id={`note-${habit.id}`} value={habit.detail.startsWith("Add a note") ? "" : habit.detail} onChange={e => noteChange(habit.id, e.target.value || "Add a note about today's progress")} placeholder="What did you work on?" rows={2} autoFocus /><button onClick={() => setOpenNote(null)}>Done</button></div>}
    </article>)}</section>
    <section className="journal-card"><div className="journal-icon">✎</div><div className="journal-content"><div className="journal-heading"><div><span className="section-kicker">A LITTLE REFLECTION</span><h3>Today's note</h3></div><span className="optional-pill">OPTIONAL</span></div><textarea aria-label="Today's journal note" placeholder="Anything you want to remember about today?" value={journal} onChange={e => { setJournal(e.target.value); localStorage.setItem("steady-journal", e.target.value); }} rows={2} /></div></section>
    <footer className="today-footer"><span>Consistency is returning, again and again.</span><span>Saved on this device</span></footer>
  </div>;
}

function Overview() {
  const { habits } = useHabits();
  const done = habits.filter(h => h.done).length;
  return <div className="content-wrap"><div className="page-top"><div><div className="date-label"><span className="date-dot" />YOUR PROGRESS</div><h1>Steady <em>looks good.</em></h1><p className="page-intro">A wider view of the work you're putting in.</p></div></div><div className="stats-grid"><Stat label="Today completed" value={`${done} / ${habits.length}`} icon="◷"/><Stat label="Active practices" value={`${habits.length}`} icon="✳"/><Stat label="Current best streak" value={`${Math.max(...habits.map(h=>h.streak),0)} days`} icon="♨"/></div><section className="panel"><div className="section-heading"><div><span className="section-kicker">THIS WEEK</span><h2>Showing up adds up</h2></div><span className="muted">Last 7 days</span></div><div className="week-bars">{["M","T","W","T","F","S","S"].map((d,i)=><div className="week-day" key={`${d}-${i}`}><div className="week-track"><span style={{height:`${[78,92,48,100,64,35,done?100:14][i]}%`}}/></div><small>{d}</small></div>)}</div><p className="chart-caption">Your rhythm is made from ordinary days like these.</p></section><section className="panel streak-panel"><div className="section-heading"><div><span className="section-kicker">PRACTICES</span><h2>Keep your rhythm</h2></div><Link className="text-action" to="/history">See history ↗</Link></div>{habits.map(h=><div className="streak-row" key={h.id}><div className={`mini-symbol ${h.hue}`}>{h.icon}</div><strong>{h.name}</strong><span className="streak-number">♨ {h.streak}</span><div className="mini-progress"><span style={{width:`${Math.min(100,h.streak*4)}%`}}/></div></div>)}</section></div>;
}
function Stat({label,value,icon}:{label:string;value:string;icon:string}) { return <div className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><strong>{value}</strong><small>Keep your pace, your way</small></div>; }

function History() {
  const [filter, setFilter] = useState("All practices");
  const { habits } = useHabits();
  const days = useMemo(()=>Array.from({length:119},(_,i)=>({i,level: [0,1,2,3,1,0,2,3,2,1,0,1,3,2,2,0,3,1,2,1,0][(i*7+Math.floor(i/5))%21]})),[]);
  return <div className="content-wrap"><div className="page-top"><div><div className="date-label"><span className="date-dot" />YOUR CONSISTENCY</div><h1>Look how far <em>you've come.</em></h1><p className="page-intro">Every mark is a day you made an effort.</p></div></div><section className="panel heatmap-panel"><div className="section-heading"><div><span className="section-kicker">YOUR ACTIVITY</span><h2>Small steps, over time</h2></div><select aria-label="Filter activity" value={filter} onChange={e=>setFilter(e.target.value)}><option>All practices</option>{habits.map(h=><option key={h.id}>{h.name}</option>)}</select></div><div className="heatmap-months"><span>JUN</span><span>JUL</span><span>AUG</span><span>SEP</span><span>OCT</span></div><div className="heatmap-wrap"><div className="heatmap-weekdays"><span>M</span><span>W</span><span>F</span></div><div className="heatmap">{days.map(day=><button key={day.i} className={`heat-cell level-${day.level}`} title={`${day.level ? day.level : "No"} practices completed`} aria-label={`Activity day ${day.i+1}: level ${day.level}`} />)}</div></div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3].map(i=><i key={i} className={`heat-cell level-${i}`}/>)}<span>More</span></div></section><div className="stats-grid history-stats"><Stat label="Active day streak" value={`${Math.max(...habits.map(h=>h.streak))} days`} icon="♨"/><Stat label="Best day this week" value="4 practices" icon="✦"/><Stat label="Showing up" value="68%" icon="↗"/></div><section className="panel"><span className="section-kicker">A NOTE TO YOURSELF</span><h2 className="quote-title">“You don't have to see the whole staircase, just take the first step.”</h2><p className="muted">Your activity history will fill in as you check in each day.</p></section></div>;
}

function Goals() {
  const goals = [{name:"Complete DBMS",category:"Core CS",progress:52,color:"#a48aca",left:"12 days left",status:"Ahead of pace",metrics:[["Chapters",6,12],["Videos",15,30],["PDFs",2,4]]},{name:"Advanced React",category:"MERN Study",progress:38,color:"#7ba78a",left:"24 days left",status:"On track",metrics:[["Modules",5,12],["Projects",1,3]]}];
  return <div className="content-wrap"><div className="page-top"><div><div className="date-label"><span className="date-dot" />THE BIGGER PICTURE</div><h1>Progress with <em>purpose.</em></h1><p className="page-intro">Meaningful goals, broken into doable pieces.</p></div><button className="primary-button" onClick={()=>alert("Goal creation is coming soon.")}>＋ New goal</button></div><div className="goal-list">{goals.map(goal=><article className="goal-card" key={goal.name}><div className="goal-top"><div><span className="goal-category">{goal.category}</span><h2>{goal.name}</h2></div><span className="pace-tag">↗ {goal.status}</span></div><div className="goal-progress-row"><div className="goal-progress"><span style={{width:`${goal.progress}%`,background:goal.color}}/></div><strong>{goal.progress}%</strong></div><div className="goal-subrow"><span>{goal.left}</span><span>Expected 45%</span></div><div className="metric-list">{goal.metrics.map(([label,value,total])=><div className="metric-row" key={label as string}><span>{label}</span><div className="metric-track"><i style={{width:`${Number(value)/Number(total)*100}%`,background:goal.color}}/></div><span>{value} / {total}</span></div>)}</div><button className="goal-update" onClick={()=>alert("Progress logging is coming soon.")}>Update progress <span>＋</span></button></article>)}</div><p className="muted goal-footnote">Progress should feel like a guide, never a verdict.</p></div>;
}

function Awards() { const awards=[{icon:"♨",name:"A week of showing up",desc:"Complete a practice 7 days in a row",unlocked:true},{icon:"✦",name:"First perfect week",desc:"Complete every scheduled practice for a week",unlocked:false},{icon:"◎",name:"First goal complete",desc:"Finish a measurable goal",unlocked:false},{icon:"♨",name:"A month of momentum",desc:"Reach a 30-day streak on any practice",unlocked:false}];return <div className="content-wrap"><div className="page-top"><div><div className="date-label"><span className="date-dot" />MILESTONES, BIG AND SMALL</div><h1>Things worth <em>celebrating.</em></h1><p className="page-intro">Not trophies. Reminders of what you can do.</p></div></div><div className="award-grid">{awards.map(a=><article className={`award-card ${a.unlocked?"unlocked":"locked"}`} key={a.name}><div className="award-medal">{a.icon}</div><div><h3>{a.name}</h3><p>{a.desc}</p></div><span className="award-state">{a.unlocked?"UNLOCKED":"IN YOUR FUTURE"}</span></article>)}</div></div>}

function Settings() { return <div className="content-wrap"><div className="page-top"><div><div className="date-label"><span className="date-dot" />MAKE IT YOURS</div><h1>Your space, <em>your way.</em></h1><p className="page-intro">A few settings to make Steady fit your life.</p></div></div><section className="panel settings-panel"><div className="setting-row"><div><h3>Appearance</h3><p>Choose a calm light or dark workspace.</p></div><select aria-label="Appearance"><option>Light</option><option>Dark</option><option>System</option></select></div><div className="setting-row"><div><h3>Time zone</h3><p>Your days and streaks follow local time.</p></div><span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div><div className="setting-row"><div><h3>Data backup</h3><p>Keep a portable copy of your progress.</p></div><button className="text-action" onClick={()=>alert("Export is coming soon.")}>Export data ↗</button></div><div className="setting-row"><div><h3>Account</h3><p>Sign in to sync across your devices.</p></div><button className="primary-button" onClick={()=>alert("Secure accounts will be available after API setup.")}>Sign in</button></div></section></div> }

function NotFound() { return <div className="content-wrap"><h1>One day at a time.</h1><Link className="text-action" to="/">Back to Today →</Link></div>; }
export default function App() { return <Shell><Routes><Route path="/" element={<Today/>}/><Route path="/dashboard" element={<Overview/>}/><Route path="/history" element={<History/>}/><Route path="/goals" element={<Goals/>}/><Route path="/achievements" element={<Awards/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<NotFound/>}/></Routes></Shell>; }
