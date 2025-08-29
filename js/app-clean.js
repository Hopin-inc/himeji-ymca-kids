import { APP_CONFIG, EVENTS } from './config/constants.js';
import { createAppEventEmitter, APP_EVENTS } from './utils/EventEmitter.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { AppInitializer } from './core/AppInitializer.js';
import { PhotoRenderer } from './modules/PhotoRenderer.js';
import { PhotoModal } from './modules/PhotoModal.js';
import { FeedbackDialog } from './modules/FeedbackDialog.js';

/**
 * 🎯 リファクタリング済みメインアプリケーションクラス
 * 単一責任原則に基づき、各機能を専門クラスに委譲
 * より保守しやすく、テストしやすい構造を実現
 */
class PhotoMapApp {
    constructor() {
        console.log('🏗️ PhotoMapApp constructor called (Clean Architecture)');
        
        // コア依存性の初期化
        this.eventBus = createAppEventEmitter();
        this.eventBus.setDebugMode(false);
        
        // 専門モジュールの初期化
        this.initializer = new AppInitializer(this.eventBus);
        this.managers = {};
        this.analytics = null;
        this.progressManager = null;
        
        // UI専門クラス
        this.photoRenderer = null;
        this.photoModal = null;
        this.feedbackDialog = null;
        
        console.log('🎯 EventBus created, starting clean initialization...');
        this.init();
    }

    /**
     * 🚀 アプリケーション初期化（責任分離版）
     */
    async init() {
        try {
            // AppInitializerに初期化を委譲
            this.managers = await this.initializer.initialize();
            this.analytics = this.initializer.getAnalytics();
            this.progressManager = this.initializer.getProgressManager();
            
            // UI専門クラスを初期化
            this.initializeUIModules();
            
            // イベントハンドリングを設定
            this.setupEventHandlers();
            
            console.log('✨ Clean PhotoMapApp initialization completed');
            
        } catch (error) {
            console.error('❌ Clean initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * UI専門モジュールの初期化
     */
    initializeUIModules() {
        // 写真レンダリング専門クラス
        this.photoRenderer = new PhotoRenderer(this.eventBus, this.analytics);
        
        // 写真モーダル専門クラス  
        this.photoModal = new PhotoModal(this.analytics);
        
        // 感想収集ダイアログ
        this.feedbackDialog = new FeedbackDialog(this.analytics);
        // 実際のGoogleフォームURLに置き換えてください
        this.feedbackDialog.setGoogleFormUrl('https://forms.gle/YOUR_ACTUAL_FORM_ID');
        
        console.log('🎨 UI modules initialized');
    }

    /**
     * 🎯 イベントハンドラの設定（簡潔版）
     */
    setupEventHandlers() {
        // データ関連イベント
        this.setupDataEvents();
        
        // 地図関連イベント
        this.setupMapEvents();
        
        // マーカー関連イベント
        this.setupMarkerEvents();
        
        // UI関連イベント
        this.setupUIEvents();
        
        // 写真関連イベント
        this.setupPhotoEvents();
        
        // エラー関連イベント
        this.setupErrorEvents();
        
        // 直接的なUI操作ハンドラ
        this.setupDirectUIHandlers();
        
        console.log('🔗 All event handlers configured');
    }

    /**
     * データ関連イベント
     */
    setupDataEvents() {
        this.eventBus.on(APP_EVENTS.DATA_LOADED, (eventData) => {
            console.log('📊 Data loaded successfully:', eventData.data);
            this.eventBus.emit(APP_EVENTS.MARKERS_UPDATED);
        });

        this.eventBus.on(APP_EVENTS.DATA_ERROR, (eventData) => {
            console.error('📊 Data loading failed:', eventData.data);
        });
    }

    /**
     * 地図関連イベント
     */
    setupMapEvents() {
        this.eventBus.on(APP_EVENTS.MAP_ZOOM_CHANGED, () => {
            this.managers.markerManager?.handleZoomChange();
        });

        this.eventBus.on(APP_EVENTS.MAP_CLICKED, () => {
            // マーカー選択を解除
            this.managers.markerManager?.deselectAllMarkers();
            this.eventBus.emit(APP_EVENTS.AREA_SELECTED, null);
        });

        this.eventBus.on(APP_EVENTS.MAP_LOCATION_SELECTED, (eventData) => {
            this.managers.uiManager?.updateLocationDisplay(eventData.data);
        });

        this.eventBus.on(APP_EVENTS.MAP_LOCATION_SELECTION_CANCELLED, () => {
            this.managers.uiManager?.hideAddPhotoModal();
        });
    }

    /**
     * マーカー関連イベント
     */
    setupMarkerEvents() {
        this.eventBus.on(APP_EVENTS.MARKER_CLICKED, (eventData) => {
            const { cluster, marker } = eventData.data;
            this.analytics?.trackMapInteraction('marker_click', {
                area_name: cluster.name,
                photos_count: this.managers.dataManager?.getPhotosInArea(cluster).length
            });
            
            this.selectArea(cluster, marker);
            this.eventBus.emit(APP_EVENTS.AREA_SELECTED, cluster);
        });

        this.eventBus.on(APP_EVENTS.MARKERS_UPDATED, () => {
            this.managers.markerManager?.refreshAreaMarkers();
        });
    }

    /**
     * UI関連イベント
     */
    setupUIEvents() {
        this.eventBus.on(APP_EVENTS.AREA_SELECTED, (eventData) => {
            const data = eventData.data;
            if (data) {
                this.managers.uiManager?.showAreaInfo(data);
            } else {
                this.managers.uiManager?.hideAreaInfo();
                // エリア選択解除時にマーカーの強調表示も解除
                this.managers.markerManager?.deselectAllMarkers();
            }
        });

        // 写真投稿機能は感想収集に変更されたため削除

        this.eventBus.on(APP_EVENTS.DISPLAY_MODE_CHANGED, (eventData) => {
            const { mode, page } = eventData.data;
            
            this.analytics?.trackUserAction('display_mode_change', 'ui', {
                new_mode: mode,
                page: page
            });
            
            this.refreshPhotoDisplay(mode, page);
        });
    }

    /**
     * 写真関連イベント
     */
    setupPhotoEvents() {
        this.eventBus.on(APP_EVENTS.PHOTO_CLICKED, (eventData) => {
            const photo = eventData.data || eventData;
            console.log('📸 Photo clicked:', photo.title);
            
            // PhotoModalクラスに委譲
            this.photoModal.show(photo);
        });
    }

    /**
     * エラー関連イベント
     */
    setupErrorEvents() {
        this.eventBus.on(APP_EVENTS.ERROR_OCCURRED, (eventData) => {
            console.error('🚨 Application error:', eventData.data);
        });
    }

    /**
     * 直接的なUI操作ハンドラ
     */
    setupDirectUIHandlers() {
        if (!this.managers.uiManager) return;

        this.managers.uiManager.addEventListener('centerMap', () => {
            this.managers.mapManager?.centerMapOnLocation();
        });

        this.managers.uiManager.addEventListener('selectLocation', () => {
            this.managers.uiManager.hideAddPhotoModal();
            this.managers.mapManager?.startLocationSelection();
        });

        this.managers.uiManager.addEventListener('cancelLocationSelection', () => {
            this.managers.mapManager?.cancelLocationSelection();
            this.managers.uiManager.showAddPhotoModal();
        });

        this.managers.uiManager.addEventListener('refreshPhotos', (mode, page) => {
            this.refreshPhotoDisplay(mode, page);
        });

        // 感想収集ボタンのイベントリスナー
        const feedbackBtn = document.getElementById('feedbackBtn');
        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => {
                console.log('💬 Feedback button clicked');
                this.feedbackDialog.show();
            });
        }
    }

    /**
     * エリア選択処理
     */
    selectArea(area, marker) {
        if (!area) {
            console.warn('⚠️ No area data provided to selectArea');
            return;
        }
        
        if (area.isCluster) {
            const zoom = Math.min(this.managers.mapManager.getZoom() + 2, APP_CONFIG.MAP.MAX_ZOOM);
            this.managers.mapManager.centerMapOnLocation(area.center_lat, area.center_lng, zoom);
        }
    }

    /**
     * 写真表示の更新（PhotoRendererに委譲）
     */
    refreshPhotoDisplay(mode = 'grid', page = 1) {
        console.log(`📱 Refreshing photo display: ${mode} mode, page ${page}`);
        
        if (!this.managers.uiManager?.selectedArea || !this.managers.dataManager) {
            console.warn('⚠️ No area selected or DataManager not available');
            return;
        }

        const photosInArea = this.managers.dataManager.getPhotosInArea(this.managers.uiManager.selectedArea);
        console.log(`🔍 Found ${photosInArea.length} photos in area after filtering`);
        
        // PhotoRendererクラスに委譲
        this.photoRenderer.updateDisplayMode(mode, page);
        this.photoRenderer.renderPhotos(photosInArea, mode, page);
    }

    /**
     * 感想収集ダイアログを表示
     */
    showFeedbackDialog() {
        console.log('💬 Showing feedback dialog...');
        this.feedbackDialog.show();
    }

    /**
     * 初期化エラーの処理
     */
    handleInitializationError(error) {
        if (this.progressManager) {
            this.progressManager.showError(
                `初期化中にエラーが発生しました: ${error.message}`
            );
        } else {
            this.showProductionError(error);
        }
    }

    /**
     * プロダクション環境でのエラー表示
     */
    showProductionError(error) {
        const errorPanel = document.createElement('div');
        errorPanel.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9); color: white; padding: 30px;
            border-radius: 15px; z-index: 10000; max-width: 90%; text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        errorPanel.innerHTML = `
            <h3>⚠️ アプリケーションエラー</h3>
            <p>申し訳ありません。アプリケーションの初期化中にエラーが発生しました。</p>
            <p>ページを再読み込みしてもう一度お試しください。</p>
            <button onclick="window.location.reload()" style="
                margin-top: 15px; padding: 10px 20px; background: white;
                color: #d32f2f; border: none; border-radius: 8px;
                cursor: pointer; font-weight: bold;
            ">再読み込み</button>
        `;

        document.body.appendChild(errorPanel);
    }
}

/**
 * アプリケーション開始処理
 */
function startApp() {
    console.log('📄 Starting Clean PhotoMapApp...');
    
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library not loaded');
        return;
    }
    
    console.log('✅ Leaflet library loaded:', L.version);
    
    console.log('⏰ Waiting for potential Cloudflare challenges to complete...');
    setTimeout(() => {
        console.log('🚀 Creating Clean PhotoMapApp instance...');
        const app = new PhotoMapApp();
        console.log('✅ Clean PhotoMapApp instance created:', app);
    }, APP_CONFIG.UI.LOADING_DELAY_MS);
}

// DOMが既に読み込み済みかチェック
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}