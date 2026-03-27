import styles from "./Navbar.module.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className={styles.navbar}>

      {/* LEFT: Logo */}
      <div className={styles.logo}>GYMxBRO</div>

      {/* RIGHT: Actions */}
      <div className={styles.right}>

        {user ? (
          // --- LOGGED IN STATE ---
          <>
            <div className={styles.userIcon} title={user.displayName || user.email}>
              <span>👤</span>
            </div>
            <button className={`${styles.btn} ${styles.outline}`} onClick={handleLogout}>
              Log Out
            </button>
          </>
        ) : (
          // --- LOGGED OUT STATE ---
          <>
            <button className={styles.btn} onClick={() => navigate("/signup")}>
              Sign Up
            </button>
            <button className={`${styles.btn} ${styles.outline}`} onClick={() => navigate("/login")}>
              Log In
            </button>
          </>
        )}

      </div>

    </div>
  );
};

export default Navbar;