import { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./AIPlan.module.css";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
const DEFAULTS = {
  age: "", sex: "male", height: "", weight: "",
  goal: "muscle gain", experience: "beginner",
  equipment: "gym", days: "4",
};

const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/";

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function findExercise(db, name) {
  if (!name || !db.length) return null;
  const target = normalize(name);
  let match = db.find((e) => normalize(e.name) === target);
  if (match) return match;
  const targetWords = target.split(" ").filter((w) => w.length > 2);
  let best = null, bestScore = 0;
  for (const ex of db) {
    const exName = normalize(ex.name);
    let score = 0;
    for (const w of targetWords) if (exName.includes(w)) score++;
    if (score > bestScore) { bestScore = score; best = ex; }
  }
  return bestScore >= 1 ? best : null;
}

export default function AIPlan({ onPlanGenerated }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [exerciseDb, setExerciseDb] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const popupRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    setDbLoading(true);
    axios
      .get("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json")
      .then((res) => setExerciseDb(res.data))
      .catch(() => setExerciseDb([]))
      .finally(() => setDbLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setPopup(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleExerciseClick = (exName) => {
    const dbEntry = findExercise(exerciseDb, exName);
    if (dbEntry) setPopup(dbEntry);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true); setPlan(null); setPopup(null);

    const seed = Math.floor(Math.random() * 100000);
    const eqMap = {
      gym: ["barbell", "dumbbell", "cable", "machine", "e-z curl bar", "kettlebells"],
      home: ["dumbbell", "body only", "bands", "kettlebells"],
      "no equipment": ["body only"],
    };
    const allowedEq = eqMap[form.equipment] || [];
    const filtered = exerciseDb
      .filter((ex) => allowedEq.includes(ex.equipment) && ex.category === "strength")
      .slice(0, 55)
      .map((ex) => `${ex.name} [${ex.primaryMuscles[0]}]`);
    const exHint = filtered.length
      ? `\nPrefer these exercises:\n${filtered.join(", ")}`
      : "";

    const prompt = `You are an expert personal trainer. Create a ${form.goal} plan.

Profile: Age ${form.age}, ${form.sex}, ${form.height}cm, ${form.weight}kg, ${form.experience}, ${form.equipment}, ${form.days} days/week. Seed: ${seed}
${exHint}

Rules:
- Exactly ${form.days} days
- Split: 2-3 days=full body, 4=upper/lower, 5-6=push/pull/legs
- Beginner: 4-5 exercises. Intermediate: 5-6 exercises
- muscle gain=6-12 reps, fat loss=12-20 reps, endurance=15-25 reps
- Age >40: reduce joint stress
- 1 compound lift minimum per day, cover all muscle groups across the week

Return ONLY valid JSON (no markdown, no text outside JSON):
{"summary":"2 sentence overview","days":[{"day":"Day 1","focus":"focus label","exercises":[{"name":"name","sets":3,"reps":"8-10","rest":"60s","notes":"tip"}]}]}`;

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      let text = res.data.choices[0].message.content;
      text = text.replace(/```json|```/g, "").trim();
      const s = text.indexOf("{"), en = text.lastIndexOf("}");
      if (s === -1 || en === -1) throw new Error("No JSON");
      const parsed = JSON.parse(text.slice(s, en + 1));
      setPlan(parsed);
      onPlanGenerated?.(parsed);
    } catch (err) {
      console.error(err);
      setError("Generation failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!user) return alert("You must be logged in to save a plan.");
    if (!plan) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "users", user.uid, "programs"), {
        planType: "ai",
        name: `AI Plan - ${new Date().toLocaleDateString()}`,
        days: plan.days,
        summary: plan.summary,
        createdAt: new Date().toISOString(),
        completedDays: []
      });
      setTimeout(() => navigate("/programs"), 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.logoMark}>⚡</div>
        <h1 className={styles.title}>AI Workout Planner</h1>
        <p className={styles.subtitle}>
          {dbLoading
            ? "Loading exercise database…"
            : exerciseDb.length
            ? `${exerciseDb.length.toLocaleString()} exercises ready`
            : "Exercise DB unavailable"}
        </p>
      </header>

      {/* ── Form ── */}
      <form className={styles.form} onSubmit={handleGenerate}>
        <div className={styles.fieldGrid}>
          {[
            { label: "Age", name: "age", type: "number", placeholder: "25" },
            { label: "Height (cm)", name: "height", type: "number", placeholder: "175" },
            { label: "Weight (kg)", name: "weight", type: "number", placeholder: "75" },
          ].map(({ label, name, type, placeholder }) => (
            <div className={styles.field} key={name}>
              <label>{label}</label>
              <input
                type={type} name={name} placeholder={placeholder}
                value={form[name]} onChange={handleChange} required
              />
            </div>
          ))}
          <div className={styles.field}>
            <label>Sex</label>
            <select name="sex" value={form.sex} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Goal</label>
            <select name="goal" value={form.goal} onChange={handleChange}>
              <option value="muscle gain">Muscle Gain</option>
              <option value="fat loss">Fat Loss</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Experience</label>
            <select name="experience" value={form.experience} onChange={handleChange}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Equipment</label>
            <select name="equipment" value={form.equipment} onChange={handleChange}>
              <option value="gym">Full Gym</option>
              <option value="home">Home</option>
              <option value="no equipment">No Equipment</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Days / Week</label>
            <select name="days" value={form.days} onChange={handleChange}>
              {[2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}

        <button type="submit" disabled={loading || dbLoading} className={styles.generateBtn}>
          {loading ? (
            <><span className={styles.spinner} /> Generating…</>
          ) : "⚡ Generate My Plan"}
        </button>
      </form>

      {/* ── Plan Output ── */}
      {plan && (
        <div className={styles.planOutput}>
          <div className={styles.summary}>
            <div className={styles.summaryIcon}>📋</div>
            <p>{plan.summary}</p>
          </div>

          <div className={styles.actionRow} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button 
              className={styles.generateBtn} 
              style={{ width: 'auto', padding: '12px 24px' }} 
              onClick={handleSavePlan}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save to Programs"}
            </button>
          </div>

          <p className={styles.clickHint}>
            Click any <span className={styles.hintHighlight}>underlined exercise</span> to see full details from the database
          </p>

          <div className={styles.daysGrid}>
            {plan.days.map((day, i) => (
              <div key={i} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayBadge}>{day.day}</span>
                  <span className={styles.dayFocus}>{day.focus}</span>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Exercise</th>
                        <th>Sets</th>
                        <th>Reps</th>
                        <th>Rest</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((ex, j) => {
                        const hasDb = !!findExercise(exerciseDb, ex.name);
                        return (
                          <tr key={j}>
                            <td>
                              <button
                                type="button"
                                className={`${styles.exBtn} ${hasDb ? styles.exClickable : ""}`}
                                onClick={hasDb ? () => handleExerciseClick(ex.name) : undefined}
                                title={hasDb ? "Click for exercise details" : undefined}
                              >
                                {ex.name}
                                {hasDb && <span className={styles.infoIcon}>ⓘ</span>}
                              </button>
                            </td>
                            <td className={styles.center}>{ex.sets}</td>
                            <td className={styles.center}>{ex.reps}</td>
                            <td className={styles.center}>{ex.rest}</td>
                            <td className={styles.noteCell}>{ex.notes || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Exercise Popup ── */}
      {popup && (
        <div className={styles.overlay} onClick={() => setPopup(null)}>
          <div className={styles.popup} ref={popupRef} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setPopup(null)}>✕</button>

            <div className={styles.popupTop}>
              <h2 className={styles.popupTitle}>{popup.name}</h2>
              <div className={styles.badgeRow}>
                {[
                  { val: popup.level, type: "level" },
                  { val: popup.category, type: "cat" },
                  { val: popup.mechanic, type: "mech" },
                  { val: popup.force, type: "force" },
                ]
                  .filter((b) => b.val)
                  .map((b) => (
                    <span key={b.type} className={styles.badge} data-type={b.type}>
                      {b.val}
                    </span>
                  ))}
              </div>
            </div>

            {popup.images?.length > 0 && (
              <div className={styles.imgRow}>
                {popup.images.slice(0, 2).map((img, i) => (
                  <img
                    key={i}
                    src={`${IMAGE_BASE}${img}`}
                    alt={`${popup.name} step ${i + 1}`}
                    className={styles.exImg}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ))}
              </div>
            )}

            <div className={styles.infoGrid}>
              {popup.equipment && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Equipment</span>
                  <span className={styles.infoVal}>{popup.equipment}</span>
                </div>
              )}
              {popup.primaryMuscles?.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Primary</span>
                  <div className={styles.muscleRow}>
                    {popup.primaryMuscles.map((m, i) => (
                      <span key={i} className={styles.muscleTag}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {popup.secondaryMuscles?.length > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Secondary</span>
                  <div className={styles.muscleRow}>
                    {popup.secondaryMuscles.map((m, i) => (
                      <span key={i} className={`${styles.muscleTag} ${styles.secondary}`}>{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {popup.instructions?.length > 0 && (
              <div className={styles.instructionsBlock}>
                <p className={styles.instrLabel}>How to perform</p>
                <ol className={styles.instrList}>
                  {popup.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}