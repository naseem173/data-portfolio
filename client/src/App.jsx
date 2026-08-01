import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import StocksDashboard from './pages/StocksDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Link to="/" className="font-semibold text-gray-900">
            data-portfolio
          </Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/stocks" element={<StocksDashboard />} />
      </Routes>
    </div>
  )
}

export default App
