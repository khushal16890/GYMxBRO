import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import styles from "./Programs.module.css";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Programs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workout state
  const [workoutActive, setWorkoutActive] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutData, setWorkoutData] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchProgram = async () => {
      try {
        const docRef = doc(db, "users", user.uid, "programs", "active");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setProgram(data);
          // Determine active day
          const completedCount = data.completedDays?.length || 0;
          setActiveDayIdx(completedCount);
        }
      } catch (err) {
        console.error("Failed to load program", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [user]);

  useEffect(() => {
    if (workoutActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [workoutActive]);

  if (loading) {
    return <div className={styles.loading}>Loading your program...</div>;
  }

  if (!program) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏋️</div>
        <h2>No Active Program</h2>
        <p>You need to build or generate a plan first to start tracking.</p>
        <button className={styles.primaryBtn} onClick={() => navigate("/custom-plan")}>
          Go to Custom Plan
        </button>
      </div>
    );
  }

  const weekFinished = activeDayIdx >= program.days.length;

  const startWorkout = (dayIdx) => {
    setActiveDayIdx(dayIdx);
    setWorkoutActive(true);
    setElapsedTime(0);
    
    // Initialize workout data structure
    const initialData = {};
    const exercises = program.days[dayIdx].exercises || [];
    exercises.forEach((ex, exIdx) => {
      initialData[exIdx] = [];
      const numSets = parseInt(ex.sets) || 3; // Default to 3 if parsing fails
      for (let i = 0; i < numSets; i++) {
        initialData[exIdx].push({ reps: "", weight: "", done: false });
      }
    });
    setWorkoutData(initialData);
  };

  const handleSetUpdate = (exIdx, setIdx, field, value) => {
    setWorkoutData(prev => {
      const copy = { ...prev };
      copy[exIdx][setIdx] = { ...copy[exIdx][setIdx], [field]: value };
      return copy;
    });
  };

  const toggleSetDone = (exIdx, setIdx) => {
    setWorkoutData(prev => {
      const copy = { ...prev };
      copy[exIdx][setIdx].done = !copy[exIdx][setIdx].done;
      return copy;
    });
  };

  const finishWorkout = async () => {
    if (!window.confirm("Are you sure you want to finish this workout?")) return;
    
    try {
      // 1. Log the workout
      const logData = {
        date: serverTimestamp(),
        day: program.days[activeDayIdx].day,
        focus: program.days[activeDayIdx].focus || "",
        durationSeconds: elapsedTime,
        exercises: program.days[activeDayIdx].exercises.map((ex, i) => ({
          name: ex.name,
          sets: workoutData[i]
        }))
      };
      await addDoc(collection(db, "users", user.uid, "workoutLogs"), logData);

      // 2. Mark day as completed
      const newCompletedDays = [...(program.completedDays || []), activeDayIdx];
      const docRef = doc(db, "users", user.uid, "programs", "active");
      await updateDoc(docRef, { completedDays: newCompletedDays });
      
      setProgram(prev => ({ ...prev, completedDays: newCompletedDays }));
      setActiveDayIdx(newCompletedDays.length);
      setWorkoutActive(false);
      setElapsedTime(0);

    } catch (err) {
      console.error("Failed to save workout", err);
      alert("Failed to save workout data.");
    }
  };

  const resetWeek = async () => {
    const defaultData = { completedDays: [] };
    try {
      const docRef = doc(db, "users", user.uid, "programs", "active");
      await updateDoc(docRef, defaultData);
      setProgram(prev => ({ ...prev, completedDays: [] }));
      setActiveDayIdx(0);
    } catch (err) {
      console.error("Failed to reset week", err);
    }
  };

  if (workoutActive) {
    const day = program.days[activeDayIdx];
    return (
      <div className={styles.container}>
        <div className={styles.trackerHeader}>
          <div className={styles.trackerMeta}>
            <span className={styles.liveIndicator}>🔴 LIVE</span>
            <h1>{day.day}</h1>
            <p className={styles.focusLabel}>{day.focus || Object.keys(workoutData).length + " Exercises"}</p>
          </div>
          <div className={styles.timerBlock}>
            <span className={styles.timer}>{formatTime(elapsedTime)}</span>
          </div>
        </div>

        <div className={styles.exercisesList}>
          {day.exercises.map((ex, i) => (
            <div key={i} className={styles.exerciseCard}>
              <div className={styles.exHeader}>
                <h3 className={styles.exTitle}>{ex.name}</h3>
                <span className={styles.exTarget}>Target: {ex.sets} Sets × {ex.reps} ({ex.rest} rest)</span>
              </div>
              
              <div className={styles.setsTableWrap}>
                <table className={styles.setsTable}>
                  <thead>
                    <tr>
                      <th>Set</th>
                      <th>Previous</th>
                      <th>kg / lbs</th>
                      <th>Reps</th>
                      <th>Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(workoutData[i] || []).map((set, sIdx) => (
                      <tr key={sIdx} className={set.done ? styles.setRowDone : styles.setRow}>
                        <td className={styles.setNumber}>{sIdx + 1}</td>
                        <td className={styles.previousMeta}>-</td>
                        <td>
                          <input 
                            className={styles.setVal} 
                            placeholder="0" type="number" 
                            value={set.weight}
                            onChange={(e) => handleSetUpdate(i, sIdx, "weight", e.target.value)}
                            disabled={set.done}
                          />
                        </td>
                        <td>
                          <input 
                            className={styles.setVal} 
                            placeholder="0" type="number" 
                            value={set.reps}
                            onChange={(e) => handleSetUpdate(i, sIdx, "reps", e.target.value)}
                            disabled={set.done}
                          />
                        </td>
                        <td>
                          <button 
                            className={set.done ? styles.checkBtnDone : styles.checkBtn}
                            onClick={() => toggleSetDone(i, sIdx)}
                          >
                            ✓
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.workoutFooter}>
          <button className={styles.finishBtn} onClick={finishWorkout}>
            Finish Workout
          </button>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className={styles.container}>
      <header className={styles.dashHeader}>
        <h1 className={styles.dashTitle}>Active Program</h1>
        {program.summary && <p className={styles.dashSummary}>{program.summary}</p>}
      </header>

      {weekFinished ? (
        <div className={styles.weekResetCard}>
          <div className={styles.trophy}>🏆</div>
          <h2>Week Completed!</h2>
          <p>You have finished all workouts for your current cycle.</p>
          <button className={styles.primaryBtn} onClick={resetWeek}>
            Start New Week
          </button>
        </div>
      ) : (
        <div className={styles.calendarGrid}>
          {program.days.map((day, i) => {
            const isCompleted = (program.completedDays || []).includes(i);
            const isCurrent = i === activeDayIdx;
            const isLocked = i > activeDayIdx;

            let cardClass = styles.dayCard;
            if (isCompleted) cardClass += " " + styles.completed;
            if (isCurrent) cardClass += " " + styles.current;
            if (isLocked) cardClass += " " + styles.locked;

            return (
              <div key={i} className={cardClass}>
                <div className={styles.dayTop}>
                  <h3 className={styles.dayTitle}>{day.day}</h3>
                  <span className={styles.dayBadge}>
                    {isCompleted ? "Completed ✓" : isCurrent ? "Up Next" : "Locked 🔒"}
                  </span>
                </div>
                <p className={styles.daySubtitle}>{day.focus || `${day.exercises?.length || 0} Exercises`}</p>
                
                {isCurrent && (
                  <button className={styles.startBtn} onClick={() => startWorkout(i)}>
                    Start Workout
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}