import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Info, HardDrive, FileSpreadsheet } from 'lucide-react';

const UploadView = ({ onSync }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6">
          <FileUp size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Excel Data Center</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          Current Source: <strong className="text-slate-700 bg-slate-100 px-2 py-1 rounded-md font-medium border border-slate-200">bom_3_2_2026 10_41_27 AM.xlsx</strong>
        </p>
        
        <div className="w-full max-w-2xl border-2 border-dashed border-slate-300 rounded-2xl p-12 bg-slate-50 hover:bg-slate-100/50 transition-colors group cursor-pointer">
          <FileSpreadsheet size={48} className="mx-auto text-slate-400 group-hover:text-blue-500 transition-colors mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Upload New BOM Export</h3>
          <p className="text-sm text-slate-500 mb-6">Drag and drop your latest .xlsx file here, or click to browse</p>
          
          <button className="bg-white border border-slate-200 shadow-sm text-slate-700 hover:text-blue-600 hover:border-blue-200 px-6 py-2.5 rounded-lg font-medium transition-all mx-auto block">
            Select Excel File
          </button>
        </div>

        <div className="mt-8 flex gap-4">
            <button 
                onClick={onSync} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm shadow-blue-500/20"
            >
                Manual Database Sync
            </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4 text-blue-800">
        <Info size={24} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
            <h4 className="font-semibold mb-1">How Syncing Works</h4>
            <p className="text-sm text-blue-700/80 leading-relaxed">
                When you upload a new Excel file, the system reads the data and automatically matches it against your previous work using the <strong>Bom Line No</strong> as a unique key. 
                Any statuses or remarks you previously entered will be seamlessly attached to the new rows.
            </p>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadView;
