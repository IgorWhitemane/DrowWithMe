import { useState } from "react";
import { useTranslation } from "react-i18next";

// ВАЖНО: в TOOLS используем не готовую строку, а ключ для перевода (labelKey)
const TOOLS = [
  { key: "brush", icon: "🖌️", labelKey: "BRUSH" },
  { key: "eraser", icon: "🧽", labelKey: "ERASER" },
  // { key: "marker", icon: "📍", labelKey: "MARKER" },
  // { key: "select", icon: "🔲", labelKey: "SELECT" },
  // { key: "hand", icon: "🤚", labelKey: "HAND" },
];

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  lineWidth,
  setLineWidth,
  onClear,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation(); // Хук для переводов

  return (
    // Выдвижная панель инструментов
    <div id="panel" className="panel panel--tool"
      style={{ left: collapsed ? -300 : 0 }}
    >

      {/* Кнопка — свернуть */}
      <button
        id="panel-toggle-btn"
        className="panel-toggle-btn panel--tool-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? t("SHOW_TOOLBAR") : t("HIDE_TOOLBAR")}
        style={{ right: -24 }}
      >
        {collapsed ? "▶" : "◀"}
      </button>

      {/* Заголовок панели */}
      <div className="info">{t("TOOLS")}</div>

      {/* Блок инструментов (кисти, ластик и т.д.) */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {TOOLS.map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTool(tItem.key)}
            className={`tool-btn${tool === tItem.key ? " tool-btn--active" : ""}`}
            title={t(tItem.labelKey)}
            type="button"
          >
            {tItem.icon}
          </button>
        ))}
      </div>

      {/* Цвет кисти */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 15, opacity: 0.8 }}>{t("COLOR")}:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      {/* Толщина кисти */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 15, opacity: 0.8 }}>
          {t("THICKNESS")}: <b>{lineWidth}</b>
        </label>
        <input
          className="thickness"
          type="range"
          min={1}
          max={64}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
      </div>

      {/* Кнопка очистки холста */}
      <button
        className="btn"
        style={{
          width: "100%",
          marginTop: 8,
        }}
        onClick={onClear}
        type="button"
      >
        {t("CLEAR")}
      </button>
    </div>
  );
}
