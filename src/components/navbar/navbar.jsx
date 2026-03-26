import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      
      {/* LEFT: Logo */}
      <div className={styles.logo}>GYMxBRO</div>

      {/* RIGHT: Actions */}
      <div className={styles.right}>
        <button className={styles.btn}>Sign In</button>
        <button className={`${styles.btn} ${styles.outline}`}>Log In</button>

        {/* User Icon */}
        <div className={styles.userIcon}>
          <span>👤</span>
        </div>
      </div>

    </div>
  );
};

export default Navbar;