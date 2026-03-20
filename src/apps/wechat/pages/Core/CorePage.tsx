import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Star, Smile, Settings, ChevronRight, UserCircle, Palette } from 'lucide-react';
import { CollectionsPage, FavoriteMessage } from './CollectionsPage';
import { AppearancePage } from './AppearancePage';

// 定义 CorePage 接收的属性接口
interface CorePageProps {
  favorites: FavoriteMessage[];
  onRemoveFavorite: (id: string) => void;
}

// 抽离的菜单项组件
const MenuItem = ({ icon: Icon, label, desc, onClick }: any) => (
  <motion.div 
    whileTap={{ backgroundColor: "rgba(0,0,0,0.03)" }}
    onClick={onClick}
    className="group flex items-center justify-between px-6 py-6 cursor-pointer bg-white transition-colors"
  >
    <div className="flex items-center gap-5">
      <div className="w-11 h-11 bg-[#F5F5F5] rounded-2xl flex items-center justify-center border border-black/[0.03]">
        <Icon size={20} className="text-black/60" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-[16px] font-bold text-black/80 tracking-tight">{label}</span>
        <span className="text-[10px] text-black/20 font-black tracking-[0.15em] uppercase mt-0.5">{desc}</span>
      </div>
    </div>
    <ChevronRight size={14} className="text-black/10 group-active:translate-x-1 transition-transform" />
  </motion.div>
);

// 核心修复：在这里接收从 index.tsx 传下来的 favorites 和 onRemoveFavorite
export const CorePage: React.FC<CorePageProps> = ({ favorites, onRemoveFavorite }) => {
  const [showCollections, setShowCollections] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 h-full">
      {/* 主页面内容 */}
      <div className="flex-1 flex flex-col bg-[#FBFBFB] overflow-y-auto">
        
        {/* 1. 顶部身份区 */}
        <div className="px-8 pt-16 pb-10 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-black rounded-[28px] flex items-center justify-center shadow-xl">
                <User size={36} className="text-white" strokeWidth={1.2} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <div className="w-3 h-3 bg-black/10 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-black text-black tracking-tighter">SYLVIA</h3>
              <div className="mt-1">
                <span className="px-2 py-0.5 bg-black/[0.04] rounded-md text-[9px] text-black/40 font-bold tracking-tighter border border-black/[0.05]">
                  CORE IDENTITY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 功能区块 */}
        <div className="px-6 flex-shrink-0">
          <div className="overflow-hidden rounded-[32px] border border-black/[0.03] bg-white shadow-sm">
            <MenuItem 
              icon={UserCircle} 
              label="个人设定" 
              desc="MASKS / PERSONA" 
              onClick={() => console.log('进入个人设定')}
            />
            <div className="h-[1px] bg-black/[0.02] mx-6" />
            
            <MenuItem 
              icon={Star} 
              label="收藏列表" 
              desc="STATIONS / DIALOGUES" 
              onClick={() => setShowCollections(true)} 
            />
            
            <div className="h-[1px] bg-black/[0.02] mx-6" />
            <MenuItem 
              icon={Smile} 
              label="表情管理" 
              desc="EMOJI / ASSETS" 
              onClick={() => console.log('进入表情管理')}
            />
            <div className="h-[1px] bg-black/[0.02] mx-6" />
            <MenuItem
              icon={Palette}
              label="界面外观"
              desc="APPEARANCE / THEME"
              onClick={() => setShowAppearance(true)}
            />
            <div className="h-[1px] bg-black/[0.02] mx-6" />
            <MenuItem 
              icon={Settings} 
              label="设置" 
              desc="PREFERENCES / API" 
              onClick={() => console.log('进入设置')}
            />
          </div>
        </div>

        <div className="flex-1" />

        <div className="pb-4 pt-4 flex flex-col items-center gap-2 opacity-10 flex-shrink-0">
          <div className="w-12 h-[1px] bg-black" />
          <span className="text-[8px] font-black tracking-[0.4em] uppercase">V 1.0.2 - STARRY</span>
        </div>
      </div>

      {/* 二级页面覆盖层 */}
      <AnimatePresence>
        {showCollections && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            className="absolute inset-0 z-50 overflow-hidden bg-[#FBFBFB]"
          >
            <CollectionsPage 
              favorites={favorites} 
              onRemove={onRemoveFavorite} 
              onBack={() => setShowCollections(false)} 
            />
          </motion.div>
        )}
        {showAppearance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            className="absolute inset-0 z-50 overflow-hidden bg-[#FBFBFB]"
          >
            <AppearancePage onBack={() => setShowAppearance(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};