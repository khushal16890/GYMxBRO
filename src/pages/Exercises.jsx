import { useState, useEffect, useRef } from "react";
import "./Exercises.css";

const EXERCISES_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const PER_PAGE = 12;

const MUSCLES = [
  "All", "abdominals", "abductors", "adductors", "biceps", "calves",
  "chest", "forearms", "glutes", "hamstrings", "lats", "lower back",
  "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps",
];

const CATEGORIES = [
  "All", "Cardio", "Olympic Weightlifting", "Plyometrics",
  "Powerlifting", "Strength", "Stretching", "Strongman",
];

export default function Exercises() {
  const [allEx, setAllEx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [category, setCategory] = useState("All");

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const topRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(EXERCISES_URL);
        const data = await res.json();
        setAllEx(data);
      } catch {
        setError("Failed to load exercises. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter
  const filtered = allEx.filter((ex) => {
    const matchSearch =
      !search ||
      ex.name?.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscles?.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    const matchMuscle =
      muscle === "All" ||
      ex.muscles?.some((m) => m.toLowerCase() === muscle.toLowerCase()) ||
      ex.muscles_secondary?.some((m) => m.toLowerCase() === muscle.toLowerCase());
    const matchCat =
      category === "All" ||
      ex.category?.toLowerCase() === category.toLowerCase();
    return matchSearch && matchMuscle && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changePage = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, muscle, category]);

  const getImage = (ex) => {
    if (!ex.images?.length) return null;
    return `${IMG_BASE}${ex.images[0]}`;
  };

  const getPaginationPages = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);

    if (left > 1) { pages.push(1); if (left > 2) pages.push("..."); }
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages) { if (right < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="ex-page">
      <div ref={topRef} />

      {/* Header */}
      <div className="ex-header">
        <h1 className="ex-title">Exercise Library</h1>
        <p className="ex-subtitle">
          {loading ? "Loading..." : `${filtered.length.toLocaleString()} exercises`}
        </p>
      </div>

      {/* Filters */}
      <div className="ex-filters">
        <div className="ex-search-wrap">
          <span className="ex-search-icon">🔍</span>
          <input
            className="ex-search"
            placeholder="Search exercises or muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="ex-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className="ex-selects">
          <select
            className="ex-select"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          >
            {MUSCLES.map((m) => (
              <option key={m} value={m}>{m === "All" ? "All Muscles" : m}</option>
            ))}
          </select>

          <select
            className="ex-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && <div className="ex-error">{error}</div>}

      {/* Loading skeleton */}
      {loading && (
        <div className="ex-grid">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <div key={i} className="ex-card skeleton" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <>
          {paginated.length === 0 ? (
            <div className="ex-empty">
              <p>No exercises found for "{search}"</p>
            </div>
          ) : (
            <div className="ex-grid">
              {paginated.map((ex, i) => (
                <div
                  key={ex.id || i}
                  className="ex-card"
                  onClick={() => setSelected(ex)}
                >
                  <div className="ex-card-img-wrap">
                    {getImage(ex) ? (
                      <img
                        src={getImage(ex)}
                        alt={ex.name}
                        className="ex-card-img"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="ex-card-no-img">💪</div>
                    )}
                    <span className="ex-card-cat">{ex.category}</span>
                  </div>
                  <div className="ex-card-body">
                    <h3 className="ex-card-name">{ex.name}</h3>
                    <div className="ex-card-muscles">
                      {ex.muscles?.slice(0, 2).map((m, j) => (
                        <span key={j} className="ex-muscle-chip primary">{m}</span>
                      ))}
                      {ex.muscles_secondary?.slice(0, 1).map((m, j) => (
                        <span key={j} className="ex-muscle-chip secondary">{m}</span>
                      ))}
                    </div>
                    {ex.equipment && (
                      <div className="ex-card-equip">🏋️ {ex.equipment}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn nav"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                ‹ Prev
              </button>

              {getPaginationPages().map((p, i) =>
                p === "..." ? (
                  <span key={i} className="page-ellipsis">…</span>
                ) : (
                  <button
                    key={i}
                    className={`page-btn ${page === p ? "active" : ""}`}
                    onClick={() => changePage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="page-btn nav"
                disabled={page === totalPages}
                onClick={() => changePage(page + 1)}
              >
                Next ›
              </button>
            </div>
          )}

          <div className="page-info">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} exercises
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>

            <div className="modal-imgs">
              {selected.images?.length > 0 ? (
                selected.images.slice(0, 2).map((img, i) => (
                  <img
                    key={i}
                    src={`${IMG_BASE}${img}`}
                    alt={`${selected.name} ${i + 1}`}
                    className="modal-img"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ))
              ) : (
                <div className="modal-no-img">💪</div>
              )}
            </div>

            <div className="modal-body">
              <div className="modal-cat">{selected.category}</div>
              <h2 className="modal-name">{selected.name}</h2>

              <div className="modal-tags">
                {selected.muscles?.map((m, i) => (
                  <span key={i} className="ex-muscle-chip primary">{m}</span>
                ))}
                {selected.muscles_secondary?.map((m, i) => (
                  <span key={i} className="ex-muscle-chip secondary">{m}</span>
                ))}
              </div>

              {selected.equipment && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Equipment</span>
                  <span className="modal-info-val">{selected.equipment}</span>
                </div>
              )}

              {selected.mechanic && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Mechanic</span>
                  <span className="modal-info-val">{selected.mechanic}</span>
                </div>
              )}

              {selected.force && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Force</span>
                  <span className="modal-info-val">{selected.force}</span>
                </div>
              )}

              {selected.level && (
                <div className="modal-info-row">
                  <span className="modal-info-label">Level</span>
                  <span className={`modal-level ${selected.level}`}>{selected.level}</span>
                </div>
              )}

              {selected.instructions?.length > 0 && (
                <div className="modal-instructions">
                  <div className="modal-instructions-title">How to perform</div>
                  <ol className="modal-steps">
                    {selected.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}