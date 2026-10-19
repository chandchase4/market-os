import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProvidersDashboard from './pages/ProvidersDashboard.jsx'
import KrakenPage from './pages/KrakenPage.jsx'
import './App.css'

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/providers/dashboard" replace />} />
      <Route path="/providers" element={<Navigate to="/providers/dashboard" replace />} />
      <Route path="/providers/dashboard" element={<ProvidersDashboard />} />
      <Route path="/providers/kraken" element={<KrakenPage />} />
      <Route path="*" element={<Navigate to="/providers/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
}
