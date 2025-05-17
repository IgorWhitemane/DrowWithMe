import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:8000/ws';

export default function Canvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const socketRef = useRef(null);
  const lastPoint = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [tool, setTool] = useState('brush');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Инициализация Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.scale(2, 2); // Для ретина-дисплеев
    ctxRef.current = ctx;

    // Загрузка текущего состояния холста
    fetch('http://localhost:8000/sync')
      .then(res => res.json())
      .then(strokes => {
        strokes.forEach(stroke => {
          drawStroke(stroke.points, stroke.color, stroke.lineWidth);
        });
      })
      .catch(err => {
        console.error('Failed to load canvas state:', err);
        setErrorMessage('Failed to load canvas state');
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Настройка WebSocket
  useEffect(() => {
    if (!token) {
      setSocketStatus('Missing token');
      return;
    }

    try {
      socketRef.current = new WebSocket(WS_URL);
      
      // Добавляем токен в заголовки
      socketRef.current.onopen = () => {
        setIsConnected(true);
        setSocketStatus('Connected');
        console.log('✅ WebSocket connected');
        
        // Отправляем текущие настройки
        sendSettings();
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'stroke') {
            drawStroke(data.points, data.color, data.lineWidth, false);
          } else if (data.type === 'settings') {
            applySettings(data.settings);
          } else if (data.type === 'clear') {
            clearCanvas();
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          setErrorMessage('Error parsing message');
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setSocketStatus('Error');
        setErrorMessage(`WebSocket error: ${error.message}`);
      };

      socketRef.current.onclose = (event) => {
        setIsConnected(false);
        setSocketStatus('Disconnected');
        console.log('🔌 WebSocket closed', event.reason);
        
        // Автоматическое восстановление соединения
        setTimeout(() => {
          setSocketStatus('Reconnecting...');
          // Повторная попытка подключения
          if (token) {
            socketRef.current = new WebSocket(WS_URL);
          }
        }, 5000);
      };

    } catch (error) {
      console.error('WebSocket initialization error:', error);
      setErrorMessage('Failed to initialize WebSocket');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [token]);

  // Обновление токена
  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  const sendSettings = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    const settings = {
      tool,
      color,
      lineWidth,
      scale,
      offset
    };
    
    socketRef.current.send(JSON.stringify({
      type: 'settings',
      settings
    }));
  };

  const applySettings = (settings) => {
    if (settings.tool) setTool(settings.tool);
    if (settings.color) setColor(settings.color);
    if (settings.lineWidth) setLineWidth(settings.lineWidth);
    if (settings.scale) setScale(settings.scale);
    if (settings.offset) setOffset(settings.offset);
  };

  const drawStroke = (points, strokeColor = color, strokeWidth = lineWidth, emit = true) => {
    if (!ctxRef.current || points.length < 2) return;
    
    ctxRef.current.strokeStyle = strokeColor;
    ctxRef.current.lineWidth = strokeWidth;
    
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctxRef.current.lineTo(points[i].x, points[i].y);
    }
    
    ctxRef.current.stroke();
    
    if (emit && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'stroke',
        points,
        color: strokeColor,
        lineWidth: strokeWidth
      }));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'clear'
      }));
    }
  };

  const handleMouseDown = (e) => {
    if (tool === 'move') {
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    drawing.current = true;
    const { clientX, clientY } = e;
    lastPoint.current = { x: clientX, y: clientY };
  };

  const handleMouseMove = (e) => {
    if (tool === 'move' && e.buttons === 1) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!drawing.current) return;
    
    const { clientX, clientY } = e;
    
    if (tool === 'brush' || tool === 'eraser') {
      const currentPoint = { x: clientX, y: clientY };
      const points = [lastPoint.current, currentPoint];
      
      drawStroke(points, tool === 'eraser' ? '#FFFFFF' : color, lineWidth, true);
      lastPoint.current = currentPoint;
    }
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
    
    setScale(newScale);
    
    // Центрируем зум относительно курсора
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = (mouseX / scale) * (zoomFactor - 1);
    const dy = (mouseY / scale) * (zoomFactor - 1);
    
    setOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));
  };

  const updateTool = (newTool) => {
    setTool(newTool);
    
    if (isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'settings',
        settings: { tool: newTool }
      }));
    }
  };

  const updateColor = (newColor) => {
    setColor(newColor);
    
    if (isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'settings',
        settings: { color: newColor }
      }));
    }
  };

  const updateLineWidth = (newWidth) => {
    setLineWidth(newWidth);
    
    if (isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'settings',
        settings: { lineWidth: newWidth }
      }));
    }
  };

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  return (
    <div className="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      {/* Панель инструментов */}
      <div className="toolbar" style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => updateTool('brush')} style={{ fontWeight: tool === 'brush' ? 'bold' : 'normal' }}>Brush</button>
          <button onClick={() => updateTool('eraser')} style={{ fontWeight: tool === 'eraser' ? 'bold' : 'normal' }}>Eraser</button>
          <button onClick={() => updateTool('move')} style={{ fontWeight: tool === 'move' ? 'bold' : 'normal' }}>Move</button>
          <button onClick={clearCanvas}>Clear</button>
        </div>
        
        {tool !== 'move' && (
          <>
            <div style={{ marginBottom: '5px' }}>Color:</div>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => updateColor(e.target.value)} 
              style={{ width: '100%', marginBottom: '10px' }}
            />
            
            <div style={{ marginBottom: '5px' }}>Line Width: {lineWidth}</div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={lineWidth} 
              onChange={(e) => updateLineWidth(parseInt(e.target.value))} 
              style={{ width: '100%' }}
            />
          </>
        )}
      </div>
      
      {/* Статус подключения */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0 }}>WebSocket Status: {socketStatus}</p>
        {errorMessage && <p style={{ color: 'red', margin: 0 }}>Error: {errorMessage}</p>}
      </div>

      {/* Холст */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
        onWheel={handleWheel}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`
        }}
      />
    </div>
  );
}