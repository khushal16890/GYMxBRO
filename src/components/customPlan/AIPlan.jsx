import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./AIPlan.module.css";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
console.log("KEY:", import.meta.env.VITE_GEMINI_API_KEY);
const DEFAULTS = {
  age: "", sex: "male", height: "", weight: "",
  goal: "muscle gain", experience: "beginner",
  equipment: "gym", days: "4",
};

export default function AIPlan({ onPlanGenerated }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPlan(null);

    const prompt = `
      You are an expert fitness coach. Create a detailed ${form.days}-day per week workout plan for the following person:
      - Age: ${form.age}
      - Sex: ${form.sex}
      - Height: ${form.height} cm
      - Weight: ${form.weight} kg
      - Goal: ${form.goal}
      - Experience level: ${form.experience}
      - Available equipment: ${form.equipment}

      Return ONLY a valid JSON object with no markdown, no explanation, no backticks. 
      Use exactly this structure:
      {
        "summary": "brief 1-2 sentence plan overview",
        "days": [
          {
            "day": "Day 1",
            "focus": "e.g. Chest & Triceps",
            "exercises": [
              {
                "name": "Exercise name",
                "sets": 3,
                "reps": "8-12",
                "rest": "60s",
                "notes": "optional form tip"
              }
            ]
          }
        ]
      }
    `;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setPlan(parsed);
      onPlanGenerated?.(parsed);
    } catch (err) {
      setError("Failed to generate plan. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleGenerate}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Age</label>
            <input type="number" name="age" placeholder="25" value={form.age} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Sex</label>
            <select name="sex" value={form.sex} onChange={handleChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Height (cm)</label>
            <input type="number" name="height" placeholder="175" value={form.height} onChange={handleChange} required />
          </div>
          <div className={styles.field}>
            <label>Weight (kg)</label>
            <input type="number" name="weight" placeholder="70" value={form.weight} onChange={handleChange} required />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>Goal</label>
            <select name="goal" value={form.goal} onChange={handleChange}>
              <option value="muscle gain">Muscle Gain</option>
              <option value="fat loss">Fat Loss</option>
              <option value="endurance">Endurance</option>
              <option value="general fitness">General Fitness</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Experience</label>
            <select name="experience" value={form.experience} onChange={handleChange}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Equipment</label>
            <select name="equipment" value={form.equipment} onChange={handleChange}>
              <option value="gym">Full Gym</option>
              <option value="home">Home Equipment</option>
              <option value="no equipment">No Equipment</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Days / week</label>
            <select name="days" value={form.days} onChange={handleChange}>
              {[2,3,4,5,6].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.generateBtn} disabled={loading}>
          {loading ? "Generating your plan..." : "Generate AI Plan"}
        </button>
      </form>

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Building your personalized plan...</p>
        </div>
      )}

      {plan && (
        <div className={styles.planOutput}>
          <p className={styles.summary}>{plan.summary}</p>
          <div className={styles.daysGrid}>
            {plan.days.map((day, i) => (
              <div key={i} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayLabel}>{day.day}</span>
                  <span className={styles.dayFocus}>{day.focus}</span>
                </div>
                <div className={styles.exerciseList}>
                  {day.exercises.map((ex, j) => (
                    <div key={j} className={styles.exerciseRow}>
                      <span className={styles.exName}>{ex.name}</span>
                      <span className={styles.exDetail}>{ex.sets} × {ex.reps}</span>
                      <span className={styles.exRest}>{ex.rest}</span>
                      {ex.notes && <span className={styles.exNotes}>{ex.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}