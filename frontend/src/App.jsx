// frontend/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Canvas from './components/Canvas';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/canvas" element={<Canvas />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;