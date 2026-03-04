import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

const AnalyticsView = ({ data }: any) => {
  const chartData = useMemo(() => {
    const modules: Record<string, number> = {};
    const vendors: Record<string, number> = {};

    data.forEach((item: any) => {
      const mod = item.Module || 'Unknown';
      modules[mod] = (modules[mod] || 0) + (item['Total Price'] || 0);
      const ven = item['Vendor Name'] || 'Other';
      vendors[ven] = (vendors[ven] || 0) + (item['Total Price'] || 0);
    });

    return {
      modules: Object.entries(modules).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      vendors: Object.entries(vendors).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 5)
    };
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Detailed Cost breakdown by Module</h3>
          <p className="text-sm text-slate-500">Total estimated material cost grouped by BOM module.</p>
        </div>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.modules} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip formatter={(value: number) => `RM ${value.toLocaleString()}`} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Top 5 Vendors by Spend</h3>
          <p className="text-sm text-slate-500">Distribution of allocated budget across suppliers.</p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.vendors} innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value">
                {chartData.vendors.map((_, i) => <Cell key={i} fill={['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `RM ${value.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsView;
