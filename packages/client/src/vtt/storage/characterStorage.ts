import { DnDCharacter } from '@oldbear/shared';

export interface SavedCharacterRecord {
  id: string;
  name: string;
  classes?: string;
  avatarUrl?: string;
  charData: DnDCharacter;
  savedAt: number;
}

export const LOCAL_STORAGE_KEY = 'oldbear_saved_characters';
export const GM_STORAGE_KEY = 'oldbear_gm_saved_characters';

export function getSavedCharacters(isGm: boolean): SavedCharacterRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: SavedCharacterRecord[] = raw ? JSON.parse(raw) : [];
    if (isGm) {
      const gmRaw = localStorage.getItem(GM_STORAGE_KEY);
      const gmList: SavedCharacterRecord[] = gmRaw ? JSON.parse(gmRaw) : [];
      const map = new Map<string, SavedCharacterRecord>();
      for (const item of [...list, ...gmList]) {
        map.set(item.id, item);
      }
      return Array.from(map.values());
    }
    return list;
  } catch {
    return [];
  }
}

export function saveCharacterToStorage(char: DnDCharacter, isGm: boolean): void {
  try {
    const id = char.id || `char_${Date.now()}`;
    const record: SavedCharacterRecord = {
      id,
      name: char.name || 'Unnamed Adventurer',
      classes: char.classes || '',
      avatarUrl: char.avatarUrl || '',
      charData: char,
      savedAt: Date.now(),
    };

    const key = isGm ? GM_STORAGE_KEY : LOCAL_STORAGE_KEY;
    const existingRaw = localStorage.getItem(key);
    const list: SavedCharacterRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const idx = list.findIndex((c) => c.id === id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save character to storage:', err);
  }
}

export function deleteSavedCharacter(id: string, isGm: boolean): void {
  try {
    const userRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (userRaw) {
      const list = JSON.parse(userRaw).filter((c: any) => c.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
    if (isGm) {
      const gmRaw = localStorage.getItem(GM_STORAGE_KEY);
      if (gmRaw) {
        const gmList = JSON.parse(gmRaw).filter((c: any) => c.id !== id);
        localStorage.setItem(GM_STORAGE_KEY, JSON.stringify(gmList));
      }
    }
  } catch (err) {
    console.error('Failed to delete saved character:', err);
  }
}
