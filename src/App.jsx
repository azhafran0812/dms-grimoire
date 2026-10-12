import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './views/pages/Welcome';
import Login from './views/pages/Login';
import DashboardDM from './views/pages/DashboardDM';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/dm" element={<DashboardDM />} />
        <Route path="/dashboard/player" element={<div className="text-white p-10">Dasbor Player - Segera Hadir</div>} />
      </Routes>
    </Router>
  );
}

export default App;