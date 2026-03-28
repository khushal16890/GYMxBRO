import { useState, useRef, useEffect } from "react";
import axios from "axios";
import styles from "./ManualPlan.module.css";

// Free public-domain exercise dataset — 800+ exercises, no API key, no rate limit
const EXERCISES_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

export default function ManualPlan() {
  const [allExercises, setAllExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState([{ day: "Day 1", exercises: [] }]);
  const [activeDay, setActiveDay] = useState(0);

  const dropdownRef = useRef(null);

  // Fetch full dataset ONCE on mount — local filtering after that, no more API calls
  useEffect(() => {
    const load = async () => {
      setLoadingExercises(true);
      setFetchError("");
      try {
        const res = await axios.get(EXERCISES_URL);
        // This dataset returns an array of exercise objects
        setAllExercises(res.data);
      } catch (err) {
        console.error("Failed to load exercises:", err);
        setFetchError("Failed to load exercise library. Check your connection.");
      } finally {
        setLoadingExercises(false);
      }
    };
    load();
  }, []);

  // Filter locally on every keystroke — instant, no API calls
  useEffect(() => {
    if (!search.trim()) {
      setFiltered([]);
      return;
    }
    const q = search.toLowerCase();
    const results = allExercises
      .filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          (ex.category && ex.category.toLowerCase().includes(q)) ||
          (Array.isArray(ex.muscles) &&
            ex.muscles.some((m) => m.toLowerCase().includes(q)))
      )
      .slice(0, 20);
    setFiltered(results);
  }, [search, allExercises]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSearch("");
        setFiltered([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addExercise = (ex) => {
    const updated = [...plan];
    const alreadyAdded = updated[activeDay].exercises.some(
      (e) => e.name === ex.name
    );
    if (alreadyAdded) {
      setSearch("");
      setFiltered([]);
      return;
    }
    updated[activeDay].exercises.push({
      name: ex.name,
      // free-exercise-db uses: category, muscles, muscles_secondary
      bodyPart: ex.category ?? (ex.muscles?.[0] ?? "—"),
      equipment: ex.equipment ?? "—",
      sets: 3,
      reps: "10",
      rest: "60s",
      notes: "",
    });
    setPlan(updated);
    setSearch("");
    setFiltered([]);
    setSaved(false);
  };

  const updateExercise = (i, field, value) => {
    const updated = [...plan];
    updated[activeDay].exercises[i][field] = value;
    setPlan(updated);
    setSaved(false);
  };

  const removeExercise = (i) => {
    const updated = [...plan];
    updated[activeDay].exercises.splice(i, 1);
    setPlan(updated);
    setSaved(false);
  };

  const addDay = () => {
    const newPlan = [
      ...plan,
      { day: `Day ${plan.length + 1}`, exercises: [] },
    ];
    setPlan(newPlan);
    setActiveDay(newPlan.length - 1);
  };

  const removeDay = (i) => {
    if (plan.length === 1) return;
    const updated = plan.filter((_, idx) => idx !== i);
    setPlan(updated);
    setActiveDay(Math.min(activeDay, updated.length - 1));
  };

  const savePlan = () => {
    console.log("Plan saved:", plan);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const showDropdown = search.trim().length > 0 && !loadingExercises;

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.title}>Manual Plan Builder</h2>
          <p className={styles.subtitle}>
            {loadingExercises
              ? "Loading exercise library..."
              : fetchError
              ? fetchError
              : `${allExercises.length} exercises ready — search to add`}
          </p>
        </div>
        <button
          className={styles.saveBtn}
          onClick={savePlan}
          disabled={plan.every((d) => d.exercises.length === 0)}
        >
          {saved ? "✓ Saved!" : "Save Plan"}
        </button>
      </div>

      {/* Day Tabs */}
      <div className={styles.dayTabs}>
        {plan.map((d, i) => (
          <div key={i} className={styles.tabWrapper}>
            <button
              onClick={() => setActiveDay(i)}
              className={`${styles.tab} ${
                activeDay === i ? styles.activeTab : ""
              }`}
            >
              {d.day}
              <span className={styles.exCount}>{d.exercises.length}</span>
            </button>
            {plan.length > 1 && (
              <button
                className={styles.removeDay}
                onClick={() => removeDay(i)}
                title="Remove day"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className={styles.addDayBtn} onClick={addDay}>
          + Add Day
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchWrapper} ref={dropdownRef}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>
            {loadingExercises ? "⏳" : "🔍"}
          </span>
          <input
            className={styles.searchInput}
            placeholder={
              loadingExercises
                ? "Loading exercises..."
                : fetchError
                ? "Exercise library unavailable"
                : "Search by name, muscle or category..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loadingExercises || !!fetchError}
          />
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setSearch("");
                setFiltered([]);
              }}
            >
              ×
            </button>
          )}
        </div>

        {showDropdown && (
          <div className={styles.dropdown}>
            {filtered.length === 0 && (
              <div className={styles.dropdownStatus}>
                No results for "{search}"
              </div>
            )}
            {filtered.map((ex, i) => (
              <div
                key={ex.id ?? i}
                className={styles.dropdownItem}
                onClick={() => addExercise(ex)}
              >
                <span className={styles.exName}>{ex.name}</span>
                <span className={styles.exMeta}>
                  {ex.category ?? ""}
                  {ex.muscles?.[0] ? ` · ${ex.muscles[0]}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table / Empty State */}
      {plan[activeDay].exercises.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No exercises added to {plan[activeDay].day} yet.</p>
          <p>Use the search above to add exercises.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Exercise</th>
                <th>Category</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Rest</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plan[activeDay].exercises.map((ex, i) => (
                <tr key={i}>
                  <td className={styles.indexCell}>{i + 1}</td>
                  <td className={styles.nameCell}>{ex.name}</td>
                  <td>
                    <span className={styles.badge}>{ex.bodyPart}</span>
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      type="number"
                      value={ex.sets}
                      min={1}
                      onChange={(e) =>
                        updateExercise(i, "sets", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(i, "reps", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInput}
                      value={ex.rest}
                      onChange={(e) =>
                        updateExercise(i, "rest", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className={styles.cellInputWide}
                      value={ex.notes}
                      placeholder="optional tip..."
                      onChange={(e) =>
                        updateExercise(i, "notes", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeExercise(i)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}