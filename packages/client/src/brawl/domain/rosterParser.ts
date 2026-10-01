import { WargameArmy, WargameUnit, WargameModel, WargameAction, BaseShape } from '../types/brawl.js';
import { disambiguateArmy } from './armyManager.js';

export interface ParseRosterResult {
  army: WargameArmy;
  format: 'newrecruit' | 'battlescribe_xml' | 'battlescribe_rosz';
  warnings: string[];
}

/**
 * Infers an appropriate base shape and diameter in millimeters from unit keywords, toughness, and wounds.
 */
export function inferBaseShape(name: string, toughness = 4, wounds = 1): BaseShape {
  const lower = name.toLowerCase();

  if (lower.includes('tank') || lower.includes('rhino') || lower.includes('land raider') || lower.includes('repulsor')) {
    return { type: 'rect', widthMm: 120, heightMm: 75 };
  }
  if (lower.includes('dreadnought') || lower.includes('helbrute') || lower.includes('carnifex')) {
    return { type: 'circle', widthMm: 60, heightMm: 60 };
  }
  if (lower.includes('terminator') || lower.includes('gravis') || lower.includes('custodian') || lower.includes('captain') || lower.includes('character') || wounds >= 4) {
    return { type: 'circle', widthMm: 40, heightMm: 40 };
  }
  if (lower.includes('grot') || lower.includes('guardsman') || lower.includes('gaunt') || lower.includes('cultist') || toughness <= 3) {
    return { type: 'circle', widthMm: 28, heightMm: 28 };
  }
  return { type: 'circle', widthMm: 32, heightMm: 32 };
}

/**
 * Parses NewRecruit JSON export.
 */
export function parseNewRecruitJson(jsonContent: string | Record<string, any>): WargameArmy {
  const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
  const root = data.roster || data;

  const armyId = `army_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const armyName = root.name || data.name || 'Imported Army';
  const faction = root.faction || root.gameSystemName || data.faction || 'Unknown Faction';

  let pointsLimit = root.pointsLimit || root.maxPoints || 2000;
  let totalCost = 0;

  const rawUnits: any[] = root.units || root.selections || root.forces?.[0]?.selections || [];
  const parsedUnits: WargameUnit[] = [];

  for (let uIdx = 0; uIdx < rawUnits.length; uIdx++) {
    const rawUnit = rawUnits[uIdx];
    const unitName = rawUnit.name || `Unit ${uIdx + 1}`;
    const unitId = `unit_${armyId}_${uIdx}`;

    // Extract unit points
    const unitPts =
      typeof rawUnit.costs?.pts === 'number'
        ? rawUnit.costs.pts
        : typeof rawUnit.cost === 'number'
        ? rawUnit.cost
        : typeof rawUnit.points === 'number'
        ? rawUnit.points
        : 100;

    totalCost += unitPts;

    // Find stats profile if present
    let movement = 6;
    let toughness = 4;
    let armorSave = '3+';
    let wounds = 2;
    let leadership = '6+';
    let oc = 1;

    const profiles = rawUnit.profiles || [];
    const unitProfile = profiles.find(
      (p: any) => p.typeName === 'Unit' || p.type === 'unit' || p.name === unitName
    );

    if (unitProfile?.attributes || unitProfile?.characteristics) {
      const attrs = unitProfile.attributes || unitProfile.characteristics;
      const getAttr = (key: string) => {
        if (typeof attrs === 'object') {
          for (const k of Object.keys(attrs)) {
            if (k.toLowerCase() === key.toLowerCase()) return attrs[k];
          }
        }
        return undefined;
      };

      movement = parseInt(String(getAttr('M') || '6').replace(/\D/g, ''), 10) || 6;
      toughness = parseInt(String(getAttr('T') || '4').replace(/\D/g, ''), 10) || 4;
      armorSave = String(getAttr('SV') || getAttr('Save') || '3+');
      wounds = parseInt(String(getAttr('W') || '2').replace(/\D/g, ''), 10) || 2;
      leadership = String(getAttr('LD') || '6+');
      oc = parseInt(String(getAttr('OC') || '1').replace(/\D/g, ''), 10) || 1;
    }

    // Extract weapons into baseActions
    const baseActions: WargameAction[] = [];
    const weaponProfiles = profiles.filter(
      (p: any) =>
        p.typeName?.includes('Weapon') ||
        p.type?.includes('weapon') ||
        p.attributes?.Range ||
        p.characteristics?.Range
    );

    weaponProfiles.forEach((wp: any, wIdx: number) => {
      const wName = wp.name || `Weapon ${wIdx + 1}`;
      const isMelee = wp.typeName?.toLowerCase().includes('melee') || wp.type?.toLowerCase().includes('melee');
      const attrs = wp.attributes || wp.characteristics || {};
      const getVal = (k: string) => {
        for (const key of Object.keys(attrs)) {
          if (key.toLowerCase() === k.toLowerCase()) return String(attrs[key]);
        }
        return '';
      };

      baseActions.push({
        id: `act_${unitId}_${wIdx}`,
        name: wName,
        type: isMelee ? 'melee' : 'ranged',
        rangeInches: isMelee ? 0 : parseInt(getVal('range').replace(/\D/g, ''), 10) || 24,
        attacks: getVal('A') || '2',
        skill: getVal('BS') || getVal('WS') || '3+',
        strength: parseInt(getVal('S').replace(/\D/g, ''), 10) || 4,
        ap: parseInt(getVal('AP').replace(/[^0-9-]/g, ''), 10) || 0,
        damage: getVal('D') || '1',
      });
    });

    // Model count
    const modelCount =
      rawUnit.count ||
      rawUnit.number ||
      rawUnit.models?.length ||
      rawUnit.selections?.filter((s: any) => s.type === 'model').length ||
      5;

    const baseShape = inferBaseShape(unitName, toughness, wounds);

    const models: WargameModel[] = [];
    for (let m = 0; m < modelCount; m++) {
      models.push({
        id: `model_${unitId}_${m}`,
        name: `${unitName} ${m + 1}`,
        unitId,
        x: 0,
        y: 0,
        baseShape,
      });
    }

    parsedUnits.push({
      id: unitId,
      name: unitName,
      armyId,
      points: unitPts,
      coherencyDistanceInches: 2.0,
      models,
      baseActions,
      datasheet: {
        movementInches: movement,
        toughness,
        armorSave,
        woundsPerModel: wounds,
        leadership,
        objectiveControl: oc,
      },
    });
  }

  const army: WargameArmy = {
    id: armyId,
    name: armyName,
    faction,
    pointsLimit: Math.max(pointsLimit, totalCost),
    units: parsedUnits,
  };

  return disambiguateArmy(army);
}

/**
 * Parses BattleScribe `.ros` XML format.
 */
export function parseBattleScribeXml(xmlContent: string): WargameArmy {
  const armyId = `army_bs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Extract roster name
  const rosterNameMatch = xmlContent.match(/<roster[^>]*\bname="([^"]+)"/i);
  const armyName = rosterNameMatch ? rosterNameMatch[1] : 'BattleScribe Army';

  // Extract catalogue / faction
  const forceMatch = xmlContent.match(/<force[^>]*\bcatalogueName="([^"]+)"/i);
  const faction = forceMatch ? forceMatch[1] : 'Unknown Faction';

  // Extract points limit
  const costMatch = xmlContent.match(/<cost[^>]*\bname="pts"[^>]*\bvalue="([^"]+)"/i);
  const pointsLimit = costMatch ? parseInt(costMatch[1], 10) : 2000;

  // Extract units from <selection ... type="unit">
  const unitRegex = /<selection\b[^>]*\btype="unit"[^>]*>([\s\S]*?)<\/selection>/gi;
  const parsedUnits: WargameUnit[] = [];

  let match: RegExpExecArray | null;
  let uIdx = 0;

  while ((match = unitRegex.exec(xmlContent)) !== null) {
    const unitXml = match[0];
    const unitInner = match[1];

    const nameMatch = unitXml.match(/<selection\b[^>]*\bname="([^"]+)"/i);
    const unitName = nameMatch ? nameMatch[1] : `Unit ${uIdx + 1}`;
    const unitId = `unit_${armyId}_${uIdx}`;

    // Extract unit points
    const unitCostMatch = unitXml.match(/<cost[^>]*\bname="pts"[^>]*\bvalue="([^"]+)"/i);
    const unitPts = unitCostMatch ? parseInt(unitCostMatch[1], 10) : 100;

    // Extract profile characteristics
    const profileMatch = unitInner.match(/<profile\b[^>]*\btypeName="Unit"[\s\S]*?<\/profile>/i);
    let movement = 6;
    let toughness = 4;
    let armorSave = '3+';
    let wounds = 2;
    let leadership = '6+';
    let oc = 1;

    if (profileMatch) {
      const pXml = profileMatch[0];
      const getChar = (cName: string) => {
        const charMatch = pXml.match(new RegExp(`<characteristic\\b[^>]*\\bname="${cName}"[^>]*>([^<]*)<`, 'i'));
        return charMatch ? charMatch[1].trim() : '';
      };

      movement = parseInt(getChar('M').replace(/\D/g, ''), 10) || 6;
      toughness = parseInt(getChar('T').replace(/\D/g, ''), 10) || 4;
      armorSave = getChar('Sv') || '3+';
      wounds = parseInt(getChar('W').replace(/\D/g, ''), 10) || 2;
      leadership = getChar('Ld') || '6+';
      oc = parseInt(getChar('OC').replace(/\D/g, ''), 10) || 1;
    }

    // Extract weapons
    const baseActions: WargameAction[] = [];
    const profileRegex = /<profile\b([^>]*)>([\s\S]*?)<\/profile>/gi;
    let pMatch: RegExpExecArray | null;
    let wIdx = 0;

    while ((pMatch = profileRegex.exec(unitInner)) !== null) {
      const pHeader = pMatch[1];
      const pContent = pMatch[2];

      const typeMatch = pHeader.match(/typeName="([^"]+)"/i);
      const typeName = typeMatch ? typeMatch[1] : '';

      if (typeName.toLowerCase().includes('weapon')) {
        const isMelee = typeName.toLowerCase().includes('melee');
        const nameMatch = pHeader.match(/name="([^"]+)"/i);
        const wName = nameMatch ? nameMatch[1] : `Weapon ${wIdx + 1}`;

        const getWChar = (cName: string) => {
          const cMatch = pContent.match(new RegExp(`<characteristic\\b[^>]*\\bname="${cName}"[^>]*>([^<]*)<`, 'i'));
          return cMatch ? cMatch[1].trim() : '';
        };

        baseActions.push({
          id: `act_${unitId}_${wIdx}`,
          name: wName,
          type: isMelee ? 'melee' : 'ranged',
          rangeInches: isMelee ? 0 : parseInt(getWChar('Range').replace(/\D/g, ''), 10) || 24,
          attacks: getWChar('A') || '2',
          skill: getWChar('BS') || getWChar('WS') || '3+',
          strength: parseInt(getWChar('S').replace(/\D/g, ''), 10) || 4,
          ap: parseInt(getWChar('AP').replace(/[^0-9-]/g, ''), 10) || 0,
          damage: getWChar('D') || '1',
        });
        wIdx++;
      }
    }

    // Count models: find <selection type="model" count="X">
    let modelCount = 0;
    const modelRegex = /<selection\b[^>]*\btype="model"[^>]*>/gi;
    let mMatch: RegExpExecArray | null;
    while ((mMatch = modelRegex.exec(unitInner)) !== null) {
      const countMatch = mMatch[0].match(/number="(\d+)"/i);
      modelCount += countMatch ? parseInt(countMatch[1], 10) : 1;
    }
    if (modelCount === 0) modelCount = 5;

    const baseShape = inferBaseShape(unitName, toughness, wounds);

    const models: WargameModel[] = [];
    for (let m = 0; m < modelCount; m++) {
      models.push({
        id: `model_${unitId}_${m}`,
        name: `${unitName} ${m + 1}`,
        unitId,
        x: 0,
        y: 0,
        baseShape,
      });
    }

    parsedUnits.push({
      id: unitId,
      name: unitName,
      armyId,
      points: unitPts,
      coherencyDistanceInches: 2.0,
      models,
      baseActions,
      datasheet: {
        movementInches: movement,
        toughness,
        armorSave,
        woundsPerModel: wounds,
        leadership,
        objectiveControl: oc,
      },
    });

    uIdx++;
  }

  const army: WargameArmy = {
    id: armyId,
    name: armyName,
    faction,
    pointsLimit,
    units: parsedUnits,
  };

  return disambiguateArmy(army);
}

/**
 * Extracts raw XML string from a zipped BattleScribe `.rosz` byte buffer.
 * Uses standard zip local header detection.
 */
export async function extractRosXmlFromRosz(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // Check PKZip signature 'PK\x03\x04' (0x04034b50)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    // Read local file header: compression method at offset 8 (2 bytes)
    const compressionMethod = bytes[8] | (bytes[9] << 8);
    const fileNameLen = bytes[26] | (bytes[27] << 8);
    const extraFieldLen = bytes[28] | (bytes[29] << 8);
    const dataOffset = 30 + fileNameLen + extraFieldLen;

    if (compressionMethod === 0) {
      // Uncompressed stored data
      const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
      const xmlBytes = bytes.slice(dataOffset, dataOffset + compressedSize);
      return new TextDecoder().decode(xmlBytes);
    } else if (compressionMethod === 8 && typeof DecompressionStream !== 'undefined') {
      // Deflated data
      const compressedSize = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
      const compressedData = bytes.slice(dataOffset, dataOffset + compressedSize);

      try {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(compressedData);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        let done = false;
        while (!done) {
          const res = await reader.read();
          if (res.done) done = true;
          else chunks.push(res.value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        return new TextDecoder().decode(merged);
      } catch {
        // Fallback to text decoding
      }
    }
  }

  // Fallback if already an XML string or raw
  return new TextDecoder().decode(bytes);
}

/**
 * Universal auto-detection and ingestion pipeline for roster exports.
 */
export async function parseRosterFile(
  filename: string,
  content: string | ArrayBuffer | Uint8Array
): Promise<ParseRosterResult> {
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.rosz') || (content instanceof ArrayBuffer && !(typeof content === 'string'))) {
    const xml = await extractRosXmlFromRosz(content as any);
    const army = parseBattleScribeXml(xml);
    return {
      army,
      format: 'battlescribe_rosz',
      warnings: [],
    };
  }

  const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content as any);

  if (lowerName.endsWith('.json') || textContent.trim().startsWith('{')) {
    const army = parseNewRecruitJson(textContent);
    return {
      army,
      format: 'newrecruit',
      warnings: [],
    };
  }

  if (lowerName.endsWith('.ros') || textContent.includes('<roster')) {
    const army = parseBattleScribeXml(textContent);
    return {
      army,
      format: 'battlescribe_xml',
      warnings: [],
    };
  }

  throw new Error(`Unsupported roster format: "${filename}". Expected NewRecruit JSON or BattleScribe .ros / .rosz.`);
}
