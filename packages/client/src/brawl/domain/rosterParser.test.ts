import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  inferBaseShape,
  parseNewRecruitJson,
  parseBattleScribeXml,
  parseRosterFile,
} from './rosterParser.js';

describe('Roster Ingestion Pipeline (OB-161)', () => {
  describe('inferBaseShape', () => {
    it('infers rectangular hull bases for tanks and transports', () => {
      const shape = inferBaseShape('Land Raider Redeemer');
      assert.strictEqual(shape.type, 'rect');
      assert.strictEqual(shape.widthMm, 120);
      assert.strictEqual(shape.heightMm, 75);
    });

    it('infers 60mm circular base for dreadnoughts and monsters', () => {
      const shape = inferBaseShape('Redemptor Dreadnought');
      assert.strictEqual(shape.type, 'circle');
      assert.strictEqual(shape.widthMm, 60);
    });

    it('infers 40mm circular base for terminators, captains, and multi-wound heroes', () => {
      const shapeTerminator = inferBaseShape('Terminator Squad');
      assert.strictEqual(shapeTerminator.type, 'circle');
      assert.strictEqual(shapeTerminator.widthMm, 40);

      const shapeHero = inferBaseShape('Unknown Hero', 4, 5);
      assert.strictEqual(shapeHero.type, 'circle');
      assert.strictEqual(shapeHero.widthMm, 40);
    });

    it('infers 28mm circular base for grots, cultists, or low-toughness infantry', () => {
      const shapeGrot = inferBaseShape('Gretchin', 2, 1);
      assert.strictEqual(shapeGrot.type, 'circle');
      assert.strictEqual(shapeGrot.widthMm, 28);
    });

    it('defaults to 32mm circular base for standard infantry', () => {
      const shapeIntercessor = inferBaseShape('Intercessor Squad', 4, 2);
      assert.strictEqual(shapeIntercessor.type, 'circle');
      assert.strictEqual(shapeIntercessor.widthMm, 32);
    });
  });

  describe('parseNewRecruitJson', () => {
    it('parses army details, unit profiles, weapons, and models from NewRecruit format', () => {
      const sampleNrJson = {
        roster: {
          name: '1st Company Task Force',
          faction: 'Adeptus Astartes',
          pointsLimit: 2000,
          units: [
            {
              name: 'Terminator Squad',
              cost: 185,
              count: 5,
              profiles: [
                {
                  typeName: 'Unit',
                  attributes: {
                    M: '5"',
                    T: '5',
                    SV: '2+',
                    W: '3',
                    LD: '6+',
                    OC: '1',
                  },
                },
                {
                  typeName: 'Ranged Weapon',
                  name: 'Storm Bolter',
                  attributes: {
                    Range: '24"',
                    A: '2',
                    BS: '3+',
                    S: '4',
                    AP: '0',
                    D: '1',
                  },
                },
                {
                  typeName: 'Melee Weapon',
                  name: 'Power Fist',
                  attributes: {
                    Range: 'Melee',
                    A: '3',
                    WS: '3+',
                    S: '8',
                    AP: '-2',
                    D: '2',
                  },
                },
              ],
            },
            {
              name: 'Terminator Squad',
              cost: 185,
              count: 5,
              profiles: [
                {
                  typeName: 'Unit',
                  attributes: {
                    M: '5"',
                    T: '5',
                    SV: '2+',
                    W: '3',
                    LD: '6+',
                    OC: '1',
                  },
                },
              ],
            },
          ],
        },
      };

      const parsed = parseNewRecruitJson(sampleNrJson);

      assert.strictEqual(parsed.name, '1st Company Task Force');
      assert.strictEqual(parsed.faction, 'Adeptus Astartes');
      assert.strictEqual(parsed.units.length, 2);

      // Duplicate units should be disambiguated with letters A and B
      assert.strictEqual(parsed.units[0].name, 'Terminator Squad A');
      assert.strictEqual(parsed.units[1].name, 'Terminator Squad B');

      // Check models
      assert.strictEqual(parsed.units[0].models.length, 5);
      assert.strictEqual(parsed.units[0].models[0].name, 'Terminator Squad A 1');
      assert.strictEqual(parsed.units[0].models[0].baseShape.widthMm, 40);

      // Check datasheet characteristics
      assert.strictEqual(parsed.units[0].datasheet?.movementInches, 5);
      assert.strictEqual(parsed.units[0].datasheet?.toughness, 5);
      assert.strictEqual(parsed.units[0].datasheet?.armorSave, '2+');
      assert.strictEqual(parsed.units[0].datasheet?.woundsPerModel, 3);
      assert.strictEqual(parsed.units[0].datasheet?.objectiveControl, 1);

      // Check actions
      assert.strictEqual(parsed.units[0].baseActions.length, 2);
      assert.strictEqual(parsed.units[0].baseActions[0].name, 'Storm Bolter');
      assert.strictEqual(parsed.units[0].baseActions[0].type, 'ranged');
      assert.strictEqual(parsed.units[0].baseActions[0].rangeInches, 24);
      assert.strictEqual(parsed.units[0].baseActions[1].name, 'Power Fist');
      assert.strictEqual(parsed.units[0].baseActions[1].type, 'melee');
      assert.strictEqual(parsed.units[0].baseActions[1].strength, 8);
    });
  });

  describe('parseBattleScribeXml', () => {
    it('parses BattleScribe XML format including forces, units, profiles, and weapons', () => {
      const sampleBsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<roster id="123" name="Waaagh Stomp" battleScribeVersion="2.03">
  <costs>
    <cost name="pts" typeId="points" value="1000"/>
  </costs>
  <forces>
    <force id="f1" name="Ork Patrol" catalogueName="Orks - Codex">
      <selections>
        <selection id="s1" name="Boyz" type="unit">
          <costs>
            <cost name="pts" typeId="points" value="85"/>
          </costs>
          <selections>
            <selection id="m1" name="Boy" type="model" number="10"/>
          </selections>
          <profiles>
            <profile id="p1" name="Boyz" typeName="Unit">
              <characteristics>
                <characteristic name="M">6"</characteristic>
                <characteristic name="T">5</characteristic>
                <characteristic name="Sv">5+</characteristic>
                <characteristic name="W">1</characteristic>
                <characteristic name="Ld">7+</characteristic>
                <characteristic name="OC">2</characteristic>
              </characteristics>
            </profile>
            <profile id="p2" name="Choppa" typeName="Melee Weapons">
              <characteristics>
                <characteristic name="Range">Melee</characteristic>
                <characteristic name="A">3</characteristic>
                <characteristic name="WS">3+</characteristic>
                <characteristic name="S">4</characteristic>
                <characteristic name="AP">-1</characteristic>
                <characteristic name="D">1</characteristic>
              </characteristics>
            </profile>
          </profiles>
        </selection>
      </selections>
    </force>
  </forces>
</roster>`;

      const parsed = parseBattleScribeXml(sampleBsXml);

      assert.strictEqual(parsed.name, 'Waaagh Stomp');
      assert.strictEqual(parsed.faction, 'Orks - Codex');
      assert.strictEqual(parsed.units.length, 1);

      const boyz = parsed.units[0];
      assert.strictEqual(boyz.name, 'Boyz');
      assert.strictEqual(boyz.points, 85);
      assert.strictEqual(boyz.models.length, 10);
      assert.strictEqual(boyz.models[0].name, 'Boyz 1');
      assert.strictEqual(boyz.datasheet?.movementInches, 6);
      assert.strictEqual(boyz.datasheet?.toughness, 5);
      assert.strictEqual(boyz.datasheet?.objectiveControl, 2);

      assert.strictEqual(boyz.baseActions.length, 1);
      assert.strictEqual(boyz.baseActions[0].name, 'Choppa');
      assert.strictEqual(boyz.baseActions[0].type, 'melee');
      assert.strictEqual(boyz.baseActions[0].ap, -1);
    });
  });

  describe('parseRosterFile', () => {
    it('auto-detects and parses JSON string or file', async () => {
      const json = JSON.stringify({
        roster: {
          name: 'Necron Dynastic Army',
          units: [{ name: 'Necron Warriors', count: 10, cost: 100 }],
        },
      });

      const result = await parseRosterFile('army.json', json);
      assert.strictEqual(result.format, 'newrecruit');
      assert.strictEqual(result.army.name, 'Necron Dynastic Army');
      assert.strictEqual(result.army.units.length, 1);
      assert.strictEqual(result.army.units[0].models.length, 10);
    });

    it('auto-detects and parses XML file', async () => {
      const xml = `<roster name="Aeldari Host"><selection type="unit" name="Guardians"></selection></roster>`;
      const result = await parseRosterFile('aeldari.ros', xml);
      assert.strictEqual(result.format, 'battlescribe_xml');
      assert.strictEqual(result.army.name, 'Aeldari Host');
      assert.strictEqual(result.army.units[0].name, 'Guardians');
    });

    it('throws error on unsupported format', async () => {
      await assert.rejects(
        async () => {
          await parseRosterFile('image.png', 'PNGDATA');
        },
        /Unsupported roster format/
      );
    });
  });
});
