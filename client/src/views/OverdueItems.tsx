import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Package, Calendar, ChevronRight } from 'lucide-react';
import InventoryView from './Inventory';

const OverdueItemsView = ({ data, onUpdate }: any) => {
  const overdueData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter((item: any) => {
      // Rule 1: Not collected
      const isNotCollected = item['Actual Status'] !== 'Collected';
      
      // Rule 2: Has ETA and ETA <= today
      const etaStr = item['Estimate Delivery Date'];
      if (!etaStr || !isNotCollected) return false;
      
      const etaDate = new Date(etaStr);
      etaDate.setHours(0, 0, 0, 0);
      
      return etaDate <= today;
    }).sort((a: any, b: any) => {
      // Sort by oldest ETA first
      return new Date(a['Estimate Delivery Date']).getTime() - new Date(b['Estimate Delivery Date']).getTime();
    });
  }, [data]);

  const stats = useMemo(() => {
    return {
      count: overdueData.length,
      totalValue: overdueData.reduce((acc: number, i: any) => acc + (Number(i['Total Price']) || 0), 0),
      urgentCount: overdueData.filter((i: any) => i['Attention Needed']).length
    };
  }, [overdueData]);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">Overdue Deliveries</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-red-200">Action Required</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Items that have reached or passed their ETA but are not yet collected.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Overdue</p>
              <h4 className="text-base font-bold text-slate-900">{stats.count} Items</h4>
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Urgent Attention</p>
              <h4 className="text-base font-bold text-slate-900">{stats.urgentCount} Flagged</h4>
            </div>
          </div>
        </div>
      </div>

      {overdueData.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <InventoryView data={overdueData} onUpdate={onUpdate} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full" />
            <Package size={64} strokeWidth={1} className="relative opacity-20 text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule is on track!</h3>
          <p className="text-sm font-medium">No items found with overdue delivery dates.</p>
        </div>
      )}
    </div>
  );
};

export default OverdueItemsView;
