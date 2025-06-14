import { useRef, useState, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";
import Minimap from "./Minimap";

const FIGURE_TO_SHAPE = {
    square: "rect", rectangle: "rect", circle: "ellipse", line: "line",
    arrow: "arrow", rhombus: "rhombus", triangle: "triangle",
    hexagon: "hexagon", star: "star"
};
const FIGURE_TO_FIXED_RATIO = { square: 1, circle: 1 };
const FIGURES = Object.keys(FIGURE_TO_SHAPE);

export default function Canvas({
    tool, setTool, color, setColor, lineWidth, setLineWidth,
    scale, setScale, offset, setOffset, strokes, setStrokes,
    worldRect, setWorldRect,
}) {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState(null);
    const [drawing, setDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState([]);
    const [currentShape, setCurrentShape] = useState(null);
    const [spacePressed, setSpacePressed] = useState(false);
    const [eraserCursorPos, setEraserCursorPos] = useState(null);

    const screenToWorld = useCallback((x, y) => ({
        x: (x - offset.x) / scale,
        y: (y - offset.y) / scale,
    }), [offset, scale]);

    const worldToScreen = useCallback((x, y) => ({
        x: x * scale + offset.x,
        y: y * scale + offset.y,
    }), [offset, scale]);

    // Получает позицию мыши относительно холста.
    const getRelativeMouse = useCallback((e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        return rect ? { mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top } : { mouseX: 0, mouseY: 0 };
    }, []);

    // ==== Обработчики событий клавиатуры (Undo и панорамирование) ====
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Используем e.code, чтобы отслеживать физическую клавишу, независимо от раскладки
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                setStrokes(prev => prev.slice(0, -1));
            }
            if (e.code === 'Space') {
                e.preventDefault();
                setSpacePressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setSpacePressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setStrokes]); // Зависим только от setStrokes, чтобы функция всегда была актуальной


    // ==== Сброс состояния рисования при смене инструмента ====
    useEffect(() => {
        if (drawing) {
            setDrawing(false);
            setCurrentShape(null);
            setCurrentStroke([]);
        }
    }, [tool]);


  // --- Динамически расширяет границы "мира", если рисунок выходит за их пределы. ---
  const expandWorldIfNeeded = useCallback((points) => {
    let { minX, minY, maxX, maxY } = worldRect;
    let expanded = false;
    for (const { x, y } of points) {
      if (x < minX) { minX = x - 500; expanded = true; }
      if (x > maxX) { maxX = x + 500; expanded = true; }
      if (y < minY) { minY = y - 500; expanded = true; }
      if (y > maxY) { maxY = y + 500; expanded = true; }
    }
    if (expanded) setWorldRect({ minX, minY, maxX, maxY });
  }, [worldRect, setWorldRect]);


  // ====== Отрисовывает геометрическую фигуру на холсте. ======
  const drawFigure = useCallback((ctx, type, params, isPreview = false) => {
    ctx.save();
    ctx.strokeStyle = params.color;
    ctx.lineWidth = params.lineWidth * scale;
    ctx.globalAlpha = isPreview ? 0.65 : 1;

    let { x1, y1, x2, y2, figure } = params;

    if (FIGURE_TO_FIXED_RATIO[figure]) {
      const size = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      x2 = x1 + Math.sign(x2 - x1) * size;
      y2 = y1 + Math.sign(y2 - y1) * size;
    }

    const p1 = worldToScreen(x1, y1);
    const p2 = worldToScreen(x2, y2);

    ctx.beginPath();
    switch (type) {
      case "rect":
        ctx.rect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
        break;
      case "ellipse":
        ctx.ellipse((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, Math.abs(p2.x - p1.x) / 2, Math.abs(p2.y - p1.y) / 2, 0, 0, 2 * Math.PI);
        break;
      case "line":
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        break;
      case "arrow": {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke(); // Draw the line part first

        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowLength = Math.min(20, 18 * scale);
        ctx.beginPath(); // Start new path for the arrowhead
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - arrowLength * Math.cos(angle - Math.PI / 7), p2.y - arrowLength * Math.sin(angle - Math.PI / 7));
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - arrowLength * Math.cos(angle + Math.PI / 7), p2.y - arrowLength * Math.sin(angle + Math.PI / 7));
        break;
      }
      case "rhombus": {
        const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
        ctx.moveTo(cx, p1.y);
        ctx.lineTo(p2.x, cy);
        ctx.lineTo(cx, p2.y);
        ctx.lineTo(p1.x, cy);
        ctx.closePath();
        break;
      }
      case "triangle":
        ctx.moveTo((p1.x + p2.x) / 2, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p1.x, p2.y);
        ctx.closePath();
        break;
      case "hexagon": {
        const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
        const rx = Math.abs(p2.x - p1.x) / 2, ry = Math.abs(p2.y - p1.y) / 2;
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i - Math.PI / 6;
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }
      case "star": {
        const cx = (p1.x + p2.x) / 2, cy = (p1.y + p2.y) / 2;
        const spikes = 5, outerRadius = Math.max(Math.abs(p2.x - p1.x) / 2, Math.abs(p2.y - p1.y) / 2);
        const innerRadius = outerRadius / 2.5;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = Math.PI / spikes * i - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }
      default:
        break;
    }
    ctx.stroke();
    ctx.restore();
  }, [scale, worldToScreen]);

  // Отрисовывает кастомный курсор для ластика.
    function drawEraserCursor(ctx, pos, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }


    // ====== Основной эффект перерисовки всего холста ======
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Отрисовка всех сохраненных линий и фигур
        for (const stroke of strokes) {
            if (stroke.figure) {
                drawFigure(ctx, stroke.type, stroke);
            } else if (stroke.points && stroke.points.length >= 2) {
                ctx.strokeStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
                ctx.lineWidth = stroke.lineWidth * scale;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                let start = worldToScreen(stroke.points[0].x, stroke.points[0].y);
                ctx.moveTo(start.x, start.y);
                for (let i = 1; i < stroke.points.length; i++) {
                    let p = worldToScreen(stroke.points[i].x, stroke.points[i].y);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            }
        }

        // 2. Отрисовка превью (того, что рисуется в данный момент)
        if (drawing) {
            if (currentStroke.length > 1) { // Для кисти или ластика
                ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
                ctx.lineWidth = lineWidth * scale;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.beginPath();
                let start = worldToScreen(currentStroke[0].x, currentStroke[0].y);
                ctx.moveTo(start.x, start.y);
                for (let i = 1; i < currentStroke.length; i++) {
                    let p = worldToScreen(currentStroke[i].x, currentStroke[i].y);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            } else if (currentShape) { // Для фигур
                drawFigure(ctx, currentShape.type, { ...currentShape, color, lineWidth }, true);
            }
        }
    
        // 3. Отрисовка курсора ластика
        if (tool === "eraser" && eraserCursorPos) {
            drawEraserCursor(ctx, eraserCursorPos, (lineWidth * scale) / 2);
        }
    }, [strokes, drawing, currentStroke, currentShape, eraserCursorPos, tool, color, lineWidth, scale, offset, drawFigure, worldToScreen]);

    // ==== Обработчики событий мыши ====
    const handleMouseDown = (e) => {
        if (e.button === 2 && currentShape) { e.preventDefault(); setCurrentShape(null); setDrawing(false); return; }
        if (e.button === 1 || (e.button === 0 && spacePressed)) { setIsPanning(true); setLastMousePos({ x: e.clientX, y: e.clientY }); return; }
        if (e.button !== 0) return;

        const { mouseX, mouseY } = getRelativeMouse(e);
        const pos = screenToWorld(mouseX, mouseY);
        setDrawing(true);

        if (tool === "brush" || tool === "eraser") {
            setCurrentStroke([{ x: pos.x, y: pos.y }]);
        } else if (FIGURES.includes(tool)) {
            if (!currentShape) {
                setCurrentShape({ type: FIGURE_TO_SHAPE[tool], figure: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
            } else {
                let newShape = { ...currentShape, x2: pos.x, y2: pos.y };
                if (FIGURE_TO_FIXED_RATIO[tool]) {
                    const size = Math.max(Math.abs(newShape.x2 - newShape.x1), Math.abs(newShape.y2 - newShape.y1));
                    newShape.x2 = newShape.x1 + Math.sign(newShape.x2 - newShape.x1) * size;
                    newShape.y2 = newShape.y1 + Math.sign(newShape.y2 - newShape.y1) * size;
                }
                expandWorldIfNeeded([{ x: newShape.x1, y: newShape.y1 }, { x: newShape.x2, y: newShape.y2 }]);
                setStrokes((prev) => [...prev, { ...newShape, color, lineWidth, tool, figure: tool }]);
                setCurrentShape(null);
                setDrawing(false);
            }
        }
    };

    const handleMouseMove = (e) => {
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

        if (tool === "brush" || tool === "eraser") {
            setCurrentStroke((prev) => [...prev, pos]);
        } else if (currentShape) {
            setCurrentShape(prev => ({ ...prev, x2: pos.x, y2: pos.y }));
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setLastMousePos(null);
        if (!drawing) return;
        if ((tool === "brush" || tool === "eraser") && currentStroke.length > 1) {
            expandWorldIfNeeded(currentStroke);
            setStrokes((prev) => [...prev, { points: currentStroke, color, lineWidth, tool }]);
        }
        if (!currentShape) {
            setDrawing(false);
        }
        setCurrentStroke([]);
    };

    const handleMouseLeave = () => {
        if (drawing) {
            handleMouseUp();
        }
        setEraserCursorPos(null);
    };

    const handleWheel = useCallback((e) => {
        const { mouseX, mouseY } = getRelativeMouse(e);
        const worldPosBefore = {
            x: (mouseX - offset.x) / scale,
            y: (mouseY - offset.y) / scale
        };
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.01, Math.min(30, scale * zoomFactor));
        const newOffset = {
            x: mouseX - worldPosBefore.x * newScale,
            y: mouseY - worldPosBefore.y * newScale
        };
        setScale(newScale);
        setOffset(newOffset);
    }, [scale, offset, getRelativeMouse, setScale, setOffset]);

    // ==== Установка обработчиков событий, которые не должны пересоздаваться ====
    const wheelHandlerRef = useRef(handleWheel);
    useEffect(() => {
        wheelHandlerRef.current = handleWheel;
    }, [handleWheel]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        ctxRef.current = canvas.getContext("2d");
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            canvas.width = width;
            canvas.height = height;
            setViewportSize({ w: width, h: height });
        });
        resizeObserver.observe(canvas);
        const preventMenu = (e) => e.preventDefault();
        canvas.addEventListener("contextmenu", preventMenu);
        const wheelListener = (e) => {
            e.preventDefault();
            wheelHandlerRef.current(e)
        };
        canvas.addEventListener("wheel", wheelListener, { passive: false });
        return () => {
            if (canvas) {
                resizeObserver.unobserve(canvas);
                canvas.removeEventListener("contextmenu", preventMenu);
                canvas.removeEventListener("wheel", wheelListener);
            }
        };
    }, [getRelativeMouse]);

    const clearCanvas = () => setStrokes([]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#23232e",
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
      <Minimap
        strokes={strokes}
        offset={offset}
        scale={scale}
        setOffset={setOffset}
        worldRect={worldRect}
        minimapSize={200}
        viewportW={viewportSize.w}
        viewportH={viewportSize.h}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: "block",
          background: "#fff",
          zIndex: 1,
          cursor: isPanning || spacePressed ? "grab" : tool === "eraser" ? "none" : "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
      />
    </div>
  );
}