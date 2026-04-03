import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, AlertCircle, MessageSquare, Filter, CheckSquare, Square, 
  X, Circle, Loader2, DollarSign, PackageCheck, TrendingUp,
  ArrowUpDown, ChevronUp, ChevronDown, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

const InventoryView = ({ data, onUpdate }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [batchRemark, setBatchRemark] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const filteredData = useMemo(() => {
    // 1. Filter
    let result = data.filter((item: any) => 
      item.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item['Bom Line No']?.toString().includes(searchTerm) ||
      item.Module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item['Part No']?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item['Po No']?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item['Actual Status']?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort
    if (sortConfig !== null) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="ml-1 text-blue-500" /> : <ChevronDown size={12} className="ml-1 text-blue-500" />;
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Group data by module
    const modules: Record<string, any[]> = {};
    data.forEach((item: any) => {
      const modName = (item.Module || 'Unassigned').substring(0, 31).replace(/[\[\]\*\?\:\/\\]/g, ''); // Excel sheet name constraints
      if (!modules[modName]) modules[modName] = [];
      modules[modName].push(item);
    });

    // Create a sheet for each module
    Object.keys(modules).sort().forEach(modName => {
      const modData = modules[modName];
      
      // Sort by category then by description within the module
      const sortedModData = [...modData].sort((a, b) => {
        const catCompare = (a.Category || '').localeCompare(b.Category || '');
        if (catCompare !== 0) return catCompare;
        return (a.Description || '').localeCompare(b.Description || '');
      });

      const exportRows = sortedModData.map(item => ({
        'Category': item.Category || '-',
        'Part No': item['Part No'] || '-',
        'Description': item.Description || '-',
        'PO No': item['Po No'] || '-',
        'ETA': item['Estimate Delivery Date'] || '-',
        'Actual Status': item['Actual Status'] || '-',
        'Bom Status': item['Status'] || '-',
        'Remark': item.Remark || '-',
        'Vendor': item['Vendor Name'] || '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Category
        { wch: 15 }, // Part No
        { wch: 45 }, // Description
        { wch: 15 }, // PO No
        { wch: 12 }, // ETA
        { wch: 15 }, // Status
        { wch: 15 }, // Bom Status
        { wch: 30 }, // Remark
        { wch: 25 }, // Vendor
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, modName);
    });

    XLSX.writeFile(workbook, `BOM_Full_Status_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const stats = useMemo(() => {
    const totalWithOther = filteredData.length;
    // Exclude 'Other' from being counted as a "part of the item"
    const trackingData = filteredData.filter((i: any) => i['Actual Status'] !== 'Other');
    const total = trackingData.length;
    
    if (totalWithOther === 0) return null;

    const statusCounts = {
      'Pending for PR': filteredData.filter((i: any) => i['Actual Status'] === 'Pending for PR').length,
      'Pending with ETA': filteredData.filter((i: any) => i['Actual Status'] === 'Pending with ETA').length,
      'Arrived': filteredData.filter((i: any) => i['Actual Status'] === 'Arrived').length,
      'Collected': filteredData.filter((i: any) => i['Actual Status'] === 'Collected').length,
      'Delayed': filteredData.filter((i: any) => i['Actual Status'] === 'Delayed').length,
      'Other': filteredData.filter((i: any) => i['Actual Status'] === 'Other').length,
    };
    
    const totalCost = trackingData.reduce((acc: number, i: any) => acc + (Number(i['Total Price']) || 0), 0);
    const collectedCost = trackingData
      .filter((i: any) => i['Actual Status'] === 'Collected')
      .reduce((acc: number, i: any) => acc + (Number(i['Total Price']) || 0), 0);
    
    const completionRate = total > 0 ? Math.round((statusCounts.Collected / total) * 100) : 0;
    const costProgress = totalCost > 0 ? Math.round((collectedCost / totalCost) * 100) : 0;

    return { total, totalWithOther, statusCounts, totalCost, collectedCost, completionRate, costProgress };
  }, [filteredData]);

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredData.length && filteredData.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map((item: any) => item['Bom Line No'].toString()));
    }
  };

  const toggleSelectItem = (lineNo: string) => {
    setSelectedItems(prev => 
      prev.includes(lineNo) ? prev.filter(id => id !== lineNo) : [...prev, lineNo]
    );
  };

  const updateItem = async (lineNo: string, updates: any) => {
    try {
      const payload = { ...updates };
      if (payload['Actual Status']) { payload.status = payload['Actual Status']; delete payload['Actual Status']; }
      if (payload['Attention Needed'] !== undefined) { payload.attention = payload['Attention Needed']; delete payload['Attention Needed']; }
      if (payload.Remark !== undefined) { payload.remark = payload.Remark; delete payload.Remark; }
      
      await axios.post('http://localhost:5000/api/update', { lineNo, ...payload });
      onUpdate(); 
    } catch (err) {
      console.error(err);
    }
  };

  const executeBatch = async (updates: any) => {
    if (selectedItems.length === 0) return;
    setIsUpdating(true);
    try {
      await axios.post('http://localhost:5000/api/update-batch', { 
        lineNos: selectedItems, 
        ...updates 
      });
      setSelectedItems([]);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("Batch update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending for PR': return 'text-slate-400 fill-slate-400';
      case 'Pending with ETA': return 'text-amber-500 fill-amber-500';
      case 'Arrived': return 'text-blue-500 fill-blue-500';
      case 'Collected': return 'text-emerald-500 fill-emerald-500';
      case 'Delayed': return 'text-red-500 fill-red-500';
      case 'Other': return 'text-slate-400 fill-slate-200';
      default: return 'text-slate-300 fill-slate-300';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col h-[calc(100vh-10rem)] gap-6"
    >
      {/* Module Summary Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</p>
              <h4 className="text-lg font-bold text-slate-900">RM {stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collection Progress</p>
              <div className="flex items-center justify-between mt-0.5">
                <h4 className="text-lg font-bold text-slate-900">{stats.statusCounts.Collected} / {stats.total}</h4>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{stats.completionRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Utilization</p>
              <div className="flex items-center justify-between mt-0.5">
                <h4 className="text-lg font-bold text-slate-900">RM {stats.collectedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{stats.costProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.costProgress}%` }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status Breakdown</p>
            <div className="flex items-center gap-1.5">
              {(['Pending for PR', 'Pending with ETA', 'Arrived', 'Collected', 'Delayed', 'Other'] as const).map((s) => {
                const count = stats.statusCounts[s];
                return (
                  <div key={s} className="group relative flex-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500
                        ${s === 'Pending for PR' ? 'bg-slate-300' : ''}
                        ${s === 'Pending with ETA' ? 'bg-amber-400' : ''}
                        ${s === 'Arrived' ? 'bg-blue-400' : ''}
                        ${s === 'Collected' ? 'bg-emerald-400' : ''}
                        ${s === 'Delayed' ? 'bg-red-400' : ''}
                        ${s === 'Other' ? 'bg-slate-100' : ''}
                      `}
                      style={{ width: '100%', opacity: count > 0 ? 1 : 0.2 }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-50">
                      {s}: {count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>{stats.statusCounts['Pending for PR']}PR</span>
              <span>{stats.statusCounts['Pending with ETA']}ETA</span>
              <span>{stats.statusCounts.Arrived}A</span>
              <span>{stats.statusCounts.Collected}C</span>
              <span>{stats.statusCounts.Delayed}D</span>
              <span>{stats.statusCounts.Other}O</span>
            </div>
          </div>
        </div>
      )}

      {/* IMPROVED FLOATING BATCH BAR */}
      <AnimatePresence>
        {selectedItems.length > 0 && (
          <motion.div 
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="fixed bottom-10 left-1/2 bg-slate-900 border border-slate-800 text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex items-center gap-10 min-w-[800px]"
          >
            <div className="flex items-center gap-4 pr-10 border-r border-slate-800">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-blue-500 leading-none">{selectedItems.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Items</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-between gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Apply Status Update</span>
                <div className="flex gap-2">
                  {['Pending for PR', 'Pending with ETA', 'Arrived', 'Collected', 'Delayed', 'Other'].map(s => (
                    <button 
                      key={s}
                      disabled={isUpdating}
                      onClick={() => executeBatch({ status: s })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border active:scale-95 disabled:opacity-50
                        ${s === 'Pending for PR' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500 hover:text-white' : ''}
                        ${s === 'Pending with ETA' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white' : ''}
                        ${s === 'Arrived' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white' : ''}
                        ${s === 'Collected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : ''}
                        ${s === 'Delayed' ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : ''}
                        ${s === 'Other' ? 'bg-slate-500/10 text-slate-300 border-slate-500/20 hover:bg-slate-500 hover:text-white' : ''}
                      `}
                    >
                      {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-px h-10 bg-slate-800" />

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Urgency Control</span>
                <div className="flex gap-2">
                  <button 
                    disabled={isUpdating}
                    onClick={() => executeBatch({ attention: true })}
                    className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
                  >
                    Set Urgent
                  </button>
                  <button 
                    disabled={isUpdating}
                    onClick={() => executeBatch({ attention: false })}
                    className="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="w-px h-10 bg-slate-800" />

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Batch Remark</span>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={batchRemark}
                    onChange={(e) => setBatchRemark(e.target.value)}
                    placeholder="Type remark..."
                    className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-blue-500/50 outline-none w-40"
                  />
                  <button 
                    disabled={isUpdating || !batchRemark.trim()}
                    onClick={() => {
                      executeBatch({ remark: batchRemark });
                      setBatchRemark('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedItems([])}
              className="p-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-md group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search BOM (Module, Category, Description, PO)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredData.length} Items</span>
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-xs font-bold active:scale-95"
            >
              <Download size={16} />
              <span>Export Report</span>
            </button>
            <button className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"><Filter size={18} /></button>
          </div>
        </div>

        {/* Improved Table Body */}
        <div 
          className="overflow-auto flex-1 scroll-smooth"
          style={{ paddingBottom: selectedItems.length > 0 ? '120px' : '0' }}
        >
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-md">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 w-12">
                  <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
                    {selectedItems.length === filteredData.length && filteredData.length > 0 
                      ? <CheckSquare size={20} className="text-blue-600" /> 
                      : <Square size={20} className="text-slate-300" />}
                  </button>
                </th>
                <th className="px-4 py-4 w-32 cursor-pointer group" onClick={() => requestSort('Module')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    Module / Cat <SortIndicator columnKey="Module" />
                  </div>
                </th>
                <th className="px-4 py-4 w-32 cursor-pointer group" onClick={() => requestSort('Part No')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    Part No <SortIndicator columnKey="Part No" />
                  </div>
                </th>
                <th className="px-4 py-4 w-80 cursor-pointer group" onClick={() => requestSort('Description')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    Description <SortIndicator columnKey="Description" />
                  </div>
                </th>
                <th className="px-4 py-4 w-28 cursor-pointer group" onClick={() => requestSort('Po No')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    PO No <SortIndicator columnKey="Po No" />
                  </div>
                </th>
                <th className="px-4 py-4 w-28 cursor-pointer group" onClick={() => requestSort('Estimate Delivery Date')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    ETA <SortIndicator columnKey="Estimate Delivery Date" />
                  </div>
                </th>
                <th className="px-4 py-4 w-40 cursor-pointer group" onClick={() => requestSort('Actual Status')}>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    Status <SortIndicator columnKey="Actual Status" />
                  </div>
                </th>
                <th className="px-4 py-4 w-20 cursor-pointer group text-center" onClick={() => requestSort('Attention Needed')}>
                  <div className="flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                    Urg <SortIndicator columnKey="Attention Needed" />
                  </div>
                </th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item: any) => {
                const isSelected = selectedItems.includes(item['Bom Line No'].toString());
                return (
                  <tr key={item['Bom Line No']} className={`group transition-all ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelectItem(item['Bom Line No'].toString())}>
                        {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} className="text-slate-200 group-hover:text-slate-300" />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex px-1.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold w-fit uppercase truncate max-w-full">{item.Module}</span>
                        <span className="inline-flex px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold w-fit uppercase truncate max-w-full">{item.Category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-bold text-slate-600 truncate block">{item['Part No'] || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-bold text-slate-900 leading-snug mb-0.5 truncate">{item.Description}</div>
                      <div className="text-[9px] font-bold text-slate-400 truncate">{item['Vendor Name'] || 'No Supplier'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] font-bold text-slate-600 truncate block">{item['Po No'] || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-bold ${item['Estimate Delivery Date'] ? 'text-amber-600' : 'text-slate-300'} truncate block`}>
                        {item['Estimate Delivery Date'] || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Circle size={6} className={getStatusColor(item['Actual Status'])} />
                        <select 
                          value={item['Actual Status']} 
                          onChange={(e) => updateItem(item['Bom Line No'], { 'Actual Status': e.target.value })}
                          className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500/10 outline-none cursor-pointer transition-all shadow-sm w-full"
                        >
                          <option value="Pending for PR">Pending for PR</option>
                          <option value="Pending with ETA">Pending with ETA</option>
                          <option value="Arrived">Arrived</option>
                          <option value="Collected">Collected</option>
                          <option value="Delayed">Delayed</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => updateItem(item['Bom Line No'], { 'Attention Needed': !item['Attention Needed'] })}
                        className={`p-1.5 rounded-lg border transition-all ${item['Attention Needed'] ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-white text-slate-200 border-slate-100 hover:border-slate-300 hover:text-slate-400'}`}
                      >
                        <AlertCircle size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 bg-slate-50 border border-transparent focus-within:bg-white focus-within:border-blue-100 rounded-xl px-3 py-1.5 transition-all w-full">
                        <MessageSquare size={12} className="text-slate-300 shrink-0" />
                        <input 
                          type="text" 
                          defaultValue={item.Remark}
                          onBlur={(e) => updateItem(item['Bom Line No'], { Remark: e.target.value })}
                          placeholder="Note..."
                          className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 placeholder:text-slate-300 w-full"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryView;
