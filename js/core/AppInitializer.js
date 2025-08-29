import { APP_CONFIG } from '../config/constants.js';
import { DataManager } from '../modules/DataManager.js';
import { MapManager } from '../modules/MapManager.js';
import { MarkerManager } from '../modules/MarkerManager.js';
import { UIManager } from '../modules/UIManager.js';
import { ProgressManager } from '../utils/ProgressManager.js';
import { Analytics } from '../utils/Analytics.js';

/**
 * アプリケーション初期化処理を専門に扱うクラス
 * 複雑な初期化ロジックを整理し、責任を分離
 */
export class AppInitializer {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.managers = {};
        this.analytics = null;
        this.progressManager = null;
    }

    /**
     * アプリケーション全体の初期化
     */
    async initialize() {
        try {
            console.log('🚀 PhotoMapApp initialization started (Refactored Version)');
            this.logEnvironmentInfo();

            await this.initializeAnalytics();
            await this.initializeProgress();
            await this.initializeDataLayer();
            await this.initializeMapLayer();
            await this.initializeUILayer();
            await this.finalizeInitialization();

            return this.managers;

        } catch (error) {
            console.error('❌ Initialization error:', error);
            await this.handleInitializationError(error);
        }
    }

    /**
     * 環境情報をログ出力
     */
    logEnvironmentInfo() {
        console.log('📍 Environment check:', {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            userAgent: navigator.userAgent.substring(0, 100) + '...'
        });
    }

    /**
     * アナリティクスの初期化
     */
    async initializeAnalytics() {
        console.log('📊 Initializing Analytics...');
        this.analytics = new Analytics();
        this.analytics.trackPageView('taishi_no_ashita');
    }

    /**
     * 進捗管理の初期化
     */
    async initializeProgress() {
        console.log('🔄 Initializing ProgressManager...');
        this.progressManager = new ProgressManager();
        console.log('✅ ProgressManager initialized');
    }

    /**
     * データレイヤーの初期化
     */
    async initializeDataLayer() {
        this.progressManager.startStep(0); // データ読み込み
        console.log('📊 Initializing data management...');
        
        this.managers.dataManager = new DataManager();
        this.managers.dataManager.eventBus = this.eventBus;
        await this.managers.dataManager.loadData();
        
        this.progressManager.updateStepProgress(100);
    }

    /**
     * 地図レイヤーの初期化
     */
    async initializeMapLayer() {
        this.progressManager.startStep(1); // 地図準備
        console.log('🗺️ Initializing map...');
        
        this.managers.mapManager = new MapManager('map');
        await this.managers.mapManager.initMap();
        this.progressManager.updateStepProgress(70);

        console.log('📍 Initializing markers...');
        this.managers.markerManager = new MarkerManager(
            this.managers.mapManager.getMap(), 
            this.managers.dataManager, 
            this.eventBus
        );
        this.progressManager.updateStepProgress(100);
    }

    /**
     * UIレイヤーの初期化
     */
    async initializeUILayer() {
        this.progressManager.startStep(2); // 画像準備
        console.log('🎛️ Initializing UI...');
        
        this.managers.uiManager = new UIManager(this.managers.dataManager);
        this.managers.uiManager.eventBus = this.eventBus;
        this.progressManager.updateStepProgress(30);

        console.log('🔗 Setting up event handlers...');
        this.progressManager.updateStepProgress(50);

        console.log('🎯 Adding markers...');
        await this.managers.markerManager.addAreaMarkers();
        this.progressManager.updateStepProgress(80);

        console.log('🎛️ Setting up UI event listeners...');
        this.managers.uiManager.initEventListeners();
        this.progressManager.updateStepProgress(100);
    }

    /**
     * 初期化の最終化
     */
    async finalizeInitialization() {
        console.log('✅ All initialization completed!');
        this.progressManager.completeAll();
        
        this.trackPerformanceMetrics();
        this.runPostInitializationTests();
        
        console.log('🎉 PhotoMapApp initialization completed successfully');
    }

    /**
     * パフォーマンス統計の記録
     */
    trackPerformanceMetrics() {
        const initTime = performance.now() - this.analytics.startTime;
        this.analytics.trackPerformance('app_initialization', Math.round(initTime), 'ms');
        this.analytics.trackEvent('app_ready', {
            photos_count: this.managers.dataManager.photos.length,
            areas_count: this.managers.dataManager.areas.length
        });
    }

    /**
     * 初期化後のテスト実行
     */
    runPostInitializationTests() {
        setTimeout(() => {
            const areas = this.managers.dataManager.areas.filter(area => area.is_active);
            if (areas.length > 0) {
                console.log('🔍 Testing scroll with area:', areas[0].name);
                this.managers.markerManager.handleMarkerClick(areas[0], null);
            }
        }, 2000);
    }

    /**
     * 初期化エラーの処理
     */
    async handleInitializationError(error) {
        console.error('Error stack:', error.stack);
        
        if (this.progressManager) {
            this.progressManager.showError(
                `初期化中にエラーが発生しました: ${error.message}`
            );
        }
        
        try {
            console.log('🔄 Attempting fallback initialization...');
            await this.fallbackInitialization();
        } catch (fallbackError) {
            console.error('❌ Fallback initialization also failed:', fallbackError);
            this.showCriticalError(error);
        }
    }

    /**
     * フォールバック初期化
     */
    async fallbackInitialization() {
        console.log('🔄 Running fallback initialization...');
        
        // 最小限のマップ初期化
        if (!this.managers.mapManager) {
            this.managers.mapManager = new MapManager('map');
            await this.managers.mapManager.initMap();
        }

        // 最小限のUI初期化
        if (!this.managers.uiManager) {
            this.managers.uiManager = new UIManager(null);
            this.managers.uiManager.initEventListeners();
        }

        this.managers.uiManager.hideLoading();
        this.showFallbackMessage();
    }

    /**
     * フォールバックメッセージの表示
     */
    showFallbackMessage() {
        const fallbackPanel = document.createElement('div');
        fallbackPanel.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95); color: white; padding: 30px;
            border-radius: 15px; z-index: 10000; max-width: 90%;
            text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
        `;

        fallbackPanel.innerHTML = `
            <h3>🗺️ マップが利用可能です</h3>
            <p>データの読み込みに問題がありましたが、<br>基本的なマップ機能は使用できます。</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 15px; padding: 10px 20px; background: #007AFF;
                color: white; border: none; border-radius: 8px; cursor: pointer;
            ">OK</button>
        `;

        document.body.appendChild(fallbackPanel);
        setTimeout(() => fallbackPanel.remove?.(), 10000);
    }

    /**
     * 致命的エラーの表示
     */
    showCriticalError(error) {
        if (this.progressManager) {
            this.progressManager.showError(
                'アプリケーションの初期化に失敗しました。ページを再読み込みしてください。'
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

    /**
     * ゲッター
     */
    getAnalytics() { return this.analytics; }
    getProgressManager() { return this.progressManager; }
}