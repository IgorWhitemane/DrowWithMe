// frontend/src/App.jsx

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './components/Login';
import Register from './components/Register';
import Canvas from './components/Canvas';
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function App() {
  // Глобальные состояния "мира"
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [strokes, setStrokes] = useState([]);
  const [worldRect, setWorldRect] = useState({
    minX: -5000,
    minY: -5000,
    maxX: 5000,
    maxY: 5000,
  });

  // Центрируем viewport при старте
  useEffect(() => {
    setOffset({
      x: window.innerWidth / 2 - ((worldRect.minX + worldRect.maxX) / 2) * scale,
      y: window.innerHeight / 2 - ((worldRect.minY + worldRect.maxY) / 2) * scale,
    });
    // eslint-disable-next-line
  }, []);

  return (
    <Router>
      <LanguageSwitcher />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/canvas"
          element={
            <Canvas
              tool={tool}
              setTool={setTool}
              color={color}
              setColor={setColor}
              lineWidth={lineWidth}
              setLineWidth={setLineWidth}
              scale={scale}
              setScale={setScale}
              offset={offset}
              setOffset={setOffset}
              strokes={strokes}
              setStrokes={setStrokes}
              worldRect={worldRect}
              setWorldRect={setWorldRect}
            />
          }
        />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}