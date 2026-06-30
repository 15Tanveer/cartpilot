/**
 * Login Page
 * Authentication page for users to log in or register
 */

import React, { useState } from "react";
import styles from "./Login.module.scss";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const validate = () => {
    if (!email) return "Email is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return "Invalid email format.";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    setError(validationError);
    if (!validationError) {
      // No API call, just show success for demo
      alert("Login successful (demo only)");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Sign In</h2>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              required
              placeholder="Enter your email"
              autoFocus
            />
            {touched.email && !email && (
              <div className={styles.error}>Email is required.</div>
            )}
            {touched.email &&
              email &&
              !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && (
                <div className={styles.error}>Invalid email format.</div>
              )}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
              placeholder="Enter your password"
            />
            {touched.password && !password && (
              <div className={styles.error}>Password is required.</div>
            )}
            {touched.password && password && password.length < 6 && (
              <div className={styles.error}>
                Password must be at least 6 characters.
              </div>
            )}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
// Removed all leftover code after this line

export default Login;
