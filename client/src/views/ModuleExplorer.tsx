import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, Package, DollarSign, 
  CheckCircle2, Clock, AlertTriangle, Layers, 
  ArrowLeft, Filter, LayoutGrid
} from 'lucide-react';
import InventoryView from './Inventory';

const ModuleExplorer = ({ data, onUpdate }: any) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleSearch, setModuleSearch] = useState('');

  const moduleStats = useMemo(() => {
    const stats: Record<string, any> = {};
    
    data.forEach((item: any) => {
      // Exclude 'Other' status from module-level item and cost tracking
      if (item['Actual Status'] === 'Other') return;

      const mod = item.Module || 'Unassigned';
      if (!stats[mod]) {
        stats[mod] = {
          name: mod,
          totalItems: 0,
          collectedItems: 0,
          totalCost: 0,
          urgentItems: 0,
          categories: new Set()
        };
      }
      
      stats[mod].totalItems++;
      if (item['Actual Status'] === 'Collected') stats[mod].collectedItems++;
      if (item['Attention Needed']) stats[mod].urgentItems++;
      stats[mod].totalCost += (Number(item['Total Price']) || 0);
      if (item.Category) stats[mod].categories.add(item.Category);
    });

    return Object.values(stats).sort((a, b) => b.totalCost - a.totalCost);
  }, [data]);

  const filteredModules = moduleStats.filter(m => 
    m.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const activeModuleData = useMemo(() => {
    if (!selectedModule) return [];
    return data.filter((item: any) => (item.Module || 'Unassigned') === selectedModule);
  }, [data, selectedModule]);

  if (selectedModule) {
    return (
      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => setSelectedModule(null)}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Module</span>
              <h2 className="text-xl font-bold text-slate-900">{selectedModule}</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Focusing on {activeModuleData.length} items within this module</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <InventoryView data={activeModuleData} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Module Explorer</h2>
          <p className="text-sm text-slate-500 font-medium">Select a module to drill down into its inventory and status.</p>
        </div>
        
        <div className="relative group w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search module name..." 
            value={moduleSearch}
            onChange={(e) => setModuleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredModules.map((m) => {
            const progress = Math.round((m.collectedItems / m.totalItems) * 100);
            return (
              <motion.button
                key={m.name}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedModule(m.name)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all text-left flex flex-col gap-5 group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Layers size={24} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Value</span>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">RM {m.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{m.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.totalItems} Items</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.categories.size} Categories</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Collection Status</span>
                    <span className={progress === 100 ? 'text-emerald-600' : 'text-blue-600'}>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex gap-3">
                    {m.urgentItems > 0 && (
                      <div className="flex items-center gap-1 text-red-500">
                        <AlertTriangle size={14} />
                        <span className="text-[10px] font-black">{m.urgentItems}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock size={14} />
                      <span className="text-[10px] font-black">{m.totalItems - m.collectedItems}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      
      {filteredModules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">No modules found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default ModuleExplorer;
