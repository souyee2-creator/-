import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ImageIcon, RotateCcw, Plus, Trash2,
  Check, ChevronDown, Eye, EyeOff, Save, Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CssPreset {
  id: string;
  name: string;
  css: string;
}

export interface AppearanceSettings {
  bgImage: string | null;
  bubblePresets: CssPreset[];
  activeBubblePresetId: string | null;
  bubbleDraftCss: string;
  themePresets: CssPreset[];
  activeThemePresetId: string | null;
  themeDraftCss: string;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  bgImage: null,
  bubblePresets: [],
  activeBubblePresetId: null,
  bubbleDraftCss: '',
  themePresets: [],
  activeThemePresetId: null,
  themeDraftCss: '',
};

const STORAGE_KEY = 'souyee_appearance_global';

export const loadAppearance = (): AppearanceSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) } : DEFAULT_APPEARANCE;
  } catch { return DEFAULT_APPEARANCE; }
};

export const saveAppearance = (s: AppearanceSettings) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-1 mb-3">
    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-black/25">{children}</span>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[24px] border border-black/[0.04] shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

// ─── Preset Selector ──────────────────────────────────────────────────────────

const PresetSelector = ({
  presets, activeId, onSelect, onDelete,
}: {
  presets: CssPreset[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const active = presets.find(p => p.id === activeId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-black/[0.025] rounded-2xl active:bg-black/[0.05] transition-colors"
      >
        <span className="text-sm font-bold text-black/50 truncate pr-2">
          {active ? active.name : '— 不使用预设 —'}
        </span>
        <ChevronDown
          size={14}
          className={`text-black/25 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-black/[0.06] shadow-2xl z-20 overflow-hidden"
            >
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className="w-full px-4 py-3 flex items-center justify-between text-left active:bg-black/[0.03] transition-colors"
              >
                <span className="text-sm text-black/35 font-bold">— 不使用预设 —</span>
                {activeId === null && <Check size={13} className="text-black/50" />}
              </button>

              {presets.length === 0 && (
                <div className="border-t border-black/[0.03] px-4 py-3 text-[12px] text-black/25 text-center">
                  暂无保存的预设
                </div>
              )}

              {presets.map(p => (
                <div key={p.id} className="border-t border-black/[0.03] flex items-center">
                  <button
                    onClick={() => { onSelect(p.id); setOpen(false); }}
                    className="flex-1 min-w-0 px-4 py-3 flex items-center justify-between gap-2 text-left active:bg-black/[0.03] transition-colors"
                  >
                    <span className="text-sm font-bold text-black/70 truncate">{p.name}</span>
                    {activeId === p.id && <Check size={13} className="text-black/50 flex-shrink-0" />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(p.id); setOpen(false); }}
                    className="pr-4 pl-2 py-3 opacity-40 active:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── CSS Editor Section ───────────────────────────────────────────────────────

const CssEditorSection = ({
  title, desc, placeholder,
  presets, activeId, draftCss,
  onDraftChange, onSelectPreset, onDeletePreset, onSavePreset,
}: {
  title: string;
  desc: string;
  placeholder: string;
  presets: CssPreset[];
  activeId: string | null;
  draftCss: string;
  onDraftChange: (v: string) => void;
  onSelectPreset: (id: string | null) => void;
  onDeletePreset: (id: string) => void;
  onSavePreset: (name: string) => void;
}) => {
  const [saveMode, setSaveMode] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleConfirmSave = () => {
    const name = presetName.trim();
    if (!name) return;
    onSavePreset(name);
    setPresetName('');
    setSaveMode(false);
  };

  return (
    <Card>
      <div className="p-5">
        <div className="mb-4">
          <div className="text-[15px] font-black text-black/80 tracking-tight">{title}</div>
          <div className="text-[11px] text-black/30 mt-0.5 leading-relaxed">{desc}</div>
        </div>

        <div className="mb-3">
          <PresetSelector
            presets={presets}
            activeId={activeId}
            onSelect={onSelectPreset}
            onDelete={onDeletePreset}
          />
        </div>

        <textarea
          value={draftCss}
          onChange={e => onDraftChange(e.target.value)}
          placeholder={placeholder}
          rows={8}
          spellCheck={false}
          className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl px-4 py-3 text-[12px] font-mono text-black/65 outline-none resize-none focus:ring-2 focus:ring-black/[0.08] placeholder:text-black/15 leading-[1.7] transition-shadow"
        />

        <div className="mt-3 min-h-[34px] flex items-center">
          <AnimatePresence mode="wait">
            {saveMode ? (
              <motion.div
                key="naming"
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex gap-2 w-full"
              >
                <input
                  autoFocus
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmSave();
                    if (e.key === 'Escape') { setSaveMode(false); setPresetName(''); }
                  }}
                  placeholder="预设名称..."
                  className="flex-1 bg-black/[0.025] border border-black/[0.05] rounded-xl px-3 py-2 text-[13px] text-black/70 outline-none focus:ring-2 focus:ring-black/[0.08]"
                />
                <button
                  onClick={handleConfirmSave}
                  disabled={!presetName.trim()}
                  className="px-3 py-2 bg-black text-white rounded-xl disabled:opacity-25 active:scale-95 transition-all"
                >
                  <Save size={13} />
                </button>
                <button
                  onClick={() => { setSaveMode(false); setPresetName(''); }}
                  className="px-3 py-2 bg-black/[0.04] text-black/40 rounded-xl active:scale-95 transition-all text-[13px] font-bold"
                >
                  ✕
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="save-trigger"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { if (draftCss.trim()) setSaveMode(true); }}
                disabled={!draftCss.trim()}
                className="flex items-center gap-1.5 text-[12px] font-bold text-black/30 disabled:opacity-30 active:text-black/60 transition-colors"
              >
                <Plus size={13} />
                保存为预设
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};

// ─── Live Preview ─────────────────────────────────────────────────────────────

const LivePreview = ({ bgImage, bubbleCss, themeCss }: {
  bgImage: string | null;
  bubbleCss: string;
  themeCss: string;
}) => {
  const [visible, setVisible] = useState(true);

  const scopedBubbleCss = bubbleCss
    .replace(/\.message\.sent/g, '.ap-preview .ap-sent')
    .replace(/\.message\.received/g, '.ap-preview .ap-recv')
    .replace(/\.message\.recv/g, '.ap-preview .ap-recv');

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[15px] font-black text-black/80 tracking-tight">实时预览</div>
            <div className="text-[11px] text-black/30 mt-0.5">CSS 变更即时生效</div>
          </div>
          <button
            onClick={() => setVisible(v => !v)}
            className="p-2 rounded-xl bg-black/[0.03] active:bg-black/[0.06] transition-colors"
          >
            {visible
              ? <EyeOff size={14} className="text-black/35" />
              : <Eye size={14} className="text-black/35" />
            }
          </button>
        </div>

        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <style>{`
                .ap-preview .ap-sent { background: black; color: white; }
                .ap-preview .ap-recv { background: white; color: black; border: 1px solid rgba(0,0,0,0.08); }
                .ap-preview .ap-theme-btn { background: black; color: white; }
                ${scopedBubbleCss}
                ${themeCss}
              `}</style>

              <div
                className="ap-preview rounded-2xl overflow-hidden border border-black/[0.04]"
                style={{
                  background: bgImage
                    ? `url(${bgImage}) center/cover no-repeat`
                    : '#F4F4F4',
                  minHeight: 176,
                }}
              >
                <div className="p-4 space-y-2.5">
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gray-300 flex-shrink-0" />
                    <div className="ap-recv px-3 py-2 rounded-2xl rounded-tl-none text-[13px] max-w-[65%] leading-snug">
                      这是收到的消息。
                    </div>
                  </div>
                  <div className="flex items-end gap-2 flex-row-reverse">
                    <div className="w-7 h-7 rounded-xl bg-black flex-shrink-0" />
                    <div className="ap-sent px-3 py-2 rounded-2xl rounded-tr-none text-[13px] max-w-[65%] leading-snug">
                      这是发送的消息。
                    </div>
                  </div>
                  <div className="flex justify-center pt-1">
                    <div className="ap-theme-btn px-4 py-1.5 rounded-xl text-[12px] font-bold">
                      主题色按钮
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

// ─── AppearancePage ───────────────────────────────────────────────────────────

interface AppearancePageProps {
  onBack: () => void;
}

export const AppearancePage: React.FC<AppearancePageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(loadAppearance);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((patch: Partial<AppearanceSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveAppearance(next);
      return next;
    });
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => update({ bgImage: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApply = () => {
    saveAppearance(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FBFBFB] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex-shrink-0 border-b border-black/[0.03]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-2xl active:bg-black/[0.04] transition-colors"
          >
            <ChevronLeft size={22} className="text-black/50" strokeWidth={2} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[19px] font-black tracking-tighter text-black/80">界面外观</h2>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/20 mt-0.5">
              APPEARANCE / GLOBAL
            </p>
          </div>
          <motion.button
            onClick={handleApply}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[13px] font-bold rounded-2xl active:opacity-75 transition-all"
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <Check size={13} strokeWidth={2.5} /> 已保存
                </motion.span>
              ) : (
                <motion.span
                  key="apply"
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <Sparkles size={13} /> 应用
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">

        {/* 实时预览 */}
        <LivePreview
          bgImage={settings.bgImage}
          bubbleCss={settings.bubbleDraftCss}
          themeCss={settings.themeDraftCss}
        />

        {/* 聊天背景 */}
        <div>
          <SectionLabel>聊天背景</SectionLabel>
          <Card>
            <div className="p-5 space-y-3">
              <p className="text-[11px] text-black/30 leading-relaxed">
                上传图片作为所有聊天的默认背景。在单个聊天详情页可单独覆盖。
              </p>
              {settings.bgImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-20 rounded-2xl border border-black/[0.05] overflow-hidden"
                  style={{ background: `url(${settings.bgImage}) center/cover no-repeat` }}
                />
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white text-[13px] font-bold rounded-2xl active:opacity-75 transition-opacity"
                >
                  <ImageIcon size={14} />
                  {settings.bgImage ? '更换图片' : '上传图片'}
                </button>
                {settings.bgImage && (
                  <button
                    onClick={() => update({ bgImage: null })}
                    className="flex items-center justify-center px-4 py-3 bg-black/[0.04] text-black/45 rounded-2xl active:bg-black/[0.08] transition-colors"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            </div>
          </Card>
        </div>

        {/* 气泡 CSS */}
        <div>
          <SectionLabel>气泡样式 CSS</SectionLabel>
          <CssEditorSection
            title="气泡 CSS"
            desc="自定义消息气泡的颜色、圆角、内边距等。选择器：.message.sent / .message.received"
            placeholder={`.message.sent {\n  background: #1a1a1a !important;\n  color: #fff !important;\n  border-radius: 18px !important;\n}\n.message.received {\n  background: #f5f5f5 !important;\n  color: #000 !important;\n}`}
            presets={settings.bubblePresets}
            activeId={settings.activeBubblePresetId}
            draftCss={settings.bubbleDraftCss}
            onDraftChange={v => update({ bubbleDraftCss: v, activeBubblePresetId: null })}
            onSelectPreset={id => {
              const p = settings.bubblePresets.find(p => p.id === id);
              update({ activeBubblePresetId: id, bubbleDraftCss: p?.css ?? '' });
            }}
            onDeletePreset={id => update({
              bubblePresets: settings.bubblePresets.filter(p => p.id !== id),
              activeBubblePresetId: settings.activeBubblePresetId === id ? null : settings.activeBubblePresetId,
            })}
            onSavePreset={name => {
              const np: CssPreset = { id: Date.now().toString(), name, css: settings.bubbleDraftCss };
              update({ bubblePresets: [...settings.bubblePresets, np], activeBubblePresetId: np.id });
            }}
          />
        </div>

        {/* 主题 CSS */}
        <div>
          <SectionLabel>全局主题 CSS</SectionLabel>
          <CssEditorSection
            title="主题 CSS"
            desc="覆盖整体主题：CSS 变量、字体、背景色、间距等全局样式。"
            placeholder={`:root {\n  --theme-primary: #000;\n  --theme-bg: #fafafa;\n}\n/* 支持任意全局 CSS */`}
            presets={settings.themePresets}
            activeId={settings.activeThemePresetId}
            draftCss={settings.themeDraftCss}
            onDraftChange={v => update({ themeDraftCss: v, activeThemePresetId: null })}
            onSelectPreset={id => {
              const p = settings.themePresets.find(p => p.id === id);
              update({ activeThemePresetId: id, themeDraftCss: p?.css ?? '' });
            }}
            onDeletePreset={id => update({
              themePresets: settings.themePresets.filter(p => p.id !== id),
              activeThemePresetId: settings.activeThemePresetId === id ? null : settings.activeThemePresetId,
            })}
            onSavePreset={name => {
              const np: CssPreset = { id: Date.now().toString(), name, css: settings.themeDraftCss };
              update({ themePresets: [...settings.themePresets, np], activeThemePresetId: np.id });
            }}
          />
        </div>

        <p className="px-1 pb-2 text-[10px] font-bold text-black/18 leading-relaxed">
          以上为全局默认外观。在聊天详情 → 个性化中可为单个联系人单独覆盖。
        </p>

      </div>
    </div>
  );
};