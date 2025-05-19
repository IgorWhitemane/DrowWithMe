import { useRef, useState, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";
import Minimap from "./Minimap";

export default function Canvas({
  tool, setTool,
  color, setColor,
  lineWidth, setLineWidth,
  scale, setScale,
  offset, setOffset,
  strokes, setStrokes,
  worldRect, setWorldRect,
}) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState(null);

  const [drawing, setDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);

  const [spacePressed, setSpacePressed] = useState(false);

  // Для кастомного курсора ластика
  const [eraserCursorPos, setEraserCursorPos] = useState(null);

  // Глобальные слушатели для пробела (перемещение)
  useEffect(() => {
    const downHandler = (e) => {
      if (e.code === "Space") setSpacePressed(true);
    };
    const upHandler = (e) => {
      if (e.code === "Space") setSpacePressed(false);
    };
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []);

  // Преобразование экранных координат в мировые
  const screenToWorld = (x, y) => ({
    x: (x - offset.x) / scale,
    y: (y - offset.y) / scale,
  });

  // Преобразование мировых координат в экранные
  const worldToScreen = (x, y) => ({
    x: x * scale + offset.x,
    y: y * scale + offset.y,
  });

  // --- Авторасширение мира по необходимости ---
  function expandWorldIfNeeded(points) {
    let { minX, minY, maxX, maxY } = worldRect;
    let expanded = false;
    for (const { x, y } of points) {
      if (x < minX) { minX = x - 500; expanded = true; }
      if (x > maxX) { maxX = x + 500; expanded = true; }
      if (y < minY) { minY = y - 500; expanded = true; }
      if (y > maxY) { maxY = y + 500; expanded = true; }
    }
    if (expanded) setWorldRect({ minX, minY, maxX, maxY });
  }

  // Поддержка resize окна
  useEffect(() => {
    const handleResize = () => {
      redrawAll();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [scale, offset, strokes, worldRect]);

  // Инициализация и перерисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;
    ctxRef.current = canvas.getContext("2d");
    redrawAll();
    // После отрисовки strokes сразу рисуем курсор-ластик, если надо
    if (tool === "eraser" && eraserCursorPos) {
      drawEraserCursor(ctxRef.current, eraserCursorPos, (lineWidth * scale) / 2);
    }
  }, [scale, offset, strokes, worldRect, tool, eraserCursorPos, lineWidth]);

  const redrawAll = () => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.tool === "eraser" ? "#fff" : stroke.color;
      ctx.lineWidth = stroke.lineWidth * scale;
      ctx.beginPath();
      let start = worldToScreen(stroke.points[0].x, stroke.points[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < stroke.points.length; i++) {
        let p = worldToScreen(stroke.points[i].x, stroke.points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  };

  // Онлайн отрисовка текущего штриха
  useEffect(() => {
    if (!drawing || currentStroke.length < 2) return;
    redrawAll();
    const ctx = ctxRef.current;
    ctx.strokeStyle = tool === "eraser" ? "#fff" : color;
    ctx.lineWidth = lineWidth * scale;
    ctx.beginPath();
    let start = worldToScreen(currentStroke[0].x, currentStroke[0].y);
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < currentStroke.length; i++) {
      let p = worldToScreen(currentStroke[i].x, currentStroke[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // После дорисовки снова показать ластик
    if (tool === "eraser" && eraserCursorPos) {
      drawEraserCursor(ctx, eraserCursorPos, (lineWidth * scale) / 2);
    }
  }, [currentStroke, drawing, scale, offset, tool, color, lineWidth, eraserCursorPos]);

  // Функция отрисовки кастомного ластика (виден всегда!)
  function drawEraserCursor(ctx, pos, radius) {
    // Внутренняя полупрозрачная тень
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#23232e";
    ctx.fill();
    ctx.restore();

    // Золотая наружная обводка (акцент)
    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "var(--accent-color, #c3b590)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // Внутренний контур (чёрный)
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(2, radius - 2), 0, Math.PI * 2);
    ctx.strokeStyle = "#23232e";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  // Корректная обработка позиции мыши
  const getRelativeMouse = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return { mouseX, mouseY };
  };

  const handleMouseDown = (e) => {
    // Перемещение: средняя кнопка или пробел+ЛКМ
    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (tool === "brush" || tool === "eraser") {
      setDrawing(true);
      const { mouseX, mouseY } = getRelativeMouse(e);
      const pos = screenToWorld(mouseX, mouseY);
      setCurrentStroke([{ x: pos.x, y: pos.y }]);
    }
  };

  const handleMouseMove = (e) => {
    // Для кастомного курсора ластика — всегда обновлять позицию!
    if (tool === "eraser") {
      const { mouseX, mouseY } = getRelativeMouse(e);
      setEraserCursorPos({ x: mouseX, y: mouseY });
    } else {
      setEraserCursorPos(null);
    }

    if (isPanning) {
      if (lastMousePos) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
      return;
    }
    if (!drawing) return;
    const { mouseX, mouseY } = getRelativeMouse(e);
    const pos = screenToWorld(mouseX, mouseY);
    setCurrentStroke((prev) => [...prev, { x: pos.x, y: pos.y }]);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastMousePos(null);
      return;
    }
    if (drawing) {
      setDrawing(false);
      if (currentStroke.length > 1) {
        expandWorldIfNeeded(currentStroke);
        setStrokes((prev) => [
          ...prev,
          {
            points: currentStroke,
            color,
            lineWidth,
            tool,
          },
        ]);
      }
      setCurrentStroke([]);
    }
  };

  // Масштабирование колесиком мыши
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldPosBefore = screenToWorld(mouseX, mouseY);

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newScale = Math.max(0.2, Math.min(4, scale * zoomFactor));
      setScale(newScale);

      setOffset((prev) => {
        const worldPosAfter = {
          x: worldPosBefore.x * newScale,
          y: worldPosBefore.y * newScale,
        };
        return {
          x: mouseX - worldPosAfter.x,
          y: mouseY - worldPosAfter.y,
        };
      });
    },
    [scale, offset]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const clearCanvas = () => setStrokes([]);

  // Размеры viewport
  const viewportW = window.innerWidth - 10;
  const viewportH = window.innerHeight - 10;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#23232e",
        padding: 5,
        boxSizing: "border-box",
      }}
    >
      {/* Toolbar и Minimap получают состояние через props */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        onClear={clearCanvas}
      />
      <Minimap
        strokes={strokes}
        offset={offset}
        scale={scale}
        setOffset={setOffset}
        worldRect={worldRect}
        minimapSize={200}
        viewportW={viewportW}
        viewportH={viewportH}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          width: "calc(100vw - 10px)",
          height: "calc(100vh - 10px)",
          display: "block",
          background: "#fff",
          zIndex: 1,
          borderRadius: "0px",
          cursor:
            isPanning || spacePressed
              ? "grab"
              : tool === "eraser"
              ? "none"
              : "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
