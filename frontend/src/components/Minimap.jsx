import { useRef, useEffect, useState } from "react";

// worldRect — {minX, minY, maxX, maxY}
export default function Minimap({
  strokes,
  offset,
  scale,
  setOffset,
  worldRect,
  minimapSize = 200,
  viewportW,
  viewportH,
}) {
  const canvasRef = useRef(null);

  // Параметры для drag
  const [dragging, setDragging] = useState(false);
  // Сдвиг панели вниз/вверх
  const [collapsed, setCollapsed] = useState(false);


  // Границы мира
  const worldW = worldRect.maxX - worldRect.minX || 1;
  const worldH = worldRect.maxY - worldRect.minY || 1;
  const kx = minimapSize / worldW;
  const ky = minimapSize / worldH;


  // --- Рисуем миникарту ---
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, minimapSize, minimapSize);

    // фон
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, minimapSize, minimapSize);

    // линии
    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.tool === "eraser" ? "#bbb" : stroke.color;
      ctx.lineWidth = Math.max(1, stroke.lineWidth * kx);
      ctx.beginPath();
      let { x, y } = stroke.points[0];
      ctx.moveTo((x - worldRect.minX) * kx, (y - worldRect.minY) * ky);
      for (let i = 1; i < stroke.points.length; i++) {
        let p = stroke.points[i];
        ctx.lineTo((p.x - worldRect.minX) * kx, (p.y - worldRect.minY) * ky);
      }
      ctx.stroke();
    }

    const viewWorldX = -offset.x / scale;
    const viewWorldY = -offset.y / scale;
    const viewWorldW = viewportW / scale;
    const viewWorldH = viewportH / scale;

    // прямоугольник viewport
    ctx.save();
    ctx.globalAlpha = 0.17;
    ctx.fillStyle = "#000";
    ctx.fillRect(
      (viewWorldX - worldRect.minX) * kx,
      (viewWorldY - worldRect.minY) * ky,
      viewWorldW * kx,
      viewWorldH * ky
    );
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#23232e";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      (viewWorldX - worldRect.minX) * kx,
      (viewWorldY - worldRect.minY) * ky,
      viewWorldW * kx,
      viewWorldH * ky
    );
    ctx.restore();

  }, [strokes, offset, scale, worldRect, minimapSize, viewportW, viewportH, kx, ky]);

  // --- Drag навигация ---
  // Клик или drag на миникарте = переместить viewport
  const minimapToWorld = (mx, my) => ({
    x: (mx / minimapSize) * (worldRect.maxX - worldRect.minX) + worldRect.minX,
    y: (my / minimapSize) * (worldRect.maxY - worldRect.minY) + worldRect.minY,
  });

  const handleMinimapDown = (e) => {
    setDragging(true);
    handleMinimapMove(e);
  };

  const handleMinimapMove = (e) => {
    if (!dragging && e.type !== "mousedown") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, minimapSize));
    const mouseY = Math.max(0, Math.min(e.clientY - rect.top, minimapSize));
    const { x, y } = minimapToWorld(mouseX, mouseY);

    setOffset({
      x: -(x * scale - viewportW / 2),
      y: -(y * scale - viewportH / 2),
    });
  };

  const handleMinimapUp = () => {
    setDragging(false);
  };

  // Навешиваем и снимаем drag события
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => handleMinimapMove(e);
    const handleUp = () => handleMinimapUp();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line
  }, [dragging]);

  // --- Стилизованный контейнер как у Toolbar ---
  return (
    <>
      {/* Выдвижная карта */}
      <div id="panel" className="panel panel--minimap" 
        style={{ right: collapsed ? -213 : 0 }}>

      {/* Кнопка свернуть/развернуть */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Показать миникарту" : "Свернуть миникарту"}
        style={{
          position: "absolute",
          top: 10,
          left: -24, // чуть выдвигаем вправо за пределы панели
          width: 24,
          height: 46,
          background: "#23232e",
          color: "#fff",
          border: "none",
          borderRadius: "0px",
          outline: "none",
          fontSize: 10,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          transition: "background 0.16s",
        }}
      >
        {collapsed ? "◀" : "▶"}
      </button>
      
      <div className="info"> миникарта </div>

      <canvas
        ref={canvasRef}
        width={minimapSize}
        height={minimapSize}
        style={{
          display: "block",
          width: minimapSize,
          height: minimapSize,
          borderRadius: "0px",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMinimapDown}
        onTouchStart={handleMinimapDown}
      />
    </div>
    </>
  );
}
