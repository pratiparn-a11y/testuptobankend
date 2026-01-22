import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import api from './api';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    // Wake up the server immediately when someone visits
    const wakeUpServer = async () => {
      try {
        console.log('Sending wake-up ping to server... 🚀');
        await api.get('/ping');
        console.log('Server is awake and ready! ✨');
      } catch (error) {
        console.error('Error waking up server:', error);
      }
    };

    wakeUpServer();

    // Keep it awake every 10 minutes while the tab is open
    const interval = setInterval(wakeUpServer, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
