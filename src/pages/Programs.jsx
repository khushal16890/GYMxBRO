import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDocs, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import styles from "./Programs.module.css";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Parse rest strings like "90s", "2min", "1:30", "60" into seconds
function parseRestSeconds(restStr) {
  if (!restStr) return 90; // default 90s
  const s = restStr.toString().trim().toLowerCase();
  if (s.includes(':')) {
    const [m, sec] = s.split(':').map(Number);
    return (m || 0) * 60 + (sec || 0);
  }
  if (s.endsWith('min')) return parseInt(s) * 60 || 90;
  if (s.endsWith('s')) return parseInt(s) || 90;
  const num = parseInt(s);
  return num > 0 ? (num <= 10 ? num * 60 : num) : 90; // if small number, treat as minutes
}

// Simple beep using Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
    }, 200);
  } catch (e) { /* silently fail if no audio context */ }
}

export default function Programs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  // Workout state
  const [workoutActive, setWorkoutActive] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutData, setWorkoutData] = useState({});
  const timerRef = useRef(null);

  // Rest timer state
  const [restRemaining, setRestRemaining] = useState(0);
  const [restDuration, setRestDuration] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const restTimerRef = useRef(null);

  // Previous workout data for "Repeat Previous Set"
  const [previousData, setPreviousData] = useState({}); // { exerciseName: [{ weight, reps }, ...] }

  useEffect(() => {
    if (!user) return;
    const fetchPrograms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "programs"));
        const fetched = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPrograms(fetched);
      } catch (err) {
        console.error("Failed to load programs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrograms();
  }, [user]);

  // Workout elapsed timer
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

  // Rest countdown timer
  useEffect(() => {
    if (restActive && restRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestRemaining(prev => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            setRestActive(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restTimerRef.current);
  }, [restActive]);

  // Fetch previous workout data when a program is opened for workout
  const fetchPreviousData = async (programId) => {
    if (!user) return;
    try {
      const logsRef = collection(db, "users", user.uid, "workoutLogs");
      const q = query(logsRef, where("programId", "==", programId), orderBy("date", "desc"), limit(7));
      const snap = await getDocs(q);
      const prevMap = {};
      snap.forEach(d => {
        const log = d.data();
        if (log.exercises) {
          log.exercises.forEach(ex => {
            if (!prevMap[ex.name] && ex.sets?.length > 0) {
              prevMap[ex.name] = ex.sets.map(s => ({
                weight: s.weight || '',
                reps: s.reps || ''
              }));
            }
          });
        }
      });
      setPreviousData(prevMap);
    } catch (err) {
      console.error("Failed to fetch previous data", err);
    }
  };

  const handleDeletePlan = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "programs", id));
      setPrograms(prev => prev.filter(p => p.id !== id));
      if (selectedProgram && selectedProgram.id === id) {
        setSelectedProgram(null);
      }
    } catch (err) {
      console.error("Failed to delete plan", err);
      alert("Could not delete the plan at this time.");
    }
  };

  const openProgram = (prog) => {
    setSelectedProgram(prog);
    const completedCount = prog.completedDays?.length || 0;
    setActiveDayIdx(completedCount);
    fetchPreviousData(prog.id);
  };

  const closeProgram = () => {
    setSelectedProgram(null);
    setWorkoutActive(false);
    dismissRest();
  };

  const dismissRest = () => {
    clearInterval(restTimerRef.current);
    setRestActive(false);
    setRestRemaining(0);
  };

  if (loading) {
    return <div className={styles.loading}>Loading your programs...</div>;
  }

  // LIST VIEW: Showing all saved programs
  if (!selectedProgram) {
    return (
      <div className={styles.container}>
        <header className={styles.dashHeader}>
          <h1 className={styles.dashTitle}>My Programs</h1>
          <p className={styles.dashSummary}>Select a program to start your workout.</p>
        </header>

        {programs.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏋️</div>
            <h2>No Active Programs</h2>
            <p>You need to build or generate a plan first to start tracking.</p>
            <button className={styles.primaryBtn} onClick={() => navigate("/custom-plan")}>
              Go to Custom Plan
            </button>
          </div>
        ) : (
          <div className={styles.calendarGrid}>
            {programs.map((prog) => (
              <div 
                key={prog.id} 
                className={`${styles.dayCard} ${styles.programCardHover}`}
                onClick={() => openProgram(prog)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.dayTop}>
                  <h3 className={styles.dayTitle} style={{ fontSize: '24px' }}>
                    {prog.name || (prog.planType === 'ai' ? 'AI Program' : 'Manual Plan')}
                  </h3>
                  <span className={styles.dayBadge}>
                    {prog.days?.length || 0} Days
                  </span>
                </div>
                <p className={styles.daySubtitle} style={{ marginBottom: '12px' }}>
                  {prog.summary ? (prog.summary.substring(0, 60) + '...') : `${(prog.completedDays || []).length} workouts completed`}
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className={styles.startBtn} style={{ width: 'auto', padding: '8px 16px', fontSize: '12px' }}>
                    View Plan
                  </button>
                  <button 
                    onClick={(e) => handleDeletePlan(prog.id, e)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '8px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // DETAILED VIEW (Tracker dashboard for a specific program)
  const weekFinished = activeDayIdx >= selectedProgram.days.length;

  const startWorkout = (dayIdx) => {
    setActiveDayIdx(dayIdx);
    setWorkoutActive(true);
    setElapsedTime(0);
    dismissRest();
    
    const initialData = {};
    const exercises = selectedProgram.days[dayIdx].exercises || [];
    exercises.forEach((ex, exIdx) => {
      initialData[exIdx] = [];
      const numSets = parseInt(ex.sets) || 3;
      for (let i = 0; i < numSets; i++) {
        initialData[exIdx].push({ reps: "", weight: "", done: false });
      }
    });
    setWorkoutData(initialData);
  };

  const handleSetUpdate = (exIdx, setIdx, field, value) => {
    setWorkoutData(prev => {
      const copy = { ...prev };
      copy[exIdx] = [...copy[exIdx]];
      copy[exIdx][setIdx] = { ...copy[exIdx][setIdx], [field]: value };
      return copy;
    });
  };

  const fillFromPrevious = (exIdx, setIdx, exerciseName) => {
    const prev = previousData[exerciseName];
    if (!prev || !prev[setIdx]) return;
    setWorkoutData(old => {
      const copy = { ...old };
      copy[exIdx] = [...copy[exIdx]];
      copy[exIdx][setIdx] = { 
        ...copy[exIdx][setIdx], 
        weight: prev[setIdx].weight, 
        reps: prev[setIdx].reps 
      };
      return copy;
    });
  };

  const toggleSetDone = (exIdx, setIdx, exercise) => {
    setWorkoutData(prev => {
      const copy = { ...prev };
      copy[exIdx] = [...copy[exIdx]];
      const wasDone = copy[exIdx][setIdx].done;
      copy[exIdx][setIdx] = { ...copy[exIdx][setIdx], done: !wasDone };
      
      // Start rest timer when marking a set as done
      if (!wasDone) {
        const restSec = parseRestSeconds(exercise?.rest);
        setRestDuration(restSec);
        setRestRemaining(restSec);
        clearInterval(restTimerRef.current);
        setRestActive(true);
      }
      
      return copy;
    });
  };

  const finishWorkout = async () => {
    if (!window.confirm("Are you sure you want to finish this workout?")) return;
    dismissRest();
    
    try {
      const logData = {
        date: serverTimestamp(),
        programId: selectedProgram.id,
        programName: selectedProgram.name || "Program",
        day: selectedProgram.days[activeDayIdx].day,
        focus: selectedProgram.days[activeDayIdx].focus || "",
        durationSeconds: elapsedTime,
        exercises: selectedProgram.days[activeDayIdx].exercises.map((ex, i) => ({
          name: ex.name,
          sets: workoutData[i]
        }))
      };
      await addDoc(collection(db, "users", user.uid, "workoutLogs"), logData);

      const newCompletedDays = [...(selectedProgram.completedDays || []), activeDayIdx];
      const docRef = doc(db, "users", user.uid, "programs", selectedProgram.id);
      await updateDoc(docRef, { completedDays: newCompletedDays });
      
      const updatedProg = { ...selectedProgram, completedDays: newCompletedDays };
      setSelectedProgram(updatedProg);
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? updatedProg : p));
      
      setActiveDayIdx(newCompletedDays.length);
      setWorkoutActive(false);
      setElapsedTime(0);

    } catch (err) {
      console.error("Failed to save workout", err);
      alert("Failed to save workout data.");
    }
  };

  const resetWeek = async () => {
    try {
      const docRef = doc(db, "users", user.uid, "programs", selectedProgram.id);
      await updateDoc(docRef, { completedDays: [] });
      
      const updatedProg = { ...selectedProgram, completedDays: [] };
      setSelectedProgram(updatedProg);
      setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? updatedProg : p));
      
      setActiveDayIdx(0);
    } catch (err) {
      console.error("Failed to reset week", err);
    }
  };

  if (workoutActive) {
    const day = selectedProgram.days[activeDayIdx];
    const restPercent = restDuration > 0 ? (restRemaining / restDuration) * 100 : 0;

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

        {/* Rest Timer Bar */}
        {restActive && restRemaining > 0 && (
          <div className={styles.restTimerBar}>
            <div className={styles.restTimerInner}>
              <span className={styles.restTimerLabel}>⏱ Rest</span>
              <span className={styles.restTimerCount}>{formatTime(restRemaining)}</span>
              <div className={styles.restProgressTrack}>
                <div className={styles.restProgressFill} style={{ width: `${restPercent}%` }} />
              </div>
              <button className={styles.restSkipBtn} onClick={dismissRest}>Skip →</button>
            </div>
          </div>
        )}

        <div className={styles.exercisesList}>
          {day.exercises.map((ex, i) => {
            const prevSets = previousData[ex.name];
            return (
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
                        <th className={styles.prevHeader}>Previous</th>
                        <th>kg / lbs</th>
                        <th>Reps</th>
                        <th>Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(workoutData[i] || []).map((set, sIdx) => {
                        const prev = prevSets?.[sIdx];
                        const hasPrev = prev && (prev.weight || prev.reps);
                        return (
                          <tr key={sIdx} className={set.done ? styles.setRowDone : styles.setRow}>
                            <td className={styles.setNumber}>{sIdx + 1}</td>
                            <td className={styles.previousMeta}>
                              {hasPrev ? (
                                <button 
                                  className={styles.prevFillBtn}
                                  onClick={() => fillFromPrevious(i, sIdx, ex.name)}
                                  title="Click to auto-fill"
                                  disabled={set.done}
                                >
                                  {prev.weight}kg × {prev.reps}
                                </button>
                              ) : (
                                <span className={styles.prevDash}>-</span>
                              )}
                            </td>
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
                                className={set.done ? styles.setValDisabled : styles.setVal} 
                                placeholder="0" type="number" 
                                value={set.reps}
                                onChange={(e) => handleSetUpdate(i, sIdx, "reps", e.target.value)}
                                disabled={set.done}
                              />
                            </td>
                            <td>
                              <button 
                                className={set.done ? styles.checkBtnDone : styles.checkBtn}
                                onClick={() => toggleSetDone(i, sIdx, ex)}
                              >
                                ✓
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.workoutFooter}>
          <button className={styles.finishBtn} onClick={finishWorkout}>
            Finish Workout
          </button>
        </div>
      </div>
    );
  }

  // Dashboard View (within a specific program)
  return (
    <div className={styles.container}>
      <header className={styles.dashHeader} style={{ position: 'relative' }}>
        <button 
          onClick={closeProgram}
          style={{ background: 'transparent', border: '1px solid #2a2a2e', color: '#9999a8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
        >
          ← Back to Library
        </button>
        <h1 className={styles.dashTitle}>{selectedProgram.name || "Active Program"}</h1>
        {selectedProgram.summary && <p className={styles.dashSummary}>{selectedProgram.summary}</p>}
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
          {selectedProgram.days.map((day, i) => {
            const isCompleted = (selectedProgram.completedDays || []).includes(i);
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