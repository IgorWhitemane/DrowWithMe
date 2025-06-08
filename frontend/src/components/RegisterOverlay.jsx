import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function RegisterOverlay({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;

    const res = await fetch("http://localhost:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      onSuccess();
    }
  };

  return (
    <div className="modal-panel panel" style={{ maxWidth: 380, width: "100%" }}>
      <div className="info" style={{ marginBottom: 12, fontSize: 22 }}>
        {t("REGISTRATION")}
      </div>

      {error && (
        <div style={{ color: 'var(--danger-color)', fontSize: 14, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label>{t("USERNAME")}:</label>
        <input
          className="input"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder={t("USERNAME")}
          required
        />

        <label>{t("PASSWORD")}:</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={t("PASSWORD")}
          required
        />

        <button className="btn" type="submit" style={{ width: '100%', marginTop: 10 }}>
          {t("REGISTER")}
        </button>
      </form>
    </div>
  );
}
