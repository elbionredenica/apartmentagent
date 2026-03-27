import { auth0 } from "@/lib/auth0";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>🏠 ApartmentAgent</h1>
          <p className={styles.subtitle}>
            AI that calls apartment listings on your behalf and schedules viewings worth your time
          </p>
          
          <div className={styles.actions}>
            <a href="/auth/login?screen_hint=signup" className={styles.button}>
              Sign Up
            </a>
            <a href="/auth/login" className={`${styles.button} ${styles.secondary}`}>
              Log In
            </a>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.icon}>📞</span>
              <h3>Automated Calling</h3>
              <p>Agent calls 20+ listings per day</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.icon}>✅</span>
              <h3>Smart Filtering</h3>
              <p>Only books viewings that pass your criteria</p>
            </div>
            <div className={styles.feature}>
              <span className={styles.icon}>📅</span>
              <h3>Calendar Integration</h3>
              <p>Auto-schedules to your Google Calendar</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Welcome back!</h1>
            <p className={styles.email}>Logged in as {session.user.email}</p>
          </div>
          <a href="/auth/logout" className={`${styles.button} ${styles.small}`}>
            Logout
          </a>
        </div>

        <div className={styles.dashboard}>
          <h2>Your Dashboard</h2>
          <p className={styles.comingSoon}>
            Dashboard coming soon! The agent will show your listings, call transcripts, and scheduled viewings here.
          </p>

          <div className={styles.userInfo}>
            <h3>User Profile</h3>
            <pre className={styles.code}>{JSON.stringify(session.user, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
