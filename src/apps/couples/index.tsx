import React from 'react';
import { motion } from 'motion/react';
import { X, Heart } from 'lucide-react';

interface CouplesAppProps {
  onClose: () => void;
}

export const CouplesApp: React.FC<CouplesAppProps> = ({ onClose }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
    animate={{ scale: 1, opacity: 1, borderRadius: '0' }}
    exit={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    className="fixed inset-0 z-50 bg-white shadow-2xl overflow-hidden flex flex-col"
    onClick={(e) => e.stopPropagation()}
    style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)'
    }}
  >
    <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">情侣空间</h2>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <X size={24} className="text-gray-500" />
      </button>
    </div>
    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center bg-red-400">
        <Heart className="text-white w-12 h-12" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">情侣空间</h3>
      <p className="text-gray-500 max-w-xs">属于您和另一半的私密星空。</p>
    </div>
    <div className="h-1 w-32 bg-gray-300 rounded-full mx-auto mb-2" />
  </motion.div>
);
