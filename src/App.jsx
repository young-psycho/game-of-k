import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "./context/GameContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import PlayerSetup from "./pages/PlayerSetup";
import PreferencesSetup from "./pages/PreferencesSetup";
import InventorySetup from "./pages/InventorySetup";
import GamePlay from "./pages/GamePlay";
import "./App.css";

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
            <Route path="players" element={<PlayerSetup />} />
            <Route path="preferences" element={<PreferencesSetup />} />
            <Route path="inventory" element={<InventorySetup />} />
            <Route path="play" element={<GamePlay />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
