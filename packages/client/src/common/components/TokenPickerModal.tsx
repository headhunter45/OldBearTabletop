import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  User,
  Sparkles,
  Check,
  Package,
  Skull,
  Shield,
  Search,
} from 'lucide-react';
import { StoredAsset, getAllAssets, saveAsset } from '../storage/db.js';

export interface SavedCharacterRecord {
  id: string;
  name: string;
  classes?: string;
  avatarUrl?: string;
  charData?: any;
  savedAt?: number;
}

export interface TokenSpawnData {
  name: string;
  imageUrl?: string;
  size: number;
  isProp?: boolean;
  layer?: 'token' | 'prop';
  character?: any;
  monsterData?: any;
  currentHp?: number;
  maxHp?: number;
  speed?: number;
  armorClass?: number;
  ringColor?: string;
  fillColor?: string;
  clipCircle?: boolean;
  clipShape?: 'circle' | 'square' | 'rounded' | 'hexagon' | 'octagon';
  propWidth?: number;
  propHeight?: number;
}

export interface TokenPickerModalProps {
  onClose: () => void;
  onCreateToken: (tokenData: TokenSpawnData) => void;
  isGm?: boolean;
  loadCharacters?: (isGm: boolean) => SavedCharacterRecord[];
}
/*
  { name: '', base: ''},
*/
const PRESET_TOKENS = [
  // { name: '', base: ''},
  {
    name: 'Mask of human face in multicolored',
    base: 'vector-1760005368300-d2edc728bb40',
    author: { name: 'Rudra K', url: 'https://unsplash.com/@rudra_ind' },
  },
  {
    name: 'A multicolored Dragon Mask with yellow eyes that looks real. Using red, perple, blue, orange, yellow, green, etc. Colored shades using in this art of dragon mask.',
    base: 'vector-1769793467599-c40ce42d2133',
    author: { name: 'Rudra K', url: 'https://unsplash.com/@rudra_ind' },
  },
  {
    name: 'A highly detailed, symmetrical vector illustration of an iguana’s head, designed with the intricate patterns of a traditional ceremonial mask.',
    base: 'vector-1777123850186-f3b3523aa067',
    author: { name: 'Rudra K', url: 'https://unsplash.com/@rudra_ind' },
  },
  {
    name: 'Anime Girl',
    base: 'vector-1760040811785-401bbbb5c32f',
    author: {
      name: 'Ands Mahardika',
      url: 'https://unsplash.com/@andsproject',
    },
  },
  {
    name: 'Ands-1',
    base: 'vector-1760040739628-5bfc1fcb0449',
    author: {
      name: 'Ands Mahardika',
      url: 'https://unsplash.com/@andsproject',
    },
  },
  {
    name: 'Ands-2',
    base: 'vector-1760041021485-9bf5244c2797',
    author: {
      name: 'Ands Mahardika',
      url: 'https://unsplash.com/@andsproject',
    },
  },
  {
    name: 'Ands-3',
    base: 'vector-1753220889071-bfa0cd2b2d2a',
    author: {
      name: 'Ands Mahardika',
      url: 'https://unsplash.com/@andsproject',
    },
  },
  {
    name: 'Ands-4',
    base: 'vector-1760040811785-401bbbb5c32f',
    author: {
      name: 'Ands Mahardika',
      url: 'https://unsplash.com/@andsproject',
    },
  },
  {
    name: 'maulana',
    base: 'vector-1775490412285-7c07076ec2d3',
    author: {
      name: 'maulana ahmad',
      url: 'https://unsplash.com/@maulana_ahmad/',
    },
  },
  {
    name: 'Round-1',
    base: 'vector-1738925310534-6013fbe76ad5',
    author: { name: 'Round Icons', url: 'https://unsplash.com/@roundicons' },
  },
  {
    name: 'Brigitte-1',
    base: 'vector-1751048722843-c2444fbabfdf',
    author: { name: 'Brigitte Elsner', url: 'https://unsplash.com/@bel_media' },
  },
  {
    name: 'Brigitte-2',
    base: 'vector-1760458534590-85912e8a4684',
    author: { name: 'Brigitte Elsner', url: 'https://unsplash.com/@bel_media' },
  },
  {
    name: 'Marcio-1',
    base: 'vector-1761603754199-f68965ad4a08',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-2',
    base: 'vector-1761603754324-8a968862bdc0',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-3',
    base: 'vector-1761605358363-daf54d533a56',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-4',
    base: 'vector-1761606294661-221cff330381',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-5',
    base: 'vector-1761748019541-3d0545b5f8c9',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-6',
    base: 'vector-1761835780372-e847fbdd4a98',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-7',
    base: 'vector-1761835780440-5f68a8c84c1b',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-8',
    base: 'vector-1761835780472-65d8d2b15688',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-9',
    base: 'vector-1761930269561-dbb1c06c9f22',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-10',
    base: 'vector-1761930796350-36a5010984bf',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-11',
    base: 'vector-1761943847595-4247b0de7a1b',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'Marcio-12',
    base: 'vector-1761944560968-17644a61957c',
    author: { name: 'Marcio Goldzweig', url: 'https://unsplash.com/@zweig17' },
  },
  {
    name: 'baru',
    base: 'vector-1771869934008-3c9a08d78fa3',
    author: { name: 'baru mulai', url: 'https://unsplash.com/@sutisna76' },
  },
  {
    name: 'Sufyan',
    base: 'vector-1781764237367-7383e182e077',
    author: { name: 'Sufyan pir', url: 'https://unsplash.com/@sufyanpir' },
  },
  {
    name: 'Knight Warrior',
    base: 'photo-1686747513617-ccd391daa3e2',
    author: { name: 'Anna Saveleva', url: 'https://unsplash.com/@paneva' },
  },
  {
    name: 'Elven Wizard',
    base: 'photo-1718750307490-f4f04761800c',
    author: { name: 'Nur demirbaş', url: 'https://unsplash.com/@nurdeniss' },
  },
  {
    name: 'Shadow Rogue',
    base: 'photo-1644437687093-8a01d1721fae',
    author: {
      name: 'Christopher Luther',
      url: 'https://unsplash.com/@chriscantlose',
    },
  },
  {
    name: 'Holy Cleric',
    base: 'photo-1697043593484-1b8c8d475327',
    author: { name: 'HamZa NOUASRIA', url: 'https://unsplash.com/@hamza01nsr' },
  },
  {
    name: 'Forest Ranger',
    base: 'photo-1720462813863-cf94aef89b38',
    author: { name: 'Aditya Saxena', url: 'https://unsplash.com/@adityaries' },
  },
  {
    name: 'Orc Berserker',
    base: 'photo-1568224014743-c17edeea85bb',
    author: { name: 'Anne Nygård', url: 'https://unsplash.com/@polarmermaid' },
  },
  {
    name: 'Dragon Wyrmling',
    base: 'photo-1523586044048-b7d32d5da502',
    author: { name: 'David Clode', url: 'https://unsplash.com/@davidclode' },
  },
  {
    name: 'Goblin Scout',
    base: 'photo-1562433712-9474d4ef8510',
    author: { name: 'Henry Addo', url: 'https://unsplash.com/@eyedol25' },
  },
  {
    name: 'Amber',
    base: 'photo-1573865526739-10659fec78a5',
    author: { name: 'Amber Kipp', url: 'https://unsplash.com/@sadmax' },
  },
  {
    name: 'Manja',
    base: 'photo-1514888286974-6c03e2ca1dba',
    author: {
      name: 'Manja Vitolic',
      url: 'https://unsplash.com/@madhatterzone',
    },
  },
  {
    name: 'Loan',
    base: 'photo-1574144611937-0df059b5ef3e',
    author: { name: 'Loan', url: 'https://unsplash.com/@l_oan' },
  },
  {
    name: 'hang',
    base: 'photo-1561948955-570b270e7c36',
    author: { name: 'hang niu', url: 'https://unsplash.com/@niuhang' },
  },
  {
    name: 'Ahmadreza Rezaie',
    base: 'photo-1622559924472-2c2f69abb854',
    author: {
      name: 'Ahmadreza Rezaie',
      url: 'https://unsplash.com/@ahmdrzarzai',
    },
  },
  {
    name: 'Ali',
    base: 'photo-1559564408-21dd77348e7d',
    author: { name: 'Ali Pazani', url: 'https://unsplash.com/@alipzn' },
  },
  {
    name: 'Armin',
    base: 'photo-1551073179-0be3ab1dbf1d',
    author: { name: 'Armin Lotfi', url: 'https://unsplash.com/@armin_lotfi' },
  },
  {
    name: 'Necromancer',
    base: 'photo-1632112991792-efbfa8bdec49',
    author: { name: 'Nurlan Imash', url: 'https://unsplash.com/@edifieer' },
  },
  {
    name: 'Dmitry Vechorko',
    base: 'photo-1572979129454-dce4055c1f68',
    author: { name: 'Dmitry Vechorko', url: 'https://unsplash.com/@vechorko' },
  },
  {
    name: 'Sander-1',
    base: 'photo-1634409884980-a30da0b2b010',
    author: {
      name: 'Sander Sammy',
      url: 'https://unsplash.com/@sammywilliams',
    },
  },
  {
    name: 'Royce',
    base: 'photo-1783712989825-8467185c4417',
    author: {
      name: 'Royce Fonseca',
      url: 'https://unsplash.com/@casunshine0508',
    },
  },
  {
    name: 'Cash',
    base: 'photo-1659225260593-f082454ca503',
    author: {
      name: 'Cash Macanaya',
      url: 'https://unsplash.com/@cashmacanaya',
    },
  },
  {
    name: 'Gioele',
    base: 'photo-1635622840764-a1e78449c383',
    author: {
      name: 'Gioele Fazzeri',
      url: 'https://unsplash.com/@gioele_fazzeri_89',
    },
  },
  {
    name: 'Round-2',
    base: 'vector-1739809756512-12bf17cfb925',
    author: { name: 'Round Icons', url: 'https://unsplash.com/@roundicons' },
  },
  {
    name: 'Round-3',
    base: 'vector-1738925523359-31a95a2792e3',
    author: { name: 'Round Icons', url: 'https://unsplash.com/@roundicons' },
  },
  {
    name: 'Jan',
    base: 'photo-1612038529168-4f07c57b5e08',
    author: { name: 'Jan Kopřiva', url: 'https://unsplash.com/@jxk' },
  },
  {
    name: 'Vitaliy',
    base: 'photo-1785879768819-c95a43eb20e7',
    author: {
      name: 'Vitaliy Shevchenko',
      url: 'https://unsplash.com/@vitaliyshev89',
    },
  },
  {
    name: 'Abbat',
    base: 'photo-1635606158660-523e7d89e5b3',
    author: { name: 'Abbat', url: 'https://unsplash.com/@abbat' },
  },
  {
    name: 'Anna',
    base: 'photo-1686747519565-a58b865f2961',
    author: { name: 'Anna Saveleva', url: 'https://unsplash.com/@paneva' },
  },
  {
    name: 'iggii',
    base: 'photo-1597857552457-338c8bfa0756',
    author: { name: 'iggii', url: 'https://unsplash.com/@iggii' },
  },
  {
    name: 'Daniel',
    base: 'photo-1544501616-6c71ff5438ec',
    author: {
      name: 'Daniel Lincoln',
      url: 'https://unsplash.com/@danny_lincoln',
    },
  },
  {
    name: 'Andrea',
    base: 'photo-1601169436310-7daf100c413e',
    author: {
      name: 'Andrea Puglisi',
      url: 'https://unsplash.com/@tairagoodsnow',
    },
  },
  {
    name: 'Adrian',
    base: 'photo-1756982609894-9c11d8225e0d',
    author: { name: 'Adrian Henry', url: 'https://unsplash.com/@adrianhenry' },
  },
  {
    name: 'Sander-2',
    base: 'photo-1618425978767-c0b3b9205423',
    author: {
      name: 'Sander Sammy',
      url: 'https://unsplash.com/@sammywilliams',
    },
  },
  {
    name: 'JJ',
    base: 'photo-1572337382669-5896358c14fe',
    author: { name: 'JJ Jordan', url: 'https://unsplash.com/@jjjordan' },
  },
].map((token) => ({
  ...token,
  url: `https://images.unsplash.com/${token.base}?w=150&auto=format&fit=crop&q=80`,
}));

type CategoryTab = 'tokens' | 'props' | 'monsters' | 'characters';

export const TokenPickerModal: React.FC<TokenPickerModalProps> = ({
  onClose,
  onCreateToken,
  isGm = true,
  loadCharacters,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('tokens');
  const [tokenName, setTokenName] = useState('Hero');
  const [size, setSize] = useState(1);
  const [isProp, setIsProp] = useState(false);
  const [currentHp, setCurrentHp] = useState<number | undefined>(20);
  const [maxHp, setMaxHp] = useState<number | undefined>(20);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Attached metadata from selected card
  const [selectedCharacter, setSelectedCharacter] = useState<any>(undefined);
  const [selectedMonster, setSelectedMonster] = useState<any>(undefined);
  const [propWidth, setPropWidth] = useState<number | undefined>(undefined);
  const [propHeight, setPropHeight] = useState<number | undefined>(undefined);

  const [allAssets, setAllAssets] = useState<StoredAsset[]>([]);
  const [savedCharacters, setSavedCharacters] = useState<
    SavedCharacterRecord[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const assets = await getAllAssets();
        setAllAssets(assets);
        if (loadCharacters) {
          setSavedCharacters(loadCharacters(isGm));
        }
      } catch (err) {
        console.warn('Failed to load assets for token picker:', err);
      }
    })();
  }, [isGm, loadCharacters]);

  // Derived asset lists
  const tokenAssets = allAssets.filter(
    (a) =>
      a.type === 'token' &&
      !a.monsterData &&
      (!a.character || !a.character.actions),
  );
  const propAssets = allAssets.filter((a) => a.type === 'prop' || a.isProp);
  const monsterAssets = allAssets.filter((a) =>
    Boolean(
      a.monsterData ||
      (a.type as string) === 'monster' ||
      (a.character && a.character.actions),
    ),
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      if (!tokenName || tokenName === 'Hero') {
        setTokenName(cleanName);
      }
      const shouldBeProp = activeCategory === 'props';
      setIsProp(shouldBeProp);

      // Persist to indexedDB asset library
      await saveAsset({
        id: crypto.randomUUID(),
        name: cleanName,
        type: shouldBeProp ? 'prop' : 'token',
        dataUrl,
        isProp: shouldBeProp,
        layer: shouldBeProp ? 'prop' : 'token',
        createdAt: Date.now(),
      });
      const updated = await getAllAssets();
      setAllAssets(updated);
    };
    reader.readAsDataURL(file);
  };

  const selectPreset = (preset: { name: string; url: string }) => {
    setSelectedImage(preset.url);
    setTokenName(preset.name);
    setIsProp(false);
    setSelectedCharacter(undefined);
    setSelectedMonster(undefined);
  };

  const selectAsset = (asset: StoredAsset) => {
    setSelectedImage(asset.dataUrl);
    setTokenName(asset.name);
    const assetIsProp = asset.type === 'prop' || Boolean(asset.isProp);
    setIsProp(assetIsProp);
    if (asset.size) setSize(asset.size);
    if (asset.maxHp !== undefined) {
      setMaxHp(asset.maxHp);
      setCurrentHp(asset.maxHp);
    } else if (assetIsProp) {
      setMaxHp(0);
      setCurrentHp(0);
    }
    if (asset.propWidth) setPropWidth(asset.propWidth);
    if (asset.propHeight) setPropHeight(asset.propHeight);
    setSelectedMonster(asset.monsterData);
    setSelectedCharacter(asset.character);
  };

  const selectCharacter = (charRecord: SavedCharacterRecord) => {
    const char = charRecord.charData;
    setSelectedImage(char.avatarUrl || charRecord.avatarUrl || '');
    setTokenName(char.name || charRecord.name || 'Hero');
    setIsProp(false);
    setSize(1);
    const hp = char.currentHp ?? char.maxHp ?? 20;
    setCurrentHp(hp);
    setMaxHp(char.maxHp ?? 20);
    setSelectedCharacter(char);
    setSelectedMonster(undefined);
  };

  const handleConfirm = () => {
    onCreateToken({
      name: tokenName.trim() || 'New Token',
      imageUrl: selectedImage || undefined,
      size,
      isProp,
      layer: isProp ? 'prop' : 'token',
      currentHp,
      maxHp,
      character: selectedCharacter,
      monsterData: selectedMonster,
      propWidth,
      propHeight,
    });
    onClose();
  };

  const q = searchQuery.toLowerCase().trim();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={22} color="var(--accent-primary)" />
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  margin: 0,
                }}
              >
                Add Token or Prop
              </h2>
              <div
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}
              >
                Add tokens, props, monsters, or characters to the active map
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Categories Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '0 0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            className={`tab-btn ${activeCategory === 'tokens' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('tokens');
              setIsProp(false);
            }}
            style={{
              padding: '0.65rem 0.9rem',
              border: 'none',
              background: 'none',
              color:
                activeCategory === 'tokens'
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
              borderBottom:
                activeCategory === 'tokens'
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.85rem',
            }}
          >
            <User size={15} /> Tokens (
            {tokenAssets.length + PRESET_TOKENS.length})
          </button>

          <button
            className={`tab-btn ${activeCategory === 'props' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('props');
              setIsProp(true);
            }}
            style={{
              padding: '0.65rem 0.9rem',
              border: 'none',
              background: 'none',
              color:
                activeCategory === 'props'
                  ? '#eab308'
                  : 'var(--text-secondary)',
              borderBottom:
                activeCategory === 'props'
                  ? '2px solid #eab308'
                  : '2px solid transparent',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.85rem',
            }}
          >
            <Package size={15} /> Props ({propAssets.length})
          </button>

          {(isGm || monsterAssets.length > 0) && (
            <button
              className={`tab-btn ${activeCategory === 'monsters' ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory('monsters');
                setIsProp(false);
              }}
              style={{
                padding: '0.65rem 0.9rem',
                border: 'none',
                background: 'none',
                color:
                  activeCategory === 'monsters'
                    ? 'var(--accent-rose)'
                    : 'var(--text-secondary)',
                borderBottom:
                  activeCategory === 'monsters'
                    ? '2px solid var(--accent-rose)'
                    : '2px solid transparent',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.85rem',
              }}
            >
              <Skull size={15} /> Monsters ({monsterAssets.length})
            </button>
          )}

          <button
            className={`tab-btn ${activeCategory === 'characters' ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('characters');
              setIsProp(false);
            }}
            style={{
              padding: '0.65rem 0.9rem',
              border: 'none',
              background: 'none',
              color:
                activeCategory === 'characters'
                  ? '#818cf8'
                  : 'var(--text-secondary)',
              borderBottom:
                activeCategory === 'characters'
                  ? '2px solid #818cf8'
                  : '2px solid transparent',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.85rem',
            }}
          >
            <Shield size={15} /> Characters ({savedCharacters.length})
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
          }}
        >
          {/* Selected Preview & Custom Details */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: isProp ? 'var(--radius-sm)' : '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '2px solid var(--accent-primary)',
                backgroundImage: selectedImage
                  ? `url("${selectedImage}")`
                  : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {!selectedImage &&
                (isProp ? (
                  <Package size={22} color="var(--text-muted)" />
                ) : (
                  <User size={22} color="var(--text-muted)" />
                ))}
            </div>

            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Hero, Barrel, Ankheg"
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.85rem',
                    marginTop: '2px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Size (Tiles)
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'white',
                    fontSize: '0.85rem',
                    marginTop: '2px',
                  }}
                >
                  <option value={1}>1×1 (Medium)</option>
                  <option value={2}>2×2 (Large)</option>
                  <option value={3}>3×3 (Huge)</option>
                  <option value={4}>4×4 (Gargantuan)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search & Upload Action Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder={`Search ${activeCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.6rem 0.4rem 2rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                }}
              />
            </div>

            <label
              className="btn btn-secondary"
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
              }}
            >
              <Upload size={14} /> Upload Custom Image...
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Grid Selection by Tab */}
          {activeCategory === 'tokens' && (
            <div>
              {/* Uploaded Token Library */}
              {tokenAssets.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Your Saved Tokens
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(70px, 1fr))',
                      gap: '0.6rem',
                    }}
                  >
                    {tokenAssets
                      .filter((a) => !q || a.name.toLowerCase().includes(q))
                      .map((asset) => {
                        const isSel = selectedImage === asset.dataUrl;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => selectAsset(asset)}
                            onDoubleClick={handleConfirm}
                            style={{
                              width: '70px',
                              height: '70px',
                              borderRadius: '50%',
                              border: isSel
                                ? '2px solid var(--accent-primary)'
                                : '1px solid var(--border-subtle)',
                              backgroundImage: `url("${asset.dataUrl}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              cursor: 'pointer',
                              position: 'relative',
                              boxShadow: isSel
                                ? '0 0 10px var(--accent-primary)'
                                : 'none',
                            }}
                            title={asset.name}
                          >
                            {isSel && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  backgroundColor: 'var(--accent-primary)',
                                  borderRadius: '50%',
                                  width: 18,
                                  height: 18,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Check size={12} color="#fff" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Preset Tokens */}
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.4rem',
                  }}
                >
                  Preset Portraits
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                    gap: '0.6rem',
                  }}
                >
                  {PRESET_TOKENS.filter(
                    (p) => !q || p.name.toLowerCase().includes(q),
                  ).map((preset) => {
                    const isSel = selectedImage === preset.url;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => selectPreset(preset)}
                        onDoubleClick={handleConfirm}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          border: isSel
                            ? '2px solid var(--accent-primary)'
                            : '1px solid var(--border-subtle)',
                          backgroundImage: `url("${preset.url}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: isSel
                            ? '0 0 10px var(--accent-primary)'
                            : 'none',
                        }}
                        title={preset.name}
                      >
                        {isSel && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              backgroundColor: 'var(--accent-primary)',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={12} color="#fff" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'props' && (
            <div>
              {propAssets.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  No props uploaded yet. Click Upload Custom Image above or drag
                  props into the Asset Manager!
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))',
                    gap: '0.6rem',
                  }}
                >
                  {propAssets
                    .filter((a) => !q || a.name.toLowerCase().includes(q))
                    .map((asset) => {
                      const isSel = selectedImage === asset.dataUrl;
                      return (
                        <div
                          key={asset.id}
                          onClick={() => selectAsset(asset)}
                          onDoubleClick={handleConfirm}
                          style={{
                            width: '75px',
                            height: '75px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSel
                              ? '2px solid #eab308'
                              : '1px solid var(--border-subtle)',
                            backgroundImage: `url("${asset.dataUrl}")`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: isSel ? '0 0 10px #eab308' : 'none',
                          }}
                          title={asset.name}
                        >
                          {isSel && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                backgroundColor: '#eab308',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={12} color="#000" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {activeCategory === 'monsters' && (
            <div>
              {monsterAssets.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  No monsters uploaded yet. Drag a TetraCube .monster file into
                  the board or Asset Manager!
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.6rem',
                  }}
                >
                  {monsterAssets
                    .filter((a) => !q || a.name.toLowerCase().includes(q))
                    .map((asset) => {
                      const isSel = selectedImage === asset.dataUrl;
                      return (
                        <div
                          key={asset.id}
                          onClick={() => selectAsset(asset)}
                          onDoubleClick={handleConfirm}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            border: isSel
                              ? '2px solid var(--accent-rose)'
                              : '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              backgroundImage: `url("${asset.dataUrl}")`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#3f1d24',
                            }}
                          />
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {asset.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            HP {asset.maxHp || 20} • AC {asset.armorClass || 12}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {activeCategory === 'characters' && (
            <div>
              {savedCharacters.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  No characters saved yet. Create or import a character sheet in
                  the Characters menu!
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '0.6rem',
                  }}
                >
                  {savedCharacters
                    .filter(
                      (c) => !q || (c.name || '').toLowerCase().includes(q),
                    )
                    .map((charRecord) => {
                      const char = charRecord.charData;
                      const avatar = char.avatarUrl || charRecord.avatarUrl;
                      const isSel = selectedImage === avatar;
                      return (
                        <div
                          key={charRecord.id}
                          onClick={() => selectCharacter(charRecord)}
                          onDoubleClick={handleConfirm}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            border: isSel
                              ? '2px solid #818cf8'
                              : '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '50%',
                              backgroundImage: avatar
                                ? `url("${avatar}")`
                                : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: '#1e1b4b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {!avatar && <User size={20} color="#818cf8" />}
                          </div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              textAlign: 'center',
                              width: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {char.name || charRecord.name || 'Hero'}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            HP {char.currentHp ?? char.maxHp ?? 20} •{' '}
                            {char.classes?.[0] || 'Hero'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.9rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => {
              onCreateToken({
                name: tokenName.trim() || 'New Token',
                size,
                isProp,
                layer: isProp ? 'prop' : 'token',
              });
              onClose();
            }}
          >
            Create without Image
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirm}>
              Place on Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
