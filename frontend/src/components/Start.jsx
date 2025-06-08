import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AboutOverlay from "./AboutOverlay";
import LoginOverlay from "./LoginOverlay";
import RegisterOverlay from "./RegisterOverlay";

export default function Start({
  showAboutOverlay = false,
  showLoginOverlay = false,
  showRegisterOverlay = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleAuthSuccess = () => navigate("/canvas");

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Фон с прокруткой и блюром */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "scroll",
          overflowX: "hidden",
          zIndex: 0,
        }}
      >
        <img
          src="/media/hero-bg.png"
          alt="background"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            filter: "blur(10px)",
          }}
        />
      </div>

      {/* Центральная панель */}
      <div className="panel panel--hero">
        <div className="info" style={{ fontSize: 28, marginBottom: 8 }}>
          DROW WITH ME
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 12 }}>
          {t("PROJECT_DESCRIPTION")}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => navigate("/register")}>
            {t("TRY_FREE")}
          </button>
          <button className="btn" onClick={() => navigate("/login")}>
            {t("LOGIN")}
          </button>
          <button className="btn" onClick={() => navigate("/about")}>
            {t("ABOUT")}
          </button>
        </div>
      </div>

      {/* Панель "Об авторе" */}
      {showAboutOverlay && (
        <AboutOverlay onClose={() => navigate("/")} />
      )}

      {/* Панель логина */}
      {showLoginOverlay && (
        <LoginOverlay
          onClose={() => navigate("/")}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Панель регистрации */}
      {showRegisterOverlay && (
        <RegisterOverlay
          onClose={() => navigate("/")}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
