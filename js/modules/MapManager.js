import { APP_CONFIG } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * 地図管理を担当するクラス
 * Leafletマップの初期化、タイルレイヤー、コントロール、イベントハンドリングを管理
 */
export class MapManager {
    constructor(containerId = 'map', eventBus = null) {
        this.containerId = containerId;
        this.map = null;
        this.eventHandlers = new Map(); // レガシー互換性
        this.isSelectingLocation = false;
        this.selectedLocation = null;
        this.tempMapClickHandler = null;
        
        // 🎯 EventBus統合
        this.eventBus = eventBus;
    }

    /**
     * 地図を初期化
     */
    async initMap() {
        try {
            console.log('🗺️ Checking map container...');
            const mapContainer = document.getElementById(this.containerId);
            
            if (!mapContainer) {
                throw new Error(`Map container with id '${this.containerId}' not found`);
            }
            
            console.log('✅ Map container found:', mapContainer);
            
            console.log('🌍 Creating Leaflet map instance...');
            console.log('📍 Map config:', APP_CONFIG.MAP);
            
            // Create Leaflet map
            this.map = L.map(this.containerId, {
                center: APP_CONFIG.MAP.CENTER,
                zoom: APP_CONFIG.MAP.ZOOM,
                maxZoom: APP_CONFIG.MAP.MAX_ZOOM,
                minZoom: APP_CONFIG.MAP.MIN_ZOOM,
                zoomControl: false // カスタムコントロールを後で追加
            });
            
            console.log('✅ Leaflet map created successfully');
            
            this.addTileLayer();
            this.addZoomControls();
            this.setupMapEvents();
            
            return this.map;
            
        } catch (error) {
            await ErrorHandler.handle(error, 'MapManager.initMap', {
                level: ErrorHandler.ERROR_LEVELS.FATAL,
                category: ErrorHandler.ERROR_CATEGORIES.MAP,
                showToUser: true,
                component: 'MapManager'
            });
            throw error;
        }
    }

    /**
     * タイルレイヤーを追加
     */
    addTileLayer() {
        console.log('🗺️ Adding tile layer...');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: APP_CONFIG.MAP.MAX_ZOOM
        }).addTo(this.map);
        
        console.log('✅ Tile layer added');
    }

    /**
     * ズームコントロールを追加
     */
    addZoomControls() {
        console.log('🎛️ Adding zoom controls...');
        
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);
    }

    /**
     * 地図イベントを設定
     */
    setupMapEvents() {
        // ズーム変更イベント
        this.map.on('zoomend', () => {
            const handler = this.eventHandlers.get('zoomChange');
            if (handler) {
                handler(this.map.getZoom());
            }
        });

        // 地図クリックイベント
        this.map.on('click', (e) => {
            // 位置選択モード中の処理
            if (this.isSelectingLocation) {
                this.handleLocationSelection(e);
                return;
            }

            // 通常の地図クリック処理
            const handler = this.eventHandlers.get('mapClick');
            if (handler) {
                handler(e);
            }
        });

        // リサイズイベント
        window.addEventListener('resize', () => {
            setTimeout(() => this.map.invalidateSize(), 100);
        });
    }

    /**
     * 位置選択を開始
     */
    startLocationSelection() {
        console.log('📍 Starting location selection mode');
        this.isSelectingLocation = true;
        
        // カーソルスタイルを変更
        document.getElementById('map').style.cursor = 'crosshair';
        
        // 一時的なクリックハンドラを追加
        this.tempMapClickHandler = (e) => {
            this.handleLocationSelection(e);
        };
    }

    /**
     * 位置選択を処理
     */
    handleLocationSelection(e) {
        const { lat, lng } = e.latlng;
        console.log(`📍 Location selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        this.selectedLocation = { lat, lng };
        
        // 位置選択モードを終了
        this.endLocationSelection();
        
        // 位置選択完了イベントを発火
        const handler = this.eventHandlers.get('locationSelected');
        if (handler) {
            handler(this.selectedLocation);
        }
    }

    /**
     * 位置選択を終了
     */
    endLocationSelection() {
        console.log('📍 Ending location selection mode');
        this.isSelectingLocation = false;
        
        // カーソルスタイルを元に戻す
        document.getElementById('map').style.cursor = '';
        
        this.tempMapClickHandler = null;
    }

    /**
     * 位置選択をキャンセル
     */
    cancelLocationSelection() {
        console.log('📍 Cancelling location selection');
        this.endLocationSelection();
        this.selectedLocation = null;
        
        const handler = this.eventHandlers.get('locationSelectionCancelled');
        if (handler) {
            handler();
        }
    }

    /**
     * 地図を指定の位置にセンタリング
     */
    centerMapOnLocation(lat = APP_CONFIG.MAP.CENTER[0], lng = APP_CONFIG.MAP.CENTER[1], zoom = APP_CONFIG.MAP.ZOOM) {
        console.log(`🎯 Centering map on: ${lat}, ${lng} (zoom: ${zoom})`);
        this.map.setView([lat, lng], zoom);
    }

    /**
     * 地図のバウンズを設定
     */
    fitBounds(bounds, options = {}) {
        this.map.fitBounds(bounds, options);
    }

    /**
     * 一時的なマーカーを追加（位置選択時など）
     */
    addTemporaryMarker(lat, lng, options = {}) {
        const marker = L.marker([lat, lng], options).addTo(this.map);
        
        // 自動削除タイマー（オプション）
        if (options.autoRemove) {
            setTimeout(() => {
                this.map.removeLayer(marker);
            }, options.autoRemove);
        }
        
        return marker;
    }

    /**
     * レイヤーを追加
     */
    addLayer(layer) {
        if (this.map && layer) {
            layer.addTo(this.map);
            return layer;
        }
        return null;
    }

    /**
     * レイヤーを削除
     */
    removeLayer(layer) {
        if (this.map && layer) {
            this.map.removeLayer(layer);
        }
    }

    /**
     * 地図サイズを再計算
     */
    invalidateSize() {
        if (this.map) {
            this.map.invalidateSize();
        }
    }

    /**
     * 現在のズームレベルを取得
     */
    getZoom() {
        return this.map ? this.map.getZoom() : APP_CONFIG.MAP.ZOOM;
    }

    /**
     * 現在の地図中心を取得
     */
    getCenter() {
        return this.map ? this.map.getCenter() : { lat: APP_CONFIG.MAP.CENTER[0], lng: APP_CONFIG.MAP.CENTER[1] };
    }

    /**
     * 地図のバウンズを取得
     */
    getBounds() {
        return this.map ? this.map.getBounds() : null;
    }

    /**
     * 特定の座標が現在の表示範囲内にあるかチェック
     */
    isInView(lat, lng) {
        if (!this.map) return false;
        const bounds = this.map.getBounds();
        return bounds.contains([lat, lng]);
    }

    /**
     * 2点間の画面上での距離を計算（ピクセル単位）
     */
    getPixelDistance(lat1, lng1, lat2, lng2) {
        if (!this.map) return 0;
        
        const point1 = this.map.latLngToLayerPoint([lat1, lng1]);
        const point2 = this.map.latLngToLayerPoint([lat2, lng2]);
        
        return Math.sqrt(
            Math.pow(point2.x - point1.x, 2) + 
            Math.pow(point2.y - point1.y, 2)
        );
    }

    /**
     * イベントハンドラを登録
     */
    addEventListener(eventType, handler) {
        this.eventHandlers.set(eventType, handler);
    }

    /**
     * イベントハンドラを削除
     */
    removeEventListener(eventType) {
        this.eventHandlers.delete(eventType);
    }

    /**
     * 地図インスタンスを取得
     */
    getMap() {
        return this.map;
    }

    /**
     * 地図を破棄
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.eventHandlers.clear();
    }
}