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
  const [dragging, setDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);


  // Вычисляем масштаб миникарты относительно мира
  const worldW = worldRect.maxX - worldRect.minX || 1;
  const worldH = worldRect.maxY - worldRect.minY || 1;
  const kx = minimapSize / worldW;
  const ky = minimapSize / worldH;


  // Рисуем миникарту (строки + viewport)
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, minimapSize, minimapSize);

    // Белый фон миникарты (можно взять цвет из переменной, если будет нужно)
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, minimapSize, minimapSize);

    // Все strokes (рисование)
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

    // Выделяем область viewport
    const viewWorldX = -offset.x / scale;
    const viewWorldY = -offset.y / scale;
    const viewWorldW = viewportW / scale;
    const viewWorldH = viewportH / scale;

    // Затемнение/заливка области просмотра (эффект "стекла")
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

    // Чёрная рамка viewport
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

  // Преобразование координат миникарты в координаты мира
  const minimapToWorld = (mx, my) => ({
    x: (mx / minimapSize) * (worldRect.maxX - worldRect.minX) + worldRect.minX,
    y: (my / minimapSize) * (worldRect.maxY - worldRect.minY) + worldRect.minY,
  });

  // Drag навигация
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

  const handleMinimapUp = () => setDragging(false);

  // Навешиваем drag-события на window для поддержки drag вне canvas
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => handleMinimapMove(e);
    const handleUp = () => handleMinimapUp();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
    // eslint-disable-next-line
  }, [dragging]);

  return (
    // {/* Выдвижная карта */}
  <div id="panel" className="panel panel--minimap" 
    style={{ right: collapsed ? -213 : 0 }}
  >

    {/* Кнопка свернуть/развернуть */}
    <button
      className="panel-toggle-btn"
      onClick={() => setCollapsed(!collapsed)}
      title={collapsed ? "Показать миникарту" : "Свернуть миникарту"}
      style={{ left: -24 }}
    >
      {collapsed ? "◀" : "▶"}
    </button>

    {/* Шапка миникарты */}
    <div className="info"> миникарта </div>
    
    {/* Канвас миникарты */}
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
  );
}
