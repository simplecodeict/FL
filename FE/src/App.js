import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Registration'; // Ensure this path is correct
import LandingPage from './pages/landingPage';
import HomePage from './pages/homepage';
import CodeNexa from './pages/dashboard/CodeNexa';
import HydraGuard from './pages/dashboard/HydraGuard';
import Shield from './pages/dashboard/SHIELD';
import Secunid from './pages/dashboard/Secunid';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/home" element={<HomePage />} /> */}
        <Route path="/CodeNexa" element={<CodeNexa />} />
        <Route path="/HydraGuard" element={<HydraGuard />} />
        <Route path="/shield" element={<Shield />} />
        <Route path="/Secunid" element={<Secunid />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;