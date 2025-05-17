// frontend/src/components/Toolbar.jsx

import { useState } from "react";

// Можно заменить emoji на свои SVG-иконки или lucide-react
const TOOLS = [
  { key: "brush", icon: "🖌️", label: "Кисть" },
  { key: "eraser", icon: "🧽", label: "Ластик" },
  // { key: "marker", icon: "📍", label: "Маркер" },
  // { key: "select", icon: "🔲", label: "Выделить" },
  // { key: "hand", icon: "🤚", label: "Рука" },
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

  return (
    <>
      {/* Выдвижная панель */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: collapsed ? -221 : 0, // - ширина панели + 30px для кнопки
          zIndex: 1100,
          background: "#23232e",
          borderRadius: "0px",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          padding: "150px 18px",
          minWidth: 190,
          width: 190,
          color: "#fff",
          transition: "left 0.30s cubic-bezier(.7,.2,.19,.95)",
          overflow: "visible",
        }}
>
      {/* Кнопка — всегда в правой части, даже если панель свернута */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Показать панель инструментов" : "Свернуть панель инструментов"}
        style={{
          position: "absolute",
          top: 10,
          right: -24, // чуть выдвигаем вправо за пределы панели
          width: 24,
          height: 46,
          background: "#23232e",
          color: "#fff",
          border: "none",
          borderRadius: "0px",
          outline: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,.13)",
          fontSize: 10,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          transition: "background 0.16s",
        }}
      >
        {collapsed ? "▶" : "◀"}
      </button>
        <h3 style={{ margin: "0 0 16px 0", fontWeight: 700, fontSize: 18 }}>
          Инструменты
        </h3>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {TOOLS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTool(t.key)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: tool === t.key ? "2.5px solid #81aaff" : "1.5px solid #333",
                background: tool === t.key ? "#2e436b" : "#24242f",
                color: "#fff",
                fontSize: 22,
                boxShadow: tool === t.key ? "0 2px 8px #81aaff44" : "none",
                cursor: "pointer",
                transition: "all .18s",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 15, opacity: 0.8 }}>Цвет:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              marginLeft: 10,
              border: "none",
              borderRadius: 4,
              width: 36,
              height: 26,
              background: "none",
              verticalAlign: "middle",
              outline: "none",
              cursor: "pointer",
            }}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 15, opacity: 0.8 }}>
            Толщина: <b>{lineWidth}</b>
          </label>
          <input
            type="range"
            min={1}
            max={32}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{
              width: "100%",
              marginTop: 4,
              accentColor: "#81aaff",
            }}
          />
        </div>
        <button
          onClick={onClear}
          style={{
            width: "100%",
            marginTop: 8,
            border: "none",
            background: "#292941",
            color: "#fff",
            padding: "8px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 0.2,
            cursor: "pointer",
            boxShadow: "0 1px 4px #0002",
          }}
        >
          Очистить холст
        </button>
      </div>
    </>
  );
}