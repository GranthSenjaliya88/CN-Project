import { lazy, Suspense } from 'react';
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppNavigation } from './components/AppNavigation';
const HomePage = lazy(() => import('./pages/HomePage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const ExperimentsPage = lazy(() => import('./pages/ExperimentsPage'));
const TheoryPage = lazy(() => import('./pages/TheoryPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#070d1a',
        color: '#f0f9ff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <AppNavigation />
        <div style={{ flex: 1 }}>
          <Suspense fallback={<main style={{padding:100}}>Loading the networking lab…</main>}><Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/protocol-lab" element={<Navigate to="/simulator" replace />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/theory" element={<TheoryPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}
