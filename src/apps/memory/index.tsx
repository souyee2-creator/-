import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, Plus, Trash2, Pencil, Check, X, Pin,
  Search, BookOpen, Layers, ChevronDown
} from 'lucide-react';

// ─── 数据类型 ────────────────────────────────────────────────────────────────

export interface MemoryFact {
  id: string;
  content: string;
  category: 'identity' | 'preference' | 'relationship' | 'event' | 'other';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  updatedFlag?: boolean;
}

export interface MemorySummary {
  id: string;
  content: string;
  messageRange: string;
  createdAt: string;
}

export interface ContactMemory {
  contactId: string;
  contactName: string;
  facts: MemoryFact[];
  summaries: MemorySummary[];
  lastExtractedAt: number;
  extractIntervalRounds: number;
}

// ─── 存储工具 ─────────────────────────────────────────────────────────────────

export const MEMORY_KEY = (contactId: string) => `souyee_memory_${contactId}`;

export const loadMemory = (contactId: string, contactName: string): ContactMemory => {
  try {
    const raw = localStorage.getItem(MEMORY_KEY(contactId));
    if (raw) return { extractIntervalRounds: 20, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return {
    contactId, contactName,
    facts: [], summaries: [],
    lastExtractedAt: 0,
    extractIntervalRounds: 20,
  };
};

export const saveMemory = (mem: ContactMemory) => {
  try { localStorage.setItem(MEMORY_KEY(mem.contactId), JSON.stringify(mem)); } catch { /* ignore */ }
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
  const [allContacts, setAllContacts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [memory, setMemory] = useState<ContactMemory | null>(null);
  const [activeTab, setActiveTab] = useState<'facts' | 'summaries'>('facts');
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // 读取所有联系人
  useEffect(() => {
    try {
      const raw = localStorage.getItem('souyee_os_wechat_characters');
      if (raw) {
        const parsed = JSON.parse(raw);
        
        // 关键修复：判断解析出来的是数组还是对象
        let all: Array<{ id: string; name: string }> = [];
        
        if (Array.isArray(parsed)) {
          // 如果本身就是数组
          all = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          // 如果是对象，将其转换为包含 id 和 name 的数组
          all = Object.entries(parsed).map(([id, data]: [string, any]) => ({
            id: id,
            name: data.name || '未知角色'
          }));
        }

        setAllContacts(all);

        // 设置初始选中的联系人
        if (all.length > 0) {
          const withMem = all.find(c => localStorage.getItem(MEMORY_KEY(c.id)));
          const first = withMem || all[0];
          setSelectedContactId(first.id);
        }
      }
    } catch (e) {
      console.error("读取联系人列表失败:", e);
    }
  }, []);

  // 联系人切换时加载记忆
  useEffect(() => {
    if (!selectedContactId) return;
    const c = allContacts.find(c => c.id === selectedContactId);
    if (!c) return;
    setMemory(loadMemory(selectedContactId, c.name));
    setSearchQuery('');
    setActiveTab('facts');
  }, [selectedContactId, allContacts]);

  const saveAndUpdate = useCallback((updated: ContactMemory) => {
    saveMemory(updated);
    setMemory(updated);
  }, []);

  // ── 空状态 ──
  if (allContacts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 16px 12px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', color: 'rgba(0,0,0,0.4)' }}>
            <ChevronLeft size={24} />
          </button>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.8)', margin: 0 }}>记忆档案</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'rgba(0,0,0,0.2)' }}>
          <BookOpen size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, margin: 0 }}>暂无联系人</p>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.2)', margin: 0 }}>先在微信中添加角色</p>
        </div>
      </motion.div>
    );
  }

  const contactName = allContacts.find(c => c.id === selectedContactId)?.name ?? '';
  const hasMemory = memory && (memory.facts.length > 0 || memory.summaries.length > 0);

  const filteredFacts = (memory?.facts ?? []).filter(f =>
    !searchQuery || f.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedFacts = filteredFacts.filter(f => f.isPinned);
  const unpinnedFacts = filteredFacts.filter(f => !f.isPinned);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#F7F7F7', display: 'flex', flexDirection: 'column' }}
      onClick={e => e.stopPropagation()}
    >
      {/* 顶栏 */}
      <div style={{ padding: '16px 16px 12px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', marginLeft: -8, color: 'rgba(0,0,0,0.4)', flexShrink: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(0,0,0,0.8)', margin: 0, flex: 1 }}>记忆档案</h2>

        {/* 联系人切换按钮 */}
        <button
          onClick={e => { e.stopPropagation(); setShowContactDropdown(v => !v); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, background: '#fff', cursor: 'pointer', fontFamily: 'Georgia, serif' }}
        >
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.05em' }}>选择联系人</span>
          <motion.div animate={{ rotate: showContactDropdown ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={14} style={{ color: 'rgba(0,0,0,0.3)' }} />
          </motion.div>
        </button>

        {/* 下拉菜单 */}
        <AnimatePresence>
          {showContactDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: '100%', right: 16, zIndex: 400,
                background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.06)', minWidth: 160, overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.25)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
                全部角色
              </div>
              {allContacts.map(c => (
                <button key={c.id} onClick={() => { setSelectedContactId(c.id); setShowContactDropdown(false); }}
                  style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.id === selectedContactId ? 'rgba(0,0,0,0.04)' : 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
                  <span style={{ fontSize: 14, fontWeight: c.id === selectedContactId ? 700 : 500, color: 'rgba(0,0,0,0.7)' }}>{c.name}</span>
                  {c.id === selectedContactId && <Check size={14} style={{ color: 'rgba(0,0,0,0.4)' }} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 点击下拉外部关闭 */}
      {showContactDropdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={() => setShowContactDropdown(false)} />
      )}

      {/* 无记忆提示 */}
      {!hasMemory ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'rgba(0,0,0,0.2)' }}>
          <BookOpen size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, margin: 0 }}>
            {contactName} 暂无记忆
          </p>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.2)', margin: 0 }}>与 TA 聊天后会自动提取</p>
        </div>
      ) : (
        <>
          {/* 统计栏 */}
          <div style={{ margin: '12px 16px 0', background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            {[
              { num: memory!.facts.length, label: '记忆条目' },
              { num: memory!.facts.filter(f => f.isPinned).length, label: '已置顶' },
              { num: memory!.summaries.length, label: '对话摘要' },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(0,0,0,0.06)' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: 'rgba(0,0,0,0.7)' }}>{item.num}</div>
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{item.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* 搜索框 */}
          <div style={{ margin: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '8px 12px' }}>
            <Search size={15} style={{ color: 'rgba(0,0,0,0.25)', flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索记忆内容…"
              style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', fontSize: 13, color: 'rgba(0,0,0,0.6)', fontFamily: 'Georgia, serif' }}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={13} style={{ color: 'rgba(0,0,0,0.3)' }} /></button>}
          </div>

          {/* Tab 切换 */}
          <div style={{ margin: '10px 16px 0', display: 'flex', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, overflow: 'hidden' }}>
            {([['facts', '关键记忆', <Layers size={13} />], ['summaries', '对话摘要', <BookOpen size={13} />]] as const).map(([tab, label, icon]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: 'Georgia, serif', border: 'none', cursor: 'pointer',
                  background: activeTab === tab ? '#111' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'rgba(0,0,0,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* 内容区 */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, marginTop: 10 }}>
            {activeTab === 'facts' ? (
              <FactsTab pinned={pinnedFacts} unpinned={unpinnedFacts} memory={memory!} onUpdate={saveAndUpdate} />
            ) : (
              <SummariesTab summaries={memory!.summaries} memory={memory!} onUpdate={saveAndUpdate} />
            )}
          </div>
        </>
      )}
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
  const handleEdit = (fact: MemoryFact) => { setEditingId(fact.id); setEditText(fact.content); };
  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) return;
    onUpdate({ ...memory, facts: memory.facts.map(f => f.id === id ? { ...f, content: editText.trim(), updatedAt: new Date().toLocaleString('zh-CN'), updatedFlag: false } : f) });
    setEditingId(null);
  };
  const handleAdd = () => {
    if (!newContent.trim()) return;
    onUpdate({ ...memory, facts: [...memory.facts, { id: `fact_${Date.now()}`, content: newContent.trim(), category: newCategory, isPinned: false, createdAt: new Date().toLocaleString('zh-CN'), updatedAt: new Date().toLocaleString('zh-CN') }] });
    setNewContent(''); setNewCategory('other'); setShowAddForm(false);
  };

  const renderFact = (fact: MemoryFact) => (
    <div key={fact.id} style={{ margin: '0 16px 10px', background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 14px 12px' }}>
        <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 4, background: CATEGORY_CONFIG[fact.category].color, flexShrink: 0, minHeight: 16 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, color: CATEGORY_CONFIG[fact.category].color, background: CATEGORY_CONFIG[fact.category].bg, fontFamily: 'Georgia, serif' }}>
              {CATEGORY_CONFIG[fact.category].label}
            </span>
            {fact.isPinned && <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 6 }}>📌 置顶</span>}
            {fact.updatedFlag && <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: 6 }}>已更新</span>}
          </div>
          {editingId === fact.id ? (
            <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)} rows={3}
              style={{ width: '100%', fontSize: 14, color: 'rgba(0,0,0,0.7)', lineHeight: 1.6, background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '8px 10px', outline: 'none', resize: 'none', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'Georgia, serif' }} />
          ) : (
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6, margin: 0, fontFamily: 'Georgia, serif' }}>{fact.content}</p>
          )}
          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.2)', marginTop: 6 }}>{fact.updatedAt}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {editingId === fact.id ? (
            <>
              <button onClick={() => handleSaveEdit(fact.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#22c55e' }}><Check size={16} /></button>
              <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(0,0,0,0.25)' }}><X size={16} /></button>
            </>
          ) : (
            <>
              <button onClick={() => handleTogglePin(fact.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: fact.isPinned ? '#f59e0b' : 'rgba(0,0,0,0.2)' }}><Pin size={15} /></button>
              <button onClick={() => handleEdit(fact)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(0,0,0,0.25)' }}><Pencil size={15} /></button>
              <button onClick={() => handleDelete(fact.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(220,38,38,0.6)' }}><Trash2 size={15} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {memory.facts.length === 0 && !showAddForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'rgba(0,0,0,0.2)', gap: 10 }}>
          <Layers size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, margin: 0 }}>暂无记忆条目</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <div style={{ padding: '4px 20px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>📌 置顶记忆</div>
              {pinned.map(renderFact)}
            </>
          )}
          {unpinned.length > 0 && (
            <>
              {pinned.length > 0 && <div style={{ padding: '4px 20px 6px', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>其他记忆</div>}
              {unpinned.map(renderFact)}
            </>
          )}
        </>
      )}

      {/* 手动添加表单 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ margin: '0 16px 10px', background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>手动添加记忆</div>
            <textarea autoFocus value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="输入记忆内容…" rows={3}
              style={{ width: '100%', fontSize: 14, color: 'rgba(0,0,0,0.65)', background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '8px 10px', outline: 'none', resize: 'none', border: '1px solid rgba(0,0,0,0.08)', fontFamily: 'Georgia, serif', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0 12px' }}>
              {(Object.keys(CATEGORY_CONFIG) as MemoryFact['category'][]).map(cat => (
                <button key={cat} onClick={() => setNewCategory(cat)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', color: newCategory === cat ? '#fff' : CATEGORY_CONFIG[cat].color, background: newCategory === cat ? CATEGORY_CONFIG[cat].color : CATEGORY_CONFIG[cat].bg }}>
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.35)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, background: '#fff', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>取消</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, color: '#fff', background: '#111', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>添加</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 'calc(100% - 32px)', margin: '4px 16px', padding: '12px 0', border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: 16, background: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(0,0,0,0.3)', fontFamily: 'Georgia, serif' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', color: 'rgba(0,0,0,0.2)', gap: 10 }}>
        <BookOpen size={40} style={{ opacity: 0.3 }} />
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 14, margin: 0 }}>暂无对话摘要</p>
        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.2)', margin: 0 }}>每隔若干轮对话自动生成</p>
      </div>
    );
  }

  return (
    <>
      {[...summaries].reverse().map((summary, i) => (
        <div key={summary.id} style={{ margin: '0 16px 10px', background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.3)', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Georgia, serif' }}>
                  摘要 {summaries.length - i}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.2)' }}>{summary.messageRange}</span>
              </div>
              <button onClick={() => handleDelete(summary.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(220,38,38,0.5)' }}>
                <Trash2 size={14} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', lineHeight: 1.7, margin: 0, fontFamily: 'Georgia, serif' }}>{summary.content}</p>
            <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.2)', marginTop: 8 }}>{summary.createdAt}</div>
          </div>
        </div>
      ))}
    </>
  );
};