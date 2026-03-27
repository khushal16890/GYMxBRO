import { useState } from "react";
import axios from "axios";
import styles from "./AIPlan.module.css";

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

  const fetchExercises = async () => {
    try {
      const res = await axios.get(
        "https://exercisedb.p.rapidapi.com/exercises",
        {
          headers: {
            "X-RapidAPI-Key": import.meta.env.VITE_EXERCISEDB_API_KEY,
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
        }
      );

      // take only needed fields (reduce tokens)
      return res.data.slice(0, 80).map(ex => ({
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target
      }));
    } catch {
      return [];
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPlan(null);

    const exercises = await fetchExercises();

const seed = Math.floor(Math.random() * 100000);

const prompt = `
You are an experienced gym coach who writes REALISTIC and EFFECTIVE workout plans.

User:
- Age: ${form.age}
- Sex: ${form.sex}
- Height: ${form.height}
- Weight: ${form.weight}
- Goal: ${form.goal}
- Experience: ${form.experience}
- Equipment: ${form.equipment}
- Days per week: ${form.days}
- Variation seed: ${seed}

------------------------

PLAN LOGIC (IMPORTANT)

1. INTENSITY (DO NOT PLAY SAFE):
- Beginner → moderate difficulty (not too easy)
- Intermediate → challenging
- Do NOT give overly basic plans

2. SPLIT (STRICT):
- 2–3 days → full body
- 4 days → upper/lower
- 5–6 days → push/pull/legs or bro split

3. MUSCLE COVERAGE:
You MUST cover:
chest, back, shoulders, legs, arms, core

4. EXERCISES:
- Use REAL gym-style exercises (bench press, squats, rows, etc.)
- Avoid repeating same exercises across days
- Include at least 1 compound lift per day

5. AGE ADJUSTMENT:
- <18 → avoid heavy barbell focus
- 18–40 → full intensity
- >40 → reduce joint stress (no extreme volume)

6. GOAL ADJUSTMENT:
- muscle gain → 6–12 reps, hypertrophy focus
- fat loss → more volume + shorter rest
- endurance → higher reps (12–20)

7. EXPERIENCE:
- beginner → 4–5 exercises
- intermediate → 5–6 exercises

8. MAKE IT FEEL REAL:
- This should look like a plan a gym trainer would actually give
- NOT a textbook template
- NOT repetitive

------------------------

OUTPUT FORMAT (STRICT JSON ONLY)

{
  "summary": "short explanation mentioning goal and difficulty",
  "days": [
    {
      "day": "Day 1",
      "focus": "muscle focus",
      "exercises": [
        {
          "name": "exercise",
          "sets": number,
          "reps": "range",
          "rest": "time",
          "notes": "short tip"
        }
      ]
    }
  ]
}

RULES:
- Exactly ${form.days} days
- No text outside JSON
- No markdown
- Keep plan practical and slightly challenging
`;

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
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

      const parsed = JSON.parse(text);

      setPlan(parsed);
      onPlanGenerated?.(parsed);

    } catch (err) {
      console.error(err);
      setError("AI failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleGenerate}>
        <div className={styles.row}>
          <input type="number" name="age" placeholder="Age" value={form.age} onChange={handleChange} required />
          <select name="sex" value={form.sex} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <input type="number" name="height" placeholder="Height" value={form.height} onChange={handleChange} required />
          <input type="number" name="weight" placeholder="Weight" value={form.weight} onChange={handleChange} required />
        </div>

        <div className={styles.row}>
          <select name="goal" value={form.goal} onChange={handleChange}>
            <option value="muscle gain">Muscle Gain</option>
            <option value="fat loss">Fat Loss</option>
          </select>
          <select name="experience" value={form.experience} onChange={handleChange}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
          </select>
          <select name="equipment" value={form.equipment} onChange={handleChange}>
            <option value="gym">Gym</option>
            <option value="home">Home</option>
            <option value="no equipment">No Equipment</option>
          </select>
          <select name="days" value={form.days} onChange={handleChange}>
            {[2,3,4,5,6].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate AI Plan"}
        </button>
      </form>

     {plan && (
  <div className={styles.planOutput}>
    <p>{plan.summary}</p>

    {plan.days.map((day, i) => (
      <div key={i} className={styles.dayCard}>
        <div className={styles.dayHeader}>
          <span>{day.day}</span>
          <span>{day.focus}</span>
        </div>

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
            {day.exercises.map((ex, j) => (
              <tr key={j}>
                <td>{ex.name}</td>
                <td>{ex.sets}</td>
                <td>{ex.reps}</td>
                <td>{ex.rest}</td>
                <td>{ex.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
)}
    </div>
  );
}