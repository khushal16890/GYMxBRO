import { useState } from "react";
import AIPlan from "../components/AIPLAN/AIPlan";
import styles from "./CustomPlan.module.css";

export default function CustomPlan() {
  const [activeTab, setActiveTab] = useState("ai");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Custom Plan</h1>
        <p className={styles.subtitle}>Build your plan manually or let AI do it for you.</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "ai" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          AI Generated
        </button>
        <button
          className={`${styles.tab} ${activeTab === "manual" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("manual")}
        >
          Build Manually
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "ai" && <AIPlan />}
        {activeTab === "manual" && (
          <div className={styles.comingSoon}>
            Manual plan builder — coming next.
          </div>
        )}
      </div>
    </div>
  );
}