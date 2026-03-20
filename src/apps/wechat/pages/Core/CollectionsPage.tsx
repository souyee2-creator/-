import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Trash2, Star } from 'lucide-react';

// 定义收藏消息的接口
export interface FavoriteMessage {
  id: string;
  content: string;
  from: string;
  time: string;
}

interface CollectionsPageProps {
  favorites: FavoriteMessage[];
  onRemove: (id: string) => void;
  onBack: () => void;
}

/**
 * 内部卡片组件
 * 修正：在参数类型定义中显式加入 key?: string，
 * 这样 TS 就不会在第 74 行报错 "Property 'key' does not exist" 了。
 */
const FavoriteCard = ({ 
  msg, 
  onRemove, 
  key 
}: { 
  msg: FavoriteMessage; 
  onRemove: (id: string) => void; 
  key?: string 
}) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="relative group break-inside-avoid mb-4 p-5 bg-white border border-black/3 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
  >
    <p className="text-[14px] leading-relaxed text-black/80 font-medium tracking-tight">
      {msg.content}
    </p>

    <div className="mt-4 pt-4 border-t border-black/2 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Source</span>
        <span className="text-[10px] font-bold text-black/40 whitespace-nowrap">{msg.from}</span>
      </div>
      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-black/20 hover:text-black/60">
          <Share2 size={14} />
        </button>
        <button 
          onClick={() => onRemove(msg.id)} 
          className="text-black/20 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </motion.div>
);

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ favorites, onRemove, onBack }) => {
  return (
    <div className="fixed inset-0 bg-[#FBFBFB] z-100 flex flex-col overflow-hidden">
      {/* 顶部导航 */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-black/2">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-black" />
        </button>
        <h2 className="text-[15px] font-black tracking-[0.2em] uppercase text-black">Collections</h2>
        <div className="w-8" />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {favorites && favorites.length > 0 ? (
            <div className="columns-2 gap-4">
              {favorites.map((msg) => (
                <FavoriteCard key={msg.id} msg={msg} onRemove={onRemove} />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center py-20"
            >
              <div className="w-16 h-16 bg-black/2 rounded-full flex items-center justify-center mb-4">
                <Star size={24} className="text-black/10" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-bold text-black/20 tracking-[0.2em] uppercase">
                No Fragments Saved
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {favorites && favorites.length > 0 && (
          <div className="py-12 flex flex-col items-center opacity-10">
            <div className="w-1 h-1 bg-black rounded-full mb-2" />
            <span className="text-[8px] font-black tracking-[0.3em]">END OF FRAGMENTS</span>
          </div>
        )}
      </div>
    </div>
  );
};