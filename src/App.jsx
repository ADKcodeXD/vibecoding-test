import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Signal from './pages/Signal';
import AudioVisualizer from './pages/AudioVisualizer';
import FxSimulator from './pages/FxSimulator';
import { Home, LineChart, Activity, Music, TrendingUp } from 'lucide-react';
import './App.css'; // You might want to remove or clear this file if it conflicts, or use it for global layout styles

function NavLink({ to, icon: Icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <Icon size={18} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 mb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          VibeCoding Projects
        </h1>
        <p className="text-slate-400 mb-10 text-lg">
          A collection of interactive visualization and simulation experiments.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/signal" className="group relative overflow-hidden bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Activity size={100} />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                 <Activity size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Alpha Signal</h3>
               <p className="text-slate-400 text-sm">Quant analysis dashboard with advanced signal processing and visualization.</p>
             </div>
          </Link>

          <Link to="/audio" className="group relative overflow-hidden bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Music size={100} />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                 <Music size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Audio Visualizer</h3>
               <p className="text-slate-400 text-sm">Interactive 3D audio visualization experience using Three.js.</p>
             </div>
          </Link>

          <Link to="/fx" className="group relative overflow-hidden bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-green-500 transition-all hover:shadow-lg hover:shadow-green-500/10">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp size={100} />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                 <TrendingUp size={24} />
               </div>
               <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition-colors">FX Simulator</h3>
               <p className="text-slate-400 text-sm">Real-time professional Forex trading simulator with order book and charting.</p>
             </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
      
      {/* Bottom Navigation Bar */}
      <nav className="flex-none bg-slate-900/95 border-t border-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 z-50">
        <div className="flex justify-center p-2 gap-2 overflow-x-auto">
          <NavLink to="/" icon={Home} label="Home" />
          <NavLink to="/signal" icon={Activity} label="Signal" />
          <NavLink to="/audio" icon={Music} label="Visualizer" />
          <NavLink to="/fx" icon={TrendingUp} label="FX Sim" />
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signal" element={<Signal />} />
          <Route path="/audio" element={<AudioVisualizer />} />
          <Route path="/fx" element={<FxSimulator />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
