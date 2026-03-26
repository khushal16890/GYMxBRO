import { useState } from "react";
import styles from "./Sidebar.module.css";

import {
  Dumbbell,
  Settings,
  BookOpen,
  Brain,
  User,
  Menu,
  Home
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Programs", icon: Dumbbell, path: "/programs" },
    { name: "Custom Plan", icon: Settings, path: "/custom-plan" },
    { name: "Learn", icon: BookOpen, path: "/learn" },
    { name: "Exercises", icon: Brain, path: "/exercises" },
    { name: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      
      {/* TOP (☰ button) */}
      <div className={styles.top}>
        <div
          className={styles.toggle}
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu size={22} />
        </div>
      </div>

      {/* MENU */}
      <div className={styles.menu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div
              key={item.name}
              className={`${styles.item} ${
                isActive ? styles.active : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={20} className={styles.icon} />
              {!collapsed && (
                <span className={styles.text}>{item.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;