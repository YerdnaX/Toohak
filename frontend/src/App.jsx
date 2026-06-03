import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import CreateKahootPage from './pages/CreateKahootPage.jsx';
import GameAdminPage from './pages/GameAdminPage.jsx';
import JoinPage from './pages/JoinPage.jsx';
import GuestGamePage from './pages/GuestGamePage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/admin"         element={<AdminPage />} />
        <Route path="/admin/crear"   element={<CreateKahootPage />} />
        <Route path="/admin/juego"   element={<GameAdminPage />} />
        <Route path="/unirse"        element={<JoinPage />} />
        <Route path="/juego/:codigo" element={<GuestGamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
