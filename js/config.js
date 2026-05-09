const getDebugFlag = () => {
  try {
    return Boolean(globalThis.__CET46_DEBUG__);
  } catch (error) {
    return false;
  }
};

export const CONFIG = {
  VERSION: '1.3.2',
  SCHEMA_VERSION: '1.0',

  DEBUG: getDebugFlag(),
  
  CORS_PROXIES: [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ],
  
  AUDIO_BASE_URL: 'https://dict.youdao.com/dictvoice',
  
  MAX_ACTION_STACK: 20,
  CIRCADIAN_MIN_SAMPLES: 100,
  
  DB_NAME: 'CET46_DB',
  DB_VERSION: 2,
  
  CACHE_NAME: 'cet46-v1.3.5',
  AUDIO_CACHE_NAME: 'cet46-audio-cache',
  MAX_AUDIO_CACHE_ITEMS: 500,
  MAX_CACHE_ITEMS: 8000,
  
  FSRS: {
    DEFAULT_EF: 2.5,
    MIN_EF: 1.3,
    MAX_EF: 3.0,
    TARGET_RETENTION: 0.9,
    DEFAULT_W: [
      0.4025, 1.4612, 3.3458, 15.6941, 5.3611, 0.9971, 0.8807, 
      0.0424, 1.4946, 0.144, 0.9995, 2.2107, 0.0578, 0.3267, 
      1.2691, 0.2314, 2.0583
    ]
  },
  
  STORAGE_KEYS: {
    FSRS_WEIGHTS: 'cet46_fsrs_weights',
    WEBDAV_CONFIG: 'cet46_webdav_config',
    THEME: 'cet46_theme',
    LAST_ETAG: 'cet46_last_etag',
    LAST_SYNC: 'cet46_last_sync',
    VECTOR_CLOCK: 'cet46_vector_clock'
  },
  
  RETENTION_THRESHOLDS: {
    HIGH: 90,
    MEDIUM: 70,
    LOW: 50
  },
  
  ITEM_HEIGHT: 80,
  VISIBLE_COUNT: 6,

  FETCH_TIMEOUT: 15000,
  FETCH_RETRIES: 3,
  FETCH_BACKOFF: 1000,
  AUDIO_TIMEOUT: 8000,
  
  TOAST_DURATION: 3000,
  
  CHUNK_SIZE_DB: 500,
  CHUNK_SIZE_WORKER: 100,
  CHUNK_SIZE_VOCAB: 500,
  SYNC_DEBOUNCE_MS: 1000,
  
  LRU_LIMIT_PROGRESS: 1000,
  LRU_LIMIT_WRONGWORDS: 500,
  LRU_LIMIT_HEATMAP: 365,
  
  ALLOWED_CONNECT_DOMAINS: [
    'api.allorigins.win',
    'corsproxy.io',
    'api.codetabs.com',
    'dict.youdao.com',
    'cdn.jsdelivr.net',
    'raw.githubusercontent.com'
  ],

  UI: {
    CARD_FLIP_DELAY: 300,
    VIRTUAL_SCROLL_BUFFER: 10,
    BATCH_SIZE: 500,
    SWIPE_TIME_THRESHOLD: 500,
    SHORTCUT_GUIDE_DELAY: 1000,
    INITIALIZATION_DELAY: 2000,
    ANIMATION_DELAY: 500,
    CELEBRATION_REMOVE_DELAY: 300,
    TIMESTAMP_CHECK_DELAY: 5 * 60 * 1000,
    WEBVITALS_THRESHOLDS: {
      FID: { good: 100, poor: 300 },
      TTFB: { good: 200, poor: 500 },
      FCP: { good: 1000, poor: 3000 }
    }
  },

  MILESTONES: {
    FIRST_500: 500,
    FIRST_1000: 1000
  },

  CONSTANTS: {
    OVERLOAD_THRESHOLD: 200,
    MS_PER_DAY: 24 * 60 * 60 * 1000
  }
};

export const SEMANTIC_CLUSTERS = {
  'abandon': ['desert', 'forsake', 'leave'],
  'ability': ['capability', 'capacity', 'competence'],
  'absorb': ['assimilate', 'digest', 'incorporate'],
  'abstract': ['theoretical', 'conceptual', 'intangible'],
  'accept': ['receive', 'admit', 'acknowledge'],
  'access': ['entry', 'admission', 'approach'],
  'accurate': ['precise', 'exact', 'correct'],
  'achieve': ['accomplish', 'attain', 'fulfill'],
  'acknowledge': ['admit', 'confess', 'recognize'],
  'acquire': ['obtain', 'gain', 'procure'],
  'adapt': ['adjust', 'modify', 'accommodate'],
  'adequate': ['sufficient', 'enough', 'satisfactory'],
  'advantage': ['benefit', 'profit', 'edge'],
  'adventure': ['venture', 'enterprise', 'exploit'],
  'affect': ['influence', 'impact', 'sway'],
  'aggressive': ['assertive', 'forceful', 'militant'],
  'allocate': ['distribute', 'assign', 'allot'],
  'alternative': ['option', 'choice', 'substitute'],
  'ambition': ['aspiration', 'goal', 'aim'],
  'amateur': ['novice', 'beginner', 'nonprofessional']
};

export const CONFUSING_PAIRS = [
  ['abandon', 'abundant'], ['accept', 'except'], ['access', 'excess'],
  ['adapt', 'adopt'], ['affect', 'effect'], ['allusion', 'illusion'],
  ['altar', 'alter'], ['amend', 'emend'], ['assure', 'ensure', 'insure'],
  ['complement', 'compliment'], ['conscience', 'conscious'], ['council', 'counsel'],
  ['dessert', 'desert'], ['device', 'devise'], ['emigrate', 'immigrate'],
  ['farther', 'further'], ['imply', 'infer'], ['loose', 'lose'],
  ['principal', 'principle'], ['stationary', 'stationery'], ['than', 'then']
];
