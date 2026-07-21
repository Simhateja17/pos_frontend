"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./auth.css";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login");

  function handleLogin(e) {
    e.preventDefault();
    try {
      localStorage.setItem("authUser", "logged-in");
    } catch {}
    router.push("/us/onboarding/1");
  }

  function handleSignup(e) {
    e.preventDefault();
    try {
      localStorage.setItem("authUser", "signup");
    } catch {}
    router.push("/us/onboarding/1");
  }

  return (
    <div className="auth-page">
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-mark">CP</div>
            <span>Couture POS</span>
          </div>

          <div className="tab-switcher">
            <button
              className={`tab-btn${tab === "login" ? " active" : ""}`}
              onClick={() => setTab("login")}
            >
              Sign in
            </button>
            <button
              className={`tab-btn${tab === "signup" ? " active" : ""}`}
              onClick={() => setTab("signup")}
            >
              Create account
            </button>
          </div>

          {/* Login */}
          <div className={`tab-content${tab === "login" ? " active" : ""}`}>
            <h1>Welcome back</h1>
            <p className="subtitle">
              Enter your credentials to access your dashboard.
            </p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required />
              </div>
              <div className="form-check">
                <input type="checkbox" id="remember" />
                <label
                  htmlFor="remember"
                  style={{
                    margin: 0,
                    letterSpacing: "normal",
                    textTransform: "capitalize",
                  }}
                >
                  Remember me
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                Sign in
              </button>
            </form>
            <p className="auth-link">
              <a href="#">Forgot password?</a>
            </p>
          </div>

          {/* Signup */}
          <div className={`tab-content${tab === "signup" ? " active" : ""}`}>
            <h1>Create account</h1>
            <p className="subtitle">Set up Couture POS in 3 minutes.</p>
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label>Full name</label>
                <input type="text" placeholder="Jane Doe" required />
              </div>
              <div className="form-group">
                <label>Store name</label>
                <input type="text" placeholder="My Boutique" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required />
              </div>
              <div className="form-check">
                <input type="checkbox" id="terms" required />
                <label
                  htmlFor="terms"
                  style={{
                    margin: 0,
                    letterSpacing: "normal",
                    textTransform: "capitalize",
                  }}
                >
                  I agree to the Terms of Service
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                Create account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
