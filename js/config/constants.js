// Application Configuration Constants
export const APP_CONFIG = {
    // Map configuration
    MAP: {
        CENTER: [34.843, 134.5972], // 太子町中心地点
        ZOOM: 14,  // デフォルトズームを上げる
        MAX_ZOOM: 18,
        MIN_ZOOM: 10,
        CLUSTER_DISTANCE_KM: 2.0,
        CLUSTER_ZOOM_THRESHOLD: 12  // クラスター閾値を下げる（12以下でクラスタリング）
    },
    
    // UI configuration
    UI: {
        PHOTOS_PER_PAGE: 12,
        DEFAULT_DISPLAY_MODE: 'grid', // 'grid' or 'timeline'
        DEFAULT_SORT_ORDER: 'newest',
        LOADING_DELAY_MS: 100
    },
    
    // Marker configuration
    MARKER: {
        DEFAULT_SIZE: 30,
        MIN_SIZE: 20,
        MAX_SIZE: 50,
        SIZE_SCALE_FACTOR: 1.5,
        COLOR: '#007AFF',
        STROKE_WIDTH: 2,
        STROKE_COLOR: 'white'
    },
    
    // Data file paths
    DATA: {
        PHOTOS_FILE: '/data/photos.json',
        AREAS_FILE: '/data/areas.json'
    },
    
    // Error messages
    MESSAGES: {
        INIT_ERROR: '❌ Initialization error:',
        DATA_LOAD_ERROR: '📊 Data loading failed:',
        MAP_INIT_ERROR: '🗺️ Map initialization failed:',
        FALLBACK_MESSAGE: '🔄 Attempting fallback initialization...'
    }
};

// Area categories and their properties
export const AREA_CATEGORIES = {
    '公園': { color: '#32CD32', icon: '🏞️' },
    '観光地': { color: '#FF6347', icon: '🌟' },
    'レストラン': { color: '#FFD700', icon: '🍽️' },
    '文化施設': { color: '#9370DB', icon: '🏛️' },
    '自然': { color: '#00CED1', icon: '🌲' },
    'その他': { color: '#007AFF', icon: '📍' }
};

// Event types for decoupled communication
export const EVENTS = {
    DATA_LOADED: 'dataLoaded',
    MAP_READY: 'mapReady',
    MARKER_CLICKED: 'markerClicked',
    PHOTO_SELECTED: 'photoSelected',
    AREA_SELECTED: 'areaSelected',
    UI_MODE_CHANGED: 'uiModeChanged'
};