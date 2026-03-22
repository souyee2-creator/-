// src/apps/wechat/utils/emojiStorage.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmojiItem {
  id: string;
  type: 'url' | 'local';
  url?: string;       // URL 类型直接存链接
  idbKey?: string;    // 本地图片存 IndexedDB，这里存 key
  label: string;      // 释义，AI 发表情时用这个字段判断
}

export interface EmojiGroup {
  id: string;
  name: string;
  boundContactIds: string[]; // 绑定的联系人 id 列表
  emojis: EmojiItem[];
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const GROUPS_KEY = 'souyee_os_emoji_groups';

export function loadGroups(): EmojiGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: EmojiGroup[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

/** 返回某个联系人绑定的所有表情组 */
export function getGroupsForContact(contactId: string): EmojiGroup[] {
  return loadGroups().filter(g => g.boundContactIds.includes(contactId));
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const DB_NAME = 'souyee_emoji_db';
const STORE   = 'images';
const DB_VER  = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveImageToIDB(key: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getImageFromIDB(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteImageFromIDB(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

// ─── 图片压缩 ─────────────────────────────────────────────────────────────────

/** 压缩图片到 ≤200KB，最大边长 400px，返回 base64 dataUrl */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_DIM = 400;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width  = MAX_DIM;
          } else {
            width  = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

        // 逐步降低质量直到 ≤200KB
        let quality = 0.88;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 200 * 1024 * 1.37 && quality > 0.3) {
          quality -= 0.08;
          dataUrl  = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── 批量 URL 解析 ─────────────────────────────────────────────────────────────

/**
 * 自动识别两种格式：
 *   格式A（同行）：开心大笑 https://example.com/1.gif
 *   格式B（换行）：开心大笑\nhttps://example.com/1.gif
 * 两种格式可混用。
 */
export function parseBatchInput(text: string): Array<{ url: string; label: string }> {
  const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: Array<{ url: string; label: string }> = [];

  let i = 0;
  while (i < lines.length) {
    const line     = lines[i];
    const urlMatch = line.match(/https?:\/\/\S+/);

    if (urlMatch) {
      // 格式A：URL 在本行，行首可能有释义
      const label = line.replace(urlMatch[0], '').trim();
      results.push({ url: urlMatch[0], label: label || '表情' });
      i++;
    } else {
      // 释义在本行，下一行应该是 URL（格式B）
      const nextLine     = lines[i + 1] ?? '';
      const nextUrlMatch = nextLine.match(/https?:\/\/\S+/);
      if (nextUrlMatch) {
        results.push({ url: nextUrlMatch[0], label: line || '表情' });
        i += 2;
      } else {
        // 解析不了，跳过
        i++;
      }
    }
  }

  return results;
}