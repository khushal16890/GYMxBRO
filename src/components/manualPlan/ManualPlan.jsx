import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./ManualPlan.module.css";

export default function ManualPlan() {
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  const [plan, setPlan] = useState([
    { day: "Day 1", exercises: [] }
  ]);

  const [activeDay, setActiveDay] = useState(0);

  // fetch exercises
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(
        "https://exercisedb.p.rapidapi.com/exercises",
        {
          headers: {
            "X-RapidAPI-Key": import.meta.env.VITE_EXERCISEDB_API_KEY,
            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
          },
        }
      );

      setAllExercises(res.data.slice(0, 200));
    };

    fetchData();
  }, []);

  // search filter
  useEffect(() => {
    setFiltered(
      allExercises
        .filter((ex) =>
          ex.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 8)
    );
  }, [search, allExercises]);

  const addExercise = (ex) => {
    const updated = [...plan];
    updated[activeDay].exercises.push({
      name: ex.name,
      sets: 3,
      reps: "10",
      rest: "60s",
      notes: ""
    });
    setPlan(updated);
    setSearch("");
  };

  const updateExercise = (i, field, value) => {
    const updated = [...plan];
    updated[activeDay].exercises[i][field] = value;
    setPlan(updated);
  };

  const addDay = () => {
    setPlan([...plan, { day: `Day ${plan.length + 1}`, exercises: [] }]);
  };

  return (
    <div className={styles.container}>
      <h2>Manual Plan Builder</h2>

      {/* Day Tabs */}
      <div className={styles.dayTabs}>
        {plan.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={activeDay === i ? styles.activeTab : ""}
          >
            {d.day}
          </button>
        ))}
        <button onClick={addDay}>+ Add Day</button>
      </div>

      {/* Search */}
      <input
        placeholder="Search exercise..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {search && (
        <div className={styles.dropdown}>
          {filtered.map((ex, i) => (
            <div key={i} onClick={() => addExercise(ex)}>
              {ex.name}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
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
          {plan[activeDay].exercises.map((ex, i) => (
            <tr key={i}>
              <td>{ex.name}</td>
              <td>
                <input
                  value={ex.sets}
                  onChange={(e) =>
                    updateExercise(i, "sets", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={ex.reps}
                  onChange={(e) =>
                    updateExercise(i, "reps", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={ex.rest}
                  onChange={(e) =>
                    updateExercise(i, "rest", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={ex.notes}
                  onChange={(e) =>
                    updateExercise(i, "notes", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}