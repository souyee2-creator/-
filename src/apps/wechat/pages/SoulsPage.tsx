import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICharacter } from '../types';

interface SoulsPageProps {
  characters: AICharacter[];
  onAddCharacter: (char: AICharacter) => void;
  onUpdateCharacter: (char: AICharacter) => void;
  onDeleteCharacter: (id: string) => void;
}

/* ── Design Tokens (aligned with index.tsx) ── */
const T = {
  paper:      '#f5f4f1',
  ink:        '#111110',
  inkFaint:   '#8a8984',
  inkGhost:   '#c4c3c0',
  surface:    '#ffffff',
  line:       'rgba(17,17,16,0.10)',
  lineStrong: 'rgba(17,17,16,0.20)',
  error:      '#c0392b',

  serif: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  mono:  '"DM Mono", "JetBrains Mono", "SF Mono", monospace',
  sans:  '"Helvetica Neue", "Helvetica", Arial, sans-serif',

  ease: [0.22, 1, 0.36, 1] as const,
};

const inputBase: React.CSSProperties = {
  fontFamily: T.sans,
  fontSize: 14,
  fontWeight: 400,
  letterSpacing: '0.01em',
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: `0.5px solid ${T.lineStrong}`,
  outline: 'none',
  color: T.ink,
  padding: '10px 0',
  transition: 'border-color 0.2s',
};

const labelBase: React.CSSProperties = {
  fontFamily: T.mono,
  fontSize: 9,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: T.inkGhost,
  display: 'block',
  marginBottom: 2,
};

/* ── Hairline Rule ── */
const Rule = () => (
  <div style={{ height: '0.5px', background: T.line, flexShrink: 0 }} />
);

export const SoulsPage: React.FC<SoulsPageProps> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
}) => {
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingChar, setEditingChar]           = useState<AICharacter | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<AICharacter>>({
    avatar: '', realName: '', remark: '', personality: '',
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
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.realName?.trim() || !formData.personality?.trim()) return;
    if (editingChar) {
      onUpdateCharacter({ ...editingChar, ...formData } as AICharacter);
    } else {
      onAddCharacter({
        id: Date.now().toString(),
        createdAt: Date.now(),
        ...formData,
      } as AICharacter);
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      background: T.paper,
      overflowY: 'auto',
      fontFamily: T.sans,
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 140px' }}>

        {/* ── Add Button: architectural, full-width, ink on paper ── */}
        <motion.button
          onClick={openCreateModal}
          whileHover={{ background: T.ink, color: T.paper }}
          style={{
            width: '100%',
            background: 'transparent',
            color: T.ink,
            border: `0.5px solid ${T.lineStrong}`,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            marginBottom: 40,
            transition: 'background 0.3s, color 0.3s',
            borderRadius: 0,
          }}
        >
          <span style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}>
            Initialize New Soul
          </span>
          <Plus size={13} strokeWidth={1.5} />
        </motion.button>

        {/* ── Character List ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {characters.map((char, i) => (
            <React.Fragment key={char.id}>
              {i === 0 && <Rule />}
              <motion.div
                layout
                onClick={() => openEditModal(char)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: T.ease }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px 0',
                  cursor: 'pointer',
                  gap: 20,
                  transition: 'opacity 0.2s',
                }}
                whileHover={{ opacity: 0.65 }}
              >
                {/* Avatar: square, no radius */}
                <div style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  background: T.surface,
                  border: `0.5px solid ${T.line}`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {char.avatar ? (
                    <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{
                      fontFamily: T.serif,
                      fontStyle: 'italic',
                      fontSize: 22,
                      fontWeight: 400,
                      color: T.inkGhost,
                    }}>
                      {(char.remark || char.realName)?.[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: T.serif,
                    fontStyle: 'italic',
                    fontSize: 20,
                    fontWeight: 400,
                    color: T.ink,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {char.remark || char.realName}
                  </div>
                  <div style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: '0.18em',
                    color: T.inkGhost,
                    textTransform: 'uppercase',
                  }}>
                    {char.remark ? char.realName : 'Undefined Soul'}
                  </div>
                </div>

                {/* Arrow mark */}
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="14" y2="5" stroke={T.inkGhost} strokeWidth="0.8"/>
                  <polyline points="10,1 14,5 10,9" fill="none" stroke={T.inkGhost} strokeWidth="0.8"/>
                </svg>
              </motion.div>
              <Rule />
            </React.Fragment>
          ))}
        </div>

        {/* Empty state */}
        {characters.length === 0 && (
          <div style={{
            paddingTop: 48,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: T.serif,
              fontStyle: 'italic',
              fontSize: 28,
              color: T.inkGhost,
              fontWeight: 300,
              marginBottom: 12,
            }}>
              No souls yet.
            </div>
            <div style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.2em',
              color: T.inkGhost,
              textTransform: 'uppercase',
            }}>
              Initialize to begin
            </div>
          </div>
        )}
      </div>

      {/* ── Edit / Create Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'flex-end',
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(17,17,16,0.5)',
              }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.4, ease: T.ease }}
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '90vh',
                background: T.paper,
                overflowY: 'auto',
                padding: '40px 28px 48px',
                borderTop: `0.5px solid ${T.lineStrong}`,
              }}
            >
              {/* Close */}
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute', top: 20, right: 24,
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0.4, padding: 4,
                }}
              >
                <X size={16} strokeWidth={1} />
              </button>

              {/* Header */}
              <header style={{ marginBottom: 36 }}>
                <div style={{ ...labelBase, marginBottom: 10 }}>
                  {editingChar ? 'Identity Modification' : 'New Consciousness'}
                </div>
                <h2 style={{
                  margin: 0,
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 34,
                  color: T.ink,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>
                  {editingChar ? 'Refine Soul.' : 'Initial Soul.'}
                </h2>
              </header>

              {/* Avatar Upload */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ ...labelBase, marginBottom: 10 }}>Avatar</div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 64,
                    height: 64,
                    border: `0.5px solid ${T.lineStrong}`,
                    background: T.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  {formData.avatar
                    ? <img src={formData.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageIcon size={16} strokeWidth={1} color={T.inkGhost} />
                  }
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <label style={labelBase}>Real Name</label>
                  <input
                    style={inputBase}
                    type="text"
                    value={formData.realName}
                    onChange={e => setFormData(p => ({ ...p, realName: e.target.value }))}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label style={labelBase}>Remark</label>
                  <input
                    style={inputBase}
                    type="text"
                    value={formData.remark}
                    onChange={e => setFormData(p => ({ ...p, remark: e.target.value }))}
                    placeholder="—"
                  />
                </div>
                <div>
                  <label style={labelBase}>Personality / 设定</label>
                  <textarea
                    rows={3}
                    style={{ ...inputBase, resize: 'none', lineHeight: 1.6 }}
                    value={formData.personality}
                    onChange={e => setFormData(p => ({ ...p, personality: e.target.value }))}
                    placeholder="—"
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Save */}
                <motion.button
                  onClick={handleSave}
                  whileHover={{ background: '#2a2a28' }}
                  style={{
                    background: T.ink,
                    color: T.paper,
                    border: 'none',
                    padding: '16px 24px',
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderRadius: 0,
                  }}
                >
                  {editingChar ? 'Save Changes' : 'Execute Creation'}
                </motion.button>

                {/* Delete */}
                {editingChar && (
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: T.inkGhost,
                      fontFamily: T.mono,
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      padding: '8px 0',
                      textAlign: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.error)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.inkGhost)}
                  >
                    Terminate Consciousness
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 110,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
          }}>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,16,0.72)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: T.ease }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 300,
                background: T.paper,
                padding: '40px 32px 32px',
                borderTop: `0.5px solid ${T.lineStrong}`,
                textAlign: 'center',
              }}
            >
              <div style={{
                fontFamily: T.serif,
                fontStyle: 'italic',
                fontSize: 30,
                fontWeight: 400,
                color: T.ink,
                letterSpacing: '-0.01em',
                marginBottom: 12,
              }}>
                Purge?
              </div>
              <p style={{
                fontFamily: T.sans,
                fontSize: 12,
                color: T.inkFaint,
                lineHeight: 1.6,
                marginBottom: 32,
              }}>
                This will dissolve the soul permanently.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <motion.button
                  whileHover={{ background: '#2a2a28' }}
                  onClick={() => {
                    onDeleteCharacter(editingChar!.id);
                    setIsDeleteConfirmOpen(false);
                    setIsModalOpen(false);
                  }}
                  style={{
                    background: T.ink, color: T.paper, border: 'none',
                    padding: '14px', fontFamily: T.mono, fontSize: 9,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  Confirm
                </motion.button>
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  style={{
                    background: 'none',
                    border: `0.5px solid ${T.lineStrong}`,
                    padding: '14px', fontFamily: T.mono, fontSize: 9,
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    cursor: 'pointer', color: T.inkFaint,
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};