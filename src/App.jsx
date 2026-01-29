import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

import PerformerAuth from './pages/PerformerAuth';
import Board from './pages/Board';
import ConcertInfo from './pages/ConcertInfo';
import Reservation from './pages/Reservation';
import Admin from './pages/Admin';
import Checkin from './pages/Checkin';
import AuthHandler from './components/AuthHandler';
import ProtectedRoute from './components/ProtectedRoute';
import Onsite from './pages/Onsite';

function App() {
  return (
    <BrowserRouter>
      <AuthHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="performer/login" element={<PerformerAuth />} />
          <Route path="reserve" element={<Reservation />} />
          <Route path="onsite" element={<Onsite />} />
          <Route
            path="admin"
            element={(
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            )}
          />
          <Route
            path="checkin"
            element={(
              <ProtectedRoute>
                <Checkin />
              </ProtectedRoute>
            )}
          />
          <Route path="board" element={<Board />} />
          <Route path="info" element={<ConcertInfo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
