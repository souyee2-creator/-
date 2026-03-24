import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Trash2, Pencil, Check, X, Pin, Search, BookOpen, Layers, ChevronRight } from 'lucide-react';

// ─── 数据类型 ────────────────────────────────────────────────────────────────

export interface MemoryFact {
  id: string;
  content: string;
  category: 'identity' | 'preference' | 'relationship' | 'event' | 'other';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  updatedFlag?: boolean; // 最近一次提取中被覆盖更新过
}

export interface MemorySummary {
  id: string;
  content: string;       // 2-4句摘要
  messageRange: string;  // 如 "第 20~40 条"
  createdAt: string;
}

export interface ContactMemory {
  contactId: string;
  contactName: string;
  facts: MemoryFact[];
  summaries: MemorySummary[];
  lastExtractedAt: number; // 上次提取时的消息总数
  extractIntervalRounds: number; // 每隔多少轮提取一次，默认20
}

// ─── 存储工具 ─────────────────────────────────────────────────────────────────

export const MEMORY_KEY = (contactId: string) => `souyee_memory_${contactId}`;

export const loadMemory = (contactId: string, contactName: string): ContactMemory => {
  try {
    const raw = localStorage.getItem(MEMORY_KEY(contactId));
    if (raw) return { extractIntervalRounds: 20, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return {
    contactId,
    contactName,
    facts: [],
    summaries: [],
    lastExtractedAt: 0,
    extractIntervalRounds: 20,
  };
};

export const saveMemory = (mem: ContactMemory) => {
  try {
    localStorage.setItem(MEMORY_KEY(mem.contactId), JSON.stringify(mem));
  } catch { /* ignore */ }
};

// ─── 类别标签配置 ─────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  identity:     { label: '身份',   color: '#6366f1', bg: '#eef2ff' },
  preference:   { label: '喜好',   color: '#f59e0b', bg: '#fffbeb' },
  relationship: { label: '关系',   color: '#ec4899', bg: '#fdf2f8' },
  event:        { label: '事件',   color: '#10b981', bg: '#ecfdf5' },
  other:        { label: '其他',   color: '#6b7280', bg: '#f9fafb' },
} as const;

// ─── 记忆 App 主页面 ──────────────────────────────────────────────────────────

interface MemoryAppProps {
  onClose: () => void;
}

export const MemoryApp = ({ onClose }: MemoryAppProps) => {
  // 读取所有有记忆的联系人
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [memory, setMemory] = useState<ContactMemory | null>(null);
  const [activeTab, setActiveTab] = useState<'facts' | 'summaries'>('facts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  // 读取所有联系人（从微信联系人列表里找有记忆的）
  useEffect(() => {
    try {
      const raw = localStorage.getItem('souyee_os_wechat_characters');
      const all: Array<{ id: string; name: string }> = raw ? JSON.parse(raw) : [];
      // 过滤出有记忆数据的
      const withMemory = all.filter(c => localStorage.getItem(MEMORY_KEY(c.id)));
      setContacts(withMemory.length > 0 ? withMemory : all);
      if (withMemory.length > 0 && !selectedContactId) {
        setSelectedContactId(withMemory[0].id);
      } else if (all.length > 0 && !selectedContactId) {
        setSelectedContactId(all[0].id);
      }
    } catch { /* ignore */ }
  }, []);

  // 读取当前选中联系人的记忆
  useEffect(() => {
    if (!selectedContactId) return;
    const c = contacts.find(c => c.id === selectedContactId);
    if (!c) return;
    const mem = loadMemory(selectedContactId, c.name);
    setMemory(mem);
  }, [selectedContactId, contacts]);

  const saveAndUpdate = useCallback((updated: ContactMemory) => {
    saveMemory(updated);
    setMemory(updated);
  }, []);

  if (!memory) {
    return (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed inset-0 z-50 bg-[#F7F7F7] flex flex-col"
      >
        <div className="px-4 pt-4 pb-3 bg-white border-b border-black/5 flex items-center gap-2">
          <button onClick={onClose} className="p-2 -ml-2 text-black/40"><ChevronLeft size={24} /></button>
          <h2 style={{ fontFamily: 'Georgia, serif' }} className="text-lg font-bold text-black/80">记忆档案</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-black/25 flex-col gap-3">
          <BookOpen size={40} className="opacity-30" />
          <p style={{ fontFamily: 'Georgia, serif' }} className="text-sm">暂无记忆数据</p>
          <p className="text-xs text-black/20">与角色聊天后会自动生成</p>
        </div>
      </motion.div>
    );
  }

  const filteredFacts = memory.facts.filter(f =>
    !searchQuery || f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedFacts = filteredFacts.filter(f => f.isPinned);
  const unpinnedFacts = filteredFacts.filter(f => !f.isPinned);

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#F7F7F7] flex flex-col"
    >
      {/* 顶栏 */}
      <div className="px-4 pt-4 pb-3 bg-white flex items-center gap-2" style={{ borderBottom: '1px solid #eee' }}>
        <button onClick={onClose} className="p-2 -ml-2 text-black/40"><ChevronLeft size={24} /></button>
        <h2 style={{ fontFamily: 'Georgia, serif', flex: 1 }} className="text-lg font-bold text-black/80">记忆档案</h2>
        {/* 联系人切换 */}
        <button
          onClick={() => setShowContactPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-black/10 rounded-lg active:bg-black/5"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <span className="text-[13px] text-black/60">{memory.contactName}</span>
          <ChevronRight size={14} className="text-black/30" />
        </button>
      </div>

      {/* 统计栏 */}
      <div className="bg-white mx-4 mt-3 rounded-2xl border border-black/5 px-4 py-3 flex items-center justify-around">
        {[
          { num: memory.facts.length, label: '记忆条目' },
          { num: memory.facts.filter(f => f.isPinned).length, label: '已置顶' },
          { num: memory.summaries.length, label: '对话摘要' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="w-px h-8 bg-black/6" />}
            <div className="text-center">
              <div style={{ fontFamily: 'Georgia, serif' }} className="text-2xl font-bold text-black/70">{item.num}</div>
              <div className="text-[10px] text-black/30 uppercase tracking-widest mt-0.5">{item.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* 搜索框 */}
      <div className="mx-4 mt-3 flex items-center gap-2 bg-white border border-black/8 rounded-xl px-3 py-2">
        <Search size={15} className="text-black/25 shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索记忆内容…"
          className="flex-1 bg-transparent outline-none text-[13px] text-black/60 placeholder:text-black/20"
          style={{ fontFamily: 'Georgia, serif' }}
        />
        {searchQuery && <button onClick={() => setSearchQuery('')}><X size={13} className="text-black/30" /></button>}
      </div>

      {/* Tab 切换 */}
      <div className="mx-4 mt-3 flex bg-white border border-black/5 rounded-xl overflow-hidden">
        {([['facts', '关键记忆', <Layers size={13} />], ['summaries', '对话摘要', <BookOpen size={13} />]] as const).map(([tab, label, icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold transition-colors ${activeTab === tab ? 'bg-black text-white' : 'text-black/40'}`}
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-6 mt-3">
        {activeTab === 'facts' ? (
          <FactsTab
            pinned={pinnedFacts}
            unpinned={unpinnedFacts}
            memory={memory}
            onUpdate={saveAndUpdate}
          />
        ) : (
          <SummariesTab
            summaries={memory.summaries}
            memory={memory}
            onUpdate={saveAndUpdate}
          />
        )}
      </div>

      {/* 联系人选择器 */}
      <AnimatePresence>
        {showContactPicker && (
          <ContactPickerOverlay
            contacts={contacts}
            currentId={selectedContactId!}
            onSelect={id => { setSelectedContactId(id); setShowContactPicker(false); }}
            onClose={() => setShowContactPicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── 关键记忆 Tab ─────────────────────────────────────────────────────────────

const FactsTab = ({ pinned, unpinned, memory, onUpdate }: {
  pinned: MemoryFact[];
  unpinned: MemoryFact[];
  memory: ContactMemory;
  onUpdate: (m: ContactMemory) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryFact['category']>('other');

  const handleTogglePin = (id: string) => {
    onUpdate({ ...memory, facts: memory.facts.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f) });
  };

  const handleDelete = (id: string) => {
    onUpdate({ ...memory, facts: memory.facts.filter(f => f.id !== id) });
  };

  const handleEdit = (fact: MemoryFact) => {
    setEditingId(fact.id);
    setEditText(fact.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    onUpdate({
      ...memory,
      facts: memory.facts.map(f => f.id === id
        ? { ...f, content: editText.trim(), updatedAt: new Date().toLocaleString('zh-CN'), updatedFlag: false }
        : f
      )
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newContent.trim()) return;
    const newFact: MemoryFact = {
      id: `fact_${Date.now()}`,
      content: newContent.trim(),
      category: newCategory,
      isPinned: false,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
    };
    onUpdate({ ...memory, facts: [...memory.facts, newFact] });
    setNewContent('');
    setNewCategory('other');
    setShowAddForm(false);
  };

  const renderSection = (facts: MemoryFact[], title?: string) => (
    facts.length === 0 ? null : (
      <div className="mb-2">
        {title && (
          <div className="px-5 py-2 text-[10px] font-bold text-black/25 uppercase tracking-widest">{title}</div>
        )}
        {facts.map(fact => (
          <div key={fact.id} className="mx-4 mb-2 bg-white rounded-2xl border border-black/5 overflow-hidden">
            {/* 类别色条 */}
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div
                className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                style={{ background: CATEGORY_CONFIG[fact.category].color, minHeight: 16 }}
              />
              <div className="flex-1 min-w-0">
                {/* 类别标签 + 置顶标 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: CATEGORY_CONFIG[fact.category].color,
                      background: CATEGORY_CONFIG[fact.category].bg,
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    {CATEGORY_CONFIG[fact.category].label}
                  </span>
                  {fact.isPinned && (
                    <span className="text-[10px] font-bold text-black/30 bg-black/5 px-2 py-0.5 rounded-md">
                      📌 置顶
                    </span>
                  )}
                  {fact.updatedFlag && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                      已更新
                    </span>
                  )}
                </div>

                {/* 内容 */}
                {editingId === fact.id ? (
                  <textarea
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="w-full text-[14px] text-black/70 leading-relaxed bg-black/3 rounded-xl px-3 py-2 outline-none resize-none border border-black/10"
                    style={{ fontFamily: 'Georgia, serif' }}
                    rows={3}
                  />
                ) : (
                  <p className="text-[14px] text-black/65 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                    {fact.content}
                  </p>
                )}

                <div className="text-[10px] text-black/20 mt-1.5">{fact.updatedAt}</div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-2 shrink-0">
                {editingId === fact.id ? (
                  <>
                    <button onClick={() => handleSaveEdit(fact.id)} className="p-1.5 text-green-500 active:opacity-60"><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-black/25 active:opacity-60"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleTogglePin(fact.id)} className={`p-1.5 active:opacity-60 ${fact.isPinned ? 'text-amber-400' : 'text-black/20'}`}><Pin size={15} /></button>
                    <button onClick={() => handleEdit(fact)} className="p-1.5 text-black/25 active:opacity-60"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(fact.id)} className="p-1.5 text-red-400/70 active:opacity-60"><Trash2 size={15} /></button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  );

  return (
    <>
      {memory.facts.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-black/20">
          <Layers size={40} className="mb-3 opacity-30" />
          <p style={{ fontFamily: 'Georgia, serif' }} className="text-sm">暂无记忆条目</p>
          <p className="text-xs mt-1">与角色聊天后会自动提取</p>
        </div>
      ) : (
        <>
          {renderSection(pinned, pinned.length > 0 ? '📌 置顶记忆' : undefined)}
          {renderSection(unpinned, pinned.length > 0 ? '其他记忆' : undefined)}
        </>
      )}

      {/* 手动添加表单 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mx-4 mb-3 bg-white rounded-2xl border border-black/8 p-4"
          >
            <div className="text-[11px] font-bold text-black/30 uppercase tracking-widest mb-2">手动添加记忆</div>
            <textarea
              autoFocus
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="输入记忆内容…"
              className="w-full text-[14px] text-black/65 bg-black/3 rounded-xl px-3 py-2.5 outline-none resize-none border border-black/8 mb-2"
              style={{ fontFamily: 'Georgia, serif' }}
              rows={3}
            />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(Object.keys(CATEGORY_CONFIG) as MemoryFact['category'][]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    color: newCategory === cat ? '#fff' : CATEGORY_CONFIG[cat].color,
                    background: newCategory === cat ? CATEGORY_CONFIG[cat].color : CATEGORY_CONFIG[cat].bg,
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 text-[13px] font-bold text-black/35 border border-black/8 rounded-xl active:bg-black/3">取消</button>
              <button onClick={handleAdd} className="flex-1 py-2 text-[13px] font-bold text-white bg-black rounded-xl active:opacity-80" style={{ fontFamily: 'Georgia, serif' }}>添加</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 手动添加按钮 */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mx-4 mt-1 w-[calc(100%-2rem)] py-3 border border-dashed border-black/15 rounded-2xl flex items-center justify-center gap-2 text-[13px] text-black/30 active:bg-black/3"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          <Plus size={15} /> 手动添加记忆
        </button>
      )}
    </>
  );
};

// ─── 对话摘要 Tab ─────────────────────────────────────────────────────────────

const SummariesTab = ({ summaries, memory, onUpdate }: {
  summaries: MemorySummary[];
  memory: ContactMemory;
  onUpdate: (m: ContactMemory) => void;
}) => {
  const handleDelete = (id: string) => {
    onUpdate({ ...memory, summaries: memory.summaries.filter(s => s.id !== id) });
  };

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-black/20">
        <BookOpen size={40} className="mb-3 opacity-30" />
        <p style={{ fontFamily: 'Georgia, serif' }} className="text-sm">暂无对话摘要</p>
        <p className="text-xs mt-1">每隔若干轮对话自动生成</p>
      </div>
    );
  }

  return (
    <>
      {[...summaries].reverse().map((summary, i) => (
        <div key={summary.id} className="mx-4 mb-3 bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-black/30 bg-black/4 px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                  摘要 {summaries.length - i}
                </span>
                <span className="text-[10px] text-black/20">{summary.messageRange}</span>
              </div>
              <button onClick={() => handleDelete(summary.id)} className="p-1.5 text-red-400/60 active:opacity-60">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-[14px] text-black/60 leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {summary.content}
            </p>
            <div className="text-[10px] text-black/20 mt-2">{summary.createdAt}</div>
          </div>
        </div>
      ))}
    </>
  );
};

// ─── 联系人选择器 ─────────────────────────────────────────────────────────────

const ContactPickerOverlay = ({ contacts, currentId, onSelect, onClose }: {
  contacts: Array<{ id: string; name: string }>;
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-200 flex items-end bg-black/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="w-full bg-white rounded-t-3xl overflow-hidden pb-8"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-6 pt-5 pb-3 border-b border-black/4">
        <p className="text-[11px] font-bold text-black/25 uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>选择角色</p>
      </div>
      {contacts.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full px-6 py-4 flex items-center justify-between active:bg-black/3 ${c.id === currentId ? 'bg-black/2' : ''}`}
        >
          <span className="text-[15px] font-bold text-black/70" style={{ fontFamily: 'Georgia, serif' }}>{c.name}</span>
          {c.id === currentId && <Check size={16} className="text-black/40" />}
        </button>
      ))}
      <button onClick={onClose} className="w-full py-4 font-bold text-[14px] text-black/30 border-t border-black/4 mt-2 active:bg-black/3" style={{ fontFamily: 'Georgia, serif' }}>取消</button>
    </motion.div>
  </motion.div>
);