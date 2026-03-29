import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const stats = [
  { value: "800+", label: "Exercises" },
  { value: "AI", label: "Smart Planning" },
  { value: "∞", label: "Custom Plans" },
  { value: "0", label: "Excuses" },
];

const features = [
  {
    
    title: "AI Workout Plans",
    desc: "Input your stats and goals — get a complete, personalized training plan in seconds. Built like a real coach would write it.",
  },
  {
   
    title: "Manual Builder",
    desc: "Full control. Search 800+ exercises, build your split day by day, set sets, reps and rest. Your plan, your rules.",
  },
  {
   
    title: "Workout Tracker",
    desc: "Log every set in real time. Built-in rest timer. Track your progress as you go — all inside your saved programs.",
  },
  {
   
    title: "Exercise Library",
    desc: "Browse 800+ exercises with GIFs, muscle targets, and tips. Filter by muscle group or equipment. Learn before you lift.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-noise" />
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="hero-badge">Train Smarter. Not Harder.</div>
          <h1 className="hero-title">
            The gym app
            <br />
            <span className="hero-accent">built different.</span>
          </h1>
          <p className="hero-sub">
            AI plans, manual building, workout tracking, and a full exercise
            library — all in one brutally clean platform.
          </p>

          <div className="hero-actions">
            {user ? (
              <>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/custom-plan")}
                >
                  Build a Plan
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate("/programs")}
                >
                  My Programs →
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/signup")}
                >
                  Get Started Free
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate("/exercises")}
                >
                  Browse Exercises →
                </button>
              </>
            )}
          </div>
        </div>

        {/* floating card */}
        <div className="hero-card">
          <div className="card-day">Day 1 — Push</div>
          {[
            { name: "Bench Press", sets: "4×8", done: true },
            { name: "Incline DB Press", sets: "3×10", done: true },
            { name: "Cable Fly", sets: "3×12", done: false },
            { name: "Tricep Pushdown", sets: "3×15", done: false },
          ].map((ex, i) => (
            <div key={i} className={`card-row ${ex.done ? "done" : ""}`}>
              <span className="card-check">{ex.done ? "✓" : "○"}</span>
              <span className="card-name">{ex.name}</span>
              <span className="card-sets">{ex.sets}</span>
            </div>
          ))}
          <div className="card-timer">
            <span className="timer-dot" />
            Rest: 0:42
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-bar">
        {stats.map((s, i) => (
          <div key={i} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="section-tag">What's inside</div>
        <h2 className="section-title">Everything you need.<br />Nothing you don't.</h2>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FLOW SECTION */}
      <section className="flow">
        <div className="section-tag">How it works</div>
        <h2 className="section-title">From zero to training<br />in 3 steps.</h2>

        <div className="flow-steps">
          {[
            { n: "01", title: "Set your profile", desc: "Tell us your age, goal, experience and how many days you can train." },
            { n: "02", title: "Generate or build", desc: "Let AI build the perfect plan, or construct it yourself exercise by exercise." },
            { n: "03", title: "Track & log", desc: "Open your program, start the timer, check off sets as you go." },
          ].map((step, i) => (
            <div key={i} className="flow-step">
              <div className="flow-num">{step.n}</div>
              <div className="flow-body">
                <div className="flow-title">{step.title}</div>
                <div className="flow-desc">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="cta">
          <div className="cta-glow" />
          <h2 className="cta-title">Ready to stop guessing?</h2>
          <p className="cta-sub">Join GYMxBRO and train with a plan that actually makes sense.</p>
          <button className="btn-primary large" onClick={() => navigate("/signup")}>
            Start Training Free
          </button>
        </section>
      )}

      {/* FOOTER */}
      <footer className="home-footer">
        <span className="footer-logo">GYMxBRO</span>
        <span className="footer-text">Built for people who actually train.</span>
      </footer>
    </div>
  );
}