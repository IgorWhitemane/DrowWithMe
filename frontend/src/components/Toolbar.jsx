import { useState } from "react";
import { useTranslation } from "react-i18next";

// Основные инструменты
const MAIN_TOOLS = [
  { key: "brush", icon: "🖌️", labelKey: "BRUSH" },
  { key: "eraser", icon: "🧽", labelKey: "ERASER" },
  // { key: "ruler", icon: "📏", labelKey: "RULER" },
];

// Фигуры для дропдауна
const FIGURES = [
  { key: "square", icon: "◼", labelKey: "SQUARE" },
  { key: "rectangle", icon: "▭", labelKey: "RECTANGLE" },
  { key: "circle", icon: "○", labelKey: "CIRCLE" },
  { key: "line", icon: "—", labelKey: "LINE" },
  { key: "arrow", icon: "➔", labelKey: "ARROW" },
  { key: "rhombus", icon: "◆", labelKey: "RHOMBUS" },
  { key: "triangle", icon: "▲", labelKey: "TRIANGLE" },
  { key: "hexagon", icon: "⎔", labelKey: "HEXAGON" },
  { key: "star", icon: "★", labelKey: "STAR" },
];

// Заглушка пользователей (заменить на реальные)
const MOCK_USERS = [
  { id: 1, name: "Igor" },
  { id: 2, name: "TEST1" },
  { id: 3, name: "TEST" }
];

// Функция для аватара (инициал)
function getAvatar(name) {
  if (!name) return "👤";
  const [first, second] = name.split(" ");
  return (first?.[0] || "") + (second?.[0] || "");
}

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
  const [figuresOpen, setFiguresOpen] = useState(false);
  const [userListVisible, setUserListVisible] = useState(false);

  const { t } = useTranslation();

  // Обработка выбора фигуры
  const handleFigureSelect = (key) => {
    setTool(key);
    setFiguresOpen(false);
  };

  return (
    <div id="panel" className="panel panel--tool" style={{ left: collapsed ? -300 : 0 }}>
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

      {/* Основные инструменты */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        {MAIN_TOOLS.map((tItem) => (
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

        {/* Кнопка Фигуры с дропдауном */}
        <div className="figure-dropdown">
          <button
            className={`tool-btn${FIGURES.some(f => tool === f.key) ? " tool-btn--active" : ""}`}
            title={t("FIGURES")}
            type="button"
            onClick={() => setFiguresOpen(!figuresOpen)}
            aria-haspopup="menu"
            aria-expanded={figuresOpen}
          >
            ◩
            <span style={{ fontSize: 14, marginLeft: 2 }}>{figuresOpen ? "▲" : "▼"}</span>
          </button>
          {figuresOpen && (
            <div className="figure-dropdown-menu" role="menu">
              {FIGURES.map(fig => (
                <button
                  key={fig.key}
                  className={`figure-btn${tool === fig.key ? " figure-btn--active" : ""}`}
                  onClick={() => handleFigureSelect(fig.key)}
                  type="button"
                >
                  <span style={{ fontSize: 20, marginRight: 8 }}>{fig.icon}</span>
                  {t(fig.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Цвет кисти */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 15, opacity: 0.8 }}>{t("COLOR")}:</label>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
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
          onChange={e => setLineWidth(Number(e.target.value))}
        />
      </div>

      {/* Кнопка очистки холста */}
      <button
        className="btn"
        style={{ width: "100%", marginTop: 8 }}
        onClick={onClear}
        type="button"
      >
        {t("CLEAR")}
      </button>

      {/* --- Современный счетчик пользователей --- */}
      <div className="user-panel--hero-container">
        <div className="user-counter-title">{t("ONLINE_USERS")}</div>
        <button
          className="user-counter-btn"
          onClick={() => setUserListVisible(!userListVisible)}
          aria-haspopup="listbox"
          aria-expanded={userListVisible}
        >
          <span className="user-badge">
            <span role="img" aria-label="users" style={{ fontSize: 24 }}>👥</span>
            <span className="user-badge-count">{MOCK_USERS.length}</span>
          </span>
          <span className="user-counter-arrow">{userListVisible ? "▼" : "▲"}</span>
        </button>
        {userListVisible && (
          <div className="user-list">
            {MOCK_USERS.length === 0 && (
              <div className="user-list-card user-list-empty">
                {t("NO_USERS")}
              </div>
            )}
            {MOCK_USERS.map(user => (
              <div className="user-list-card" key={user.id}>
                <div className="user-avatar">{getAvatar(user.name)}</div>
                <div className="user-name">{user.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
