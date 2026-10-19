import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProvidersDashboard from './pages/ProvidersDashboard.jsx'
import KrakenPage from './pages/KrakenPage.jsx'
import OkxPage from './pages/OkxPage.jsx'
import CoinbasePage from './pages/CoinbasePage.jsx'
import './App.css'

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/providers/dashboard" replace />} />
      <Route path="/providers" element={<Navigate to="/providers/dashboard" replace />} />
      <Route path="/providers/dashboard" element={<ProvidersDashboard />} />
      <Route path="/providers/kraken" element={<KrakenPage />} />
      <Route path="/providers/okx" element={<OkxPage />} />
      <Route path="/providers/coinbase" element={<CoinbasePage />} />
      <Route path="*" element={<Navigate to="/providers/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
}
