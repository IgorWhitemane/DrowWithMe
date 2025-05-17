import { useRef, useState, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState(null);

  const [drawing, setDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [strokes, setStrokes] = useState([]);

  // Новый флаг: зажат ли пробел
  const [spacePressed, setSpacePressed] = useState(false);

  // Глобальные слушатели для пробела
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

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 10;
    canvas.height = window.innerHeight - 10;
    ctxRef.current = canvas.getContext("2d");
    redrawAll();
    // eslint-disable-next-line
  }, [scale, offset, strokes]);

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
    // eslint-disable-next-line
  }, [currentStroke, drawing, scale, offset]);

  const getRelativeMouse = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return { mouseX, mouseY };
  };

  const handleMouseDown = (e) => {
    // 1. Перемещение: средняя кнопка (e.button === 1) или пробел + ЛКМ
    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    // 2. Рисование
    if (tool === "brush" || tool === "eraser") {
      setDrawing(true);
      const { mouseX, mouseY } = getRelativeMouse(e);
      const pos = screenToWorld(mouseX, mouseY);
      setCurrentStroke([{ x: pos.x, y: pos.y }]);
    }
  };

  const handleMouseMove = (e) => {
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
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        onClear={clearCanvas}
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
              ? "not-allowed"
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
