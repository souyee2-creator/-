import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, RefreshCw, AlertCircle, ChevronDown, Trash2, Download, Upload, AlertTriangle } from 'lucide-react';

interface ApiPreset {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export const SettingsApp: React.FC<{ onClose: () => void; showStatusBar: boolean; onToggleStatusBar: () => void }> = ({ onClose, showStatusBar, onToggleStatusBar }) => {
  const [presets, setPresets] = useState<ApiPreset[]>(() => {
    try {
      const saved = localStorage.getItem('api_presets');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('tmp_baseUrl') || '');
  const [apiKey, setApiKey] = useState(localStorage.getItem('tmp_apiKey') || '');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('tmp_model') || '');
  const [temperature, setTemperature] = useState(Number(localStorage.getItem('tmp_temp')) || 0.7);

  const [isTesting, setIsTesting] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none'; msg: string }>({ type: 'none', msg: '' });

  useEffect(() => {
    localStorage.setItem('tmp_baseUrl', baseUrl);
    localStorage.setItem('tmp_apiKey', apiKey);
    localStorage.setItem('tmp_model', selectedModel);
    localStorage.setItem('tmp_temp', temperature.toString());
  }, [baseUrl, apiKey, selectedModel, temperature]);

  const loadPreset = (p: ApiPreset) => {
    setBaseUrl(p.baseUrl);
    setApiKey(p.apiKey);
    setSelectedModel(p.model);
    setTemperature(p.temperature ?? 0.7);
    setStatus({ type: 'success', msg: `已加载: ${p.name}` });
  };

  const fetchModels = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!baseUrl || !apiKey) {
      setStatus({ type: 'error', msg: '请填写 URL 和 Key' });
      return;
    }
    setIsTesting(true);
    try {
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const response = await fetch(`${cleanUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAvailableModels(data.data.map((m: any) => m.id));
      setShowModelPicker(true);
    } catch {
      setStatus({ type: 'error', msg: '连接失败，已启用保底模型' });
      setAvailableModels(['gpt-4o', 'claude-3.5-sonnet', 'deepseek-chat']);
      setShowModelPicker(true);
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedModel) {
      setStatus({ type: 'error', msg: '请先选择模型' });
      return;
    }
    localStorage.setItem('starry_os_config', JSON.stringify({ baseUrl, apiKey, model: selectedModel, temperature }));
    setStatus({ type: 'success', msg: '配置已保存' });
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newP: ApiPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      baseUrl,
      apiKey,
      model: selectedModel,
      temperature,
    };
    const updated = [...presets, newP];
    setPresets(updated);
    localStorage.setItem('api_presets', JSON.stringify(updated));
    localStorage.setItem('starry_os_config', JSON.stringify(newP));
    setShowNameInput(false);
    setNewPresetName('');
    setStatus({ type: 'success', msg: '方案已存档' });
  };

  const exportBackup = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini-phone-backup-${Date.now()}.json`;
    a.click();
    setStatus({ type: 'success', msg: '备份已导出' });
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string));
          setStatus({ type: 'success', msg: '备份已导入，请刷新页面' });
        } catch {
          setStatus({ type: 'error', msg: '文件格式错误' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAllData = () => {
    localStorage.clear();
    setShowClearConfirm(false);
    setStatus({ type: 'success', msg: '数据已清除，请刷新页面' });
  };

  /* ─── Section Divider ─── */
  const Divider = () => <div className="border-t border-gray-200 my-0" />;

  /* ─── Section Header ─── */
  const SectionHeader = ({ en, zh }: { en: string; zh: string }) => (
    <div className="flex items-baseline gap-3 py-4 px-6">
      <span className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-900">{en}</span>
      <span className="text-xs text-gray-400">{zh}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
      animate={{ scale: 1, opacity: 1, borderRadius: '0' }}
      exit={{ scale: 0.8, opacity: 0, borderRadius: '2rem' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-white flex flex-col text-left overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Status Bar placeholder ── */}
      <div className="h-11 flex items-center justify-between px-6 shrink-0">
        <span className="text-xs font-bold text-gray-900 tabular-nums">
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* ── Nav ── */}
      <div className="px-6 pb-4 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={3} />
          Return
        </button>
      </div>

      {/* ── Title ── */}
      <div className="px-6 pb-6 shrink-0">
        <h1 className="text-[2.6rem] font-black leading-none tracking-tight text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
          Settings<span className="text-gray-900">.</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1 tracking-widest">设置</p>
      </div>

      {/* ── Status Toast ── */}
      <AnimatePresence>
        {status.type !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setStatus({ type: 'none', msg: '' }), 2000)}
            className={`mx-6 mb-3 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 ${
              status.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto border-t border-gray-200">

        {/* DISPLAY */}
        <SectionHeader en="Display" zh="显示" />
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-[11px] font-black tracking-[0.15em] uppercase text-gray-900">Status Bar &nbsp;状态栏</p>
              <p className="text-xs text-gray-400 mt-0.5">显示顶部时间与信号图标</p>
            </div>
            <button
              onClick={onToggleStatusBar}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${showStatusBar ? 'bg-gray-900' : 'bg-gray-200'}`}
            >
              <motion.div
                animate={{ x: showStatusBar ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </button>
          </div>
        </div>

        <Divider />

        {/* PRESETS */}
        <SectionHeader en="Presets" zh="API 预设" />
        <div className="px-6 pb-5">
          {presets.length === 0 ? (
            <p className="text-xs text-gray-400 font-mono">暂无预设，填写配置后可保存为预设</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-transform hover:border-gray-900"
                >
                  <span className="text-xs font-bold text-gray-700">{p.name}</span>
                  <Trash2
                    size={11}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const f = presets.filter((i) => i.id !== p.id);
                      setPresets(f);
                      localStorage.setItem('api_presets', JSON.stringify(f));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* API CONFIG */}
        <SectionHeader en="API Config" zh="接口配置" />
        <div className="px-6 pb-6 space-y-5">

          {/* URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-[0.15em] uppercase text-gray-400 font-mono">API URL</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.anthropic.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-gray-900 transition-colors bg-gray-50"
            />
            <p className="text-[10px] text-gray-400">支持 Anthropic 官方 / OpenAI 兼容站点</p>
          </div>

          {/* Key */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-[0.15em] uppercase text-gray-400 font-mono">API KEY</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-20 text-sm font-mono focus:outline-none focus:border-gray-900 transition-colors bg-gray-50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors uppercase"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black tracking-[0.15em] uppercase text-gray-400 font-mono">Temperature</label>
              <span className="text-xs font-mono font-black text-gray-900">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="2" step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-0.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
            />
            <div className="flex justify-between text-[8px] text-gray-300 font-black uppercase tracking-widest">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Fetch Models */}
          <button
            onClick={fetchModels}
            disabled={isTesting}
            className="w-full bg-gray-900 text-white py-4 rounded-xl text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {isTesting ? <RefreshCw className="animate-spin" size={14} /> : <ChevronDown size={14} />}
            Fetch Models &nbsp;拉取模型
          </button>

          {/* Current model display */}
          {selectedModel && (
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-[9px] font-black tracking-widest uppercase text-gray-400 block mb-1">当前模型</span>
              <span className="text-xs font-mono text-gray-900 font-bold">{selectedModel}</span>
            </div>
          )}

          {/* Save buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={saveConfig}
              className="flex-1 bg-gray-900 text-white py-4 rounded-xl text-[11px] font-black tracking-[0.15em] uppercase active:scale-[0.98] transition-all"
            >
              Save Config &nbsp;保存配置
            </button>
            <button
              onClick={() => {
                if (selectedModel) setShowNameInput(true);
                else setStatus({ type: 'error', msg: '请先拉取并选择模型' });
              }}
              className="flex-1 border-2 border-gray-200 text-gray-600 py-4 rounded-xl text-[11px] font-black tracking-widest uppercase hover:border-gray-900 hover:text-gray-900 transition-all active:scale-[0.98]"
            >
              + Save as Preset &nbsp;存为预设
            </button>
          </div>
        </div>

        <Divider />

        {/* BACKUP */}
        <SectionHeader en="Backup" zh="备份与恢复" />
        <div className="px-6 pb-2 space-y-0">
          <button
            onClick={exportBackup}
            className="w-full flex items-start gap-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors"
          >
            <Download size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-[11px] font-black tracking-[0.15em] uppercase text-gray-900">Export &nbsp;导出备份</p>
              <p className="text-xs text-gray-400 mt-0.5">导出所有数据为 JSON 文件</p>
            </div>
          </button>
          <button
            onClick={importBackup}
            className="w-full flex items-start gap-4 py-4 active:bg-gray-50 transition-colors"
          >
            <Upload size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-[11px] font-black tracking-[0.15em] uppercase text-gray-900">Import &nbsp;导入备份</p>
              <p className="text-xs text-gray-400 mt-0.5">从 JSON 文件恢复，会覆盖当前数据</p>
            </div>
          </button>
        </div>

        <Divider />

        {/* DANGER ZONE */}
        <SectionHeader en="Danger Zone" zh="危险操作" />
        <div className="px-6 pb-10">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-start gap-4 py-4 active:bg-red-50 transition-colors rounded-xl"
          >
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-[11px] font-black tracking-[0.15em] uppercase text-red-500">Clear All Data &nbsp;清除全部数据</p>
              <p className="text-xs text-gray-400 mt-0.5">删除所有聊天记录、角色、设置，不可恢复</p>
            </div>
          </button>
        </div>

      </div>

      {/* ── Home Indicator ── */}
      <div className="h-8 flex items-center justify-center shrink-0 bg-white">
        <div className="w-28 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* ── Model Picker Sheet ── */}
      <AnimatePresence>
        {showModelPicker && (
          <div className="fixed inset-0 z-100 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowModelPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative bg-white rounded-t-3xl px-6 pt-4 pb-10 max-h-[65vh] overflow-y-auto shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <p className="text-[10px] font-black tracking-widest uppercase text-gray-400 mb-4">选择模型</p>
              <div className="space-y-2">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                    className={`w-full py-3.5 px-5 rounded-xl text-left text-sm font-mono font-bold flex justify-between items-center transition-all ${
                      selectedModel === m ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {m}
                    {selectedModel === m && <CheckCircle2 size={15} />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Save Preset Modal ── */}
      <AnimatePresence>
        {showNameInput && (
          <div className="fixed inset-0 z-110 flex items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowNameInput(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full rounded-2xl p-7 space-y-5 shadow-2xl"
            >
              <div>
                <h3 className="font-black text-lg text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>保存预设</h3>
                <p className="text-xs text-gray-400 mt-1">给这个方案起个名字</p>
              </div>
              <input
                autoFocus
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveAsPreset()}
                placeholder="我的私人助理"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowNameInput(false)} className="flex-1 py-3.5 bg-gray-100 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500">
                  取消
                </button>
                <button onClick={saveAsPreset} className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                  确认保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Clear Confirm Modal ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-110 flex items-center justify-center px-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full rounded-2xl p-7 space-y-5 shadow-2xl"
            >
              <div>
                <h3 className="font-black text-lg text-red-500" style={{ fontFamily: 'Georgia, serif' }}>确认清除？</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  将删除所有聊天记录、角色、设置和 API 配置。此操作不可恢复。
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-3.5 bg-gray-100 rounded-xl text-xs font-black uppercase tracking-wider text-gray-600">
                  取消
                </button>
                <button onClick={clearAllData} className="flex-1 py-3.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider">
                  确认清除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};