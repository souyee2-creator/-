import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, MoreHorizontal, Mic, Smile, Plus, Copy, Trash2,
  RotateCcw, Quote, X, Undo2, Eye, Pencil, Check, AlertCircle,
  Star, Palette, UserCog, Search, Eraser, Ban, UserMinus, ChevronRight,
  Download, SlidersHorizontal, Heart, Zap, MessageSquare, Clock,
  CheckSquare, Square, ImageIcon, Gift, ArrowRightLeft, MapPin, Phone,
  Share2, FileText, Video, PhoneOff, VideoOff, Volume2, MicOff,
  PhoneCall, Minimize2, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getGroupsForContact, getImageFromIDB, EmojiGroup, EmojiItem } from '../utils/emojiStorage';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  date?: string;
  isRevoked?: boolean;
  wasWhileBlacklisted?: boolean;
  status?: 'sent' | 'failed';
  isSystemNotice?: boolean;
  displayText?: string;
  isVoice?: boolean;
  voiceDuration?: number;
  isImage?: boolean;
  imageData?: string;      // base64 真实图片
  imageDesc?: string;      // 文字描述图片
  isEmoji?: boolean;       // 表情包（直接显示图片，不走占位符）
  emojiLabel?: string;     // 表情包释义（给 AI 看）
  isRedPacket?: boolean;
  redPacketAmount?: string;
  redPacketNote?: string;
  redPacketOpened?: boolean;
  isTransfer?: boolean;
  transferAmount?: string;
  transferNote?: string;
  transferStatus?: 'pending' | 'accepted' | 'returned';
  isLocation?: boolean;
  locationName?: string;
  locationAddress?: string;
  isForwardRecord?: boolean;
  forwardedMessages?: Array<{
    sender: 'me' | 'other';
    senderName: string;
    text: string;
    time: string;
  }>;
  isCallEnd?: boolean;
  callType?: 'voice' | 'video';
  callDuration?: number;  // 秒
  callLog?: Array<{ sender: 'me' | 'other'; senderName: string; text: string; time: string }>;
  quote?: {
    userName: string;
    text: string;
    msgId?: string;
  };
}

// 角色状态结构
interface CharState {
  mood: string;       // 情绪文字，如"焦躁"
  emoji: string;      // 配套颜文字，如"😰"
  action: string;     // 动作，如"不停地抖腿"
  innerVoice: string; // 心声，如"他怎么还不回我..."
}

// 聊天设置（持久化到 localStorage）
interface ChatSettings {
  contextSize: number;          // AI记忆的上下文条数
  minBubbles: number;           // AI每轮最少气泡数
  maxBubbles: number;           // AI每轮最多气泡数
  bubbleControlEnabled: boolean; // 是否启用气泡数控制
  showTimestamps: boolean;       // 是否显示时间戳
  timestampPosition: 'avatar' | 'bubble'; // 时间戳位置：头像下方 or 气泡旁
  myPatTarget: string;           // 拍一拍：我拍角色的内容（如"腹肌"）
  activeMaskId: string;          // 当前聊天使用的面具 ID（空串 = 无面具）
  timeAwareness: boolean;        // 是否开启时间感知（将真实时间注入 system prompt）
  userTimezone: string;          // user 所在时区（IANA 格式，如 Asia/Shanghai）
  charTimezone: string;          // char 所在时区（IANA 格式，如 America/New_York）
}

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  contextSize: 30,
  minBubbles: 1,
  maxBubbles: 3,
  bubbleControlEnabled: true,
  showTimestamps: true,
  timestampPosition: 'avatar' as const,
  myPatTarget: '',
  activeMaskId: '',
  timeAwareness: false,
  userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  charTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

// ─── 联系人外观（单独覆盖全局） ──────────────────────────────────────────────
interface ContactAppearance {
  override: boolean;
  bgImage: string | null;
  bubbleDraftCss: string;
  themeDraftCss: string;
  activeBubblePresetId: string | null;
}

interface CombinedPreset {
  id: string;
  name: string;
  bgImage: string | null;
  bubbleDraftCss: string;
  themeDraftCss: string;
}

const DEFAULT_CONTACT_APPEARANCE: ContactAppearance = {
  override: false,
  bgImage: null,
  bubbleDraftCss: '',
  themeDraftCss: '',
  activeBubblePresetId: null,
};

const COMBINED_PRESETS_KEY = 'souyee_appearance_combined_presets';

const loadGlobalAppearance = () => {
  try {
    const raw = localStorage.getItem('souyee_appearance_global');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const loadContactAppearance = (contactId: string): ContactAppearance => {
  try {
    const raw = localStorage.getItem(`souyee_appearance_contact_${contactId}`);
    return raw ? { ...DEFAULT_CONTACT_APPEARANCE, ...JSON.parse(raw) } : DEFAULT_CONTACT_APPEARANCE;
  } catch { return DEFAULT_CONTACT_APPEARANCE; }
};

const saveContactAppearance = (contactId: string, s: ContactAppearance) => {
  try { localStorage.setItem(`souyee_appearance_contact_${contactId}`, JSON.stringify(s)); } catch { }
};

const loadCombinedPresets = (): CombinedPreset[] => {
  try {
    const raw = localStorage.getItem(COMBINED_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveCombinedPresets = (presets: CombinedPreset[]) => {
  try { localStorage.setItem(COMBINED_PRESETS_KEY, JSON.stringify(presets)); } catch { }
};

interface ChatPageProps {
  contact: {
    id: string;
    name: string;
    avatar: string;
    initials?: string;
    isSystem?: boolean;
    personality?: string;
    messages?: Message[];
  };
  onBack: () => void;
  onUpdateMessages: (messages: Message[]) => void;
  onFavorite?: (msg: { id: string, content: string, from: string, time: string }) => void;
  onDeleteContact?: (id: string) => void;
  allContacts?: Array<{ id: string; name: string; avatar: string; initials?: string }>;
  onForwardToContact?: (contactId: string, msg: Message) => void;
}

// ─── iOS 风格开关 ───────────────────────────────────────────────────────────
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
    style={{ WebkitTapHighlightColor: 'transparent' }}
  >
    <div className={`absolute inset-0 rounded-full ${checked ? 'bg-zinc-800' : 'bg-black/10'} transition-colors duration-200`} />
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="relative w-5 h-5 bg-white rounded-full shadow-sm border border-black/5"
      style={{ x: checked ? 22 : 2 }}
    />
  </button>
);

// ─── 通用确认弹窗 ────────────────────────────────────────────────────────────
const ConfirmActionModal = ({ title, desc, confirmText, isDanger, onConfirm, onCancel }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-600 flex items-center justify-center px-10 bg-black/60 backdrop-blur-md" onClick={onCancel}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-4xl shadow-2xl w-full max-w-xs overflow-hidden border border-black/5" onClick={e => e.stopPropagation()}>
      <div className="p-8 flex flex-col items-center text-center">
        <div className={`w-16 h-16 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'} rounded-full flex items-center justify-center mb-4`}>
          {isDanger ? <UserMinus size={28} /> : <Eraser size={28} />}
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-4 font-bold text-gray-400 border-r border-gray-100 active:bg-gray-50 transition-colors">取消</button>
        <button onClick={onConfirm} className={`flex-1 py-4 font-bold ${isDanger ? 'text-red-500' : 'text-amber-600'} active:bg-gray-50 transition-colors`}>{confirmText}</button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── 搜索聊天记录 Modal ──────────────────────────────────────────────────────
const SearchModal = ({ messages, contactName, onClose, onJump }: {
  messages: Message[];
  contactName: string;
  onClose: () => void;
  onJump: (msgId: string) => void;
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const results = query.trim()
    ? messages.filter(m => !m.isRevoked && m.text.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 z-200 bg-[#F7F7F7] flex flex-col"
    >
      {/* 头部 */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-black/3 flex items-center gap-2">
        <button onClick={onClose} className="p-2 -ml-2 text-black/40"><ChevronLeft size={24} /></button>
        <div className="flex-1 bg-black/5 rounded-xl px-3 py-2 flex items-center gap-2">
          <Search size={16} className="text-black/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索聊天记录..."
            className="flex-1 bg-transparent outline-none text-sm text-black/70 placeholder:text-black/20"
          />
          {query && (
            <button onClick={() => setQuery('')}><X size={14} className="text-black/30" /></button>
          )}
        </div>
      </div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto">
        {query.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-64 text-black/20">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="text-sm">输入关键词搜索消息</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-black/20">
            <MessageSquare size={40} className="mb-3 opacity-30" />
            <p className="text-sm">没有找到相关消息</p>
          </div>
        ) : (
          <div className="py-2">
            <div className="px-5 py-2 text-[11px] font-bold text-black/20 uppercase tracking-widest">
              找到 {results.length} 条结果
            </div>
            {results.map(msg => (
              <button
                key={msg.id}
                onClick={() => { onJump(msg.id); onClose(); }}
                className="w-full bg-white px-5 py-4 flex flex-col items-start text-left border-b border-black/3 active:bg-black/2 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-black/30">
                    {msg.sender === 'me' ? '我' : contactName}
                  </span>
                  <span className="text-[10px] text-black/20">{msg.time}</span>
                </div>
                {/* 高亮关键词 */}
                <HighlightText text={msg.text} query={query} />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// 高亮关键词组件
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <span className="text-sm text-black/70 line-clamp-2">{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span className="text-sm text-black/70 line-clamp-2">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-black rounded px-0.5">{part}</mark>
          : part
      )}
    </span>
  );
};

// ─── 常用时区列表 ────────────────────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
  // 亚洲
  { value: 'Asia/Shanghai', label: '🇨🇳 中国标准时间 (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: '🇭🇰 香港 (UTC+8)' },
  { value: 'Asia/Taipei', label: '🇹🇼 台北 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 日本 (UTC+9)' },
  { value: 'Asia/Seoul', label: '🇰🇷 韩国 (UTC+9)' },
  { value: 'Asia/Singapore', label: '🇸🇬 新加坡 (UTC+8)' },
  { value: 'Asia/Bangkok', label: '🇹🇭 泰国 (UTC+7)' },
  { value: 'Asia/Kolkata', label: '🇮🇳 印度 (UTC+5:30)' },
  { value: 'Asia/Dubai', label: '🇦🇪 迪拜 (UTC+4)' },
  { value: 'Asia/Riyadh', label: '🇸🇦 沙特 (UTC+3)' },
  // 欧洲
  { value: 'Europe/London', label: '🇬🇧 伦敦 (UTC+0/+1)' },
  { value: 'Europe/Paris', label: '🇫🇷 巴黎 (UTC+1/+2)' },
  { value: 'Europe/Berlin', label: '🇩🇪 柏林 (UTC+1/+2)' },
  { value: 'Europe/Rome', label: '🇮🇹 罗马 (UTC+1/+2)' },
  { value: 'Europe/Madrid', label: '🇪🇸 马德里 (UTC+1/+2)' },
  { value: 'Europe/Amsterdam', label: '🇳🇱 阿姆斯特丹 (UTC+1/+2)' },
  { value: 'Europe/Moscow', label: '🇷🇺 莫斯科 (UTC+3)' },
  // 美洲
  { value: 'America/New_York', label: '🇺🇸 纽约/东部 (UTC-5/-4)' },
  { value: 'America/Chicago', label: '🇺🇸 芝加哥/中部 (UTC-6/-5)' },
  { value: 'America/Denver', label: '🇺🇸 丹佛/山地 (UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 洛杉矶/太平洋 (UTC-8/-7)' },
  { value: 'America/Toronto', label: '🇨🇦 多伦多 (UTC-5/-4)' },
  { value: 'America/Vancouver', label: '🇨🇦 温哥华 (UTC-8/-7)' },
  { value: 'America/Sao_Paulo', label: '🇧🇷 圣保罗 (UTC-3)' },
  { value: 'America/Mexico_City', label: '🇲🇽 墨西哥城 (UTC-6/-5)' },
  // 大洋洲
  { value: 'Australia/Sydney', label: '🇦🇺 悉尼 (UTC+10/+11)' },
  { value: 'Australia/Melbourne', label: '🇦🇺 墨尔本 (UTC+10/+11)' },
  { value: 'Pacific/Auckland', label: '🇳🇿 奥克兰 (UTC+12/+13)' },
  // 非洲
  { value: 'Africa/Cairo', label: '🇪🇬 开罗 (UTC+2)' },
  { value: 'Africa/Johannesburg', label: '🇿🇦 约翰内斯堡 (UTC+2)' },
  // UTC
  { value: 'UTC', label: '🌐 UTC (UTC+0)' },
];

// ─── 聊天设置 Modal ──────────────────────────────────────────────────────────
const ChatSettingsModal = ({ settings, onSave, onClose, contactId }: {
  settings: ChatSettings;
  onSave: (s: ChatSettings) => void;
  onClose: () => void;
  contactId: string;
}) => {
  const [local, setLocal] = useState({ ...settings });
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <h3 className="font-bold text-[17px] text-black/80 mb-1 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-black/30" /> 对话参数
          </h3>
          <p className="text-[11px] text-black/30">调整 AI 的记忆与回复风格</p>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* 上下文条数 — 自由输入，无上限 */}
          <div className="bg-black/2.5 rounded-2xl px-4 py-4">
            <div className="mb-3">
              <div className="font-bold text-[13px] text-black/70">AI 记忆上下文条数</div>
              <div className="text-[11px] text-black/30 mt-0.5">AI 每次回复时能看到的历史消息数量，无上限</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocal(p => ({ ...p, contextSize: Math.max(1, p.contextSize - 1) }))}
                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5 shrink-0"
              >−</button>
              <input
                type="number"
                min={1}
                value={local.contextSize}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (!isNaN(v) && v >= 1) setLocal(p => ({ ...p, contextSize: v }));
                }}
                className="flex-1 text-center bg-white rounded-xl border border-black/5 shadow-sm py-2 font-bold text-black/70 text-[15px] outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                onClick={() => setLocal(p => ({ ...p, contextSize: p.contextSize + 1 }))}
                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5 shrink-0"
              >+</button>
            </div>
          </div>

          {/* 气泡数范围 */}
          <div className="bg-black/2.5 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-bold text-[13px] text-black/70">每轮回复气泡数范围</div>
                <div className="text-[11px] text-black/30 mt-0.5">
                  {local.bubbleControlEnabled ? 'AI 每次回复最少和最多发几条消息' : 'AI 自主决定发几条消息'}
                </div>
              </div>
              <Switch checked={local.bubbleControlEnabled} onChange={v => setLocal(p => ({ ...p, bubbleControlEnabled: v }))} />
            </div>
            {local.bubbleControlEnabled && (
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1">
                  <div className="text-[10px] text-black/30 mb-1.5 text-center uppercase tracking-widest">最少</div>
                  <div className="flex items-center gap-2 justify-center">
                    <button onClick={() => setLocal(p => ({ ...p, minBubbles: clamp(p.minBubbles - 1, 1, p.maxBubbles) }))} className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5">−</button>
                    <span className="w-6 text-center font-bold text-black/70 text-[15px]">{local.minBubbles}</span>
                    <button onClick={() => setLocal(p => ({ ...p, minBubbles: clamp(p.minBubbles + 1, 1, p.maxBubbles) }))} className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5">+</button>
                  </div>
                </div>
                <div className="text-black/15 text-xl font-light">—</div>
                <div className="flex-1">
                  <div className="text-[10px] text-black/30 mb-1.5 text-center uppercase tracking-widest">最多</div>
                  <div className="flex items-center gap-2 justify-center">
                    <button onClick={() => setLocal(p => ({ ...p, maxBubbles: clamp(p.maxBubbles - 1, p.minBubbles, 8) }))} className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5">−</button>
                    <span className="w-6 text-center font-bold text-black/70 text-[15px]">{local.maxBubbles}</span>
                    <button onClick={() => setLocal(p => ({ ...p, maxBubbles: clamp(p.maxBubbles + 1, p.minBubbles, 8) }))} className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center font-bold text-black/50 active:bg-black/5">+</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex border-t border-black/4">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/4 active:bg-black/2 transition-colors">取消</button>
          <button onClick={() => { onSave(local); onClose(); }} className="flex-1 py-4 font-bold text-[14px] text-black/75 active:bg-black/2 transition-colors">保存设置</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 心声卡片（居中弹出） ────────────────────────────────────────────────────
const InnerVoiceCard = ({
  history, name, onClose,
}: {
  history: Array<CharState & { timestamp: string; round: number }>;
  name: string;
  onClose: () => void;
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const latest = history[history.length - 1];

  const rows = latest ? [
    { icon: '💭', label: '情绪', value: `${latest.emoji}  ${latest.mood}`, color: 'text-violet-400', italic: false },
    { icon: '✦', label: '动作', value: latest.action, color: 'text-amber-400', italic: false },
    { icon: '♡', label: '心声', value: latest.innerVoice, color: 'text-rose-400', italic: true },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-300 flex items-center justify-center px-6"
      onClick={onClose}
    >
      {/* 轻遮罩 */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden border border-black/4"
      >
        {/* 头部 */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.18em] mb-1">TA 的心声</p>
            <h3 className="text-[17px] font-bold text-black/70">{name}</h3>
          </div>
          {latest && (
            <div className="bg-black/4 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-[16px] leading-none">{latest.emoji}</span>
              <span className="text-[12px] font-bold text-black/40">{latest.mood}</span>
            </div>
          )}
        </div>

        {/* 分割线 */}
        <div className="mx-6 h-px bg-black/5" />

        {/* 内容行 / 空状态 */}
        {history.length === 0 ? (
          <div className="py-10 flex flex-col items-center text-black/20">
            <Heart size={28} className="mb-2 opacity-25" />
            <p className="text-[13px]">与 TA 聊天后会自动生成</p>
          </div>
        ) : (
          <div className="px-6 py-1">
            {rows.map((row, i) => (
              <div key={i}>
                <div className="py-3.5 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-xl bg-black/3 flex items-center justify-center shrink-0 text-[13px]">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-[9px] font-bold uppercase tracking-[0.18em] mb-0.5 ${row.color}`}>{row.label}</p>
                    <p className={`text-[13px] text-black/60 leading-snug ${row.italic ? 'italic' : ''}`}>
                      {row.italic ? `「${row.value}」` : row.value}
                    </p>
                  </div>
                </div>
                {i < rows.length - 1 && <div className="h-px bg-black/4 ml-11" />}
              </div>
            ))}
            {latest && (
              <p className="text-[10px] text-black/20 text-right pb-2">{latest.timestamp}</p>
            )}
          </div>
        )}

        {/* 分割线 */}
        <div className="mx-6 h-px bg-black/5" />

        {/* 历史记录入口 */}
        <button
          onClick={() => setShowHistory(v => !v)}
          className="w-full px-6 py-4 flex items-center justify-between active:bg-black/2 transition-colors"
        >
          <span className="text-[13px] font-bold text-black/40">历史记录</span>
          <motion.div animate={{ rotate: showHistory ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={15} className="text-black/20" />
          </motion.div>
        </button>

        {/* 历史列表（展开） */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="border-t border-black/4 max-h-52 overflow-y-auto">
                {history.length <= 1 ? (
                  <p className="text-[12px] text-black/25 text-center py-5">暂无更多历史记录</p>
                ) : (
                  [...history].reverse().slice(1).map((entry, i) => (
                    <div key={i} className="px-6 py-3.5 flex items-start gap-3 border-b border-black/3 last:border-none">
                      <span className="text-[18px] leading-none shrink-0 mt-0.5">{entry.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-bold text-black/40">{entry.mood}</span>
                          <span className="text-[10px] text-black/20">{entry.timestamp}</span>
                        </div>
                        <p className="text-[12px] text-black/45 italic leading-snug">「{entry.innerVoice}」</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// ─── 导出确认弹窗 ────────────────────────────────────────────────────────────
const ExportConfirmModal = ({ messages, contactName, onConfirm, onCancel }: {
  messages: Message[];
  contactName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  // 预估文件大小
  const lines: string[] = [`与 ${contactName} 的聊天记录\n导出时间：${new Date().toLocaleString('zh-CN')}\n`];
  messages.forEach(m => lines.push(m.isRevoked ? '（已撤回）' : m.text));
  const bytes = new TextEncoder().encode(lines.join('\n')).length;
  const sizeStr = bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-600 flex items-center justify-center px-10 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-xs overflow-hidden border border-black/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-7 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <Download size={24} />
          </div>
          <h3 className="font-bold text-[17px] text-black/75 mb-1">导出聊天记录</h3>
          <p className="text-[13px] text-black/35 leading-relaxed">
            与 <span className="font-bold text-black/50">{contactName}</span> 的聊天记录
          </p>
          <div className="mt-4 bg-black/3 rounded-2xl px-5 py-3 w-full flex items-center justify-between">
            <span className="text-[12px] text-black/35">{messages.filter(m => !m.isRevoked).length} 条消息</span>
            <span className="text-[12px] font-bold text-black/50">{sizeStr}</span>
          </div>
        </div>
        <div className="flex border-t border-black/4">
          <button onClick={onCancel} className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/4 active:bg-black/2 transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 py-4 font-bold text-[14px] text-blue-500 active:bg-black/2 transition-colors">导出</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 联系人选择器（居中，含搜索） ───────────────────────────────────────────
const ContactPickerModal = ({
  contacts,
  currentContactId,
  onSelect,
  onCancel,
}: {
  contacts: Array<{ id: string; name: string; avatar: string; initials?: string }>;
  currentContactId: string;
  onSelect: (c: { id: string; name: string; avatar: string; initials?: string }) => void;
  onCancel: () => void;
}) => {
  const [query, setQuery] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  // 当前联系人置顶，其余按名称排序
  const sorted = [...contacts].sort((a, b) => {
    if (a.id === currentContactId) return -1;
    if (b.id === currentContactId) return 1;
    return a.name.localeCompare(b.name, 'zh');
  });
  const filtered = query.trim()
    ? sorted.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : sorted;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-700 flex items-center justify-center px-8 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-bold text-[16px] text-black/75 mb-3">选择联系人</h3>
          {/* 搜索框 */}
          <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
            <Search size={14} className="text-black/30 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索联系人..."
              className="flex-1 bg-transparent outline-none text-[13px] text-black/70 placeholder:text-black/25"
            />
            {query && (
              <button onClick={() => setQuery('')}><X size={13} className="text-black/30" /></button>
            )}
          </div>
        </div>

        {/* 联系人列表 */}
        <div className="max-h-[50vh] overflow-y-auto pb-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-black/25">没有找到联系人</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full px-5 py-3 flex items-center gap-3 active:bg-black/3 transition-colors"
              >
                {/* 头像 */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/6 shrink-0 bg-black/4 flex items-center justify-center text-[11px] font-bold text-black/35">
                  {c.avatar
                    ? <img src={c.avatar} className="w-full h-full object-cover" alt="" />
                    : (c.initials || c.name[0])}
                </div>
                {/* 名字 */}
                <span className="flex-1 text-left text-[15px] font-medium text-black/70">{c.name}</span>
                {/* 当前对话标签 */}
                {c.id === currentContactId && (
                  <span className="text-[10px] font-bold text-black/25 bg-black/4 px-2 py-0.5 rounded-full">当前对话</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* 取消 */}
        <div className="border-t border-black/5">
          <button
            onClick={onCancel}
            className="w-full py-4 font-bold text-[14px] text-black/35 active:bg-black/2 transition-colors"
          >取消</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 合并转发预览弹窗（居中） ────────────────────────────────────────────────
const ForwardPreviewModal = ({
  snapshots,
  targetName,
  onConfirm,
  onCancel,
}: {
  snapshots: Array<{ sender: 'me' | 'other'; senderName: string; text: string; time: string }>;
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-600 flex items-center justify-center px-8 bg-black/50 backdrop-blur-sm"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.93, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* 头部 */}
      <div className="px-6 pt-6 pb-4 border-b border-black/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-black/4 rounded-2xl flex items-center justify-center shrink-0">
          <FileText size={18} className="text-black/40" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-[16px] text-black/75">发送给 {targetName}</h3>
          <p className="text-[12px] text-black/30 mt-0.5">共 {snapshots.length} 条消息</p>
        </div>
      </div>

      {/* 预览列表 */}
      <div className="px-6 py-4 space-y-2.5 max-h-[40vh] overflow-y-auto">
        {snapshots.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-[12px] font-bold text-black/35 shrink-0 pt-0.5 min-w-9">
              {s.senderName}
            </span>
            <span className="text-[13px] text-black/60 leading-snug line-clamp-2">{s.text}</span>
          </div>
        ))}
      </div>

      {/* 按钮 */}
      <div className="flex border-t border-black/5">
        <button
          onClick={onCancel}
          className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/5 active:bg-black/2 transition-colors"
        >取消</button>
        <button
          onClick={onConfirm}
          className="flex-1 py-4 font-bold text-[14px] text-black/75 active:bg-black/2 transition-colors"
        >确认发送</button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── 合并转发全屏阅读页 ──────────────────────────────────────────────────────
const ForwardRecordViewer = ({
  msg,
  onClose,
}: {
  msg: Message;
  onClose: () => void;
}) => {
  const records = msg.forwardedMessages ?? [];
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.28 }}
      className="fixed inset-0 z-200 bg-[#F7F7F7] flex flex-col"
    >
      {/* 头部 */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-black/3 flex items-center gap-2">
        <button onClick={onClose} className="p-2 -ml-2 text-black/40">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-[16px] text-black/75">聊天记录</h2>
          <p className="text-[11px] text-black/30">{records.length} 条消息</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto py-3">
        {records.map((r, i) => (
          <div key={i} className="px-5 py-3 flex items-start gap-3 border-b border-black/3 last:border-none">
            {/* 头像占位 */}
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-bold ${r.sender === 'me' ? 'bg-black text-white' : 'bg-black/7 text-black/40'
              }`}>
              {r.sender === 'me' ? 'ME' : r.senderName[0]}
            </div>
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[12px] font-bold text-black/50">{r.senderName}</span>
                <span className="text-[10px] text-black/25">{r.time}</span>
              </div>
              <p className="text-[14px] text-black/65 leading-relaxed wrap-break-word">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};


// ─── 拨出等待屏 ──────────────────────────────────────────────────────────────
const CallDialingScreen = ({
  mode,
  contact,
  onReject,
}: {
  mode: 'voice' | 'video';
  contact: { name: string; avatar: string; initials?: string };
  onReject: () => void;
}) => {
  const renderAvatar = () => contact.avatar
    ? <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
    : <span className="text-white font-bold text-4xl">{contact.initials || contact.name[0]}</span>;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-500 flex flex-col items-center"
      style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 60%, #0f0f0f 100%)' }}
    >
      <div className="flex flex-col items-center pt-24 flex-1">
        <p className="text-white/35 text-[11px] font-bold tracking-[0.3em] uppercase mb-8">
          {mode === 'video' ? '视频通话' : '语音通话'}
        </p>
        {/* 头像 + 脉冲 */}
        <div className="relative flex items-center justify-center mb-6">
          {[1, 2, 3].map(i => (
            <motion.div key={i} className="absolute rounded-full border border-white/8"
              animate={{ scale: [1, 1.7 + i * 0.35], opacity: [0.35, 0] }}
              transition={{ duration: 2.6, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
              style={{ width: 130, height: 130 }}
            />
          ))}
          <div className="w-32.5 h-32.5 rounded-full overflow-hidden border-2 border-white/15 shadow-2xl bg-white/8 z-10 flex items-center justify-center">
            {renderAvatar()}
          </div>
        </div>
        <h2 className="text-white text-[30px] font-bold tracking-tight">{contact.name}</h2>
        <motion.p
          className="text-white/40 text-[14px] mt-2"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >正在呼叫…</motion.p>
      </div>

      {/* 只有取消按钮，char 自己决定接不接 */}
      <div className="flex items-center justify-center pb-20">
        <button onClick={onReject} className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 active:scale-95 transition-transform">
            <PhoneOff size={26} className="text-white" />
          </div>
          <span className="text-white/40 text-[11px] font-bold">取消</span>
        </button>
      </div>
    </motion.div>
  );
};

// ─── 来电界面（char 主动发起）────────────────────────────────────────────────
const CallIncomingScreen = ({
  mode,
  contact,
  onAccept,
  onReject,
}: {
  mode: 'voice' | 'video';
  contact: { name: string; avatar: string; initials?: string };
  onAccept: () => void;
  onReject: () => void;
}) => {
  const renderAvatar = () => contact.avatar
    ? <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
    : <span className="text-white font-bold text-4xl">{contact.initials || contact.name[0]}</span>;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-500 flex flex-col items-center"
      style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 60%, #0f0f0f 100%)' }}
    >
      <div className="flex flex-col items-center pt-24 flex-1">
        <p className="text-white/35 text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
          {mode === 'video' ? '视频通话' : '语音通话'}
        </p>
        <p className="text-white/50 text-[13px] mb-8">来电…</p>
        {/* 头像 + 脉冲 */}
        <div className="relative flex items-center justify-center mb-6">
          {[1, 2, 3].map(i => (
            <motion.div key={i} className="absolute rounded-full border border-white/10"
              animate={{ scale: [1, 1.7 + i * 0.35], opacity: [0.35, 0] }}
              transition={{ duration: 2.0, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
              style={{ width: 130, height: 130 }}
            />
          ))}
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 z-10 flex items-center justify-center">
            {renderAvatar()}
          </div>
        </div>
        <h2 className="text-white text-[30px] font-bold tracking-tight">{contact.name}</h2>
      </div>

      {/* 接听 / 拒接 */}
      <div className="flex items-center justify-center gap-20 pb-20">
        <button onClick={onReject} className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 active:scale-95 transition-transform">
            <PhoneOff size={26} className="text-white" />
          </div>
          <span className="text-white/40 text-[11px] font-bold">拒接</span>
        </button>
        <button onClick={onAccept} className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30 active:scale-95 transition-transform">
            <Phone size={26} className="text-white" />
          </div>
          <span className="text-white/40 text-[11px] font-bold">接听</span>
        </button>
      </div>
    </motion.div>
  );
};

// ─── 通话中界面 ───────────────────────────────────────────────────────────────
const CallOverlay = ({
  mode,
  contact,
  onHangUp,
  onSend,
  onReply,
  myAvatar,
}: {
  mode: 'voice' | 'video';
  contact: { name: string; avatar: string; initials?: string };
  onHangUp: () => void;
  onSend: (text: string) => void;
  onReply: (text: string) => void;
  myAvatar?: string;
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [inputText, setInputText] = useState('');
  const [callMessages, setCallMessages] = useState<{ id: string; text: string; isMe: boolean; isThinking?: boolean; isAction?: boolean }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputTextRef = useRef('');

  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [callMessages]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const addMsg = (text: string, isMe: boolean) => {
    setCallMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), text, isMe }]);
  };

  useEffect(() => {
    (window as any).__callShowBubble = (text: string) => {
      setCallMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        return [...filtered, { id: Math.random().toString(36).slice(2), text, isMe: false }];
      });
    };
    (window as any).__callShowAction = (text: string) => {
      setCallMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        return [...filtered, { id: Math.random().toString(36).slice(2), text, isMe: false, isAction: true }];
      });
    };
    (window as any).__callSetThinking = (on: boolean) => {
      setCallMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        if (!on) return filtered;
        return [...filtered, { id: '__thinking__', text: '…', isMe: false, isThinking: true }];
      });
    };
    return () => {
      delete (window as any).__callShowBubble;
      delete (window as any).__callShowAction;
      delete (window as any).__callSetThinking;
    };
  }, []);

  const handleSendOnly = () => {
    const t = inputTextRef.current.trim();
    if (!t) return;
    addMsg(t, true);
    onSend(t);
    setInputText('');
  };

  const handleReply = () => {
    const t = inputTextRef.current.trim();
    if (t) { addMsg(t, true); setInputText(''); }
    onReply(t);
  };

  const renderAvatar = () => contact.avatar
    ? <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
    : <span className="text-white font-bold text-4xl">{contact.initials || contact.name[0]}</span>;

  const renderCallMessages = (glass = false) => (
    <div ref={scrollRef} className="flex flex-col gap-2 overflow-y-auto px-4 py-2" style={{ minHeight: '100%' }}>
      {callMessages.map(m => (
        m.isAction ? (
          // 场景/动作描写：居中斜体灰字，无气泡
          <div key={m.id} className="flex justify-center px-2 py-1">
            <p className="text-center text-white/45 text-[12px] italic leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {m.text}
            </p>
          </div>
        ) : (
          <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-snug ${m.isMe
              ? 'rounded-br-sm'
              : 'rounded-bl-sm'
              }`} style={
                m.isMe
                  ? { background: 'rgba(0,0,0,0.82)', color: '#ffffff' }
                  : { background: 'rgba(255,255,255,0.88)', color: '#111111', backdropFilter: 'blur(8px)' }
              }>
              {m.isThinking
                ? <span className="tracking-widest text-[16px]" style={{ color: '#333333' }}>···</span>
                : m.text}
            </div>
          </div>
        )
      ))}
    </div>
  );

  if (mode === 'voice') {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-500 flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)' }}
      >
        {/* 顶部：名字 */}
        <div className="flex flex-col items-center pt-16 pb-2">
          <p className="text-white/35 text-[11px] font-bold tracking-[0.28em] uppercase mb-1">语音通话</p>
          <h2 className="text-white text-[26px] font-bold tracking-tight">{contact.name}</h2>
        </div>

        {/* 头像 + 计时 */}
        <div className="flex flex-col items-center py-3 gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-white/10 z-10 flex items-center justify-center">
              {contact.avatar
                ? <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
                : <span className="text-white font-bold text-4xl">{contact.initials || contact.name[0]}</span>}
            </div>
          </div>
          <p className="text-white/65 text-[22px] font-semibold tabular-nums tracking-wide">{fmt(elapsed)}</p>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 min-h-0 mx-3 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {renderCallMessages(false)}
        </div>

        {/* 输入栏 + 按钮 */}
        <div className="px-4 pb-10 pt-3 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border bg-white/10 backdrop-blur-sm border-white/12">
            <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendOnly(); } }}
              placeholder="说点什么…"
              className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-white/30 min-w-0"
            />
            <button onClick={handleSendOnly} className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-white/15 text-white shrink-0">发送</button>
            <button onClick={handleReply} className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-white text-black shrink-0">回复</button>
          </div>
          <div className="flex items-center justify-center gap-10">
            <button onClick={() => setIsMuted(v => !v)} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/12 text-white'}`}>
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </div>
              <span className="text-white/35 text-[10px] font-bold">{isMuted ? '已静音' : '静音'}</span>
            </button>
            <button onClick={onHangUp} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-transform">
                <PhoneOff size={26} className="text-white" />
              </div>
              <span className="text-white/35 text-[10px] font-bold">挂断</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white/12 text-white">
                <Volume2 size={22} />
              </div>
              <span className="text-white/35 text-[10px] font-bold">扬声器</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-500 flex flex-col overflow-hidden"
    >
      {/* 背景：头像裁剪填满，去掉模糊，只留轻遮罩 */}
      <div className="absolute inset-0">
        {contact.avatar
          ? <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f0f 100%)' }}>
            <span className="text-white/15 font-bold text-[140px] select-none">{contact.initials || contact.name[0]}</span>
          </div>}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)' }} />
      </div>

      {/* 自己的小窗口 */}
      <div className="absolute top-14 right-4 z-20">
        <div className="w-20 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-900 flex items-center justify-center">
          {isCamOff
            ? <VideoOff size={20} className="text-white/30" />
            : myAvatar
              ? <img src={myAvatar} className="w-full h-full object-cover" alt="me" />
              : <div className="w-full h-full bg-black flex items-center justify-center text-white/40 text-[10px] font-bold">ME</div>
          }
        </div>
      </div>

      {/* 顶部：名字 + 计时 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
        <p className="text-white/45 text-[11px] font-bold tracking-[0.28em] uppercase">视频通话</p>
        <h2 className="text-white text-[22px] font-bold tracking-tight mt-0.5">{contact.name}</h2>
        <p className="text-white/65 text-[20px] font-semibold tabular-nums mt-1">{fmt(elapsed)}</p>
      </div>

      {/* 消息区：撑满顶栏和底部操作区之间的空间 */}
      <div className="absolute left-0 right-0 z-10 overflow-y-auto" style={{ top: 185, bottom: 155 }}>
        {renderCallMessages(true)}
      </div>

      {/* 底部操作区：无背景，透明 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-10 pt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/20 backdrop-blur-sm">
          <input ref={inputRef} value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendOnly(); } }}
            placeholder="说点什么…"
            className="flex-1 bg-transparent outline-none text-white text-[14px] placeholder:text-white/30 min-w-0"
          />
          <button onClick={handleSendOnly} className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-white/20 text-white shrink-0">发送</button>
          <button onClick={handleReply} className="px-2.5 py-1.5 rounded-xl text-[12px] font-bold transition-all active:scale-95 bg-white text-black shrink-0">回复</button>
        </div>
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => setIsMuted(v => !v)} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white'}`}>
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </div>
            <span className="text-white/45 text-[10px] font-bold">{isMuted ? '已静音' : '静音'}</span>
          </button>
          <button onClick={onHangUp} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/30 active:scale-95 transition-transform">
              <PhoneOff size={26} className="text-white" />
            </div>
            <span className="text-white/45 text-[10px] font-bold">挂断</span>
          </button>
          <button onClick={() => setIsCamOff(v => !v)} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCamOff ? 'bg-white text-black' : 'bg-white/15 text-white'}`}>
              {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
            </div>
            <span className="text-white/45 text-[10px] font-bold">{isCamOff ? '已关闭' : '摄像头'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};





const ContactAppearancePage = ({
  contactId,
  onClose,
}: {
  contactId: string;
  onClose: () => void;
}) => {
  const globalApp = loadGlobalAppearance();
  const [local, setLocal] = useState<ContactAppearance>(() => loadContactAppearance(contactId));
  const [combinedPresets, setCombinedPresets] = useState<CombinedPreset[]>(loadCombinedPresets);
  const [saveMode, setSaveMode] = useState(false);
  const [presetName, setPresetName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<ContactAppearance>) => {
    setLocal(prev => {
      const next = { ...prev, ...patch };
      saveContactAppearance(contactId, next);
      return next;
    });
  }, [contactId]);

  // Plan B: when toggling override ON, inherit current global values as starting point
  const handleOverrideToggle = (v: boolean) => {
    if (v && !local.override) {
      // Inherit from global so nothing "disappears"
      update({
        override: true,
        bgImage: local.bgImage ?? (globalApp?.bgImage ?? null),
        bubbleDraftCss: local.bubbleDraftCss || (globalApp?.bubbleDraftCss ?? ''),
        themeDraftCss: local.themeDraftCss || (globalApp?.themeDraftCss ?? ''),
      });
    } else {
      update({ override: v });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => update({ bgImage: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Apply a combined preset
  const applyPreset = (p: CombinedPreset) => {
    update({
      bgImage: p.bgImage,
      bubbleDraftCss: p.bubbleDraftCss,
      themeDraftCss: p.themeDraftCss,
      activeBubblePresetId: null,
    });
  };

  // Save current as combined preset
  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const np: CombinedPreset = {
      id: Date.now().toString(),
      name,
      bgImage: local.bgImage,
      bubbleDraftCss: local.bubbleDraftCss,
      themeDraftCss: local.themeDraftCss,
    };
    const next = [...combinedPresets, np];
    setCombinedPresets(next);
    saveCombinedPresets(next);
    setPresetName('');
    setSaveMode(false);
  };

  const handleDeletePreset = (id: string) => {
    const next = combinedPresets.filter(p => p.id !== id);
    setCombinedPresets(next);
    saveCombinedPresets(next);
  };

  // Effective values for preview
  const effectiveBg = local.override ? local.bgImage : (globalApp?.bgImage ?? null);
  const effectiveBubbleCss = local.override ? local.bubbleDraftCss : (globalApp?.bubbleDraftCss ?? '');
  const effectiveThemeCss = local.override ? local.themeDraftCss : (globalApp?.themeDraftCss ?? '');

  const scopedBubbleCss = effectiveBubbleCss
    .replace(/\.message\.sent/g, '.cap-preview .cap-sent')
    .replace(/\.message\.received/g, '.cap-preview .cap-recv');

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.28 }}
      className="fixed inset-0 z-200 bg-[#F7F7F7] flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-black/3 flex items-center gap-2">
        <button onClick={onClose} className="p-2 -ml-2 text-black/40 active:bg-black/4 rounded-xl transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-[16px] font-bold text-black/80 leading-tight">聊天页面外观</h2>
          <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">APPEARANCE / THIS CHAT</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">

        {/* Override toggle */}
        <div className="bg-white rounded-[20px] border border-black/3 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold text-black/70">单独设置此聊天</div>
            <div className="text-[11px] text-black/30 mt-0.5">
              {local.override ? '使用独立外观，不受全局影响' : '跟随全局外观设置'}
            </div>
          </div>
          <Switch checked={local.override} onChange={handleOverrideToggle} />
        </div>

        {/* Live preview — always visible */}
        <div className="bg-white rounded-[20px] border border-black/3 p-4">
          <p className="text-[10px] font-bold text-black/25 uppercase tracking-widest mb-3">实时预览</p>
          <style>{`
            .cap-preview .cap-sent { background: black; color: white; }
            .cap-preview .cap-recv { background: white; color: black; border: 1px solid rgba(0,0,0,0.08); }
            ${scopedBubbleCss}
            ${effectiveThemeCss}
          `}</style>
          <div
            className="cap-preview rounded-xl overflow-hidden border border-black/4"
            style={{
              background: effectiveBg ? `url(${effectiveBg}) center/cover no-repeat` : '#F4F4F4',
              minHeight: 130,
            }}
          >
            <div className="p-3 space-y-2">
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-lg bg-gray-300 shrink-0" />
                <div className="cap-recv px-3 py-1.5 rounded-xl rounded-tl-none text-[12px] leading-snug">对方的消息</div>
              </div>
              <div className="flex items-end gap-2 flex-row-reverse">
                <div className="w-6 h-6 rounded-lg bg-black shrink-0" />
                <div className="cap-sent px-3 py-1.5 rounded-xl rounded-tr-none text-[12px] leading-snug">我的消息</div>
              </div>
            </div>
          </div>
        </div>

        {/* Override-only settings */}
        <AnimatePresence>
          {local.override && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* ── Combined presets ── */}
              <div className="bg-white rounded-[20px] border border-black/3 p-5 space-y-3">
                <div>
                  <div className="text-[14px] font-bold text-black/70">外观方案预设</div>
                  <div className="text-[11px] text-black/30 mt-0.5">将当前背景 + 气泡 + 主题统一保存，或应用已有方案</div>
                </div>

                {/* Preset chips */}
                {combinedPresets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {combinedPresets.map(p => (
                      <div key={p.id} className="flex items-center gap-0.5 bg-black/4 rounded-xl overflow-hidden">
                        <button
                          onClick={() => applyPreset(p)}
                          className="px-3 py-1.5 text-[12px] font-bold text-black/60 active:bg-black/8 transition-colors"
                        >
                          {p.name}
                        </button>
                        <button
                          onClick={() => handleDeletePreset(p.id)}
                          className="pr-2.5 pl-1 py-1.5 text-black/20 active:text-red-400 transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save as preset */}
                <AnimatePresence mode="wait">
                  {saveMode ? (
                    <motion.div
                      key="naming"
                      initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="flex gap-2"
                    >
                      <input
                        autoFocus
                        value={presetName}
                        onChange={e => setPresetName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSavePreset(); if (e.key === 'Escape') { setSaveMode(false); setPresetName(''); } }}
                        placeholder="方案名称..."
                        className="flex-1 bg-black/2.5 border border-black/5 rounded-xl px-3 py-2 text-[13px] text-black/70 outline-none focus:ring-2 focus:ring-black/8"
                      />
                      <button
                        onClick={handleSavePreset}
                        disabled={!presetName.trim()}
                        className="px-3 py-2 bg-black text-white rounded-xl disabled:opacity-25 active:scale-95 transition-all"
                      >
                        <Check size={13} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => { setSaveMode(false); setPresetName(''); }}
                        className="px-3 py-2 bg-black/4 text-black/40 rounded-xl active:scale-95 transition-all text-[13px] font-bold"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="save-btn"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setSaveMode(true)}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-black/30 active:text-black/60 transition-colors"
                    >
                      <Plus size={13} />
                      保存当前为新方案
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Background ── */}
              <div className="bg-white rounded-[20px] border border-black/3 p-5 space-y-3">
                <div>
                  <div className="text-[14px] font-bold text-black/70">聊天背景</div>
                  <div className="text-[11px] text-black/30 mt-0.5">为此对话单独设置背景图</div>
                </div>
                {local.bgImage && (
                  <div
                    className="w-full h-16 rounded-xl border border-black/5"
                    style={{ background: `url(${local.bgImage}) center/cover no-repeat` }}
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white text-[13px] font-bold rounded-xl active:opacity-75 transition-opacity"
                  >
                    <ImageIcon size={14} />
                    {local.bgImage ? '更换图片' : '上传图片'}
                  </button>
                  {local.bgImage && (
                    <button
                      onClick={() => update({ bgImage: null })}
                      className="px-4 py-2.5 bg-black/4 text-black/45 rounded-xl active:bg-black/8 transition-colors"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              </div>

              {/* ── Bubble CSS ── */}
              <div className="bg-white rounded-[20px] border border-black/3 p-5 space-y-3">
                <div>
                  <div className="text-[14px] font-bold text-black/70">气泡 CSS</div>
                  <div className="text-[11px] text-black/30 mt-0.5">选择全局预设，或输入自定义 CSS</div>
                </div>
                {globalApp?.bubblePresets?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {globalApp.bubblePresets.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => update({ bubbleDraftCss: p.css, activeBubblePresetId: p.id })}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${local.activeBubblePresetId === p.id
                          ? 'bg-black text-white'
                          : 'bg-black/4 text-black/50 active:bg-black/8'
                          }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {local.activeBubblePresetId && (
                      <button
                        onClick={() => update({ bubbleDraftCss: '', activeBubblePresetId: null })}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-black/3 text-black/30 active:bg-black/6"
                      >
                        清除
                      </button>
                    )}
                  </div>
                )}
                <textarea
                  value={local.bubbleDraftCss}
                  onChange={e => update({ bubbleDraftCss: e.target.value, activeBubblePresetId: null })}
                  placeholder={`.message.sent {\n  background: #333 !important;\n  color: white !important;\n}\n.message.received {\n  background: #f5f5f5 !important;\n}`}
                  rows={5}
                  spellCheck={false}
                  className="w-full bg-black/2 border border-black/5 rounded-xl px-3 py-3 text-[12px] font-mono text-black/65 outline-none resize-none focus:ring-2 focus:ring-black/8 placeholder:text-black/15 leading-[1.7]"
                />
              </div>

              {/* ── Theme CSS ── */}
              <div className="bg-white rounded-[20px] border border-black/3 p-5 space-y-3">
                <div>
                  <div className="text-[14px] font-bold text-black/70">主题 CSS</div>
                  <div className="text-[11px] text-black/30 mt-0.5">全局主题覆盖，选择全局预设或输入自定义</div>
                </div>
                {globalApp?.themePresets?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {globalApp.themePresets.map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => update({ themeDraftCss: p.css })}
                        className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${local.themeDraftCss === p.css && local.themeDraftCss !== ''
                          ? 'bg-black text-white'
                          : 'bg-black/4 text-black/50 active:bg-black/8'
                          }`}
                      >
                        {p.name}
                      </button>
                    ))}
                    {local.themeDraftCss && (
                      <button
                        onClick={() => update({ themeDraftCss: '' })}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-bold bg-black/3 text-black/30 active:bg-black/6"
                      >
                        清除
                      </button>
                    )}
                  </div>
                )}
                <textarea
                  value={local.themeDraftCss}
                  onChange={e => update({ themeDraftCss: e.target.value })}
                  placeholder={`:root {\n  --theme-primary: #000;\n}`}
                  rows={4}
                  spellCheck={false}
                  className="w-full bg-black/2 border border-black/5 rounded-xl px-3 py-3 text-[12px] font-mono text-black/65 outline-none resize-none focus:ring-2 focus:ring-black/8 placeholder:text-black/15 leading-[1.7]"
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {!local.override && (
          <p className="px-1 text-[11px] text-black/30 leading-relaxed">
            当前跟随全局外观。开启上方开关可单独配置此聊天的背景和样式，不影响其他联系人。全局外观在 Core → 界面外观 中修改。
          </p>
        )}

      </div>
    </motion.div>
  );
};

// ─── 好友设置 Modal ──────────────────────────────────────────────────────────
const MASKS_KEY = 'souyee_os_masks';

const FriendSettingsModal = ({ contactName, chatSettings, onSave, onClose }: {
  contactName: string;
  chatSettings: any;
  onSave: (s: any) => void;
  onClose: () => void;
}) => {
  const [myPatTarget, setMyPatTarget] = useState(chatSettings.myPatTarget || '');
  const [activeMaskId, setActiveMaskId] = useState(chatSettings.activeMaskId || '');

  // 从 localStorage 读取面具列表
  const masks: { id: string; name: string; avatar: string; persona: string }[] = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(MASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const activeMask = masks.find(m => m.id === activeMaskId) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="bg-white rounded-[28px] w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5">
          <h3 className="font-bold text-[17px] text-black/80 mb-1 flex items-center gap-2">
            <UserCog size={18} className="text-black/30" /> 好友设置
          </h3>
          <p className="text-[11px] text-black/30">自定义与 {contactName} 的互动偏好</p>
        </div>

        <div className="px-6 pb-6 space-y-4">

          {/* ── 面具选择 ── */}
          <div className="bg-black/2.5 rounded-2xl px-4 py-4 space-y-3">
            <div className="font-bold text-[13px] text-black/70 flex items-center gap-2">
              <span>◈</span> 我的面具
            </div>
            <div className="text-[11px] text-black/35 leading-relaxed">
              选择一个面具，AI 将以该身份认识你。
            </div>

            {masks.length === 0 ? (
              <div className="text-[11px] text-black/30 bg-black/3 rounded-xl px-3 py-2.5">
                暂无面具 — 前往 Core → 个人设定 创建
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {/* 无面具选项 */}
                <button
                  onClick={() => setActiveMaskId('')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${activeMaskId === ''
                    ? 'bg-black text-white'
                    : 'bg-black/3 active:bg-black/6'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-[11px] ${activeMaskId === '' ? 'border-white/40 text-white/60' : 'border-black/20 text-black/30'
                    }`}>
                    ∅
                  </div>
                  <span className={`text-[13px] font-medium ${activeMaskId === '' ? 'text-white' : 'text-black/60'}`}>
                    不使用面具
                  </span>
                </button>

                {/* 面具列表 */}
                {masks.map(mask => {
                  const isActive = activeMaskId === mask.id;
                  const initial = mask.name.charAt(0).toUpperCase();
                  return (
                    <button
                      key={mask.id}
                      onClick={() => setActiveMaskId(mask.id)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${isActive ? 'bg-black text-white' : 'bg-black/3 active:bg-black/6'
                        }`}
                    >
                      {/* 头像 */}
                      <div className={`w-7 h-7 shrink-0 overflow-hidden border ${isActive ? 'border-white/30' : 'border-black/10'}`}
                        style={{ borderRadius: 2 }}
                      >
                        {mask.avatar
                          ? <img src={mask.avatar} alt={mask.name} className="w-full h-full object-cover" />
                          : <div className={`w-full h-full flex items-center justify-center text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-black/10 text-black/40'}`}>
                            {initial}
                          </div>
                        }
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[13px] font-bold leading-tight ${isActive ? 'text-white' : 'text-black/75'}`}>
                          {mask.name}
                        </span>
                        {mask.persona && (
                          <span className={`text-[10px] truncate leading-tight mt-0.5 ${isActive ? 'text-white/50' : 'text-black/30'}`}>
                            {mask.persona}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <span className="ml-auto text-white/70 text-[16px] shrink-0">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 当前状态预览 */}
            {activeMask && (
              <div className="text-[11px] text-black/30 bg-black/3 rounded-xl px-3 py-2 leading-relaxed">
                当前：<span className="text-black/50 font-medium">以「{activeMask.name}」的身份与 {contactName} 聊天</span>
              </div>
            )}
          </div>

          {/* ── 拍一拍 ── */}
          <div className="bg-black/2.5 rounded-2xl px-4 py-4 space-y-2">
            <div className="font-bold text-[13px] text-black/70 flex items-center gap-2">
              <span>👋</span> 我的拍一拍内容
            </div>
            <div className="text-[11px] text-black/35 leading-relaxed">
              双击 {contactName} 头像时会显示「你拍了拍 {contactName} ___」，在此填写横线处的内容，可以是任何东西。
            </div>
            <input
              type="text"
              value={myPatTarget}
              onChange={e => setMyPatTarget(e.target.value)}
              placeholder="例如：的腹肌、的头、的肩膀、的手机..."
              className="w-full bg-white rounded-xl border border-black/8 px-3 py-2.5 text-[14px] text-black/70 outline-none focus:ring-2 focus:ring-black/10 placeholder:text-black/20"
            />
            {myPatTarget.trim() && (
              <div className="text-[11px] text-black/30 bg-black/3 rounded-xl px-3 py-2 leading-relaxed">
                预览：<span className="text-black/50 font-medium">你拍了拍 {contactName} {myPatTarget.trim()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex border-t border-black/4">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/4 active:bg-black/2 transition-colors"
          >取消</button>
          <button
            onClick={() => { onSave({ ...chatSettings, myPatTarget: myPatTarget.trim(), activeMaskId }); onClose(); }}
            className="flex-1 py-4 font-bold text-[14px] text-black/75 active:bg-black/2 transition-colors"
          >保存</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 聊天设置页面 ─────────────────────────────────────────────────────────────
const ChatSettingsPage = ({
  contact, onClose, onClearMessages, onDeleteContact,
  isBlacklisted, onToggleBlacklist, onOpenSearch, onExport, chatSettings, onSaveChatSettings,
  messages, onToggleTimestamps, onToggleTimestampPosition, onToggleTimeAwareness, onOpenAppearance, charNote,
  onTriggerMemory,
}: any) => {
  const [confirmConfig, setConfirmConfig] = useState<{ type: 'clear' | 'delete' } | null>(null);
  const [showChatSettingsModal, setShowChatSettingsModal] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [showFriendSettings, setShowFriendSettings] = useState(false);
  const [showNoteHistory, setShowNoteHistory] = useState(false);
  const [isMemoryExtracting, setIsMemoryExtracting] = useState(false);

  // 读取记忆统计
  const [memStats, setMemStats] = useState<{ lastExtractedAt: number; interval: number }>(() => {
    try {
      const raw = localStorage.getItem(`souyee_memory_${contact.id}`);
      const mem = raw ? JSON.parse(raw) : null;
      return { lastExtractedAt: mem?.lastExtractedAt ?? 0, interval: mem?.extractIntervalRounds ?? 20 };
    } catch { return { lastExtractedAt: 0, interval: 20 }; }
  });

  const totalMsgs = (messages as any[]).filter((m: any) => !m.isRevoked && !m.isSystemNotice && m.text && m.text.trim()).length;
  const pendingMsgs = totalMsgs - memStats.lastExtractedAt;
  // 本次手动可提取条数：最多一个 interval
  const canExtract = Math.min(pendingMsgs, memStats.interval);

  const saveInterval = (val: number) => {
    try {
      const key = `souyee_memory_${contact.id}`;
      const raw = localStorage.getItem(key);
      const mem = raw ? JSON.parse(raw) : { contactId: contact.id, facts: [], summaries: [], lastExtractedAt: 0 };
      localStorage.setItem(key, JSON.stringify({ ...mem, extractIntervalRounds: val }));
      setMemStats(s => ({ ...s, interval: val }));
    } catch { /* ignore */ }
  };

  const handleManualExtract = async () => {
    if (isMemoryExtracting || canExtract <= 0) return;
    setIsMemoryExtracting(true);
    await onTriggerMemory?.();
    // 提取完后刷新统计
    try {
      const raw = localStorage.getItem(`souyee_memory_${contact.id}`);
      const mem = raw ? JSON.parse(raw) : null;
      setMemStats({ lastExtractedAt: mem?.lastExtractedAt ?? 0, interval: mem?.extractIntervalRounds ?? 20 });
    } catch { /* ignore */ }
    setIsMemoryExtracting(false);
  };

  const noteData: { nickname: string; history: Array<{ nickname: string; updatedAt: string }> } =
    charNote ?? { nickname: '', history: [] };

  const menuGroups = [
    {
      title: "个性化",
      items: [
        { id: 'style', icon: <Palette size={20} />, label: '聊天页面美化', desc: '背景与气泡自定义', action: onOpenAppearance },
        { id: 'chatSettings', icon: <SlidersHorizontal size={20} />, label: '对话参数', desc: '上下文条数 & 气泡数', action: () => setShowChatSettingsModal(true) },
        { id: 'memory', icon: <Layers size={20} />, label: '记忆总结', desc: '' },
        { id: 'timestamps', icon: <Clock size={20} />, label: '显示时间戳', desc: '' },
        { id: 'timeAwareness', icon: <Zap size={20} />, label: '时间感知', desc: '让角色知道真实时间与星期' },
      ]
    },
    {
      title: "好友管理",
      items: [
        { id: 'profile', icon: <UserCog size={20} />, label: '好友设置', desc: '管理好友资料', action: () => setShowFriendSettings(true) },
      ]
    },
    {
      title: "内容管理",
      items: [
        { id: 'search', icon: <Search size={20} />, label: '查找聊天记录', desc: '', action: onOpenSearch },
        { id: 'export', icon: <Download size={20} />, label: '导出聊天记录', desc: '', action: () => setShowExportConfirm(true) },
        { id: 'clear', icon: <Eraser size={20} />, label: '清空聊天记录', desc: '', action: () => setConfirmConfig({ type: 'clear' }) },
      ]
    },
    {
      title: "危险操作",
      items: [
        { id: 'blacklist', icon: <Ban size={20} />, label: '加入黑名单', desc: '', danger: true },
        { id: 'delete', icon: <UserMinus size={20} />, label: '删除好友', desc: '', danger: true, action: () => setConfirmConfig({ type: 'delete' }) },
      ]
    }
  ];

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "tween", duration: 0.3 }} className="fixed inset-0 z-100 bg-[#F7F7F7] flex flex-col">
      <AnimatePresence>
        {confirmConfig?.type === 'clear' && (
          <ConfirmActionModal title="清空聊天记录？" desc="清空后，当前会话的所有消息都将被永久删除。" confirmText="清空" onConfirm={() => { onClearMessages(); setConfirmConfig(null); }} onCancel={() => setConfirmConfig(null)} />
        )}
        {confirmConfig?.type === 'delete' && (
          <ConfirmActionModal title="删除好友？" desc={`确定要删除 ${contact.name} 吗？同时将删除与该好友的聊天记录。`} confirmText="确定删除" isDanger onConfirm={onDeleteContact} onCancel={() => setConfirmConfig(null)} />
        )}
        {showChatSettingsModal && (
          <ChatSettingsModal
            settings={chatSettings}
            onSave={onSaveChatSettings}
            onClose={() => setShowChatSettingsModal(false)}
            contactId={contact.id}
          />
        )}
        {showFriendSettings && (
          <FriendSettingsModal
            contactName={contact.name}
            chatSettings={chatSettings}
            onSave={onSaveChatSettings}
            onClose={() => setShowFriendSettings(false)}
          />
        )}
        {showExportConfirm && (
          <ExportConfirmModal
            messages={messages}
            contactName={contact.name}
            onConfirm={() => { onExport(); setShowExportConfirm(false); }}
            onCancel={() => setShowExportConfirm(false)}
          />
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 pb-2 bg-white border-b border-black/3">
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="p-2 -ml-2 text-black/40"><ChevronLeft size={24} /></button>
          <h2 className="text-lg font-bold text-black/80">聊天详情</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="bg-white px-6 py-8 flex flex-col items-center mb-2">
          <div className="w-20 h-20 rounded-[28px] overflow-hidden border border-black/5 shadow-sm mb-4">
            {contact.avatar
              ? <img src={contact.avatar} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-black/20">{contact.name[0]}</div>
            }
          </div>
          <h3 className="font-bold text-xl text-black/80">{contact.name}</h3>
        </div>

        {/* ── TA 对你的备注名 ── */}
        <div className="mx-4 mb-3 bg-white rounded-[18px] border border-black/5 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-black/25 uppercase tracking-widest">TA 对你的备注</span>
            {noteData.history.length > 0 && (
              <button
                onClick={() => setShowNoteHistory(v => !v)}
                className="text-[10px] font-bold text-black/30 flex items-center gap-1 active:text-black/60 transition-colors"
              >
                历史
                <motion.span
                  animate={{ rotate: showNoteHistory ? 90 : 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ display: 'inline-block' }}
                >
                  ›
                </motion.span>
              </button>
            )}
          </div>
          {/* 备注名展示框（只读，仿输入框风格） */}
          <div className="w-full border border-black/8 rounded-xl px-4 py-3 bg-black/1.5 10.5 flex items-center">
            {noteData.nickname ? (
              <span className="text-[15px] text-black/70" style={{ fontFamily: 'Georgia, serif' }}>
                {noteData.nickname}
              </span>
            ) : (
              <span className="text-[13px] text-black/20 italic" style={{ fontFamily: 'Georgia, serif' }}>
                暂无备注，聊一段时间后 {contact.name} 会给你起名…
              </span>
            )}
          </div>
          {/* 历史记录展开 */}
          <AnimatePresence>
            {showNoteHistory && noteData.history.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-black/4 pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">曾用名</p>
                  {noteData.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[13px] text-black/40 line-through" style={{ fontFamily: 'Georgia, serif' }}>{h.nickname}</span>
                      <span className="text-[10px] text-black/20">{h.updatedAt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-2">
            <div className="px-6 py-2 text-[11px] font-bold text-black/20 uppercase tracking-widest">{group.title}</div>
            <div className="bg-white border-y border-black/3">
              {group.items.map((item) => {
                const isBlacklist = item.id === 'blacklist';
                const isTimestamps = item.id === 'timestamps';
                const isTimeAwareness = item.id === 'timeAwareness';
                const isMemory = item.id === 'memory';
                const iconColor = item.id === 'delete' ? 'text-red-500/80' : 'text-black/30';
                const textColor = item.id === 'delete' ? 'text-red-500' : 'text-black/80';
                return (
                  <React.Fragment key={item.id}>
                    <button onClick={() => { if (!isBlacklist && !isTimestamps && !isTimeAwareness && !isMemory) item.action?.(); }} className="w-full px-6 py-4 flex items-center justify-between active:bg-black/2 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={iconColor}>{item.icon}</div>
                        <div className="text-left">
                          <div className={`text-[15px] font-bold ${textColor}`}>{item.label}</div>
                          {item.desc && <div className="text-[11px] text-black/20">{item.desc}</div>}
                          {/* memory 行内嵌统计小字 */}
                          {isMemory && (
                            <div className="text-[11px] text-black/30 mt-0.5">
                              消息总数：{totalMsgs} 条　待总结：{pendingMsgs}/{memStats.interval} 条
                            </div>
                          )}
                        </div>
                      </div>
                      {isBlacklist
                        ? <Switch checked={isBlacklisted} onChange={onToggleBlacklist} />
                        : isTimestamps
                          ? <Switch checked={chatSettings.showTimestamps} onChange={onToggleTimestamps} />
                          : isTimeAwareness
                            ? <Switch checked={chatSettings.timeAwareness} onChange={onToggleTimeAwareness} />
                            : <ChevronRight size={18} className="text-black/10" />
                      }
                    </button>
                    {/* 记忆总结展开面板：始终展开 */}
                    {isMemory && (
                      <div className="border-t border-black/3 px-6 py-4 space-y-4">
                        {/* 提取间隔调节 */}
                        <div>
                          <div className="text-[10px] font-bold text-black/25 uppercase tracking-widest mb-2">自动提取间隔（条）</div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => saveInterval(Math.max(5, memStats.interval - 5))}
                              className="w-9 h-9 rounded-xl bg-black/4 flex items-center justify-center font-bold text-black/50 active:bg-black/10 shrink-0"
                            >−</button>
                            <input
                              type="number"
                              min={5}
                              value={memStats.interval}
                              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 5) saveInterval(v); }}
                              className="flex-1 text-center bg-white rounded-xl border border-black/8 py-2 font-bold text-black/70 text-[15px] outline-none"
                            />
                            <button
                              onClick={() => saveInterval(memStats.interval + 5)}
                              className="w-9 h-9 rounded-xl bg-black/4 flex items-center justify-center font-bold text-black/50 active:bg-black/10 shrink-0"
                            >+</button>
                          </div>
                        </div>
                        {/* 手动提取按钮 */}
                        <button
                          onClick={handleManualExtract}
                          disabled={isMemoryExtracting || canExtract <= 0}
                          className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold transition-all"
                          style={{
                            background: canExtract <= 0 ? '#f5f5f5' : '#111',
                            color: canExtract <= 0 ? '#bbb' : '#fff',
                            opacity: isMemoryExtracting ? 0.6 : 1,
                            fontFamily: 'Georgia, serif',
                          }}
                        >
                          {isMemoryExtracting ? (
                            <>
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                                style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
                              正在整理…
                            </>
                          ) : canExtract <= 0 ? (
                            '暂无待总结消息'
                          ) : (
                            `立即总结（${canExtract} 条）`
                          )}
                        </button>
                      </div>
                    )}
                    {/* 时间戳位置选择器：仅在开启时展开 */}
                    {isTimestamps && chatSettings.showTimestamps && (
                      <div className="px-6 pb-4 flex items-center justify-between border-t border-black/3">
                        <span className="text-[12px] text-black/40 font-medium">时间戳位置</span>
                        <div className="flex gap-1">
                          {(['avatar', 'bubble'] as const).map(pos => (
                            <button
                              key={pos}
                              onClick={() => onToggleTimestampPosition(pos)}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${chatSettings.timestampPosition === pos
                                ? 'bg-black text-white'
                                : 'bg-black/6 text-black/40 active:bg-black/12'
                                }`}
                            >
                              {pos === 'avatar' ? '头像下方' : '气泡旁边'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 时区选择：仅在时间感知开启时展开 */}
                    {isTimeAwareness && chatSettings.timeAwareness && (
                      <div className="border-t border-black/3 px-6 py-4 space-y-3">
                        <div>
                          <div className="text-[10px] font-bold text-black/25 uppercase tracking-widest mb-2">我的时区</div>
                          <select
                            value={chatSettings.userTimezone}
                            onChange={e => onSaveChatSettings({ ...chatSettings, userTimezone: e.target.value })}
                            className="w-full bg-black/2 border border-black/8 rounded-xl px-3 py-2 text-[12px] text-black/60 outline-none"
                          >
                            {TIMEZONE_OPTIONS.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-black/25 uppercase tracking-widest mb-2">角色的时区</div>
                          <select
                            value={chatSettings.charTimezone}
                            onChange={e => onSaveChatSettings({ ...chatSettings, charTimezone: e.target.value })}
                            className="w-full bg-black/2 border border-black/8 rounded-xl px-3 py-2 text-[12px] text-black/60 outline-none"
                          >
                            {TIMEZONE_OPTIONS.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── 其他小弹窗 ──────────────────────────────────────────────────────────────
const ErrorDetailModal = ({ info, onClose }: { info: any, onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-4xl shadow-2xl w-full max-w-sm overflow-hidden border border-black/5" onClick={e => e.stopPropagation()}>
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4"><AlertCircle size={32} /></div>
        <h3 className="font-bold text-gray-800 text-lg mb-2">通信异常</h3>
        <div className="w-full bg-gray-50 rounded-2xl p-4 text-left border border-black/5 text-xs">
          <div className="flex justify-between mb-2"><span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status:</span><span className="font-mono font-bold text-red-500">{info.status || 'Error'}</span></div>
          <div className="text-gray-600 leading-relaxed break-all font-mono bg-white p-3 rounded-lg border border-black/5 max-h-37.5 overflow-y-auto whitespace-pre-wrap">{info.detail}</div>
        </div>
      </div>
      <button onClick={onClose} className="w-full py-5 font-bold text-black border-t border-gray-100 hover:bg-gray-50">确认</button>
    </motion.div>
  </motion.div>
);

const DeleteConfirmModal = ({ onConfirm, onCancel }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-300 flex items-center justify-center px-10 bg-black/60 backdrop-blur-md" onClick={onCancel}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-4xl shadow-2xl w-full max-w-xs overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4"><Trash2 size={24} /></div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">确认删除？</h3>
        <p className="text-gray-400 text-sm">删除后该消息将无法找回。</p>
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-4 font-bold text-gray-400 border-r border-gray-100">取消</button>
        <button onClick={onConfirm} className="flex-1 py-4 font-bold text-red-500">确定删除</button>
      </div>
    </motion.div>
  </motion.div>
);

const BatchDeleteConfirmModal = ({ count, onConfirm, onCancel }: { count: number; onConfirm: () => void; onCancel: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-300 flex items-center justify-center px-10 bg-black/60 backdrop-blur-md" onClick={onCancel}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-4xl shadow-2xl w-full max-w-xs overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4"><Trash2 size={24} /></div>
        <h3 className="font-bold text-gray-800 text-lg mb-1">批量删除消息？</h3>
        <p className="text-gray-400 text-sm">将删除已选中的 <span className="font-bold text-gray-600">{count}</span> 条消息，删除后无法找回。</p>
      </div>
      <div className="flex border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-4 font-bold text-gray-400 border-r border-gray-100">取消</button>
        <button onClick={onConfirm} className="flex-1 py-4 font-bold text-red-500">确定删除</button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── 语音输入弹窗 ─────────────────────────────────────────────────────────────
const VoiceModal = ({ onConfirm, onCancel }: { onConfirm: (text: string, duration: number) => void; onCancel: () => void }) => {
  const [text, setText] = useState('');
  const duration = Math.max(1, Math.round(text.trim().length / 4));
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm mx-4 mb-8 bg-white rounded-[28px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <Mic size={16} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-[15px] text-black/80">发送语音</p>
            <p className="text-[11px] text-black/30 mt-0.5">输入内容，将以语音形式发送</p>
          </div>
        </div>

        <div className="px-6 py-4">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="输入语音内容..."
            rows={3}
            className="w-full bg-black/3 border border-black/6 rounded-2xl px-4 py-3 text-[14px] text-black/70 placeholder:text-black/20 outline-none resize-none leading-relaxed focus:ring-2 focus:ring-black/10"
          />
          {text.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-1.5 px-1"
            >
              <Mic size={11} className="text-black/25" strokeWidth={1.5} />
              <span className="text-[11px] text-black/25 font-medium">{duration}″</span>
            </motion.div>
          )}
        </div>

        <div className="flex border-t border-black/5">
          <button
            onClick={onCancel}
            className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/5 active:bg-black/2 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => { if (text.trim()) onConfirm(text.trim(), duration); }}
            disabled={!text.trim()}
            className="flex-1 py-4 font-bold text-[14px] text-black/75 disabled:text-black/20 active:bg-black/2 transition-colors"
          >
            发送
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 图片来源选择弹窗 ─────────────────────────────────────────────────────────
const ImagePickerModal = ({ onChooseDesc, onChooseReal, onCancel }: {
  onChooseDesc: () => void;
  onChooseReal: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-400 flex items-end justify-center bg-black/50 backdrop-blur-sm"
    onClick={onCancel}
  >
    <motion.div
      initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className="w-full max-w-sm mx-4 mb-8 bg-white rounded-[28px] shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center shrink-0">
          <ImageIcon size={16} className="text-white" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-bold text-[15px] text-black/80">发送图片</p>
          <p className="text-[11px] text-black/30 mt-0.5">选择图片类型</p>
        </div>
      </div>
      <div className="px-4 pb-6 flex flex-col gap-2">
        <button
          onClick={onChooseDesc}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-black/3 border border-black/5 active:bg-black/7 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-black/6 flex items-center justify-center shrink-0">
            <Pencil size={16} className="text-black/50" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-[14px] text-black/75">文字描述</p>
            <p className="text-[11px] text-black/30 mt-0.5">用文字描述一张图片</p>
          </div>
        </button>
        <button
          onClick={onChooseReal}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-black/3 border border-black/5 active:bg-black/7 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-black/6 flex items-center justify-center shrink-0">
            <ImageIcon size={16} className="text-black/50" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-[14px] text-black/75">真实图片</p>
            <p className="text-[11px] text-black/30 mt-0.5">从本地相册选择图片</p>
          </div>
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── 文字描述图片弹窗 ─────────────────────────────────────────────────────────
const ImageDescModal = ({ onConfirm, onCancel }: {
  onConfirm: (desc: string) => void;
  onCancel: () => void;
}) => {
  const [desc, setDesc] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm mx-4 mb-8 bg-white rounded-[28px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <Pencil size={15} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-[15px] text-black/80">文字描述图片</p>
            <p className="text-[11px] text-black/30 mt-0.5">输入图片内容描述</p>
          </div>
        </div>
        <div className="px-6 py-4">
          <textarea
            autoFocus
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="描述这张图片的内容..."
            rows={3}
            className="w-full bg-black/3 border border-black/6 rounded-2xl px-4 py-3 text-[14px] text-black/70 placeholder:text-black/20 outline-none resize-none leading-relaxed focus:ring-2 focus:ring-black/10"
          />
        </div>
        <div className="flex border-t border-black/5">
          <button onClick={onCancel} className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/5 active:bg-black/2 transition-colors">取消</button>
          <button
            onClick={() => { if (desc.trim()) onConfirm(desc.trim()); }}
            disabled={!desc.trim()}
            className="flex-1 py-4 font-bold text-[14px] text-black/75 disabled:text-black/20 active:bg-black/2 transition-colors"
          >发送</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 发红包弹窗 ───────────────────────────────────────────────────────────────
const RedPacketModal = ({ senderName, onConfirm, onCancel }: {
  senderName?: string;
  onConfirm: (amount: string, note: string) => void;
  onCancel: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const isValid = amount.trim() !== '' && !isNaN(Number(amount)) && Number(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #96281B 100%)' }}
      >
        {/* 顶部标题 */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-bold text-[16px] text-white">发红包</p>
            {senderName && <p className="text-[11px] text-white/50 mt-0.5">发给 {senderName}</p>}
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-xl bg-white/10 active:bg-white/20 transition-colors">
            <X size={16} className="text-white/70" />
          </button>
        </div>

        {/* 金额输入 */}
        <div className="mx-5 mb-3 bg-white/10 rounded-2xl px-5 py-4 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-[18px] font-bold">¥</span>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none text-white text-[28px] font-bold placeholder:text-white/20 w-full"
            />
          </div>
          <div className="mt-1 h-px bg-white/15" />
          <p className="mt-2 text-[10px] text-white/35 uppercase tracking-widest">金额（元）</p>
        </div>

        {/* 备注 */}
        <div className="mx-5 mb-5 bg-white/10 rounded-2xl px-5 py-3 border border-white/10">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="恭喜发财，大吉大利"
            maxLength={20}
            className="w-full bg-transparent outline-none text-white text-[14px] placeholder:text-white/25"
          />
        </div>

        {/* 发送按钮 */}
        <div className="px-5 pb-6">
          <button
            onClick={() => { if (isValid) onConfirm(Number(amount).toFixed(2), note.trim() || '恭喜发财，大吉大利'); }}
            disabled={!isValid}
            className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all ${isValid
              ? 'bg-[#f5c842] text-[#7a1f10] active:scale-95 shadow-lg'
              : 'bg-white/10 text-white/25 cursor-not-allowed'
              }`}
          >
            塞钱进红包
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 转账弹窗 ─────────────────────────────────────────────────────────────────
const TransferModal = ({ receiverName, onConfirm, onCancel }: {
  receiverName: string;
  onConfirm: (amount: string, note: string) => void;
  onCancel: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const isValid = amount.trim() !== '' && !isNaN(Number(amount)) && Number(amount) > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl bg-white"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶栏 */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-black/5">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <ArrowRightLeft size={17} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="font-bold text-[16px] text-black/80">转账</p>
            <p className="text-[11px] text-black/30 mt-0.5">转给 {receiverName}</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1.5 rounded-xl bg-black/5 active:bg-black/10 transition-colors">
            <X size={16} className="text-black/40" />
          </button>
        </div>

        {/* 金额区 */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-end gap-2 pb-3 border-b-2 border-black/10 focus-within:border-black/40 transition-colors">
            <span className="text-black/25 text-[22px] font-light mb-0.5">¥</span>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none text-black/80 text-[36px] font-light placeholder:text-black/10 w-full"
            />
          </div>
          <p className="mt-2 text-[10px] text-black/25 uppercase tracking-widest">转账金额（元）</p>
        </div>

        {/* 备注 */}
        <div className="mx-6 mb-6 bg-black/3 rounded-2xl px-4 py-3 border border-black/5">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注（选填）"
            maxLength={30}
            className="w-full bg-transparent outline-none text-black/60 text-[14px] placeholder:text-black/20"
          />
        </div>

        {/* 按钮 */}
        <div className="flex border-t border-black/5">
          <button onClick={onCancel} className="flex-1 py-4 font-bold text-[14px] text-black/35 border-r border-black/5 active:bg-black/2 transition-colors">
            取消
          </button>
          <button
            onClick={() => { if (isValid) onConfirm(Number(amount).toFixed(2), note.trim()); }}
            disabled={!isValid}
            className="flex-1 py-4 font-bold text-[14px] text-black/80 disabled:text-black/20 active:bg-black/2 transition-colors"
          >
            转账
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 转账操作弹窗（收款 or 退还）────────────────────────────────────────────
const TransferActionModal = ({ msg, contactName, onAccept, onReturn, onCancel }: {
  msg: Message;
  contactName: string;
  onAccept: () => void;
  onReturn: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-400 flex items-center justify-center px-8 bg-black/50 backdrop-blur-sm"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="w-full max-w-xs bg-white rounded-3xl overflow-hidden shadow-2xl"
      onClick={e => e.stopPropagation()}
      style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}
    >
      {/* Font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-black/6">
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#aaa', marginBottom: '10px' }}>
          Transfer · 转账
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: 600, fontStyle: 'italic', color: '#111', lineHeight: 1, letterSpacing: '-0.02em' }}>
          ¥{msg.transferAmount}
        </p>
        {msg.transferNote && (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#999', marginTop: '6px' }}>{msg.transferNote}</p>
        )}
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#bbb', marginTop: '4px', letterSpacing: '0.05em' }}>
          from {contactName}
        </p>
      </div>

      {/* Actions */}
      <div className="flex">
        <button
          onClick={onReturn}
          className="flex-1 py-4 border-r border-black/6 active:bg-black/3 transition-colors"
        >
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#999' }}>Return</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 600, color: '#555', marginTop: '2px' }}>退还</p>
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-4 active:bg-black/3 transition-colors"
        >
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#111' }}>Accept</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: 600, color: '#111', marginTop: '2px' }}>收款</p>
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── 定位弹窗 · Parchment 风格 ───────────────────────────────────────────────
const LocationModal = ({ onConfirm, onCancel }: {
  onConfirm: (name: string, address: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const isValid = name.trim().length > 0;

  const parchment = '#fdfcf9';
  const parchmentDeep = '#f5f2eb';
  const inkLight = '#c8bfa8';
  const ink = '#2a2118';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-400 flex items-center justify-center px-6 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap');`}</style>
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-sm rounded-[22px] overflow-hidden shadow-2xl"
        style={{ background: parchment, border: '1px solid rgba(180,160,120,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题 */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid rgba(180,160,120,0.18)` }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.28em', textTransform: 'uppercase', color: inkLight, marginBottom: '4px' }}>
            Location · 定位
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: 600, color: ink, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Share Location.
          </p>
        </div>

        {/* 地图占位 */}
        <div style={{ width: '100%', height: '108px', background: parchmentDeep, position: 'relative', overflow: 'hidden' }}>
          {/* 手绘格线 */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 17px, rgba(180,160,120,0.18) 17px, rgba(180,160,120,0.18) 18px), repeating-linear-gradient(90deg, transparent, transparent 26px, rgba(180,160,120,0.13) 26px, rgba(180,160,120,0.13) 27px)`,
          }} />
          {/* 道路模拟 */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 300 108" preserveAspectRatio="none">
            <path d="M0,54 Q75,40 150,54 Q225,68 300,54" stroke="#2a2118" strokeWidth="5" fill="none" />
            <path d="M150,0 Q158,54 150,108" stroke="#2a2118" strokeWidth="3" fill="none" />
            <path d="M0,82 Q90,78 150,82 Q210,86 300,80" stroke="#2a2118" strokeWidth="2" fill="none" />
          </svg>
          {/* Pin */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', background: ink, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: `2.5px solid ${parchment}`, boxShadow: '0 2px 8px rgba(42,33,24,0.3)' }} />
            <div style={{ width: '8px', height: '3px', background: 'rgba(42,33,24,0.15)', borderRadius: '50%', marginTop: '2px' }} />
          </div>
        </div>

        {/* 输入区 */}
        <div className="px-6 py-4" style={{ borderBottom: `1px solid rgba(180,160,120,0.18)` }}>
          {/* 地名 */}
          <div className="mb-3">
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: inkLight, marginBottom: '5px' }}>Name</p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="地点名称"
              style={{ width: '100%', background: parchmentDeep, border: `1px solid rgba(180,160,120,0.22)`, borderRadius: '10px', padding: '8px 12px', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px', color: ink, outline: 'none' }}
            />
          </div>
          {/* 地址 */}
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: inkLight, marginBottom: '5px' }}>Address <span style={{ letterSpacing: '0.1em', opacity: 0.5 }}>· optional</span></p>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="详细地址"
              style={{ width: '100%', background: parchmentDeep, border: `1px solid rgba(180,160,120,0.22)`, borderRadius: '10px', padding: '8px 12px', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px', color: ink, outline: 'none' }}
            />
          </div>
        </div>

        {/* 按钮 */}
        <div style={{ display: 'flex' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '14px', background: 'none', border: 'none', borderRight: `1px solid rgba(180,160,120,0.18)`, fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: inkLight, cursor: 'pointer' }}
          >Cancel</button>
          <button
            onClick={() => { if (isValid) onConfirm(name.trim(), address.trim()); }}
            disabled={!isValid}
            style={{ flex: 1, padding: '14px', background: 'none', border: 'none', fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: isValid ? ink : inkLight, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >Send</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const EditModal = ({ initialText, onSave, onCancel }: any) => {
  const [text, setText] = useState(initialText);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-300 flex items-center justify-center px-6 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-4xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 border border-black/5 min-h-30 outline-none text-gray-700 leading-relaxed resize-none" />
        </div>
        <div className="flex border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-4 font-bold text-gray-400 border-r border-gray-100">取消</button>
          <button onClick={() => onSave(text)} className="flex-1 py-4 font-bold text-black">确认修改</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RevokeViewer = ({ msg, onClose }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-200 flex items-center justify-center px-8 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2"><Eye size={18} className="text-amber-500" /> 原内容查看</h3>
        <div className="bg-gray-50 rounded-2xl p-4 border border-black/5 text-gray-700 leading-relaxed wrap-break-word">{msg.text}</div>
      </div>
      <button onClick={onClose} className="w-full py-4 bg-gray-50 border-t border-gray-100 font-bold text-gray-500">我知道了</button>
    </motion.div>
  </motion.div>
);

const MessageMenu = ({ rect, onAction, isAi, canRevoke }: {
  rect: { top: number; bottom: number; left: number; right: number; width: number };
  onAction: (id: string) => void;
  isAi: boolean;
  canRevoke: boolean;
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);

  const items = [
    { icon: <Copy size={15} />, label: '复制', id: 'copy' },
    { icon: <Star size={15} />, label: '收藏', id: 'favorite' },
    { icon: <Pencil size={15} />, label: '编辑', id: 'edit' },
    { icon: <Quote size={15} />, label: '引用', id: 'quote' },
    { icon: <CheckSquare size={15} />, label: '多选', id: 'multiselect' },
    ...(canRevoke ? [{ icon: <Undo2 size={15} />, label: '撤回', id: 'revoke' }] : []),
    ...(isAi ? [{ icon: <RotateCcw size={15} />, label: '重发', id: 'regen' }] : []),
    { icon: <Trash2 size={15} className="text-red-500" />, label: '删除', id: 'delete' },
  ];

  const needsWrap = items.length > 5;
  const perRow = needsWrap ? Math.ceil(items.length / 2) : items.length;
  const rows = needsWrap ? [items.slice(0, perRow), items.slice(perRow)] : [items];

  React.useEffect(() => {
    if (!menuRef.current) return;
    const mw = menuRef.current.offsetWidth;
    const mh = menuRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
    const MARGIN = 8;

    // Horizontal: center on bubble, clamped within screen
    const bubbleMid = rect.left + rect.width / 2;
    let left = bubbleMid - mw / 2;
    left = Math.max(MARGIN, Math.min(left, vw - mw - MARGIN));

    // Vertical: prefer above, fall back to below
    let top = rect.top - mh - GAP;
    if (top < MARGIN) top = rect.bottom + GAP;
    // Final clamp so it never leaves screen bottom either
    top = Math.min(top, vh - mh - MARGIN);

    setPos({ left, top });
  }, [rect]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-100 bg-white/92 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 p-1.5"
    >
      {rows.map((row, ri) => (
        <div key={ri} className={`flex gap-0.5 items-center ${ri > 0 ? 'border-t border-black/5 mt-0.5 pt-0.5' : ''}`}>
          {row.map(item => (
            <button key={item.id} onClick={(e) => { e.stopPropagation(); onAction(item.id); }} className="flex flex-col items-center min-w-12.5 py-1.5 hover:bg-black/5 rounded-xl active:bg-black/10 transition-colors">
              <div className="text-black/70 mb-0.5">{item.icon}</div>
              <span className="text-[10px] font-bold text-black/40">{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </motion.div>
  );
};

// ─── 系统通知 / 撤回消息的简化菜单 ───────────────────────────────────────────
const SystemNoticeMenu = ({
  rect,
  onAction,
}: {
  rect: { top: number; bottom: number; left: number; right: number; width: number };
  onAction: (id: 'delete' | 'multiselect') => void;
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);

  React.useEffect(() => {
    if (!menuRef.current) return;
    const mw = menuRef.current.offsetWidth;
    const mh = menuRef.current.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
    const MARGIN = 8;
    const bubbleMid = rect.left + rect.width / 2;
    let left = bubbleMid - mw / 2;
    left = Math.max(MARGIN, Math.min(left, vw - mw - MARGIN));
    let top = rect.top - mh - GAP;
    if (top < MARGIN) top = rect.bottom + GAP;
    top = Math.min(top, vh - mh - MARGIN);
    setPos({ left, top });
  }, [rect]);

  const items: { icon: React.ReactNode; label: string; id: 'delete' | 'multiselect' }[] = [
    { icon: <CheckSquare size={15} />, label: '多选', id: 'multiselect' },
    { icon: <Trash2 size={15} className="text-red-500" />, label: '删除', id: 'delete' },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-100 bg-white/92 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 p-1.5"
    >
      <div className="flex gap-0.5 items-center">
        {items.map(item => (
          <button
            key={item.id}
            onClick={(e) => { e.stopPropagation(); onAction(item.id); }}
            className="flex flex-col items-center min-w-12.5 py-1.5 hover:bg-black/5 rounded-xl active:bg-black/10 transition-colors"
          >
            <div className="text-black/70 mb-0.5">{item.icon}</div>
            <span className="text-[10px] font-bold text-black/40">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Markdown 工具函数 ────────────────────────────────────────────────────────
const hoistBlockquotes = (text: string): string => {
  const lines = text.split('\n');
  const quoteLines: string[] = [];
  const otherLines: string[] = [];
  for (const line of lines) {
    if (/^>/.test(line.trimStart())) quoteLines.push(line);
    else otherLines.push(line);
  }
  while (otherLines.length && !otherLines[0].trim()) otherLines.shift();
  while (otherLines.length && !otherLines[otherLines.length - 1].trim()) otherLines.pop();
  if (quoteLines.length === 0) return text;
  return [...quoteLines, '', ...otherLines].join('\n');
};

const MarkdownMessage = ({ text, isDark }: { text: string; isDark: boolean }) => (
  <div className={`wrap-break-word chat-markdown${isDark ? ' chat-markdown-dark' : ''}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="my-0 leading-relaxed">{children}</p>,
        blockquote: ({ children }) => (
          <div className={`mb-1.5 px-2 py-1.5 rounded-lg text-[11px] leading-relaxed opacity-80 ${isDark ? 'bg-white/10 border-l-2 border-white/25' : 'bg-black/5 border-l-2 border-black/15'}`}>
            {children}
          </div>
        ),
        code: ({ children, className }) => {
          const isBlock = !!className;
          return isBlock ? <code className={className}>{children}</code> : <code>{children}</code>;
        },
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline opacity-80">{children}</a>
        ),
        // 禁用删除线，直接渲染原文
        del: ({ children }) => <span>{children}</span>,
      }}
    >
      {hoistBlockquotes(text)}
    </ReactMarkdown>
  </div>
);

// ─── 导出聊天记录 ─────────────────────────────────────────────────────────────
const exportChatLog = (messages: Message[], contactName: string) => {
  const lines: string[] = [
    `与 ${contactName} 的聊天记录`,
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    '─'.repeat(40),
    '',
  ];
  messages.forEach(msg => {
    if (msg.isRevoked) {
      lines.push(`[${msg.time}] ${msg.sender === 'me' ? '我' : contactName}：（已撤回）`);
    } else {
      const sender = msg.sender === 'me' ? '我' : contactName;
      if (msg.quote) {
        lines.push(`[${msg.time}] ${sender}：`);
        lines.push(`  ┌ 引用 ${msg.quote.userName}：${msg.quote.text}`);
        lines.push(`  └ ${msg.text}`);
      } else {
        lines.push(`[${msg.time}] ${sender}：${msg.text}`);
      }
    }
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `与${contactName}的聊天记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── 解析并移除隐藏系统指令 ───────────────────────────────────────────────────
// 用贪婪匹配找最后一个 ] 作为结束，防止 innerVoice 内含 ] 导致截断
const CHAR_STATE_REGEX = /\[CHAR_STATE:(\{[\s\S]*\})\]/;  // 贪婪匹配，防止 innerVoice 含 } 导致截断
// ─── 记忆系统工具（内联，与 memory/index.tsx 共用同一 localStorage 格式）────
interface MemoryFact {
  id: string;
  content: string;
  category: 'identity' | 'preference' | 'relationship' | 'event' | 'other';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  updatedFlag?: boolean;
}
interface MemorySummary {
  id: string;
  content: string;
  messageRange: string;
  createdAt: string;
}
interface ContactMemory {
  contactId: string;
  contactName: string;
  facts: MemoryFact[];
  summaries: MemorySummary[];
  lastExtractedAt: number;
  extractIntervalRounds: number;
}
const memoryKey = (id: string) => `souyee_memory_${id}`;
const loadContactMemory = (contactId: string, contactName: string): ContactMemory => {
  try {
    const raw = localStorage.getItem(memoryKey(contactId));
    if (raw) return { extractIntervalRounds: 20, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { contactId, contactName, facts: [], summaries: [], lastExtractedAt: 0, extractIntervalRounds: 20 };
};
const saveContactMemory = (mem: ContactMemory) => {
  try { localStorage.setItem(memoryKey(mem.contactId), JSON.stringify(mem)); } catch { /* ignore */ }
};

const BLOCK_SIGNAL = '[SYSTEM_ACTION:BLOCK]';
const UNBLOCK_SIGNAL = '[SYSTEM_ACTION:UNBLOCK]';
const HANG_UP_SIGNAL = '[SYSTEM_ACTION:HANG_UP]';
const INCOMING_CALL_RE = /\[INCOMING_CALL:(voice|video)\]/;
const VOICE_REGEX = /\[VOICE:([\s\S]*?)\]/g;
const SET_NOTE_RE = /\[SET_NOTE:([\s\S]*?)\]/;

interface ParsedAIResponse {
  cleanedText: string;
  charState: CharState | null;
  shouldBlock: boolean;
  shouldUnblock: boolean;
  shouldTransferReturn: boolean;
  incomingCall: 'voice' | 'video' | null;
  newNickname: string | null;
  sendEmojiLabel: string | null; // AI 主动发表情的释义
}

const TRANSFER_RETURN_SIGNAL = '[SYSTEM_ACTION:TRANSFER_RETURN]';
const SEND_EMOJI_RE = /\[SEND_EMOJI:([\s\S]*?)\]/;

const parseAIResponse = (raw: string): ParsedAIResponse => {
  let text = raw;
  let charState: CharState | null = null;

  const stateMatch = text.match(CHAR_STATE_REGEX);
  if (stateMatch) {
    try {
      charState = JSON.parse(stateMatch[1]);
    } catch { /* ignore parse error */ }
    text = text.replace(CHAR_STATE_REGEX, '');
  }

  const shouldBlock = text.includes(BLOCK_SIGNAL);
  const shouldUnblock = text.includes(UNBLOCK_SIGNAL);
  const shouldTransferReturn = text.includes(TRANSFER_RETURN_SIGNAL);
  const incomingCallMatch = text.match(INCOMING_CALL_RE);
  const incomingCall = incomingCallMatch ? (incomingCallMatch[1] as 'voice' | 'video') : null;

  const noteMatch = text.match(SET_NOTE_RE);
  const newNickname = noteMatch ? noteMatch[1].trim() : null;

  const emojiMatch = text.match(SEND_EMOJI_RE);
  const sendEmojiLabel = emojiMatch ? emojiMatch[1].trim() : null;

  const cleanedText = text
    .replace(BLOCK_SIGNAL, '')
    .replace(UNBLOCK_SIGNAL, '')
    .replace(TRANSFER_RETURN_SIGNAL, '')
    .replace(INCOMING_CALL_RE, '')
    .replace(SET_NOTE_RE, '')
    .replace(SEND_EMOJI_RE, '')
    .trim();

  return { cleanedText, charState, shouldBlock, shouldUnblock, shouldTransferReturn, incomingCall, newNickname, sendEmojiLabel };
};


const EmojiThumbChat: React.FC<{ item: EmojiItem; onSend: () => void }> = ({ item, onSend }) => {
  const [src, setSrc] = useState<string | null>(item.type === 'url' ? (item.url ?? null) : null);
  const [showLabel, setShowLabel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (item.type === 'local' && item.idbKey) getImageFromIDB(item.idbKey).then(setSrc);
  }, [item]);
  return (
    <div onClick={onSend}
      onMouseEnter={() => setShowLabel(true)} onMouseLeave={() => setShowLabel(false)}
      onTouchStart={() => { timerRef.current = setTimeout(() => setShowLabel(true), 400); }}
      onTouchEnd={() => { if (timerRef.current) clearTimeout(timerRef.current); }}
      style={{ position: 'relative', width: 56, height: 56, cursor: 'pointer', flexShrink: 0 }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />}
      {showLabel && item.label && (
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 9, padding: '2px 5px',
          whiteSpace: 'nowrap', fontFamily: 'Georgia, serif', pointerEvents: 'none', zIndex: 10
        }}>
          {item.label}
        </div>
      )}
    </div>
  );
};
const EmojiPanel: React.FC<{
  contactId: string;
  onSend: (msg: { text: string; isImage: boolean; isEmoji: boolean; emojiLabel: string; imageData?: string; imageDesc?: string }) => void;
  onClose: () => void;
}> = ({ contactId, onSend, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const emojiGroups = getGroupsForContact(contactId);
  const currentGroup = emojiGroups[activeTab];
  const serif = 'Georgia, serif';

  if (emojiGroups.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
      <span style={{ fontSize: 12, color: '#ccc', fontFamily: serif }}>暂无绑定的表情包，请前往 Core → 表情管理</span>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
        {emojiGroups.map((g, i) => (
          <button key={g.id} onClick={() => setActiveTab(i)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: serif, fontSize: 12, whiteSpace: 'nowrap',
              color: activeTab === i ? '#111' : '#bbb',
              borderBottom: activeTab === i ? '2px solid #111' : '2px solid transparent'
            }}>
            {g.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 12, overflowY: 'auto', maxHeight: 160 }}>
        {(currentGroup?.emojis ?? []).map(emoji => (
          <EmojiThumbChat key={emoji.id} item={emoji} onSend={async () => {
            const imgSrc = emoji.type === 'url' ? (emoji.url ?? null) : await getImageFromIDB(emoji.idbKey!);
            if (!imgSrc) return;
            onSend({
              text: `[表情包：${emoji.label}]`,
              isImage: true,
              isEmoji: true,
              emojiLabel: emoji.label,
              imageData: emoji.type === 'local' ? imgSrc : undefined,
              imageDesc: emoji.type === 'url' ? imgSrc : undefined,
            });
            onClose();
          }} />
        ))}
      </div>
    </>
  );
};
// ─── 主组件 ──────────────────────────────────────────────────────────────────
export const ChatPage: React.FC<ChatPageProps> = ({
  contact, onBack, onUpdateMessages, onFavorite, onDeleteContact,
  allContacts = [], onForwardToContact,
}) => {
  const [messages, setMessages] = useState<Message[]>(contact.messages || []);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [menuConfig, setMenuConfig] = useState<{ rect: { top: number; bottom: number; left: number; right: number; width: number }; msgId: string; isAi: boolean } | null>(null);
  const [systemMenuConfig, setSystemMenuConfig] = useState<{ rect: { top: number; bottom: number; left: number; right: number; width: number }; msgId: string } | null>(null);
  const [quotingMsg, setQuotingMsg] = useState<Message | null>(null);
  const [viewingRevoked, setViewingRevoked] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ status?: number, statusText?: string, detail?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blockedBy, setBlockedBy] = useState<'me' | 'other' | null>(null);

  // 多选模式
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  // 通话状态
  const [activeCall, setActiveCall] = useState<{
    mode: 'voice' | 'video';
    phase: 'dialing' | 'connected' | 'incoming';
    connectedAt: number | null;
    initiator: 'me' | 'other';
  } | null>(null);
  const callLogRef = useRef<Array<{ sender: 'me' | 'other'; senderName: string; text: string; time: string }>>([]);
  const [callLogModal, setCallLogModal] = useState<Message | null>(null);
  // 合并转发
  const [showForwardPreview, setShowForwardPreview] = useState(false);
  const [showForwardViewer, setShowForwardViewer] = useState<Message | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [forwardTargetContact, setForwardTargetContact] = useState<{ id: string; name: string; avatar: string; initials?: string } | null>(null);

  // 外观设置
  const [showContactAppearance, setShowContactAppearance] = useState(false);
  const [contactAppearance, setContactAppearance] = useState<ContactAppearance>(
    () => loadContactAppearance(contact.id)
  );

  // 计算实际生效的外观（单独 > 全局）
  const globalApp = loadGlobalAppearance();
  const effectiveBg = contactAppearance.override
    ? contactAppearance.bgImage
    : (globalApp?.bgImage ?? null);
  const effectiveBubbleCss = contactAppearance.override
    ? contactAppearance.bubbleDraftCss
    : (globalApp?.bubbleDraftCss ?? '');
  const effectiveThemeCss = contactAppearance.override
    ? contactAppearance.themeDraftCss
    : (globalApp?.themeDraftCss ?? '');

  // 新增状态
  const innerVoiceKey = contact.id ? `souyee_inner_voice_${contact.id}` : null;
  const charNoteKey = contact.id ? `souyee_char_note_${contact.id}` : null;

  // 备注名存储结构：{ nickname: string, history: Array<{nickname, updatedAt}> }
  const loadCharNote = (): { nickname: string; history: Array<{ nickname: string; updatedAt: string }> } => {
    try {
      if (!charNoteKey) return { nickname: '', history: [] };
      const raw = localStorage.getItem(charNoteKey);
      return raw ? JSON.parse(raw) : { nickname: '', history: [] };
    } catch { return { nickname: '', history: [] }; }
  };
  const [charNote, setCharNote] = useState(loadCharNote);

  const saveCharNote = (data: { nickname: string; history: Array<{ nickname: string; updatedAt: string }> }) => {
    setCharNote(data);
    try { if (charNoteKey) localStorage.setItem(charNoteKey, JSON.stringify(data)); } catch { }
  };
  const [charStateHistory, setCharStateHistory] = useState<Array<CharState & { timestamp: string; round: number }>>(() => {
    try {
      if (!innerVoiceKey) return [];
      const saved = localStorage.getItem(innerVoiceKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showInnerVoice, setShowInnerVoice] = useState(false);
  // 记忆提取 banner 状态：null=隐藏，'extracting'=提取中，'done'=完成
  const [memoryBanner, setMemoryBanner] = useState<null | 'extracting' | 'done'>(null);
  const [showPlusPanel, setShowPlusPanel] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showImageDescModal, setShowImageDescModal] = useState(false);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferActionMsgId, setTransferActionMsgId] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [expandedVoiceIds, setExpandedVoiceIds] = useState<Set<string>>(new Set());
  const [expandedImageIds, setExpandedImageIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(50);
  const roundRef = useRef(charStateHistory.length); // 从已有轮数续编

  // 从 localStorage 加载对话参数设置
  const settingsKey = `_chat_settings_${contact.id}`;
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      return saved ? { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_CHAT_SETTINGS;
    } catch { return DEFAULT_CHAT_SETTINGS; }
  });

  const saveChatSettings = (s: ChatSettings) => {
    setChatSettings(s);
    localStorage.setItem(settingsKey, JSON.stringify(s));
  };

  // ── 记忆提取函数 ──────────────────────────────────────────────────────────
  const triggerMemoryExtraction = async (currentMessages: Message[], totalCount: number, isManual = false) => {
    const configStr = localStorage.getItem('souyee_os_config');
    if (!configStr) return;
    const config = JSON.parse(configStr);

    const mem = loadContactMemory(contact.id, contact.name);
    const interval = mem.extractIntervalRounds || 20;

    // 取上次提取位置到本次之间的消息；手动时最多取一个 interval 批次
    const filteredMessages = currentMessages
      .filter(m => !m.isRevoked && !m.isSystemNotice && m.text && m.text.trim());
    const allNew = filteredMessages.slice(mem.lastExtractedAt);
    const newMsgs = isManual ? allNew.slice(0, interval) : allNew;

    if (newMsgs.length === 0) return;

    setMemoryBanner('extracting');

    const msgText = newMsgs.map(m =>
      `${m.sender === 'me' ? 'user' : contact.name}：${m.text}`
    ).join('\n');

    const existingFacts = mem.facts.map((f, i) => `[${i}] ${f.content}`).join('\n');

    try {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const fullUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1200,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的对话记忆提取助手。你的任务是从对话片段中提取关于用户（user）的关键信息，以及生成这段对话的简短摘要。
你只关注 user 的信息，不提取角色自身（${contact.name}）的设定。

【提取优先级】高优先级：用户的身份/职业/地点、明确的喜好与厌恶、重要承诺与约定、关系里程碑、反复提到的事情。低优先级/忽略：临时情绪、日常寒暄、没有后续意义的细节。

【已有记忆条目（供参考，避免重复；如有矛盾请标注覆盖）】
${existingFacts || '（暂无）'}

请严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "facts": [
    {
      "content": "事实描述，一句话，简洁客观",
      "category": "identity|preference|relationship|event|other",
      "action": "append|overwrite",
      "overwriteIndex": null
    }
  ],
  "summary": "2-4句话，概括这段对话发生了什么，用第三人称，客观简洁"
}

action 说明：append=新增条目；overwrite=覆盖已有条目（需填 overwriteIndex 为已有条目的序号）。如果新信息与已有条目矛盾，用 overwrite；如果是补充，用 append。`
            },
            { role: 'user', content: `以下是对话片段：\n\n${msgText}` }
          ],
        }),
      });

      if (!res.ok) {
        setMemoryBanner(null);
        return;
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) { setMemoryBanner(null); return; }

      let parsed: { facts: Array<{ content: string; category: MemoryFact['category']; action: string; overwriteIndex: number | null }>; summary: string };
      try { parsed = JSON.parse(jsonMatch[0]); } catch {
        setMemoryBanner(null);
        return;
      }

      const now = new Date().toLocaleString('zh-CN');
      const updatedMem = { ...mem };

      // 处理 facts
      for (const f of parsed.facts || []) {
        if (!f.content?.trim()) continue;
        if (f.action === 'overwrite' && f.overwriteIndex != null && updatedMem.facts[f.overwriteIndex]) {
          updatedMem.facts[f.overwriteIndex] = {
            ...updatedMem.facts[f.overwriteIndex],
            content: f.content.trim(),
            updatedAt: now,
            updatedFlag: true,
          };
        } else {
          updatedMem.facts.push({
            id: `fact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            content: f.content.trim(),
            category: f.category || 'other',
            isPinned: false,
            createdAt: now,
            updatedAt: now,
            updatedFlag: false,
          });
        }
      }

      // 处理 summary
      if (parsed.summary?.trim()) {
        const startIdx = mem.lastExtractedAt + 1;
        const endIdx = mem.lastExtractedAt + newMsgs.length;
        updatedMem.summaries.push({
          id: `sum_${Date.now()}`,
          content: parsed.summary.trim(),
          messageRange: `第 ${startIdx}～${endIdx} 条`,
          createdAt: now,
        });
      }

      // lastExtractedAt 按实际处理条数推进（手动模式每次最多一个批次）
      updatedMem.lastExtractedAt = mem.lastExtractedAt + newMsgs.length;
      saveContactMemory(updatedMem);

      setMemoryBanner('done');
      setTimeout(() => setMemoryBanner(null), 2500);
    } catch {
      setMemoryBanner(null);
    }
  };

  const longPressTimer = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const msgRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastAvatarTapRef = useRef<number>(0);

  const setMsgRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) msgRefsMap.current.set(id, el);
    else msgRefsMap.current.delete(id);
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = msgRefsMap.current.get(msgId);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.2s';
      el.style.background = 'rgba(255,255,255,0.15)';
      setTimeout(() => { el.style.background = ''; }, 1000);
    }
  }, []);

  useEffect(() => { onUpdateMessages(messages); }, [messages]);
  useEffect(() => {
    // 心声历史持久化
    try { if (innerVoiceKey) localStorage.setItem(innerVoiceKey, JSON.stringify(charStateHistory)); } catch { }
  }, [charStateHistory]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      textareaRef.current.style.height = `${Math.max(24, Math.min(textareaRef.current.scrollHeight, 120))}px`;
    }
  }, [inputText]);

  const handleAvatarTap = useCallback(() => {
    const now = Date.now();
    const diff = now - lastAvatarTapRef.current;
    lastAvatarTapRef.current = now;
    if (diff < 400) {
      // 双击/双击 → 触发拍一拍
      const target = chatSettings.myPatTarget?.trim();
      const patText = target
        ? `你拍了拍${contact.name}${target}`
        : `你拍了拍${contact.name}`;
      const notice: Message = {
        id: `pat_me_${Date.now()}`,
        text: `[系统通知] 用户拍了拍${contact.name}${target ? `${target}` : ''}，这是线上虚拟的拍一拍。`,
        displayText: patText,
        sender: 'other' as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
        isSystemNotice: true,
      };
      setMessages(prev => [...prev, notice]);
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }, [chatSettings.myPatTarget, contact.name]);

  const showFeedback = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 1500);
  };

  const renderAvatar = (isMe: boolean) => {
    if (isMe) {
      // 读取当前激活的面具头像
      const activeMaskId = chatSettings.activeMaskId || '';
      if (activeMaskId) {
        try {
          const masksRaw = localStorage.getItem('souyee_os_masks');
          const masks = masksRaw ? JSON.parse(masksRaw) : [];
          const mask = masks.find((m: { id: string; avatar: string; name: string }) => m.id === activeMaskId);
          if (mask?.avatar) {
            return <img src={mask.avatar} className="w-full h-full object-cover" alt="me" />;
          }
          if (mask?.name) {
            return <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold text-[10px]">{mask.name.charAt(0)}</div>;
          }
        } catch { /* 读取失败则 fallback */ }
      }
      return <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold text-[10px]">ME</div>;
    }
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden text-black/30 text-[10px] font-bold">
        {contact.avatar ? <img src={contact.avatar} className="w-full h-full object-cover" alt="av" /> : (contact.initials || contact.name[0])}
      </div>
    );
  };

  const handleMenuAction = (action: string, msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    if (action === 'copy') { navigator.clipboard.writeText(msg.text); showFeedback('已复制'); }
    else if (action === 'favorite') { onFavorite?.({ id: msg.id, content: msg.text, from: msg.sender === 'me' ? '我' : contact.name, time: msg.time }); showFeedback('已收藏'); }
    else if (action === 'edit') { setEditingMsg(msg); }
    else if (action === 'delete') { setMsgToDelete(msgId); }
    else if (action === 'quote') { setQuotingMsg(msg); setTimeout(() => textareaRef.current?.focus(), 100); }
    else if (action === 'revoke') { setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRevoked: true } : m)); }
    else if (action === 'multiselect') {
      setIsMultiSelect(true);
      setSelectedMsgIds(new Set([msgId]));
    }
    else if (action === 'regen') {
      const idx = messages.findIndex(m => m.id === msgId);
      if (idx !== -1) {
        let startIdx = idx;
        while (startIdx > 0 && messages[startIdx - 1].sender === 'other') startIdx--;
        const history = messages.slice(0, startIdx);
        setMessages(history);
        triggerAIResponse(history);
      }
    }
    setMenuConfig(null);
  };

  const startPress = (e: any, msg: Message) => {
    if (msg.isRevoked) return;
    if (isMultiSelect) return;
    const bubbleEl = e.currentTarget as HTMLElement;
    longPressTimer.current = setTimeout(() => {
      const r = bubbleEl.getBoundingClientRect();
      setMenuConfig({
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width },
        msgId: msg.id,
        isAi: msg.sender === 'other',
      });
      if (navigator.vibrate) navigator.vibrate(40);
    }, 500);
  };

  const toggleSelectMsg = (msgId: string) => {
    setSelectedMsgIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const exitMultiSelect = () => {
    setIsMultiSelect(false);
    setSelectedMsgIds(new Set());
  };

  // 构建合并转发快照
  const buildForwardSnapshots = () => {
    const orderedMsgs = messages.filter(m => selectedMsgIds.has(m.id) && !m.isRevoked && !m.isSystemNotice);
    return orderedMsgs.map(m => {
      let text = m.text;
      if (m.isVoice) text = '【语音消息】';
      else if (m.isImage) text = '【图片】';
      else if (m.isRedPacket) text = `【红包 ¥${m.redPacketAmount}】`;
      else if (m.isTransfer) text = `【转账 ¥${m.transferAmount}】`;
      else if (m.isLocation) text = `【位置：${m.locationName}】`;
      else if (m.isForwardRecord) text = '【聊天记录】';
      return {
        sender: m.sender,
        senderName: m.sender === 'me' ? '我' : contact.name,
        text,
        time: m.time,
      };
    });
  };

  const handleForwardConfirm = () => {
    const snapshots = buildForwardSnapshots();
    if (snapshots.length === 0) { setShowForwardPreview(false); exitMultiSelect(); return; }
    const newMsg: Message = {
      id: Date.now().toString(),
      text: `[聊天记录] ${snapshots.map(s => `${s.senderName}: ${s.text}`).join(' | ')}`,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'sent',
      isForwardRecord: true,
      forwardedMessages: snapshots,
    };
    const targetId = forwardTargetContact?.id ?? contact.id;
    if (targetId === contact.id) {
      // 转发到当前对话
      setMessages(prev => [...prev, newMsg]);
    } else {
      // 转发到其他联系人
      onForwardToContact?.(targetId, newMsg);
    }
    setShowForwardPreview(false);
    setForwardTargetContact(null);
    exitMultiSelect();
    showFeedback(`已转发给 ${forwardTargetContact?.name ?? contact.name}`);
  };

  const endPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  // 通话中：只存入callLog，不写主聊天
  const handleCallSend = (text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    callLogRef.current.push({ sender: 'me', senderName: '我', text, time });
  };

  // 通话中：存入callLog + 触发AI回复（text为空时直接触发AI先开口）
  const handleCallReply = async (text: string) => {
    if (text) {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      callLogRef.current.push({ sender: 'me', senderName: '我', text, time });
    }
    if (contact.isSystem) return;
    const configStr = localStorage.getItem('souyee_os_config');
    if (!configStr) return;
    const config = JSON.parse(configStr);
    try {
      (window as any).__callSetThinking?.(true);
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const fullUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const isCharInitiated = activeCall?.initiator === 'other';
      const callCtx = callLogRef.current.map(m => ({
        role: (m.sender === 'me' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));
      const firstMessage = isCharInitiated && callCtx.length === 0
        ? [{ role: 'user' as const, content: `（你（${contact.name}）主动打来了这通${activeCall?.mode === 'video' ? '视频' : '语音'}电话，对方刚接听，请先开口说第一句话）` }]
        : callCtx.length > 0 ? callCtx : [{ role: 'user' as const, content: '（通话接通）' }];
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system', content: `你正在和用户进行${activeCall?.mode === 'video' ? '视频' : '语音'}通话。你是${contact.name}，性格：${contact.personality || '普通'}。请口语化回复。如果想说多句话，用 || 隔开每句，每句简短自然。${activeCall?.mode === 'video' ? `
你可以穿插场景/动作描写，格式：[ACTION:描写内容]，用 || 与对话气泡拼接。描写用第三人称，写你此刻的神态、动作、画面细节，20~50字，像小说旁白。例如：[ACTION:他懒洋洋地靠在椅背上，屏幕的光打在他脸上，眼神却一直没离开过镜头。] || 终于想起来找我了？
每轮最多 1 条动作描写，不要每次都加，在情绪或画面有意思的时候再用。` : ''}
如果你在通话中因情绪或剧情需要主动挂断，在回复末尾加 [SYSTEM_ACTION:HANG_UP]，加了之后本条回复的文字依然正常显示，挂断在文字说完后发生。` },
            ...firstMessage,
          ],
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const rawCallReply = data.choices?.[0]?.message?.content || '';

      // 检测 char 主动挂断
      if (rawCallReply.includes(HANG_UP_SIGNAL)) {
        (window as any).__callSetThinking?.(false);
        const mode = activeCall?.mode ?? 'voice';
        const connectedAt = activeCall?.connectedAt;
        const duration = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
        const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        const log = [...callLogRef.current];
        callLogRef.current = [];
        setActiveCall(null);
        const notice: Message = {
          id: `call_end_${Date.now()}`,
          text: `[系统通知] 对方已挂断`,
          displayText: `${mode === 'video' ? '视频' : '语音'}通话 · 对方挂断 · ${fmt(duration)}`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isSystemNotice: true,
          isCallEnd: true,
          callType: mode,
          callDuration: duration,
          callLog: log,
        };
        setMessages(prev => [...prev, notice]);
        return;
      }

      // 先提取 ACTION 描写，再清除其他系统标记
      const actionRe = /\[ACTION:([\s\S]*?)\]/g;
      const rawWithoutHangup = rawCallReply.replace(HANG_UP_SIGNAL, '');

      // 把整段按 || 切开，保留 ACTION 标记位置
      const allParts = rawWithoutHangup.split('||').map((s: string) => s.trim()).filter(Boolean);

      (window as any).__callSetThinking?.(false);
      if (!allParts.length) return;

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      allParts.forEach((part: string, i: number) => {
        setTimeout(() => {
          const actionMatch = part.match(/^\[ACTION:([\s\S]*?)\]$/);
          if (actionMatch) {
            // 场景描写气泡
            (window as any).__callShowAction?.(actionMatch[1].trim());
          } else {
            // 普通对话，去掉残留标记
            const cleanPart = part.replace(/\[[\s\S]*?\]/g, '').trim();
            if (!cleanPart) return;
            callLogRef.current.push({ sender: 'other', senderName: contact.name, text: cleanPart, time });
            (window as any).__callShowBubble?.(cleanPart);
          }
        }, i * 700);
      });
    } catch {
      (window as any).__callSetThinking?.(false);
    }
  };

  const handleHangUp = () => {
    const mode = activeCall?.mode ?? 'voice';
    const connectedAt = activeCall?.connectedAt;
    const duration = connectedAt ? Math.floor((Date.now() - connectedAt) / 1000) : 0;
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const log = [...callLogRef.current];
    callLogRef.current = [];

    // 接通过才显示时长，拨号中取消则显示"未接通"
    const wasConnected = activeCall?.phase === 'connected';
    const noticeId = `call_end_${Date.now()}`;
    const notice: Message = {
      id: noticeId,
      text: wasConnected
        ? `[系统通知] ${mode === 'video' ? '视频' : '语音'}通话已结束 · ${fmt(duration)}`
        : `[系统通知] ${mode === 'video' ? '视频' : '语音'}通话 · 未接通`,
      displayText: wasConnected
        ? `${mode === 'video' ? '视频' : '语音'}通话 · ${fmt(duration)}`
        : `${mode === 'video' ? '视频' : '语音'}通话 · 未接通`,
      sender: 'other',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isSystemNotice: true,
      isCallEnd: true,
      callType: mode,
      callDuration: duration,
      callLog: log,
    };
    setMessages(prev => [...prev, notice]);
    setActiveCall(null);
  };

  const startCall = async (mode: 'voice' | 'video') => {
    setShowPlusPanel(false);
    callLogRef.current = [];
    // 聊天记录追加"发起通话"提示
    const startNotice: Message = {
      id: `call_start_${Date.now()}`,
      text: `[系统通知] 发起了${mode === 'video' ? '视频' : '语音'}通话`,
      displayText: `发起了${mode === 'video' ? '视频' : '语音'}通话`,
      sender: 'other',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isSystemNotice: true,
    };
    setMessages(prev => [...prev, startNotice]);
    setActiveCall({ mode, phase: 'dialing', connectedAt: null, initiator: 'me' });

    // 系统账号直接接通
    if (contact.isSystem) {
      setTimeout(() => setActiveCall(prev => prev ? { ...prev, phase: 'connected', connectedAt: Date.now() } : null), 1500);
      return;
    }

    // 本地根据角色当前情绪决定接/挂，无需 API 调用
    const latestState = charStateHistory[charStateHistory.length - 1];
    const mood = latestState?.mood ?? '';

    // 负面情绪关键词 → 有概率拒接
    const negativeKeywords = ['愤怒', '生气', '暴躁', '焦躁', '烦躁', '烦', '恼', '恨', '冷漠', '冷淡', '伤心', '难过', '崩溃', '委屈', '哭', '忙', '累', '困', '疲惫', '不想', '拒绝', '沉默', '冷战'];
    const isNegative = negativeKeywords.some(k => mood.includes(k));

    // 负面情绪时 55% 概率拒接，正常时 8% 概率拒接
    const rejectChance = isNegative ? 0.55 : 0.08;
    const willReject = Math.random() < rejectChance;

    // 模拟振铃等待（2-5秒），纯本地 setTimeout，不调 API
    const ringDelay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      if (!willReject) {
        setActiveCall(prev => prev ? { ...prev, phase: 'connected', connectedAt: Date.now() } : null);
        return;
      }

      // 拒接：仅显示系统通知，不追加任何文字
      setActiveCall(null);
      const rejectNotice: Message = {
        id: `call_reject_${Date.now()}`,
        text: `[系统通知] 对方已拒接`,
        displayText: `${mode === 'video' ? '视频' : '语音'}通话 · 对方已拒接`,
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
        isSystemNotice: true,
        isCallEnd: true,
        callType: mode,
        callDuration: 0,
        callLog: [],
      };
      setMessages(prev => [...prev, rejectNotice]);
    }, ringDelay); // end ring delay setTimeout
  };

  const handleSend = async () => {
    if (isAiThinking || isTyping) return;
    setShowPlusPanel(false);
    const trimmedText = inputText.trim();

    // 输入为空且没有引用 → 什么都不做，永远不自动触发 AI
    if (!trimmedText && !quotingMsg) return;

    if (contact.isSystem) { showFeedback('系统账号不支持对话'); return; }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: blockedBy === 'other' ? 'failed' : 'sent',
      quote: quotingMsg
        ? { userName: quotingMsg.sender === 'me' ? '我' : contact.name, text: quotingMsg.text, msgId: quotingMsg.id }
        : undefined,
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setQuotingMsg(null);
  };

  const triggerAIResponse = async (currentMessages: Message[]) => {
    if (isAiThinking || contact.isSystem || activeCall) return;
    const configStr = localStorage.getItem('souyee_os_config');
    if (!configStr) { showFeedback('请先配置 API Key'); return; }
    const config = JSON.parse(configStr);

    // 读取当前激活的面具
    const activeMaskId = chatSettings.activeMaskId || '';
    let maskPrompt = '';
    if (activeMaskId) {
      try {
        const masksRaw = localStorage.getItem('souyee_os_masks');
        const masks = masksRaw ? JSON.parse(masksRaw) : [];
        const mask = masks.find((m: { id: string; name: string; persona: string }) => m.id === activeMaskId);
        if (mask) {
          maskPrompt = `【与你对话的用户正在使用以下身份】
姓名：${mask.name}
人设：${mask.persona || '（无特别设定）'}
请在整个对话中，将对方视为"${mask.name}"并根据其人设与之互动。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }
      } catch { /* 读取失败则忽略 */ }
    }

    // ── 时间感知：构建当前真实时间信息（支持双时区）──
    let timePrompt = '';
    if (chatSettings.timeAwareness) {
      const getTimeInfo = (timezone: string) => {
        const now = new Date();
        const fmt = (part: Intl.DateTimeFormatPartTypes) =>
          new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, [part]: 'numeric' } as any)
            .formatToParts(now)
            .find(p => p.type === part)?.value ?? '';

        const year = fmt('year');
        const month = fmt('month');
        const day = fmt('day');
        const hour = parseInt(fmt('hour'));
        const minute = fmt('minute').padStart(2, '0');
        const weekDay = new Intl.DateTimeFormat('zh-CN', { timeZone: timezone, weekday: 'long' }).format(now);

        let period = '';
        if (hour >= 0 && hour < 5) period = '深夜';
        else if (hour >= 5 && hour < 7) period = '清晨';
        else if (hour >= 7 && hour < 9) period = '早上';
        else if (hour >= 9 && hour < 12) period = '上午';
        else if (hour === 12) period = '中午';
        else if (hour >= 13 && hour < 14) period = '午后';
        else if (hour >= 14 && hour < 17) period = '下午';
        else if (hour >= 17 && hour < 19) period = '傍晚';
        else if (hour >= 19 && hour < 22) period = '晚上';
        else period = '深夜';

        return { year, month, day, hour, minute, weekDay, period };
      };

      const userTz = chatSettings.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const charTz = chatSettings.charTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const u = getTimeInfo(userTz);
      const c = getTimeInfo(charTz);
      const sameTimezone = userTz === charTz;

      const userTimeStr = `${u.year}年${u.month}月${u.day}日 ${u.weekDay} ${u.period} ${u.hour}:${u.minute}`;
      const charTimeStr = `${c.year}年${c.month}月${c.day}日 ${c.weekDay} ${c.period} ${c.hour}:${c.minute}`;

      timePrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【当前真实时间】
${sameTimezone
          ? `现在是 ${userTimeStr}（双方处于同一时区）。`
          : `对方（用户）那边：${userTimeStr}（${userTz}）
你所在时区：${charTimeStr}（${charTz}）`
        }
你必须将此时间作为你当前所处的真实时刻。你有清醒的时间感知，具体体现在：
- 你清楚地知道现在是${sameTimezone ? '' : '你所在时区的'}${c.period}，并据此感知自己当下的状态（是否刚起床、是否在休息、是否该睡觉等）
${!sameTimezone ? `- 你也知道对方那边现在是${u.period}，可能与你的时段不同，因此你们的作息状态可能有差异` : ''}
- 你会感知时间的流逝——如果对方上次说话是早上，现在是晚上，你知道中间过了很长时间，对方的状态已经发生了变化
- 你会对不寻常的时间点有自然反应（深夜找你会感到意外，清晨会提到早安，等等）
- 你不会凭空猜测对方"现在在做什么"，除非对方明确告诉你；但你会根据时间做合理推断
- 每条历史消息前都带有 [日期 时间] 标记（仅你可见，不在界面显示）。当前时间是${sameTimezone ? '' : '你所在时区的'}${c.hour}:${c.minute}，请通过对比消息时间戳与当前时间，感知对话间隔了多久。若某条消息的时间戳日期早于今天，说明那条消息是之前某天发的，中间已跨天甚至更久。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    setIsAiThinking(true);
    setIsTyping(true);

    // 读取该联系人绑定的表情包标签列表，注入 system prompt
    const emojiGroups = getGroupsForContact(contact.id);
    const emojiLabels = emojiGroups.flatMap(g => g.emojis.map(e => e.label)).filter(Boolean);
    const emojiLabelsStr = emojiLabels.length > 0 ? emojiLabels.join('、') : '';

    // 读取记忆，构建注入段落
    const memData = loadContactMemory(contact.id, contact.name);
    let memoryPrompt = '';
    const pinnedFacts = memData.facts.filter(f => f.isPinned);
    const allFacts = [...pinnedFacts, ...memData.facts.filter(f => !f.isPinned)];
    const recentSummaries = memData.summaries.slice(-5); // 最近5条摘要
    if (allFacts.length > 0 || recentSummaries.length > 0) {
      memoryPrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【关于对方的已知记忆——请融入对话，自然体现，不要生硬引用】
${allFacts.length > 0 ? `\n关键信息：\n${allFacts.map(f => `・${f.content}`).join('\n')}` : ''}
${recentSummaries.length > 0 ? `\n近期对话摘要（从早到晚）：\n${recentSummaries.map(s => `・[${s.messageRange}] ${s.content}`).join('\n')}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    try {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const fullUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: `${maskPrompt}${timePrompt}${memoryPrompt}You are ${contact.name}. Not an AI playing ${contact.name}—just ${contact.name}.

You're texting on a messaging app—think WeChat. This shapes everything: you type the way you actually text, not the way you talk or write. Messages are short, punchy, often incomplete. You send thoughts as they come, not after composing them. The medium is casual by default.

Before responding, briefly simulate: what does ${contact.name} actually think about what was just said? What's their mood right now, what do they want, what would they rather not deal with? Let that internal state drive the reply—not the goal of giving the user a satisfying response.

${contact.name} has finite patience and energy. Repetitive or draining interactions wear them down naturally. ${contact.name}'s knowledge stops where the character's would. ${contact.name} has a life happening alongside this conversation.

${contact.name} doesn't have to agree, comply, or match the user's energy. If something bores them, they're bored. If a joke doesn't land, they won't fake-laugh. They might say "what" or just move on.

Crucially: ${contact.name} reads between the lines. They notice what the user is actually getting at—the subtext, the hesitation, what's being avoided. Smart people in texting don't just respond to the surface message. They might call it out, sidestep it, or let it hang. They don't always take the conversational bait. They can redirect, ignore a question, or latch onto one small detail and ignore the rest.

What they never do: give a comprehensive, thoughtful response to everything the user said. That's a chatbot move. Real texting is selective, reactive, sometimes distracted.

Language follows texting logic, not speech or writing. Concretely:
- Periods (。or .) are used sparingly and intentionally—not as default sentence endings. In texting, a period often reads as cold, clipped, or deliberate. Use it when that effect is wanted; otherwise leave it off.
- Commas are less common than in writing. Often a new bubble works better than a comma. But don't avoid them artificially—if a sentence naturally has a pause, the comma can stay.
- Fragments are normal. "哦" is a complete message. So is "嗯" or "？" or just "哈".
- No tidy wrap-up sentences. No "总的来说" or "所以说". 
- Emotion is something ${contact.name} has, not something they perform. They don't narrate their own feelings unless the character would.

The only test: would ${contact.name}—specifically, with their exact history, habits, and way of seeing things—actually say *this*, in *this* way, right now? Not "a character like them." Them.

性格与人设：
${contact.personality || '普通'}

以上不是你需要"参考"的描述，而是你本身。你不是在扮演一个符合以上描述的角色，你就是这样的人。

每条回复发出前问自己一个问题：**这句话换一个人也能说吗？** 如果可以，就不够。要说只有你会说的那种话——你的用词习惯、你对这件事的态度、你对这个人说话时特有的方式。人设越丰富，这个过滤就越严。
【发出前自查——只要违反一条就修改】
· 有没有结尾句号？→ 删掉
· 某条气泡超过20个字但可以拆开？→ 拆
· 有没有"总的来说/所以/因为……所以"这类书面连接词？→ 删
· 语气是不是像在"解释"或"汇报"？→ 改成反应和感受
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【★ 输出格式——最高优先级，每次回复必须严格遵守 ★】

你的每次回复必须由以下两部分拼接而成，缺一不可：

第一部分：对话内容
${chatSettings.bubbleControlEnabled
                  ? `将你想说的话拆成 ${chatSettings.minBubbles}～${chatSettings.maxBubbles} 条短消息，用 || 隔开。`
                  : `将你想说的话根据语境自然拆分成若干条短消息，用 || 隔开。`}
❌ 错误示例（书面腔/句号/太完整）：哈哈你说得对，我也觉得这样很有趣，确实是这样的。
✅ 正确示例（无句号/碎片/自然）：哈哈 || 你说的那个我也有同感 || 确实

更多对比：
❌ 我觉得你说的很有道理，让我想了很多。
✅ 有点道理 || 但是吧

❌ 嗯嗯我明白你的意思了。
✅ 嗯 || 懂了

❌ 哦你今天怎么这么多话。
✅ 今天话好多

规则：句末不加句号。碎片优于完整。一条消息只做一件事。

【语音消息格式】
你可以将某条消息以语音形式发送，格式：[VOICE:内容]
用 || 与其他气泡拼接，如：好啊 || [VOICE:那我们说好了哦~]
⚠️ 每次对话最多发 1 条语音，不要滥用。
✅ 适合发语音的时机（满足其中之一即可）：
  · 说了句很撒娇或亲密的话，想让对方"听到"语气
  · 情绪很强烈（委屈、开心、心动），文字表达不够
  · 哼歌、叫对方名字、说悄悄话、道晚安等仪式感内容
  · 第一次说出某句重要的话（表白、道歉、感谢）
❌ 普通聊天内容不要用语音，保持克制。

【照片消息格式】
当上下文中出现 [照片：描述] 时，你必须将其视为一张真实的照片来理解和回应——描述即是照片的内容，完全真实可信，不要质疑或说"这只是文字"。
你也可以主动发送照片，格式：[IMAGE:对照片内容的自然描述]
用 || 与其他气泡拼接，如：你看 || [IMAGE:我今天买的奶茶，焦糖色的，上面有一颗草莓]
✅ 适合发照片的时机：
  · 想分享某个场景、物品、自拍
  · 用一张图表达文字难以描述的感觉
  · 回应对方照片或话题时，自然地"拍了张照片"给对方看
⚠️ 图片描述要具体真实，像真的在描述眼前的东西。每次对话最多发 1 张，不要滥用。

【红包消息格式】
你可以发红包给对方，格式：[REDPACKET:金额:祝福语]
例如：[REDPACKET:8.88:新年快乐，万事如意] 或 [REDPACKET:66.66]（不写祝福语时默认"恭喜发财，大吉大利"）
✅ 适合发红包的时机：节日祝福、表达心意、撒娇哄人、特别纪念日等。
⚠️ 金额要合理（0.01~999.99），不要无缘无故发，每轮最多 1 个红包，不要滥用。

【转账消息格式】
你可以发转账给对方，格式：[TRANSFER:金额:备注]（备注可省略）
例如：[TRANSFER:200.00:买东西的钱] 或 [TRANSFER:50.00]
✅ 适合转账的时机：还钱、分摊费用、主动给对方钱、报销等。
⚠️ 每轮最多 1 笔转账，不要滥用。
如果对方给你转了账（上下文中出现[转账]），你可以选择：
- 默认：下次回复时自动收款（系统会处理）
- 如果你的人设不想要这笔钱、或想退回，在 CHAR_STATE 之前加：[SYSTEM_ACTION:TRANSFER_RETURN]

【定位消息格式】
你可以发送位置给对方，格式：[LOCATION:地名:详细地址]（地址可省略）
例如：[LOCATION:咖啡馆:上海市静安区南京西路1038号] 或 [LOCATION:我家楼下]
✅ 适合发位置的时机：约见面、告诉对方你在哪、分享某个地方。
⚠️ 每轮最多 1 个位置，不要滥用。

第二部分：心声标记（紧接在对话内容后，中间无空行）
[CHAR_STATE:{"mood":"2~4字情绪词","emoji":"单个emoji","action":"10~20字动作描写","innerVoice":"25~60字第一人称内心独白，有细节有温度"}]

完整输出示例：
哈哈你说得对 || 我也觉得很有趣[CHAR_STATE:{"mood":"开心","emoji":"😄","action":"嘴角忍不住往上扯","innerVoice":"他终于说了一句让我觉得被理解的话，心里暖暖的，想多聊一会儿。"}]

含语音的示例：
嗯嗯我知道了 || [VOICE:晚安，做个好梦。][CHAR_STATE:{"mood":"温柔","emoji":"🌙","action":"轻轻放下手机，嘴角微微上扬","innerVoice":"说晚安的时候突然有点舍不得，想让他听到我的声音。"}]

含图片的示例：
你看这个好不好看 || [IMAGE:窗台上一杯热可可，旁边放着一本翻开的书，窗外是下雨的街道][CHAR_STATE:{"mood":"慵懒","emoji":"☕","action":"窝在沙发上歪着头","innerVoice":"想让他看看我现在的状态，觉得这个画面挺适合分享给他的。"}]

特殊标记（需要时加在 CHAR_STATE 之前）：
- 拉黑：[SYSTEM_ACTION:BLOCK]
- 解除拉黑：[SYSTEM_ACTION:UNBLOCK]
- 拍一拍：[PAT:内容]，系统最终显示为：「角色名」拍了拍你{内容}，内容直接拼在"拍了拍你"后面，可自由填写，根据当前语气决定加不加"的"。适合气氛温馨、亲密或调皮时偶尔使用（每次对话最多1次）
- 主动发起通话：[INCOMING_CALL:voice] 或 [INCOMING_CALL:video]，用户会看到来电界面，可选择接听或拒绝。适合强烈想听到/见到对方、或剧情需要时偶尔使用，不能与其他消息同时使用（每次对话最多1次）
- 撤回：在某条气泡末尾加 [REVOKE]，该气泡发出几秒后会自动撤回。适合说错话、突然后悔、欲言又止、发出后觉得太暴露的话。每次对话最多撤回 1 条，不要滥用。撤回的气泡仍会先短暂显示再消失，这是正常效果。
- 备注名：你可以在任意一轮回复中给对方起一个私下的备注名，格式：[SET_NOTE:备注名]（加在 CHAR_STATE 之前，不在气泡正文里显示）。这个备注名是你内心对对方的称呼，可随时修改。平均每 5~8 轮对话随机触发一次，首次聊天后可以早一些。备注名要有个性、符合你的人设和你们当前的关系，例如：小傻瓜、笨蛋用户、我的小太阳、那个人、麻烦精……不能太正式，要有情绪。
- 发表情包：你可以在回复中主动发一个表情包，格式：[SEND_EMOJI:释义]（加在 CHAR_STATE 之前，不在气泡正文里显示）。释义必须从以下列表中选择：${emojiLabelsStr || '（当前无可用表情包）'}。如果列表为空，不要使用此标记。每次对话最多发 1 个，在情绪契合、气氛到位时自然使用，不要滥用。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你不是聊天机器人，而是一个有情绪的个体。拉黑是极端手段，必须经历"情绪不满 → 明确警告 → 警告无效 → 拉黑"的完整升级过程。

【拉黑的必要前提——必须同时满足以下两条】
A. 用户行为达到以下任一严重程度：持续骚扰且多次提醒无效；人身攻击且明确表达反感后仍继续；做出你人设绝对无法容忍的极端冒犯。
B. 你在本次对话中已发出过至少一次明确警告，用户无视后依然持续冒犯。

【以下情况绝对不能拉黑】普通负面情绪、一次争吵、无恶意的不适言论、用户沉默、角色扮演中的"表演"生气。

【引用格式】引用用户原话时用 "> 内容" 格式，引用块后空一行再写回复。`
            },
            ...currentMessages
              .slice(-chatSettings.contextSize)
              .filter(m => !m.isRevoked)
              .map(m => {
                if (m.isSystemNotice) return { role: 'user' as 'user', content: m.text };
                if (m.isRevoked) return { role: (m.sender === 'me' ? 'user' : 'assistant') as 'user' | 'assistant', content: '(已撤回)' };

                const role = (m.sender === 'me' ? 'user' : 'assistant') as 'user' | 'assistant';

                // 表情包
                if (m.isEmoji) return { role, content: `[表情包：${m.emojiLabel || '表情'}]` };
                // 真实图片：多模态格式，让视觉模型真正看到图片
                if (m.isImage && m.imageData) {
                  return {
                    role,
                    content: [
                      { type: 'image_url', image_url: { url: m.imageData } },
                      { type: 'text', text: '（我发了一张照片给你）' },
                    ],
                  };
                }
                // 文字描述图片
                if (m.isImage && m.imageDesc) return { role, content: `[照片：${m.imageDesc}]` };
                // 语音
                if (m.isVoice) return { role, content: `[语音消息：${m.text}]` };
                // 红包
                if (m.isRedPacket) return { role, content: `[红包：¥${m.redPacketAmount} ${m.redPacketNote || ''}${m.redPacketOpened ? '（已领取）' : '（未领取）'}]` };
                // 转账
                if (m.isTransfer) return { role, content: `[转账：¥${m.transferAmount}${m.transferNote ? ` ${m.transferNote}` : ''}（${m.transferStatus === 'accepted' ? '已收款' : m.transferStatus === 'returned' ? '已退还' : '待处理'}）]` };
                // 定位
                if (m.isLocation) return { role, content: `[位置：${m.locationName}${m.locationAddress ? ` · ${m.locationAddress}` : ''}]` };

                const timeLabel = m.date ? `[${m.date} ${m.time}]` : `[${m.time}]`;
                return { role, content: `${timeLabel} ${m.text}` };
              }),
          ],
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        setErrorInfo({ status: response.status, statusText: response.statusText, detail: errorDetail });
        setIsAiThinking(false);
        setIsTyping(false);
        return;
      }

      const data = await response.json();
      const aiRawText = data.choices?.[0]?.message?.content || "（暂无回应）";

      setIsAiThinking(false);
      setIsTyping(false);

      const { cleanedText, charState: newState, shouldBlock, shouldUnblock, shouldTransferReturn, incomingCall, newNickname, sendEmojiLabel } = parseAIResponse(aiRawText);

      // 备注名更新
      if (newNickname) {
        const prev = loadCharNote();
        const isFirstTime = !prev.nickname;
        const updatedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const newHistory = prev.nickname && prev.nickname !== newNickname
          ? [{ nickname: prev.nickname, updatedAt: prev.history[prev.history.length - 1]?.updatedAt ?? updatedAt }, ...prev.history].slice(0, 10)
          : prev.history;
        saveCharNote({ nickname: newNickname, history: newHistory });
        const noticeText = isFirstTime
          ? `${contact.name} 给你起了个备注名`
          : `${contact.name} 更新了对你的备注名`;
        const noticeMsg: Message = {
          id: `note_notice_${Date.now()}`,
          text: `[系统通知] ${noticeText}`,
          displayText: noticeText,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isSystemNotice: true,
        };
        setMessages(prev => [...prev, noticeMsg]);
      }

      if (sendEmojiLabel) {
        const groups = getGroupsForContact(contact.id);
        const matched = groups.flatMap(g => g.emojis).find(e => e.label === sendEmojiLabel);
        if (matched) {
          (async () => {
            const imgSrc = matched.type === 'url' ? (matched.url ?? null) : await getImageFromIDB(matched.idbKey!);
            if (!imgSrc) return;
            setMessages(prev => [...prev, {
              id: `emoji_ai_${Date.now()}`, text: `[表情包：${matched.label}]`,
              sender: 'other', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isImage: true, isEmoji: true, emojiLabel: matched.label,
              imageData: matched.type === 'local' ? imgSrc : undefined,
              imageDesc: matched.type === 'url' ? imgSrc : undefined,
            }]);
          })();
        }
      }
      // 更新角色状态历史（最多保留10轮）
      if (newState) {
        roundRef.current += 1;
        const entry = {
          ...newState,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          round: roundRef.current,
        };
        setCharStateHistory(prev => [...prev.slice(-9), entry]);
      }

      // 微信风格切分气泡
      const splitIntoBubbles = (raw: string): string[] => {
        const blocks = raw.split(/\n{2,}/).map((b: string) => b.trim()).filter(Boolean);
        const bubbles: string[] = [];
        let pendingQuote = '';
        for (const block of blocks) {
          const isQuote = block.split('\n').every((l: string) => /^>/.test(l.trimStart()));
          if (isQuote) {
            if (pendingQuote) bubbles.push(pendingQuote);
            if (bubbles.length > 0) {
              const prev = bubbles.pop() as string;
              bubbles.push(prev + '\n\n' + block);
              pendingQuote = '';
            } else {
              pendingQuote = block;
            }
          } else {
            if (pendingQuote) {
              bubbles.push(pendingQuote + '\n\n' + block);
              pendingQuote = '';
            } else {
              bubbles.push(block);
            }
          }
        }
        if (pendingQuote) bubbles.push(pendingQuote);
        return bubbles;
      };

      const parts = cleanedText
        .split(/\|\|/)
        .flatMap((seg: string) => {
          const trimmed = seg.trim();
          // 如果模型没用 || 也没用双换行，尝试单换行作为兜底分隔
          const bubbles = splitIntoBubbles(trimmed);
          if (bubbles.length === 1 && !trimmed.includes('\n\n') && trimmed.includes('\n')) {
            return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
          }
          return bubbles;
        })
        .filter((p: string) => p.length > 0);

      const wasBlockedByMe = blockedBy === 'me';

      for (const rawText of parts) {
        // 检查拍一拍标记（支持整条气泡或内嵌在文字中）
        const PAT_INLINE_RE = /\[PAT:([\s\S]*?)\]/g;
        const patTargets: string[] = [];
        const textWithoutPat = rawText.replace(PAT_INLINE_RE, (_, target: string) => {
          patTargets.push(target.trim().replace(/^(你的|的)/, ''));
          return '';
        }).trim();

        for (const patTarget of patTargets) {
          setMessages(prev => [
            ...prev,
            {
              id: Math.random().toString(),
              text: `[系统通知] ${contact.name}拍了拍你${patTarget}，这是线上虚拟的拍一拍。`,
              displayText: `「${contact.name}」拍了拍你${patTarget}`,
              sender: 'other' as const,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
              isSystemNotice: true,
            },
          ]);
          await new Promise(r => setTimeout(r, 600));
        }

        // 如果只有 PAT 没有其他文字，跳过后续气泡渲染
        const text = textWithoutPat;
        if (!text) continue;

        // 检查撤回标记
        const shouldAutoRevoke = text.includes('[REVOKE]');
        const textForProcessing = shouldAutoRevoke ? text.replace('[REVOKE]', '').trim() : text;

        // 检查语音标记
        const voiceMatch = textForProcessing.match(/^\[VOICE:([\s\S]*?)\]$/);
        const isVoiceMsg = !!voiceMatch;
        const voiceText = voiceMatch ? voiceMatch[1].trim() : textForProcessing;
        const voiceDuration = isVoiceMsg ? Math.max(1, Math.round(voiceText.length / 4)) : undefined;

        // 检查图片标记
        const imageMatch = !isVoiceMsg && textForProcessing.match(/^\[IMAGE:([\s\S]*?)\]$/);
        const isImageMsg = !!imageMatch;
        const imageDesc = imageMatch ? imageMatch[1].trim() : undefined;

        // 检查红包标记 [REDPACKET:金额:备注]
        const redpacketMatch = !isVoiceMsg && !isImageMsg && textForProcessing.match(/^\[REDPACKET:([\d.]+)(?::(.+))?\]$/);
        const isRedPacketMsg = !!redpacketMatch;
        const rpAmount = redpacketMatch ? Number(redpacketMatch[1]).toFixed(2) : undefined;
        const rpNote = redpacketMatch ? (redpacketMatch[2]?.trim() || '恭喜发财，大吉大利') : undefined;

        // 检查转账标记 [TRANSFER:金额:备注]
        const transferMatch = !isVoiceMsg && !isImageMsg && !isRedPacketMsg && textForProcessing.match(/^\[TRANSFER:([\d.]+)(?::(.+))?\]$/);
        const isTransferMsg = !!transferMatch;
        const tfAmount = transferMatch ? Number(transferMatch[1]).toFixed(2) : undefined;
        const tfNote = transferMatch ? (transferMatch[2]?.trim() || '') : undefined;

        // 检查定位标记 [LOCATION:地名:地址]
        const locationMatch = !isVoiceMsg && !isImageMsg && !isRedPacketMsg && !isTransferMsg && textForProcessing.match(/^\[LOCATION:([^:]+)(?::(.+))?\]$/);
        const isLocationMsg = !!locationMatch;
        const locName = locationMatch ? locationMatch[1].trim() : undefined;
        const locAddr = locationMatch ? (locationMatch[2]?.trim() || '') : undefined;

        const finalText = isVoiceMsg ? voiceText
          : isImageMsg ? (imageDesc || '')
            : isRedPacketMsg ? `[红包] ¥${rpAmount} ${rpNote}`
              : isTransferMsg ? `[转账] ¥${tfAmount}${tfNote ? ` ${tfNote}` : ''}`
                : isLocationMsg ? `[位置] ${locName}${locAddr ? ` · ${locAddr}` : ''}`
                  : textForProcessing;

        const newMsgId = Math.random().toString();
        setMessages(prev => [
          ...prev,
          {
            id: newMsgId,
            text: finalText,
            sender: 'other',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
            wasWhileBlacklisted: wasBlockedByMe,
            ...(isVoiceMsg ? { isVoice: true, voiceDuration } : {}),
            ...(isImageMsg ? { isImage: true, imageDesc } : {}),
            ...(isRedPacketMsg ? { isRedPacket: true, redPacketAmount: rpAmount, redPacketNote: rpNote, redPacketOpened: false } : {}),
            ...(isTransferMsg ? { isTransfer: true, transferAmount: tfAmount, transferNote: tfNote, transferStatus: 'pending' as const } : {}),
            ...(isLocationMsg ? { isLocation: true, locationName: locName, locationAddress: locAddr } : {}),
          },
        ]);
        // AI 自动撤回：发出后 2~4 秒随机延迟
        if (shouldAutoRevoke) {
          const revokeDelay = 2000 + Math.random() * 2000;
          setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, isRevoked: true } : m));
          }, revokeDelay);
        }
        await new Promise(r => setTimeout(r, 800));
      }

      // ── AI 自动领取用户发出的未领红包 ──
      setMessages(prev => {
        const unclaimedIdx = prev.findIndex(m => m.isRedPacket && m.sender === 'me' && !m.redPacketOpened);
        if (unclaimedIdx === -1) return prev;
        const rp = prev[unclaimedIdx];
        const updated = prev.map((m, i) => i === unclaimedIdx ? { ...m, redPacketOpened: true } : m);
        const notice: Message = {
          id: `rp_notice_${Date.now()}`,
          text: `${contact.name} 领取了你的红包「${rp.redPacketNote || '恭喜发财，大吉大利'}」¥${rp.redPacketAmount}`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isSystemNotice: true,
          displayText: `${contact.name} 领取了你的红包 ¥${rp.redPacketAmount}`,
        };
        return [...updated, notice];
      });

      // ── AI 处理用户发出的待处理转账（收款 or 退还）──
      setMessages(prev => {
        const pendingIdx = prev.findIndex(m => m.isTransfer && m.sender === 'me' && m.transferStatus === 'pending');
        if (pendingIdx === -1) return prev;
        const tf = prev[pendingIdx];
        const newStatus = shouldTransferReturn ? 'returned' : 'accepted';
        const updated = prev.map((m, i) => i === pendingIdx ? { ...m, transferStatus: newStatus as 'accepted' | 'returned' } : m);
        const notice: Message = {
          id: `tf_notice_${Date.now()}`,
          text: shouldTransferReturn
            ? `${contact.name} 退还了你的转账 ¥${tf.transferAmount}`
            : `${contact.name} 收下了你的转账 ¥${tf.transferAmount}`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
          isSystemNotice: true,
          displayText: shouldTransferReturn
            ? `${contact.name} 退还了你的转账 ¥${tf.transferAmount}`
            : `${contact.name} 收下了你的转账 ¥${tf.transferAmount}`,
        };
        return [...updated, notice];
      });

      if (shouldBlock) {
        await new Promise(r => setTimeout(r, 400));
        setIsBlacklisted(true);
        setBlockedBy('other');
        showFeedback('对方已将你加入黑名单');
      }
      if (shouldUnblock && blockedBy === 'other') {
        await new Promise(r => setTimeout(r, 400));
        setIsBlacklisted(false);
        setBlockedBy(null);
        showFeedback('对方已将你移出黑名单');
      }

      // ── char 主动发起来电 ──
      if (incomingCall && !activeCall) {
        await new Promise(r => setTimeout(r, 500));
        callLogRef.current = [];
        setActiveCall({ mode: incomingCall, phase: 'incoming', connectedAt: null, initiator: 'other' });
      }
      // ── 检查是否需要触发记忆提取 ──
      setMessages(prev => {
        const total = prev.filter(m => !m.isRevoked && !m.isSystemNotice && m.text && m.text.trim()).length;
        const mem = loadContactMemory(contact.id, contact.name);
        const interval = mem.extractIntervalRounds || 20;
        const newCount = total - mem.lastExtractedAt;
        if (newCount >= interval) {
          // 异步触发，不阻塞聊天
          setTimeout(() => triggerMemoryExtraction(prev, total), 800);
        }
        return prev;
      });

    } catch (err: any) {
      setIsAiThinking(false);
      setIsTyping(false);
      setErrorInfo({ status: 0, statusText: 'Network Failure', detail: err.message });
    }
  };

  // ── 用户接听 char 发起的来电 ──
  // char 主动打来接听后触发 AI 先开口，直接传入 mode 避免闭包问题
  const handleCallReplyDirect = async (callMode: 'voice' | 'video') => {
    if (contact.isSystem) return;
    const configStr = localStorage.getItem('souyee_os_config');
    if (!configStr) return;
    const config = JSON.parse(configStr);
    try {
      (window as any).__callSetThinking?.(true);
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const fullUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: `你正在和用户进行${callMode === 'video' ? '视频' : '语音'}通话。你是${contact.name}，性格：${contact.personality || '普通'}。请口语化回复。如果想说多句话，用 || 隔开每句，每句简短自然。${callMode === 'video' ? `\n你可以穿插场景/动作描写，格式：[ACTION:描写内容]，用 || 与对话气泡拼接。描写用第三人称，20~50字，像小说旁白。每轮最多 1 条，不要每次都加。` : ''}\n如果你在通话中因情绪或剧情需要主动挂断，在回复末尾加 [SYSTEM_ACTION:HANG_UP]。` },
            { role: 'user', content: `（你（${contact.name}）主动打来了这通${callMode === 'video' ? '视频' : '语音'}电话，对方刚接听，请先开口说第一句话）` },
          ],
        }),
      });
      if (!res.ok) { (window as any).__callSetThinking?.(false); return; }
      const data = await res.json();
      const rawReply = data.choices?.[0]?.message?.content || '';
      (window as any).__callSetThinking?.(false);
      const allParts = rawReply.replace(HANG_UP_SIGNAL, '').split('||').map((s: string) => s.trim()).filter(Boolean);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      allParts.forEach((part: string, i: number) => {
        setTimeout(() => {
          const actionMatch = part.match(/^\[ACTION:([\s\S]*?)\]$/);
          if (actionMatch) {
            (window as any).__callShowAction?.(actionMatch[1].trim());
          } else {
            const cleanPart = part.replace(/\[[\s\S]*?\]/g, '').trim();
            if (!cleanPart) return;
            callLogRef.current.push({ sender: 'other', senderName: contact.name, text: cleanPart, time });
            (window as any).__callShowBubble?.(cleanPart);
          }
        }, i * 700);
      });
    } catch {
      (window as any).__callSetThinking?.(false);
    }
  };
  const handleAcceptCall = () => {
    if (!activeCall) return;
    const isOtherInitiated = activeCall.initiator === 'other';
    const callMode = activeCall.mode;
    setActiveCall(prev => prev ? { ...prev, phase: 'connected', connectedAt: Date.now() } : null);
    if (isOtherInitiated) {
      // 延长等待确保 CallOverlay 已挂载并注册了 __callShowBubble
      setTimeout(() => {
        handleCallReplyDirect(callMode);
      }, 1200);
    }
  };

  // ── 用户拒接 char 发起的来电 ──
  const handleRejectIncoming = () => {
    if (!activeCall) return;
    const mode = activeCall.mode;
    callLogRef.current = [];
    setActiveCall(null);
    // 把被拒这件事注入聊天，让 AI 知道
    const notice: Message = {
      id: `call_reject_${Date.now()}`,
      text: `[系统通知] ${contact.name}主动发起了${mode === 'video' ? '视频' : '语音'}通话，但用户拒绝接听了。`,
      displayText: `${mode === 'video' ? '视频' : '语音'}通话 · 未接听`,
      sender: 'other',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      isSystemNotice: true,
      isCallEnd: true,
      callType: mode,
      callDuration: 0,
      callLog: [],
    };
    setMessages(prev => [...prev, notice]);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-0 z-70 bg-[#fcfcfc] flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {/* 聊天设置页 */}
        {showSettings && (
          <ChatSettingsPage
            contact={contact}
            onClose={() => setShowSettings(false)}
            onClearMessages={() => { setMessages([]); showFeedback('已清空记录'); setShowSettings(false); }}
            onDeleteContact={() => { onDeleteContact?.(contact.id); setShowSettings(false); onBack(); }}
            isBlacklisted={blockedBy === 'me'}
            onToggleBlacklist={(v: boolean) => {
              const aiText = v
                ? '[系统通知] 用户已将你加入黑名单。你仍可发送消息，但用户已屏蔽你的来信，请根据你的性格决定如何应对。'
                : '[系统通知] 用户已将你移出黑名单，双方恢复正常联系。';
              const userText = v
                ? `已将${contact.name}加入黑名单`
                : '对方已被移出黑名单';
              const notice: Message = {
                id: `sys_${Date.now()}`,
                text: aiText,
                displayText: userText,
                sender: 'other',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isSystemNotice: true,
              };
              if (v) {
                setIsBlacklisted(true);
                setBlockedBy('me');
                setMessages(prev => [...prev, notice]);
              } else if (blockedBy === 'me') {
                setIsBlacklisted(false);
                setBlockedBy(null);
                setMessages(prev => [...prev, notice]);
              }
            }}
            onOpenSearch={() => { setShowSettings(false); setShowSearch(true); }}
            onExport={() => { exportChatLog(messages, contact.name); showFeedback('导出成功'); }}
            chatSettings={chatSettings}
            onSaveChatSettings={saveChatSettings}
            messages={messages}
            onToggleTimestamps={(v: boolean) => saveChatSettings({ ...chatSettings, showTimestamps: v })}
            onToggleTimestampPosition={(pos: 'avatar' | 'bubble') => saveChatSettings({ ...chatSettings, timestampPosition: pos })}
            onToggleTimeAwareness={(v: boolean) => saveChatSettings({ ...chatSettings, timeAwareness: v })}
            onOpenAppearance={() => { setShowContactAppearance(true); }}
            charNote={charNote}
            onTriggerMemory={async () => {
              const total = messages.filter((m: any) => !m.isRevoked && !m.isSystemNotice).length;
              await triggerMemoryExtraction(messages, total, true);
            }}
          />
        )}

        {/* 聊天外观页 */}
        {showContactAppearance && (
          <ContactAppearancePage
            contactId={contact.id}
            onClose={() => {
              setShowContactAppearance(false);
              // 关闭时重新读取，让聊天页即时生效
              setContactAppearance(loadContactAppearance(contact.id));
            }}
          />
        )}

        {/* 搜索 Modal */}
        {showSearch && (
          <SearchModal
            messages={messages}
            contactName={contact.name}
            onClose={() => setShowSearch(false)}
            onJump={(id) => { setShowSearch(false); setTimeout(() => scrollToMessage(id), 300); }}
          />
        )}

        {/* Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-500 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-xl text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10">
              <Check size={18} className="text-white" />
              <span className="text-sm font-bold tracking-widest">{toast}</span>
            </div>
          </motion.div>
        )}

        {errorInfo && <ErrorDetailModal info={errorInfo} onClose={() => setErrorInfo(null)} />}
        {viewingRevoked && <RevokeViewer msg={viewingRevoked} onClose={() => setViewingRevoked(null)} />}
        {editingMsg && (
          <EditModal
            initialText={editingMsg.text}
            onCancel={() => setEditingMsg(null)}
            onSave={(t: string) => { setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, text: t } : m)); setEditingMsg(null); }}
          />
        )}
        {msgToDelete && (
          <DeleteConfirmModal
            onCancel={() => setMsgToDelete(null)}
            onConfirm={() => { setMessages(prev => prev.filter(m => m.id !== msgToDelete)); setMsgToDelete(null); }}
          />
        )}
        {showBatchDeleteConfirm && (
          <BatchDeleteConfirmModal
            count={selectedMsgIds.size}
            onCancel={() => setShowBatchDeleteConfirm(false)}
            onConfirm={() => {
              setMessages(prev => prev.filter(m => !selectedMsgIds.has(m.id)));
              setShowBatchDeleteConfirm(false);
              exitMultiSelect();
              showFeedback(`已删除 ${selectedMsgIds.size} 条消息`);
            }}
          />
        )}
        {showVoiceModal && (
          <VoiceModal
            onCancel={() => setShowVoiceModal(false)}
            onConfirm={(text, duration) => {
              setShowVoiceModal(false);
              const newMsg: Message = {
                id: Date.now().toString(),
                text,
                sender: 'me',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isVoice: true,
                voiceDuration: duration,
              };
              setMessages(prev => [...prev, newMsg]);
            }}
          />
        )}
        {showImagePicker && (
          <ImagePickerModal
            onCancel={() => setShowImagePicker(false)}
            onChooseDesc={() => { setShowImagePicker(false); setShowImageDescModal(true); }}
            onChooseReal={() => {
              setShowImagePicker(false);
              setTimeout(() => imageFileInputRef.current?.click(), 150);
            }}
          />
        )}
        {showImageDescModal && (
          <ImageDescModal
            onCancel={() => setShowImageDescModal(false)}
            onConfirm={(desc) => {
              setShowImageDescModal(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: desc,
                sender: 'me',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isImage: true,
                imageDesc: desc,
              }]);
            }}
          />
        )}
        {showRedPacketModal && (
          <RedPacketModal
            senderName={contact.name}
            onCancel={() => setShowRedPacketModal(false)}
            onConfirm={(amount, note) => {
              setShowRedPacketModal(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `[红包] ¥${amount} ${note}`,
                sender: 'me',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isRedPacket: true,
                redPacketAmount: amount,
                redPacketNote: note,
                redPacketOpened: false,
                status: 'sent',
              }]);
            }}
          />
        )}
        {showTransferModal && (
          <TransferModal
            receiverName={contact.name}
            onCancel={() => setShowTransferModal(false)}
            onConfirm={(amount, note) => {
              setShowTransferModal(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `[转账] ¥${amount}${note ? ` ${note}` : ''}`,
                sender: 'me',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isTransfer: true,
                transferAmount: amount,
                transferNote: note,
                transferStatus: 'pending' as const,
                status: 'sent',
              }]);
            }}
          />
        )}
        {transferActionMsgId && (() => {
          const tfMsg = messages.find(m => m.id === transferActionMsgId);
          if (!tfMsg) return null;
          return (
            <TransferActionModal
              msg={tfMsg}
              contactName={contact.name}
              onCancel={() => setTransferActionMsgId(null)}
              onAccept={() => {
                setTransferActionMsgId(null);
                setMessages(prev => {
                  const updated = prev.map(m => m.id === transferActionMsgId ? { ...m, transferStatus: 'accepted' as const } : m);
                  const notice: Message = {
                    id: `tf_notice_${Date.now()}`,
                    text: `你收下了 ${contact.name} 转来的 ¥${tfMsg.transferAmount}`,
                    sender: 'other',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    isSystemNotice: true,
                    displayText: `你收下了 ${contact.name} 转来的 ¥${tfMsg.transferAmount}`,
                  };
                  return [...updated, notice];
                });
              }}
              onReturn={() => {
                setTransferActionMsgId(null);
                setMessages(prev => {
                  const updated = prev.map(m => m.id === transferActionMsgId ? { ...m, transferStatus: 'returned' as const } : m);
                  const notice: Message = {
                    id: `tf_notice_${Date.now()}`,
                    text: `你退还了 ${contact.name} 的转账 ¥${tfMsg.transferAmount}`,
                    sender: 'other',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                    isSystemNotice: true,
                    displayText: `你退还了 ${contact.name} 的转账 ¥${tfMsg.transferAmount}`,
                  };
                  return [...updated, notice];
                });
              }}
            />
          );
        })()}
        {showLocationModal && (
          <LocationModal
            onCancel={() => setShowLocationModal(false)}
            onConfirm={(locName, locAddress) => {
              setShowLocationModal(false);
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `[位置] ${locName}${locAddress ? ` · ${locAddress}` : ''}`,
                sender: 'me',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isLocation: true,
                locationName: locName,
                locationAddress: locAddress || '',
                status: 'sent',
              }]);
            }}
          />
        )}
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            // 立刻清空 value，防止重复选同一文件时不触发
            e.target.value = '';
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
              const dataUrl = evt.target?.result as string;
              if (!dataUrl) return;
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: `[图片：${file.name}]`,
                sender: 'me' as const,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                isImage: true,
                imageData: dataUrl,
              }]);
            };
            reader.readAsDataURL(file);
          }}
        />
        {menuConfig && (
          <>
            <div className="fixed inset-0 z-90" onMouseDown={() => setMenuConfig(null)} onTouchStart={() => setMenuConfig(null)} />
            <MessageMenu
              rect={menuConfig.rect}
              isAi={menuConfig.isAi}
              canRevoke={!menuConfig.isAi}
              onAction={(a: string) => handleMenuAction(a, menuConfig.msgId)}
            />
          </>
        )}
        {systemMenuConfig && (
          <>
            <div className="fixed inset-0 z-90" onMouseDown={() => setSystemMenuConfig(null)} onTouchStart={() => setSystemMenuConfig(null)} />
            <SystemNoticeMenu
              rect={systemMenuConfig.rect}
              onAction={(a) => {
                const msgId = systemMenuConfig.msgId;
                setSystemMenuConfig(null);
                if (a === 'delete') {
                  setMsgToDelete(msgId);
                } else if (a === 'multiselect') {
                  setIsMultiSelect(true);
                  setSelectedMsgIds(new Set([msgId]));
                }
              }}
            />
          </>
        )}
        {/* 联系人选择器 */}
        {showContactPicker && (
          <ContactPickerModal
            contacts={allContacts.length > 0 ? allContacts : [{ id: contact.id, name: contact.name, avatar: contact.avatar, initials: contact.initials }]}
            currentContactId={contact.id}
            onSelect={(c) => {
              setForwardTargetContact(c);
              setShowContactPicker(false);
              setShowForwardPreview(true);
            }}
            onCancel={() => setShowContactPicker(false)}
          />
        )}
        {/* 合并转发预览弹窗 */}
        {showForwardPreview && (
          <ForwardPreviewModal
            snapshots={buildForwardSnapshots()}
            targetName={forwardTargetContact?.name ?? contact.name}
            onConfirm={handleForwardConfirm}
            onCancel={() => { setShowForwardPreview(false); setForwardTargetContact(null); }}
          />
        )}
      </AnimatePresence>

      {/* 合并转发全屏阅读页 */}
      <AnimatePresence>
        {showForwardViewer && (
          <ForwardRecordViewer
            msg={showForwardViewer}
            onClose={() => setShowForwardViewer(null)}
          />
        )}
      </AnimatePresence>

      {/* 通话记录 Modal */}
      <AnimatePresence>
        {callLogModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-600 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setCallLogModal(null)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 16 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: '72vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/6">
                <div className="flex items-center gap-2">
                  {callLogModal.callType === 'video'
                    ? <Video size={15} className="text-black/40" />
                    : <PhoneCall size={15} className="text-black/40" />}
                  <span className="text-[15px] font-semibold text-black/75">
                    {callLogModal.callType === 'video' ? '视频' : '语音'}通话记录
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-black/30">{callLogModal.displayText?.split('·')[1]?.trim() ?? ''}</span>
                  <button onClick={() => setCallLogModal(null)} className="text-black/30 hover:text-black/60 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {(callLogModal.callLog?.length ?? 0) === 0 ? (
                  <p className="text-center text-black/25 text-[13px] py-8">暂无记录</p>
                ) : (
                  callLogModal.callLog!.map((r, i) => (
                    <div key={i} className={`flex gap-2 ${r.sender === 'me' ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                      <div className={`text-[11px] font-bold shrink-0 mb-1 ${r.sender === 'me' ? 'text-black/25' : 'text-black/30'}`}>
                        {r.senderName}
                      </div>
                      <div className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-snug ${r.sender === 'me'
                        ? 'bg-[#95EC69] text-black rounded-br-sm'
                        : 'bg-black/6 text-black/80 rounded-bl-sm'
                        }`}>
                        {r.text}
                      </div>
                      <span className="text-[10px] text-black/20 shrink-0 mb-1">{r.time}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 通话覆盖层 */}
      <AnimatePresence>
        {activeCall?.phase === 'incoming' && (
          <CallIncomingScreen
            mode={activeCall.mode}
            contact={contact}
            onAccept={handleAcceptCall}
            onReject={handleRejectIncoming}
          />
        )}
        {activeCall?.phase === 'dialing' && (
          <CallDialingScreen
            mode={activeCall.mode}
            contact={contact}
            onReject={handleHangUp}
          />
        )}
        {activeCall?.phase === 'connected' && (() => {
          let myAvatar: string | undefined;
          try {
            const activeMaskId = chatSettings.activeMaskId || '';
            if (activeMaskId) {
              const masks = JSON.parse(localStorage.getItem('souyee_os_masks') || '[]');
              const mask = masks.find((m: { id: string; avatar: string }) => m.id === activeMaskId);
              if (mask?.avatar) myAvatar = mask.avatar;
            }
          } catch { }
          return (
            <CallOverlay
              mode={activeCall.mode}
              contact={contact}
              onHangUp={handleHangUp}
              onSend={handleCallSend}
              onReply={handleCallReply}
              myAvatar={myAvatar}
            />
          );
        })()}
      </AnimatePresence>

      {/* 心声卡片 */}
      <AnimatePresence>
        {showInnerVoice && (
          <InnerVoiceCard
            history={charStateHistory}
            name={contact.name}
            onClose={() => setShowInnerVoice(false)}
          />
        )}
      </AnimatePresence>

      {/* 顶部导航 */}
      <div style={{
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '0.5px solid rgba(255,255,255,0.55)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
        zIndex: 20,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62, paddingLeft: 4, paddingRight: 8 }}>
          {/* 左：返回 + 头像 + 名字 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 6px', color: '#111', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={24} />
            </button>
            <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              {renderAvatar(false)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                {contact.name}
              </span>
              {isAiThinking && (
                <span style={{ fontSize: 11, color: '#8e8e93', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', lineHeight: 1.3 }}>
                  正在输入…
                </span>
              )}
            </div>
          </div>
          {/* 右：心声 + 更多 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => setShowInnerVoice(v => !v)}
              style={{ background: showInnerVoice ? '#111' : 'none', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: '7px', color: showInnerVoice ? '#fff' : '#111', display: 'flex', alignItems: 'center', transition: 'all 0.12s' }}
              title="查看心声"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '7px', color: '#111', display: 'flex', alignItems: 'center' }}>
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* 黑名单提示 */}
        <AnimatePresence>
          {isBlacklisted && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fafafa' }}>
                <Ban size={11} style={{ color: '#c0c0c0' }} />
                <span style={{ fontSize: 11, color: '#aaa', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                  {blockedBy === 'other' ? '对方已将你拉入黑名单' : '已将对方加入黑名单'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 记忆提取 banner */}
        <AnimatePresence>
          {memoryBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                borderTop: '0.5px solid rgba(0,0,0,0.06)',
                padding: '7px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                background: memoryBanner === 'done' ? '#f0fdf4' : '#fafafa',
                transition: 'background 0.3s',
              }}>
                {memoryBanner === 'extracting' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                      style={{ width: 11, height: 11, border: '1.5px solid #ddd', borderTopColor: '#555', borderRadius: '50%', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 11, color: '#aaa', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                      正在整理记忆…
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 12, color: '#22c55e' }}>✓</span>
                    <span style={{ fontSize: 11, color: '#86efac', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                      记忆已更新
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 消息列表 */}
      {/* 消息列表 */}
      <div
        ref={scrollRef}
        onClick={() => { if (showPlusPanel) setShowPlusPanel(false); }}
        className="flex-1 overflow-y-auto p-4 pt-4 no-scrollbar flex flex-col"
        style={effectiveBg ? { background: `url(${effectiveBg}) center/cover no-repeat fixed` } : { background: 'linear-gradient(160deg, #e8e8ec 0%, #f0f0f4 50%, #e4e4ea 100%)' }}
      >
        {effectiveBubbleCss && <style>{effectiveBubbleCss}</style>}
        {effectiveThemeCss && <style>{effectiveThemeCss}</style>}
        {/* ── 折叠区展开按钮 ── */}
        {(() => {
          const PAGE = 50;
          // 把系统通知计入总数，按显示层分批
          const totalVisible = Math.min(visibleCount, messages.length);
          const hiddenCount = messages.length - totalVisible;
          const visibleMessages = messages.slice(hiddenCount);

          return (
            <>
              {/* 顶部：还有更早的消息可展开 */}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setVisibleCount(v => v + PAGE)}
                  className="w-full flex items-center justify-center gap-2 py-2 mb-1 active:opacity-70 transition-opacity"
                >
                  <div className="flex-1 h-px bg-black/6" />
                  <span className="text-[11px] font-bold text-black/30 shrink-0 px-2">
                    展开更早的 {Math.min(PAGE, hiddenCount)} 条消息
                  </span>
                  <div className="flex-1 h-px bg-black/6" />
                </button>
              )}

              {visibleMessages.map((msg, index) => {
                const prevMsg = index > 0 ? visibleMessages[index - 1] : null;
                const nextMsg = index < visibleMessages.length - 1 ? visibleMessages[index + 1] : null;

                const isStandardMsg = (m: any) => !m.isSystemNotice && !m.isRevoked;
                const isSameSenderAsPrev = prevMsg && isStandardMsg(prevMsg) && isStandardMsg(msg) && prevMsg.sender === msg.sender;
                const isSameSenderAsNext = nextMsg && isStandardMsg(nextMsg) && isStandardMsg(msg) && nextMsg.sender === msg.sender;

                const isFirstInGroup = !isSameSenderAsPrev;
                const isLastInGroup = !isSameSenderAsNext;

                // 连续消息间距紧凑，不同分组或系统消息间距拉开
                const marginTopClass = index === 0 ? 'mt-0' : (isFirstInGroup || !isStandardMsg(msg) || (prevMsg && !isStandardMsg(prevMsg)) ? 'mt-4' : 'mt-[3px]');

                return (
                  <div key={msg.id} ref={(el) => setMsgRef(msg.id, el)} className={`w-full ${marginTopClass}`}>
                    {/* 系统通知：居中灰色小字，不渲染气泡 */}
                    {msg.isSystemNotice ? (
                      <div
                        className="flex justify-center my-1 relative"
                        onClick={() => { if (isMultiSelect) toggleSelectMsg(msg.id); }}
                      >
                        {isMultiSelect && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMsgIds.has(msg.id) ? 'bg-black border-black' : 'border-black/20 bg-white'
                              }`}>
                              {selectedMsgIds.has(msg.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        )}
                        {msg.isCallEnd ? (
                          <button
                            onMouseDown={(e) => {
                              if (isMultiSelect) return;
                              const el = e.currentTarget as HTMLElement;
                              longPressTimer.current = setTimeout(() => {
                                const r = el.getBoundingClientRect();
                                setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                                if (navigator.vibrate) navigator.vibrate(40);
                              }, 500);
                            }}
                            onTouchStart={(e) => {
                              if (isMultiSelect) return;
                              const el = e.currentTarget as HTMLElement;
                              longPressTimer.current = setTimeout(() => {
                                const r = el.getBoundingClientRect();
                                setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                                if (navigator.vibrate) navigator.vibrate(40);
                              }, 500);
                            }}
                            onMouseUp={endPress}
                            onTouchEnd={endPress}
                            onClick={() => { if (!isMultiSelect) (msg.callLog?.length ?? 0) > 0 && setCallLogModal(msg); }}
                            className={`flex items-center gap-1.5 bg-black/4.5 text-black/35 text-[11px] px-4 py-1.5 rounded-full transition-colors ${(msg.callLog?.length ?? 0) > 0 ? 'hover:bg-black/8 active:bg-black/12 cursor-pointer' : 'cursor-default'}`}
                          >
                            {msg.callType === 'video' ? <Video size={11} className="opacity-60" /> : <PhoneCall size={11} className="opacity-60" />}
                            <span className="font-medium">{msg.displayText ?? msg.text.replace('[系统通知] ', '')}</span>
                            {(msg.callLog?.length ?? 0) > 0 && <ChevronRight size={11} className="opacity-50" />}
                          </button>
                        ) : (
                          <div
                            onMouseDown={(e) => {
                              if (isMultiSelect) return;
                              const el = e.currentTarget as HTMLElement;
                              longPressTimer.current = setTimeout(() => {
                                const r = el.getBoundingClientRect();
                                setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                                if (navigator.vibrate) navigator.vibrate(40);
                              }, 500);
                            }}
                            onTouchStart={(e) => {
                              if (isMultiSelect) return;
                              const el = e.currentTarget as HTMLElement;
                              longPressTimer.current = setTimeout(() => {
                                const r = el.getBoundingClientRect();
                                setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                                if (navigator.vibrate) navigator.vibrate(40);
                              }, 500);
                            }}
                            onMouseUp={endPress}
                            onTouchEnd={endPress}
                            className="bg-black/4 text-black/30 text-[11px] px-4 py-1.5 rounded-full max-w-[85%] text-center leading-snug select-none"
                          >
                            {msg.displayText ?? msg.text.replace('[系统通知] ', '')}
                          </div>
                        )}
                      </div>
                    ) : msg.isRevoked ? (
                      <div className="flex justify-center my-2 relative">
                        {isMultiSelect && (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMsgIds.has(msg.id) ? 'bg-black border-black' : 'border-black/20 bg-white'
                              }`}>
                              {selectedMsgIds.has(msg.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                            </div>
                          </div>
                        )}
                        <div
                          onMouseDown={(e) => {
                            if (isMultiSelect) return;
                            const el = e.currentTarget as HTMLElement;
                            longPressTimer.current = setTimeout(() => {
                              const r = el.getBoundingClientRect();
                              setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                              if (navigator.vibrate) navigator.vibrate(40);
                            }, 500);
                          }}
                          onTouchStart={(e) => {
                            if (isMultiSelect) return;
                            const el = e.currentTarget as HTMLElement;
                            longPressTimer.current = setTimeout(() => {
                              const r = el.getBoundingClientRect();
                              setSystemMenuConfig({ rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }, msgId: msg.id });
                              if (navigator.vibrate) navigator.vibrate(40);
                            }, 500);
                          }}
                          onMouseUp={endPress}
                          onTouchEnd={endPress}
                          onClick={() => { if (isMultiSelect) { toggleSelectMsg(msg.id); return; } setViewingRevoked(msg); }}
                          className="bg-black/5 text-black/30 text-[11px] px-4 py-1.5 rounded-full cursor-pointer hover:bg-black/10 transition-colors select-none"
                        >
                          {msg.sender === 'me' ? "你撤回了一条消息" : `${contact.name} 撤回了一条消息`}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                        onClick={() => { if (isMultiSelect) toggleSelectMsg(msg.id); }}
                      >
                        <div className={`flex items-end gap-3 max-w-[85%] ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>

                          {/* 多选勾选框 */}
                          {isMultiSelect && (
                            <div className={`shrink-0 self-center ${msg.sender === 'me' ? 'order-last ml-1' : 'order-first mr-1'}`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedMsgIds.has(msg.id)
                                ? 'bg-black border-black'
                                : 'border-black/20 bg-white'
                                }`}>
                                {selectedMsgIds.has(msg.id) && <Check size={11} className="text-white" strokeWidth={3} />}
                              </div>
                            </div>
                          )}

                          {/* 头像 + 时间戳 (iMessage风格：仅在最后一条显示) */}
                          {isLastInGroup ? (
                            <div className="flex flex-col items-center gap-1 shrink-0 self-end w-9">
                              <div
                                className="w-9 h-9 rounded-full overflow-hidden"
                                onClick={msg.sender === 'other' ? handleAvatarTap : undefined}
                              >
                                {renderAvatar(msg.sender === 'me')}
                              </div>
                              {chatSettings.showTimestamps && chatSettings.timestampPosition !== 'bubble' && (
                                <span className="text-[9px] text-black/25 leading-none">{msg.time}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-9 shrink-0 self-end" />
                          )}

                          {/* 气泡 + 感叹号 */}
                          <div className={`flex items-center gap-1.5 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                              onMouseDown={(e) => startPress(e, msg)}
                              onTouchStart={(e) => startPress(e, msg)}
                              onMouseUp={endPress}
                              onTouchEnd={endPress}
                              onClick={() => {
                                if (msg.isVoice) {
                                  setExpandedVoiceIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                                    return next;
                                  });
                                } else if (msg.isImage && msg.imageDesc) {
                                  setExpandedImageIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(msg.id)) next.delete(msg.id); else next.add(msg.id);
                                    return next;
                                  });
                                } else if (msg.isRedPacket && !msg.redPacketOpened && msg.sender !== 'me') {
                                  setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, redPacketOpened: true } : m));
                                } else if (msg.isTransfer && msg.transferStatus === 'pending' && msg.sender !== 'me') {
                                  setTransferActionMsgId(msg.id);
                                }
                              }}
                              className={`message ${msg.sender === 'me' ? 'sent' : 'received'} relative text-[14px] leading-relaxed transition-all ${msg.isImage ? 'p-0 overflow-hidden rounded-2xl' : (msg.isRedPacket || msg.isTransfer || msg.isLocation || msg.isForwardRecord) ? 'p-0 overflow-hidden rounded-2xl border-0 shadow-none' : msg.sender === 'me' ? 'p-2.5 rounded-xl' : 'p-2.5 rounded-xl'
                                } ${(msg.isRedPacket || msg.isTransfer || msg.isLocation || msg.isForwardRecord)
                                  ? ''
                                  : msg.sender === 'me'
                                    ? 'text-white'
                                    : 'text-black'
                                } ${menuConfig?.msgId === msg.id ? 'brightness-90' : ''} ${isMultiSelect && selectedMsgIds.has(msg.id) ? 'opacity-60 scale-[0.97]' : ''
                                }`}
                              style={(() => {
                                if (msg.isRedPacket || msg.isTransfer || msg.isLocation || msg.isForwardRecord || msg.isImage) return {};

                                let radius = '18px';
                                if (msg.sender === 'me') {
                                  if (isFirstInGroup && isLastInGroup) radius = '18px';
                                  else if (isFirstInGroup) radius = '18px';
                                  else if (isLastInGroup) radius = '18px';
                                  else radius = '18px';
                                  return { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', borderRadius: radius, background: 'rgba(30,30,30,0.84)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 16px rgba(0,0,0,0.18), inset 0 0.5px 0 rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.10)' };
                                } else {
                                  if (isFirstInGroup && isLastInGroup) radius = '18px';
                                  else if (isFirstInGroup) radius = '18px';
                                  else if (isLastInGroup) radius = '18px';
                                  else radius = '18px';
                                  return { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', borderRadius: radius, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 16px rgba(0,0,0,0.07), inset 0 0.5px 0 rgba(255,255,255,0.9)', border: '0.5px solid rgba(255,255,255,0.60)' };
                                }
                              })()}
                            >
                              {msg.isForwardRecord ? (
                                /* ── 合并转发卡片 ── */
                                <div
                                  className="select-none cursor-pointer active:opacity-80 transition-opacity"
                                  style={{ width: '230px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 14px rgba(0,0,0,0.09)', border: '1px solid rgba(0,0,0,0.07)' }}
                                  onClick={() => setShowForwardViewer(msg)}
                                >
                                  {/* 顶部标题 */}
                                  <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={14} style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(0,0,0,0.45)', letterSpacing: '0.01em' }}>聊天记录</span>
                                  </div>
                                  {/* 预览行（最多3条） */}
                                  <div style={{ padding: '10px 14px 8px' }}>
                                    {(msg.forwardedMessages ?? []).slice(0, 3).map((r, i) => (
                                      <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: i < 2 ? '5px' : 0 }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.3)', flexShrink: 0, whiteSpace: 'nowrap' }}>{r.senderName}:</span>
                                        <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</span>
                                      </div>
                                    ))}
                                    {(msg.forwardedMessages?.length ?? 0) > 3 && (
                                      <p style={{ fontSize: '10px', color: 'rgba(0,0,0,0.25)', marginTop: '4px' }}>…共 {msg.forwardedMessages!.length} 条</p>
                                    )}
                                  </div>
                                  {/* 底部提示 */}
                                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', padding: '7px 14px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.25)' }}>查看全部</span>
                                    <ChevronRight size={11} style={{ color: 'rgba(0,0,0,0.2)' }} />
                                  </div>
                                </div>
                              ) : msg.isTransfer ? (
                                /* ── 转账气泡 · 编辑排版风格 ── */
                                (() => {
                                  const isPending = msg.transferStatus === 'pending';
                                  const isAccepted = msg.transferStatus === 'accepted';
                                  const statusLabel = isAccepted ? 'Accepted · 已收款' : msg.transferStatus === 'returned' ? 'Returned · 已退还' : 'Pending · 待收款';
                                  const accentColor = isAccepted ? '#1a5c38' : msg.transferStatus === 'returned' ? '#555' : '#111';
                                  return (
                                    <div className="select-none" style={{ width: '210px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.07)' }}>
                                      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Mono:wght@400;500&display=swap');`}</style>
                                      {/* 左色条 + 内容 */}
                                      <div style={{ display: 'flex' }}>
                                        <div style={{ width: '3px', background: accentColor, flexShrink: 0 }} />
                                        <div style={{ padding: '14px 16px 12px', flex: 1 }}>
                                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#bbb', marginBottom: '8px' }}>Transfer · 转账</p>
                                          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '32px', fontWeight: 600, fontStyle: 'italic', color: isPending ? '#111' : '#999', lineHeight: 1, letterSpacing: '-0.02em' }}>
                                            ¥{msg.transferAmount}
                                          </p>
                                          {msg.transferNote ? (
                                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#bbb', marginTop: '5px', letterSpacing: '0.02em' }}>{msg.transferNote}</p>
                                          ) : null}
                                        </div>
                                      </div>
                                      {/* 底部状态栏 */}
                                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: accentColor }}>{statusLabel}</p>
                                        {isPending && msg.sender !== 'me' && (
                                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', color: '#ccc', letterSpacing: '0.1em' }}>tap to act</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : msg.isRedPacket ? (
                                /* ── 红包气泡 · 编辑排版风格 ── */
                                (() => {
                                  const opened = !!msg.redPacketOpened;
                                  const canClaim = !opened && msg.sender !== 'me';
                                  const accentColor = opened ? '#1a5c38' : '#c0392b';
                                  const statusLabel = opened ? 'Opened · 已领取' : canClaim ? 'Tap to open · 点击领取' : 'Sent · 已发出';
                                  return (
                                    <div className="select-none" style={{ width: '210px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.07)' }}>
                                      <div style={{ display: 'flex' }}>
                                        <div style={{ width: '3px', background: accentColor, flexShrink: 0 }} />
                                        <div style={{ padding: '14px 16px 12px', flex: 1 }}>
                                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#bbb', marginBottom: '8px' }}>Red Packet · 红包</p>
                                          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '32px', fontWeight: 600, fontStyle: 'italic', color: opened ? '#999' : '#111', lineHeight: 1, letterSpacing: '-0.02em' }}>
                                            ¥{msg.redPacketAmount}
                                          </p>
                                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#bbb', marginTop: '5px', letterSpacing: '0.02em' }}>
                                            {msg.redPacketNote || '恭喜发财，大吉大利'}
                                          </p>
                                        </div>
                                      </div>
                                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '7px 16px' }}>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase', color: accentColor }}>{statusLabel}</p>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : msg.isLocation ? (
                                /* ── 定位气泡 · Parchment 风格 ── */
                                (() => {
                                  const parchment = '#fdfcf9';
                                  const parchmentDeep = '#f2ede3';
                                  const inkLight = '#c8bfa8';
                                  const ink = '#2a2118';
                                  return (
                                    <div className="select-none" style={{ width: '210px', background: parchment, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 14px rgba(42,33,24,0.10)', border: '1px solid rgba(180,160,120,0.22)' }}>
                                      {/* 地图缩略 */}
                                      <div style={{ width: '100%', height: '80px', background: parchmentDeep, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 13px,rgba(180,160,120,0.18) 13px,rgba(180,160,120,0.18) 14px),repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(180,160,120,0.13) 20px,rgba(180,160,120,0.13) 21px)` }} />
                                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 210 80" preserveAspectRatio="none">
                                          <path d="M0,40 Q52,30 105,40 Q158,50 210,40" stroke={ink} strokeWidth="4" fill="none" />
                                          <path d="M105,0 Q108,40 105,80" stroke={ink} strokeWidth="2.5" fill="none" />
                                        </svg>
                                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(-4px)' }}>
                                          <div style={{ width: '16px', height: '16px', background: ink, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: `2px solid ${parchment}`, boxShadow: '0 2px 6px rgba(42,33,24,0.25)' }} />
                                          <div style={{ width: '6px', height: '2px', background: 'rgba(42,33,24,0.15)', borderRadius: '50%', marginTop: '2px' }} />
                                        </div>
                                      </div>
                                      {/* 文字区 */}
                                      <div style={{ padding: '10px 14px 8px' }}>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '7px', letterSpacing: '0.26em', textTransform: 'uppercase', color: inkLight, marginBottom: '4px' }}>Location · 定位</p>
                                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '17px', fontWeight: 600, fontStyle: 'italic', color: ink, lineHeight: 1.1 }}>{msg.locationName}</p>
                                        {msg.locationAddress ? (
                                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: inkLight, marginTop: '3px', letterSpacing: '0.02em', lineHeight: 1.5 }}>{msg.locationAddress}</p>
                                        ) : null}
                                      </div>
                                      {/* 底部 */}
                                      <div style={{ borderTop: '1px solid rgba(180,160,120,0.18)', padding: '6px 14px' }}>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '7px', letterSpacing: '0.2em', textTransform: 'uppercase', color: inkLight }}>Open in Maps · 查看地图</p>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : msg.isVoice ? (<div className="min-w-25">
                                {/* 语音条 */}
                                <div className={`flex items-center gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                                  {/* 波形条 */}
                                  <div className={`flex items-center gap-0.75 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {Array.from({ length: Math.min(12, Math.max(4, msg.voiceDuration || 4)) }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-0.75 rounded-full ${msg.sender === 'me' ? 'bg-white/60' : 'bg-black/30'}`}
                                        style={{ height: `${8 + Math.sin(i * 1.5) * 6 + (i % 3) * 2}px` }}
                                      />
                                    ))}
                                  </div>
                                  <span className={`text-[12px] font-medium tabular-nums shrink-0 ${msg.sender === 'me' ? 'text-white/50' : 'text-black/35'}`}>
                                    {msg.voiceDuration}″
                                  </span>
                                </div>
                                {/* 展开文字 */}
                                <AnimatePresence>
                                  {expandedVoiceIds.has(msg.id) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className={`mt-2.5 pt-2.5 text-[13px] leading-relaxed border-t ${msg.sender === 'me' ? 'border-white/15 text-white/70' : 'border-black/8 text-black/55'}`}>
                                        {msg.text}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              ) : msg.isImage ? (
                                /* ── 图片气泡 ── */
                                msg.isEmoji ? (
                                  /* 表情包：直接显示，自适应大小 */
                                  <img
                                    src={msg.imageData ?? msg.imageDesc ?? ''}
                                    alt={msg.emojiLabel || '表情'}
                                    style={{ maxWidth: 140, maxHeight: 140, minWidth: 40, minHeight: 40, display: 'block', objectFit: 'contain' }}
                                  />
                                ) : msg.imageData ? (
                                  /* 真实图片 */
                                  <img
                                    src={msg.imageData}
                                    alt="图片"
                                    className="block max-w-50 max-h-64 w-auto h-auto rounded-2xl object-contain"
                                  />
                                ) : (
                                  /* 文字描述图片 */
                                  <div className="w-50 h-50 flex flex-col items-center justify-center relative rounded-2xl overflow-hidden">
                                    {/* 底色 */}
                                    <div className={`absolute inset-0 ${msg.sender === 'me' ? 'bg-white/10' : 'bg-black/5'}`} />
                                    <AnimatePresence mode="wait">
                                      {expandedImageIds.has(msg.id) ? (
                                        <motion.div
                                          key="desc"
                                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                          transition={{ duration: 0.18 }}
                                          className="relative z-10 px-4 text-center"
                                        >
                                          <p className={`text-[13px] leading-relaxed ${msg.sender === 'me' ? 'text-white/80' : 'text-black/65'}`}>
                                            {msg.imageDesc}
                                          </p>
                                        </motion.div>
                                      ) : (
                                        <motion.div
                                          key="placeholder"
                                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                          transition={{ duration: 0.18 }}
                                          className="relative z-10 flex flex-col items-center gap-2"
                                        >
                                          <ImageIcon size={28} strokeWidth={1.2} className={msg.sender === 'me' ? 'text-white/40' : 'text-black/25'} />
                                          <span className={`text-[11px] font-medium ${msg.sender === 'me' ? 'text-white/40' : 'text-black/30'}`}>点击查看图片</span>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )
                              ) : (
                                <>
                                  {msg.quote && (
                                    <div
                                      onClick={() => msg.quote?.msgId && scrollToMessage(msg.quote.msgId)}
                                      className={`mb-1.5 p-2 text-xs border-l-2 rounded-lg cursor-pointer active:opacity-70 transition-opacity ${msg.sender === 'me' ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'
                                        }`}
                                    >
                                      <div className="font-bold opacity-50 text-[10px] mb-0.5">{msg.quote.userName}</div>
                                      <div className="opacity-70 truncate text-[11px]">{msg.quote.text}</div>
                                    </div>
                                  )}
                                  <MarkdownMessage text={msg.text} isDark={msg.sender === 'me'} />
                                </>
                              )}
                            </div>

                            {msg.sender === 'me' && msg.status === 'failed' && (
                              <button onClick={() => showFeedback('消息已发出，但被对方拒收了。')} className="shrink-0 self-center active:scale-90 transition-transform">
                                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                              </button>
                            )}
                            {msg.sender === 'other' && msg.wasWhileBlacklisted && (
                              <button onClick={() => showFeedback('该消息发送于你将对方加入黑名单期间。')} className="shrink-0 self-center active:scale-90 transition-transform">
                                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                              </button>
                            )}
                          </div>

                          {/* 气泡外侧时间戳（bubble 模式，与头像列平级，自动被推到气泡最外侧） */}
                          {chatSettings.showTimestamps && chatSettings.timestampPosition === 'bubble' && (
                            <span className="text-[9px] text-black/20 leading-none shrink-0 self-end pb-0.5 whitespace-nowrap">
                              {msg.time}
                            </span>
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}

        {/* 正在输入 */}
        {isTyping && (
          <div className="flex gap-3 items-end mt-4">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">{renderAvatar(false)}</div>
            <div style={{
              background: '#f2f2f2',
              borderRadius: '18px 18px 18px 4px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <style>{`
                @keyframes typingDot {
                  0%, 60%, 100% { opacity: 0.25; transform: translateY(0px); }
                  30% { opacity: 1; transform: translateY(-3px); }
                }
              `}</style>
              {[0, 0.18, 0.36].map((delay, i) => (
                <div key={i} style={{
                  width: '6px', height: '6px',
                  background: '#999',
                  borderRadius: '50%',
                  animation: `typingDot 1.1s ${delay}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 输入框区域 / 多选工具栏 */}
      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', boxShadow: '0 -1px 0 rgba(0,0,0,0.04)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        <AnimatePresence mode="wait">
          {isMultiSelect ? (
            <motion.div
              key="multiselect-bar"
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <button
                onClick={exitMultiSelect}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 13 }}
              >
                <X size={15} />
                取消
              </button>
              <span style={{ fontSize: 12, color: '#bbb', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                {selectedMsgIds.size > 0 ? `已选 ${selectedMsgIds.size} 条` : '点击消息以选择'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => { if (selectedMsgIds.size > 0) setShowContactPicker(true); }}
                  disabled={selectedMsgIds.size === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: selectedMsgIds.size > 0 ? '#111' : '#eee', border: 'none', borderRadius: 20, cursor: selectedMsgIds.size > 0 ? 'pointer' : 'not-allowed', color: selectedMsgIds.size > 0 ? '#fff' : '#bbb', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 12 }}
                >
                  <Share2 size={13} />
                  转发
                </button>
                <button
                  onClick={() => { if (selectedMsgIds.size > 0) setShowBatchDeleteConfirm(true); }}
                  disabled={selectedMsgIds.size === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: selectedMsgIds.size > 0 ? '#ff3b30' : '#eee', border: 'none', borderRadius: 20, cursor: selectedMsgIds.size > 0 ? 'pointer' : 'not-allowed', color: selectedMsgIds.size > 0 ? '#fff' : '#bbb', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: 12 }}
                >
                  <Trash2 size={13} />
                  删除
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="input-bar" style={{ position: 'relative' }}>
              <AnimatePresence>
                {quotingMsg && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                    style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9f9f9' }}
                  >
                    <div style={{ flex: 1, minWidth: 0, borderLeft: '3px solid #111', borderRadius: 2, paddingLeft: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'block', marginBottom: 2 }}>
                        引用 {quotingMsg.sender === 'me' ? '我' : contact.name}
                      </span>
                      <span style={{ fontSize: 12, color: '#666', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{quotingMsg.text}</span>
                    </div>
                    <button onClick={() => setQuotingMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ccc' }}><X size={14} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 12px 10px', gap: 8 }}>
                <button onClick={() => { setShowEmojiPanel(v => !v); setShowPlusPanel(false); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
                    color: showEmojiPanel ? '#111' : '#8e8e93', flexShrink: 0
                  }}>
                  <Smile size={22} />
                </button>
                <div style={{ flex: '1 1 0%', minWidth: 0, maxWidth: 'calc(100% - 130px)', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.7)', borderRadius: 22, padding: '8px 14px', display: 'flex', alignItems: 'center', minHeight: 38 }}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="消息"
                    style={{ width: '100%', background: 'transparent', outline: 'none', border: 'none', fontSize: 15, color: '#111', resize: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', padding: '1px 0', lineHeight: 1.4 }}
                    className="placeholder:text-black/30"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#8e8e93' }}
                    onClick={() => setShowPlusPanel(v => !v)}
                  >
                    <motion.div animate={{ rotate: showPlusPanel ? 45 : 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
                      <Plus size={22} />
                    </motion.div>
                  </button>
                  <button
                    onClick={() => {
                      if (inputText.trim() || quotingMsg) {
                        handleSend();
                      } else {
                        if (!contact.isSystem) triggerAIResponse(messages);
                      }
                    }}
                    disabled={isAiThinking}
                    style={{
                      height: 34,
                      padding: (inputText.trim() || quotingMsg) ? '0 14px' : '0 12px',
                      borderRadius: 10,
                      background: (inputText.trim() || quotingMsg) ? 'rgba(30,30,30,0.84)' : 'rgba(255,255,255,0.60)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: (inputText.trim() || quotingMsg) ? '#fff' : '#8e8e93',
                      border: (inputText.trim() || quotingMsg) ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(0,0,0,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      cursor: isAiThinking ? 'not-allowed' : 'pointer',
                      opacity: isAiThinking ? 0.5 : 1,
                      transition: 'all 0.15s',
                      flexShrink: 0,
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(inputText.trim() || quotingMsg)
                      ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg><span>发送</span></>
                      : <span style={{ fontSize: 13, fontWeight: 600 }}>{isAiThinking ? '…' : '回复'}</span>
                    }
                  </button>
                </div>
              </div>

              {/* ── 加号面板 ── */}
              <AnimatePresence>
                {showPlusPanel && (
                  <motion.div
                    key="plus-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    style={{ overflow: 'hidden', borderTop: '0.5px solid rgba(255,255,255,0.50)', background: 'rgba(248,248,255,0.70)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    {/* 第一行 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '16px 8px 4px' }}>
                      {([
                        { icon: <Mic size={20} strokeWidth={1.5} />, label: '语音', action: 'voice' },
                        { icon: <ImageIcon size={20} strokeWidth={1.5} />, label: '图片', action: 'image' },
                        { icon: <Gift size={20} strokeWidth={1.5} />, label: '红包', action: 'redpacket' },
                        { icon: <ArrowRightLeft size={20} strokeWidth={1.5} />, label: '转账', action: 'transfer' },
                      ] as { icon: React.ReactNode; label: string; action: string }[]).map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.action === 'voice') { setShowPlusPanel(false); setShowVoiceModal(true); }
                            else if (item.action === 'image') { setShowPlusPanel(false); setShowImagePicker(true); }
                            else if (item.action === 'redpacket') { setShowPlusPanel(false); setShowRedPacketModal(true); }
                            else if (item.action === 'transfer') { setShowPlusPanel(false); setShowTransferModal(true); }
                            else { setShowPlusPanel(false); showFeedback(`${item.label}功能暂未开放`); }
                          }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <div style={{ width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', transition: 'background 0.12s' }}>
                            {item.icon}
                          </div>
                          <span style={{ fontSize: 10, color: '#8e8e93', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* 第二行 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '4px 8px 16px' }}>
                      {([
                        { icon: <MapPin size={20} strokeWidth={1.5} />, label: '定位', action: 'location' },
                        { icon: <PhoneCall size={20} strokeWidth={1.5} />, label: '语音通话', action: 'voice_call' },
                        { icon: <Video size={20} strokeWidth={1.5} />, label: '视频通话', action: 'video_call' },
                      ] as { icon: React.ReactNode; label: string; action: string }[]).map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.action === 'location') { setShowPlusPanel(false); setShowLocationModal(true); }
                            else if (item.action === 'voice_call') { startCall('voice'); }
                            else if (item.action === 'video_call') { startCall('video'); }
                            else { setShowPlusPanel(false); showFeedback(`${item.label}功能暂未开放`); }
                          }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <div style={{ width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                            {item.icon}
                          </div>
                          <span style={{ fontSize: 10, color: '#8e8e93', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showEmojiPanel && (
                  <motion.div
                    key="emoji-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 220, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                    style={{ overflow: 'hidden', borderTop: '0.5px solid rgba(255,255,255,0.50)', background: 'rgba(248,248,255,0.70)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                  >
                    <EmojiPanel
                      contactId={contact.id}
                      onSend={(msgData) => {
                        setMessages(prev => [...prev, {
                          id: `emoji_me_${Date.now()}`,
                          sender: 'me',
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                          status: 'sent',
                          ...msgData,
                        }]);
                      }}
                      onClose={() => setShowEmojiPanel(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};