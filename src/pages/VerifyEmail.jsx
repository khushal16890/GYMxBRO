import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function VerifyEmail() {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleResend = async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      setResent(true);
      
    } catch {
      setError("Could not resend email. Try again in a minute.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">GYMxBRO</div>
        <div className="auth-subtitle">One last step.</div>

        <p style={{ color: "#ddd", fontSize: "14px", lineHeight: "1.7", marginBottom: "24px" }}>
          We sent a verification link to your email. Click it to activate your account, then come back and log in.
        </p>

        {resent && <p className="auth-error" style={{ color: "#1D9E75" }}>Email resent! Check your inbox.</p>}
        {error && <p className="auth-error">{error}</p>}

        <button className="auth-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>

        <button className="auth-google" onClick={handleResend} disabled={resent}>
          Resend verification email
        </button>
      </div>
    </div>
  );
}