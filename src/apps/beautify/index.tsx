import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette, Image as ImageIcon, Smartphone, Type, ChevronDown } from 'lucide-react';

interface BeautifyAppProps {
  onClose: () => void;
  onSetWallpaper: (url: string) => void;
  currentWallpaper: string; // ⬅️ 新增：接收当前壁纸变量
}

export const BeautifyApp: React.FC<BeautifyAppProps> = ({ onClose, onSetWallpaper, currentWallpaper }) => {
  const [activeTab, setActiveTab] = useState<string | null>('wallpaper');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sections = [
    { id: 'wallpaper', label: '壁纸定制', icon: <ImageIcon size={18} /> },
    { id: 'icons', label: '图标定制', icon: <Smartphone size={18} /> },
    { id: 'fonts', label: '文字与界面', icon: <Type size={18} /> },
  ];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
      animate={{ scale: 1, opacity: 1, borderRadius: '0' }}
      exit={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-[#F8F9FA] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 顶部标题栏 */}
      <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Palette className="text-pink-400" size={20} /> Display
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm">
            {/* 折叠头部 */}
            <button 
              onClick={() => setActiveTab(activeTab === section.id ? null : section.id)}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 text-gray-700 font-medium">
                {section.icon}
                <span>{section.label}</span>
              </div>
              <motion.div animate={{ rotate: activeTab === section.id ? 180 : 0 }}>
                <ChevronDown size={18} className="text-gray-300" />
              </motion.div>
            </button>

            {/* 折叠内容 */}
            <AnimatePresence>
              {activeTab === section.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 border-t border-gray-50 bg-[#FCFCFD]"
                >
                  <div className="pt-6">
                    {section.id === 'wallpaper' && (
                      <div className="space-y-4 text-center">
                        {/* 手机预览框 - 已绑定 currentWallpaper */}
                        <div 
                          className="w-40 h-64 mx-auto rounded-2xl shadow-xl border-[4px] border-white flex items-center justify-center overflow-hidden relative transition-all duration-500"
                          style={{ 
                            background: currentWallpaper.startsWith('http') || currentWallpaper.startsWith('data') 
                              ? `url(${currentWallpaper}) center/cover no-repeat` 
                              : currentWallpaper 
                          }}
                        >
                           {/* 模拟 Dock 栏，增加氛围感 */}
                           <div className="absolute bottom-3 w-[80%] h-6 bg-white/20 backdrop-blur-md rounded-lg border border-white/30" />
                           
                           {/* 如果是默认背景，显示个提示文字 */}
                           {currentWallpaper === '#F5F5F7' && (
                             <span className="text-gray-400 text-[10px]">当前预览</span>
                           )}
                        </div>

                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => onSetWallpaper(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                        
                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
                          >
                            <ImageIcon size={16} /> 更换壁纸
                          </button>
                          <button 
                            onClick={() => onSetWallpaper('#F5F5F7')}
                            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                          >
                            恢复默认
                          </button>
                        </div>
                      </div>
                    )}
                    {section.id === 'icons' && <p className="text-gray-400 text-sm text-center py-4 font-light italic">正在开发图标包系统...</p>}
                    {section.id === 'fonts' && <p className="text-gray-400 text-sm text-center py-4 font-light italic">正在连接字体库...</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      
      {/* 底部小横条 */}
      <div className="h-1.5 w-32 bg-gray-200 rounded-full mx-auto mb-4" />
    </motion.div>
  );
};