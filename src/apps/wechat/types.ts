export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

export interface AICharacter {
  id: string;
  avatar: string; // Base64 or Emoji
  realName: string;
  remark: string;
  personality: string;
  createdAt: number;
  messages?: Message[];
}

// ─── Appearance / Theme ───────────────────────────────────────────────────────

export interface CssPreset {
  id: string;
  name: string;
  css: string;
}

/** Global appearance settings — stored in localStorage under 'starry_appearance_global' */
export interface AppearanceSettings {
  bgImage: string | null;
  bubblePresets: CssPreset[];
  activeBubblePresetId: string | null;
  bubbleDraftCss: string;
  themePresets: CssPreset[];
  activeThemePresetId: string | null;
  themeDraftCss: string;
}

/** Per-contact appearance override — stored in localStorage under 'starry_appearance_contact_{id}' */
export interface ContactAppearance {
  override: boolean;       // false = inherit global
  bgImage: string | null;
  bubbleDraftCss: string;
  activeBubblePresetId: string | null;
}