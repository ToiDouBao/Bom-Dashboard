import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, CheckCircle, AlertCircle, Package } from 'lucide-react';

// Color Mapping: Pending (Yellow/Slate), Arrived (Blue), Collected (Green), Delayed (Red)
const STATUS_COLORS: Record<string, string> = {
  'Pending for PR': '#94a3b8',  // Slate
  'Pending with ETA': '#f59e0b', // Amber/Yellow
  'Arrived': '#3b82f6',       // Blue
  'Collected': '#10b981',     // Green
  'Delayed': '#ef4444',       // Red
  'Other': '#cbd5e1'          // Light Slate
};

const DashboardView = ({ data }: any) => {
  const stats = useMemo(() => {
    // Exclude 'Other' from progress tracking
    const trackingData = data.filter((item: any) => item['Actual Status'] !== 'Other');
    const totalCost = trackingData.reduce((sum: any, item: any) => sum + (item['Total Price'] || 0), 0);
    const collectedCount = trackingData.filter((item: any) => item['Actual Status'] === 'Collected').length;
    const attentionCount = trackingData.filter((item: any) => item['Attention Needed']).length;
    const progress = trackingData.length > 0 ? (collectedCount / trackingData.length) * 100 : 0;
    return { totalCost, progress, attentionCount, totalItems: trackingData.length };
  }, [data]);

  const chartData = useMemo(() => {
    const modules: Record<string, number> = {};
    const statuses = [
      { name: 'Pending for PR', value: 0 },
      { name: 'Pending with ETA', value: 0 },
      { name: 'Arrived', value: 0 },
      { name: 'Collected', value: 0 },
      { name: 'Delayed', value: 0 },
      { name: 'Other', value: 0 }
    ];

    data.forEach((item: any) => {
      // Use all data for module costs, or exclude 'Other'? 
      // User said "it wont count as a part of the item", usually implies cost too.
      if (item['Actual Status'] === 'Other') return;

      const mod = item.Module || 'Unknown';
      modules[mod] = (modules[mod] || 0) + (item['Total Price'] || 0);
      const s = statuses.find(s => s.name === item['Actual Status']);
      if (s) s.value++;
    });

    // Handle 'Other' status count separately if we want to show it in the pie chart
    // but the loop above skips it. Let's include it in the pie chart but exclude from costs.
    const otherCount = data.filter((item: any) => item['Actual Status'] === 'Other').length;
    const otherStatus = statuses.find(s => s.name === 'Other');
    if (otherStatus) otherStatus.value = otherCount;

    return {
      modules: Object.entries(modules).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 6),
      statuses
    };
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Material Cost</p>
            <h3 className="text-2xl font-bold text-slate-900">RM {stats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Collection</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.progress.toFixed(1)}%</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Urgent Attention</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.attentionCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Items</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalItems}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Top Module Costs</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.modules}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">Status Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.statuses} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {chartData.statuses.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardView;
