import { useTranslation } from "react-i18next";

export default function AboutOverlay({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="about-overlay">
      <div className="about-content">
        <h2 className="info" style={{ fontSize: 26, marginBottom: 12 }}>
            <strong>{t("ABOUT_AUTHOR")}:</strong> {t("AUTHOR_NAME")}
        </h2>

        <div style={{ fontSize: 16, lineHeight: 1.6 }}>
          <p>
            <strong>Telegram:</strong>{" "}
            <a
              href={`https://t.me/${t("AUTHOR_TELEGRAM").slice(1)}`}
              className="btn" style={{ background: "transparent", color: "var(--accent-color)" }}
            >
              {t("AUTHOR_TELEGRAM")}
            </a>
          </p>
          <p>
            <strong>GitHub:</strong>{" "}
            <a
              href={t("AUTHOR_GITHUB")}
              className="btn" style={{ background: "transparent", color: "var(--accent-color)" }}
            >
              {t("AUTHOR_GITHUB")}
            </a>
          </p>
          <p>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={t("AUTHOR_LINKEDIN")}
              className="btn" style={{ background: "transparent", color: "var(--accent-color)" }}
            >
              {t("AUTHOR_LINKEDIN")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
