import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Table as TableIcon, BarChart3, Settings, 
  RefreshCw, Package, Bell, Search, ChevronRight, HardDrive, UserCircle,
  LayoutGrid, Clock
} from 'lucide-react';

import DashboardView from './views/Dashboard';
import InventoryView from './views/Inventory';
import AnalyticsView from './views/Analytics';
import UploadView from './views/Upload';
import ModuleExplorer from './views/ModuleExplorer';
import OverdueItemsView from './views/OverdueItems';

import './App.css';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => (
  <Link 
    to={path} 
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
      ${active ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    <Icon size={18} className={active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'} />
    <span>{label}</span>
    {active && (
      <motion.div 
        layoutId="active-sidebar-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" 
      />
    )}
  </Link>
);

const App: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/data');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && data.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
        <RefreshCw size={32} className="text-blue-500" />
      </motion.div>
      <p className="text-sm font-medium animate-pulse">Initializing Workspace...</p>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* Dark Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-1.5 rounded-lg shadow-sm">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">BomSync</h1>
              <p className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">Enterprise</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
          <div>
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Dashboard</p>
            <div className="space-y-1">
              <SidebarItem icon={LayoutDashboard} label="Overview" path="/" active={location.pathname === '/'} />
              <SidebarItem icon={LayoutGrid} label="Module Explorer" path="/explorer" active={location.pathname === '/explorer'} />
              <SidebarItem icon={Clock} label="Overdue Deliveries" path="/overdue" active={location.pathname === '/overdue'} />
              <SidebarItem icon={TableIcon} label="Inventory Tracking" path="/inventory" active={location.pathname === '/inventory'} />
              <SidebarItem icon={BarChart3} label="Cost Analytics" path="/analytics" active={location.pathname === '/analytics'} />
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Management</p>
            <div className="space-y-1">
              <SidebarItem icon={HardDrive} label="Data Center" path="/upload" active={location.pathname === '/upload'} />
              <SidebarItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium border border-white/10">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Sophic Corp</p>
              <p className="text-xs text-slate-400 truncate">Project P513</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>Workspace</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 capitalize">{location.pathname === '/' ? 'Overview' : location.pathname.slice(1).replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <button 
              onClick={fetchData} 
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-blue-500' : ''} /> 
              <span>Sync</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-8 relative">
          <AnimatePresence>
            {loading && data.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 right-8 z-50"
              >
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-blue-100 shadow-lg shadow-blue-500/5">
                  <RefreshCw size={12} className="text-blue-500 animate-spin" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Syncing</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<DashboardView data={data} />} />
                <Route path="/explorer" element={<ModuleExplorer data={data} onUpdate={fetchData} />} />
                <Route path="/overdue" element={<OverdueItemsView data={data} onUpdate={fetchData} />} />
                <Route path="/inventory" element={<InventoryView data={data} onUpdate={fetchData} />} />
                <Route path="/analytics" element={<AnalyticsView data={data} />} />
                <Route path="/upload" element={<UploadView onSync={fetchData} />} />
              </Routes>
            </AnimatePresence>
          </div>
        </div>
      </main>

    </div>
  );
};

export default App;
