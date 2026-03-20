import React, { useState, useRef } from 'react';
import { Sparkles, UserPlus, X, Image as ImageIcon, Check, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICharacter } from '../types';

interface SoulsPageProps {
  characters: AICharacter[];
  onAddCharacter: (char: AICharacter) => void;
  onUpdateCharacter: (char: AICharacter) => void;
  onDeleteCharacter: (id: string) => void;
}

export const SoulsPage: React.FC<SoulsPageProps> = ({ 
  characters, 
  onAddCharacter, 
  onUpdateCharacter, 
  onDeleteCharacter 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<AICharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<AICharacter>>({
    avatar: '',
    realName: '',
    remark: '',
    personality: '',
  });

  const openCreateModal = () => {
    setEditingChar(null);
    setFormData({ avatar: '', realName: '', remark: '', personality: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (char: AICharacter) => {
    setEditingChar(char);
    setFormData({ ...char });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.realName?.trim() || !formData.personality?.trim()) {
      setError('真实姓名和人设为必填项');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (editingChar) {
      onUpdateCharacter({
        ...editingChar,
        avatar: formData.avatar || '',
        realName: formData.realName.trim(),
        remark: formData.remark?.trim() || '',
        personality: formData.personality.trim(),
      });
    } else {
      const character: AICharacter = {
        id: Date.now().toString(),
        avatar: formData.avatar || '',
        realName: formData.realName.trim(),
        remark: formData.remark?.trim() || '',
        personality: formData.personality.trim(),
        createdAt: Date.now(),
      };
      onAddCharacter(character);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingChar) {
      onDeleteCharacter(editingChar.id);
      setIsDeleteConfirmOpen(false);
      setIsModalOpen(false);
    }
  };

  const getDefaultAvatar = (char: Partial<AICharacter>) => {
    const text = char.remark?.trim() || char.realName?.trim() || '?';
    return text.charAt(0).toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Add Contact Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
          className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl cursor-pointer flex items-center justify-between group overflow-hidden relative"
        >
          <div className="relative z-10">
            <h3 className="text-white text-xl font-bold mb-1 tracking-tight">添加联系人</h3>
            <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Create AI Soul</p>
          </div>
          <div className="bg-white text-black p-3 rounded-xl relative z-10 shadow-lg">
            <UserPlus size={24} />
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </motion.div>

        {/* Character List */}
        <div className="grid grid-cols-1 gap-3">
          {characters.map((char) => (
            <div key={char.id} className="bg-black/5 rounded-2xl p-4 border border-black/5 flex items-center gap-4 hover:bg-black/10 transition-all">
              {char.avatar ? (
                <img src={char.avatar} alt={char.realName} className="w-12 h-12 rounded-xl object-cover border border-black/5 shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center text-black/30 font-bold text-xl shadow-inner">
                  {getDefaultAvatar(char)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-black truncate">
                  {char.remark || char.realName}
                </h4>
              </div>
              <button 
                onClick={() => openEditModal(char)}
                className="p-2.5 hover:bg-black/5 rounded-xl transition-colors text-black/30 hover:text-black"
              >
                <Pencil size={18} />
              </button>
            </div>
          ))}
          
          {characters.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-black/20">
              <Sparkles size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-medium tracking-wide uppercase">No Souls Found</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-black/5 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 flex justify-between items-center border-b border-black/5">
                <h3 className="text-lg font-bold text-black tracking-tight">
                  {editingChar ? '编辑 AI 角色' : '创建 AI 角色'}
                </h3>
                <div className="flex items-center gap-2">
                  {editingChar && (
                    <button 
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                      title="删除角色"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                    <X size={20} className="text-black/50" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Avatar Selection */}
                <div className="flex flex-col items-center gap-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl bg-black/5 flex items-center justify-center text-4xl shadow-inner border border-black/5 relative group cursor-pointer overflow-hidden"
                  >
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-black/20">
                        <span className="text-3xl font-bold">{getDefaultAvatar(formData)}</span>
                        <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">Upload</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon size={24} className="text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 text-red-500 p-3 rounded-xl border border-red-500/20 flex items-center gap-2 text-sm"
                    >
                      <AlertCircle size={16} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-black/30 uppercase tracking-widest mb-2 ml-1">
                      真实姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.realName}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                      placeholder="例如：星空助手"
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-black/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-black/30 uppercase tracking-widest mb-2 ml-1">备注</label>
                    <input
                      type="text"
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      placeholder="例如：我的私人管家"
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder:text-black/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-black/30 uppercase tracking-widest mb-2 ml-1">
                      人设 (Personality) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      placeholder="描述该角色的性格、说话方式等..."
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none placeholder:text-black/20"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-black/5 border-t border-black/5">
                <button
                  onClick={handleSave}
                  className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs"
                >
                  {editingChar ? '保存修改' : '确认创建'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xs bg-white border border-black/5 rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-lg font-bold text-black mb-2">确认删除？</h4>
              <p className="text-sm text-black/40 mb-6">删除后聊天记录也将无法找回。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-black/10 text-black/60 font-medium active:bg-black/5 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold active:bg-red-600 transition-colors text-sm shadow-lg shadow-red-500/20"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
