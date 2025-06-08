import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LoginOverlay({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      });

      if (!res.ok) throw new Error(t("LOGIN_FAILED") || "Login failed");

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-panel panel" style={{ maxWidth: 380, width: "100%" }}>
      <div className="info" style={{ marginBottom: 12, fontSize: 22 }}>
        {t("LOGIN")}
      </div>

      {error && (
        <div style={{ color: "var(--danger-color)", fontSize: 14, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label>{t("USERNAME")}:</label>
        <input
          className="input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("USERNAME")}
          required
        />

        <label>{t("PASSWORD")}:</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("PASSWORD")}
          required
        />

        <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>
          {t("LOGIN")}
        </button>
      </form>
    </div>
  );
}
