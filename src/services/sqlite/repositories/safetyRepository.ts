import { SafetyGuide, LanguageCode } from '../../../types';
import { getDatabase } from '../database';
import { getAllBundledSafetyGuides } from '../../safety/safetyRulesEngine';

function mapRowToSafetyGuide(row: any): SafetyGuide {
  let doItems: string[] = [];
  let dontItems: string[] = [];
  let imageReferences: string[] = [];
  let audioReferences: string[] = [];

  try {
    doItems = JSON.parse(row.doItems || '[]');
  } catch {}

  try {
    dontItems = JSON.parse(row.dontItems || '[]');
  } catch {}

  try {
    imageReferences = JSON.parse(row.imageReferences || '[]');
  } catch {}

  try {
    audioReferences = JSON.parse(row.audioReferences || '[]');
  } catch {}

  return {
    id: row.id,
    materialCategory: row.materialCategory,
    title: row.title,
    severity: row.severity,
    doItems,
    dontItems,
    imageReferences,
    audioReferences,
    language: row.language,
    version: Number(row.version) || 1,
    updatedAt: row.updatedAt,
  };
}

export const safetyRepository = {
  /**
   * Fetches all safety guides cached in SQLite, filtered optionally by language.
   * If table is empty, auto-seeds from bundled authoritative guides.
   */
  async getSafetyGuides(language?: string): Promise<SafetyGuide[]> {
    const db = await getDatabase();
    await this.seedDefaultSafetyGuidesIfEmpty((language as LanguageCode) || 'hi');

    let rows: any[];
    if (language) {
      rows = await db.getAllAsync(
        'SELECT * FROM safety_guides WHERE language = ? ORDER BY severity DESC, materialCategory ASC',
        [language]
      );
    } else {
      rows = await db.getAllAsync(
        'SELECT * FROM safety_guides ORDER BY severity DESC, materialCategory ASC'
      );
    }

    if (!rows || rows.length === 0) {
      return getAllBundledSafetyGuides((language as LanguageCode) || 'hi');
    }

    return rows.map(mapRowToSafetyGuide);
  },

  /**
   * Fetches single safety guide by category and language.
   */
  async getSafetyGuideByCategory(
    materialCategory: string,
    language: string = 'hi'
  ): Promise<SafetyGuide | null> {
    const db = await getDatabase();
    const row: any = await db.getFirstAsync(
      'SELECT * FROM safety_guides WHERE materialCategory = ? AND language = ?',
      [materialCategory, language]
    );

    if (!row) {
      // Fallback to bundled
      const bundled = getAllBundledSafetyGuides(language as LanguageCode);
      const match = bundled.find((b) => b.materialCategory === materialCategory);
      return match || null;
    }

    return mapRowToSafetyGuide(row);
  },

  /**
   * Saves or updates a safety guide in local SQLite.
   */
  async saveSafetyGuide(guide: SafetyGuide): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO safety_guides (
        id, materialCategory, title, severity, doItems, dontItems,
        imageReferences, audioReferences, language, version, updatedAt, syncStatus, lastSyncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guide.id,
        guide.materialCategory,
        guide.title,
        guide.severity,
        JSON.stringify(guide.doItems || []),
        JSON.stringify(guide.dontItems || []),
        JSON.stringify(guide.imageReferences || []),
        JSON.stringify(guide.audioReferences || []),
        guide.language,
        guide.version || 1,
        guide.updatedAt || new Date().toISOString(),
        'synced',
        new Date().toISOString(),
      ]
    );
  },

  /**
   * Seeds all bundled safety guides into SQLite if not already stored.
   */
  async seedDefaultSafetyGuidesIfEmpty(defaultLang: LanguageCode = 'hi'): Promise<void> {
    const db = await getDatabase();
    const countRow: any = await db.getFirstAsync('SELECT COUNT(*) as count FROM safety_guides');
    const count = countRow ? Number(countRow.count) : 0;

    if (count === 0) {
      const languages: LanguageCode[] = ['hi', 'mr', 'en'];
      for (const lang of languages) {
        const guides = getAllBundledSafetyGuides(lang);
        for (const guide of guides) {
          await this.saveSafetyGuide(guide);
        }
      }
    }
  },
};
