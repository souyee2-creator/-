import React from 'react';
import { Orbit } from 'lucide-react';

export const OrbitPage: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
    <div className="w-20 h-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
      <Orbit size={40} className="text-white" />
    </div>
    <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">轨道 (Orbit)</h3>
    <p className="text-black/40 text-sm max-w-[200px] leading-relaxed">查看好友动态，分享您的星际生活。</p>
  </div>
);
