import { APP_CONFIG } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { APP_EVENTS } from '../utils/EventEmitter.js';

/**
 * マーカー管理を担当するクラス
 * SVGマーカーの生成、サイズ調整、クラスタリング、イベントハンドリングを管理
 */
export class MarkerManager {
    constructor(map, dataManager, eventBus = null) {
        this.map = map;
        this.dataManager = dataManager;
        this.areaLayer = L.layerGroup().addTo(map);
        this.lastClusterState = null;
        this.eventHandlers = new Map(); // レガシー互換性のために残す
        
        // 🎯 EventBus統合
        this.eventBus = eventBus;
        
        // 🎯 選択状態管理
        this.selectedMarker = null;
        this.selectedCluster = null;
        this.markerLookup = new Map(); // マーカーと詳細情報のマッピング
    }

    /**
     * エリアマーカーを追加
     */
    async addAreaMarkers() {
        if (!this.dataManager || !this.dataManager.getAreas) {
            await ErrorHandler.handle(
                new Error('DataManager not properly initialized'), 
                'MarkerManager.addAreaMarkers', {
                    level: ErrorHandler.ERROR_LEVELS.ERROR,
                    category: ErrorHandler.ERROR_CATEGORIES.INITIALIZATION,
                    showToUser: true,
                    component: 'MarkerManager'
                }
            );
            return;
        }

        const areas = this.dataManager.getAreas();
        const clusters = this.createClusters(areas);
        
        console.log(`Adding area markers for ${areas.length} areas`);

        for (const cluster of clusters) {
            const photosInArea = cluster.isCluster ? 
                cluster.photos : 
                this.dataManager.getPhotosInArea(cluster);

            console.log(`Area \"${cluster.name}\": ${photosInArea.length} photos`);
            
            if (photosInArea.length > 0) {
                await this.createAreaMarker(cluster, photosInArea.length);
            }
        }
    }

    /**
     * 単一エリアマーカーを作成
     */
    async createAreaMarker(cluster, photoCount) {
        if (!cluster.center_lat || !cluster.center_lng || cluster.is_active === false) {
            console.log(`Skipping inactive or invalid area: ${cluster.name}`);
            return;
        }

        const currentZoom = this.map.getZoom();
        const displayCount = photoCount > 999 ? '999+' : photoCount.toString();
        
        console.log(`Creating marker for ${cluster.name}: ${displayCount} photos`);
        
        let areaIcon;
        
        try {
            const count = displayCount.toString().substring(0, 3);
            const markerSize = this.getResponsiveMarkerSize(currentZoom, cluster.isCluster);
            
            // シンプルな青い円形マーカー（透明背景）
            const svgString = this.createSVGMarker(markerSize, count);
            
            areaIcon = L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))),
                iconSize: [markerSize, markerSize],
                iconAnchor: [markerSize / 2, markerSize / 2],
                popupAnchor: [0, -(markerSize / 2 + 10)],
                className: 'custom-marker-icon'
            });
            
        } catch (svgError) {
            const result = await ErrorHandler.handle(svgError, 'MarkerManager.createSVGMarker', {
                level: ErrorHandler.ERROR_LEVELS.WARNING,
                category: ErrorHandler.ERROR_CATEGORIES.MARKER,
                showToUser: false,
                fallback: () => this.createFallbackIcon(currentZoom, cluster.isCluster, displayCount),
                component: 'MarkerManager'
            });
            
            if (result.success) {
                areaIcon = result.result;
            } else {
                // 最後の手段として基本的なマーカーを作成
                areaIcon = L.marker([0, 0]).options.icon;
            }
        }

        // マーカーを地図に追加
        const marker = L.marker([cluster.center_lat, cluster.center_lng], { icon: areaIcon })
            .addTo(this.areaLayer);

        // データを保存
        marker.areaData = cluster;
        marker.clusterData = cluster.isCluster ? cluster : null;

        // マーカー検索用のマッピングを保存
        this.markerLookup.set(cluster.id, {
            marker: marker,
            cluster: cluster,
            photoCount: photoCount,
            originalIcon: areaIcon
        });

        // イベントハンドラを設定
        this.attachMarkerEvents(marker, cluster);

        console.log(`✅ Added marker with events for: ${cluster.name}`);
    }

    /**
     * SVGマーカーを生成
     */
    createSVGMarker(size, count, isSelected = false) {
        if (isSelected) {
            // 選択状態: 大きめサイズ + パルス効果 + 強調色
            const selectedSize = size * 1.2;
            return `<svg width="${selectedSize}" height="${selectedSize}" viewBox="0 0 ${selectedSize} ${selectedSize}" xmlns="http://www.w3.org/2000/svg" style="background:transparent;">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/> 
                        </feMerge>
                    </filter>
                    <animateTransform attributeName="transform" type="scale" 
                        values="1;1.1;1" dur="2s" repeatCount="indefinite"/>
                </defs>
                <rect width="100%" height="100%" fill="none" opacity="0"/>
                <!-- アウターリング（パルス効果用） -->
                <circle cx="${selectedSize/2}" cy="${selectedSize/2}" r="${selectedSize/2 - 1}" 
                    fill="none" stroke="#FF6B35" stroke-width="3" opacity="0.6">
                    <animate attributeName="r" values="${selectedSize/2 - 1};${selectedSize/2 + 5};${selectedSize/2 - 1}" 
                        dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0.2;0.6" 
                        dur="2s" repeatCount="indefinite"/>
                </circle>
                <!-- メインサークル -->
                <circle cx="${selectedSize/2}" cy="${selectedSize/2}" r="${size/2 - 2}" 
                    fill="#FF6B35" stroke="white" stroke-width="3" filter="url(#glow)"/>
                <text x="${selectedSize/2}" y="${selectedSize/2 + 4}" text-anchor="middle" 
                    fill="white" font-size="${Math.floor(size * 0.3)}" font-weight="bold">${count}</text>
            </svg>`;
        } else {
            // 通常状態
            return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:transparent;">
                <rect width="100%" height="100%" fill="none" opacity="0"/>
                <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${APP_CONFIG.MARKER.COLOR}" stroke="${APP_CONFIG.MARKER.STROKE_COLOR}" stroke-width="${APP_CONFIG.MARKER.STROKE_WIDTH}"/>
                <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" fill="white" font-size="${Math.floor(size * 0.3)}" font-weight="bold">${count}</text>
            </svg>`;
        }
    }

    /**
     * フォールバックアイコンを作成（Canvas使用）
     */
    createFallbackIcon(zoom, isCluster, displayCount) {
        const canvas = document.createElement('canvas');
        const size = this.getResponsiveMarkerSize(zoom, isCluster);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // 背景円
        ctx.fillStyle = APP_CONFIG.MARKER.COLOR;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // 白いボーダー
        ctx.strokeStyle = APP_CONFIG.MARKER.STROKE_COLOR;
        ctx.lineWidth = APP_CONFIG.MARKER.STROKE_WIDTH;
        ctx.stroke();
        
        // カウントテキスト
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(size * 0.25)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayCount, size/2, size/2);

        return L.icon({
            iconUrl: canvas.toDataURL(),
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -(size / 2 + 10)]
        });
    }

    /**
     * ズームレベルに応じたマーカーサイズを計算
     */
    getResponsiveMarkerSize(zoom, isCluster = false) {
        const baseSize = APP_CONFIG.MARKER.DEFAULT_SIZE;
        const scaleFactor = (zoom - APP_CONFIG.MAP.MIN_ZOOM) / (APP_CONFIG.MAP.MAX_ZOOM - APP_CONFIG.MAP.MIN_ZOOM);
        const dynamicSize = APP_CONFIG.MARKER.MIN_SIZE + (APP_CONFIG.MARKER.MAX_SIZE - APP_CONFIG.MARKER.MIN_SIZE) * scaleFactor;
        
        return Math.round(isCluster ? dynamicSize * APP_CONFIG.MARKER.SIZE_SCALE_FACTOR : dynamicSize);
    }

    /**
     * クラスタリングを実行
     */
    createClusters(areas) {
        const currentZoom = this.map.getZoom();
        const shouldCluster = this.shouldClusterMarkers(currentZoom);
        
        console.log(`🔍 Clustering check: zoom=${currentZoom}, threshold=${APP_CONFIG.MAP.CLUSTER_ZOOM_THRESHOLD}, shouldCluster=${shouldCluster}`);
        
        if (!shouldCluster) {
            console.log('📍 Individual markers mode (no clustering)');
            return areas.map(area => ({ ...area, isCluster: false }));
        }

        const clusters = [];
        const processed = new Set();

        areas.forEach((area, index) => {
            if (processed.has(index)) return;

            const nearbyAreas = [area];
            const nearbyIndices = [index];

            areas.forEach((otherArea, otherIndex) => {
                if (otherIndex !== index && !processed.has(otherIndex)) {
                    const distance = this.dataManager.calculateDistance(
                        area.center_lat, area.center_lng,
                        otherArea.center_lat, otherArea.center_lng
                    );

                    if (distance <= APP_CONFIG.MAP.CLUSTER_DISTANCE_KM) {
                        nearbyAreas.push(otherArea);
                        nearbyIndices.push(otherIndex);
                    }
                }
            });

            nearbyIndices.forEach(idx => processed.add(idx));

            if (nearbyAreas.length > 1) {
                // クラスター作成
                const centerLat = nearbyAreas.reduce((sum, a) => sum + a.center_lat, 0) / nearbyAreas.length;
                const centerLng = nearbyAreas.reduce((sum, a) => sum + a.center_lng, 0) / nearbyAreas.length;
                const totalPhotos = nearbyAreas.reduce((sum, a) => sum + this.dataManager.getPhotosInArea(a).length, 0);

                clusters.push({
                    id: `cluster_${nearbyAreas.map(a => a.id).join('_')}`,
                    name: `${nearbyAreas[0].name} エリア`,
                    center_lat: centerLat,
                    center_lng: centerLng,
                    isCluster: true,
                    areas: nearbyAreas,
                    photos: nearbyAreas.flatMap(a => this.dataManager.getPhotosInArea(a)),
                    is_active: true
                });
            } else {
                clusters.push({ ...area, isCluster: false });
            }
        });

        console.log(`🎯 Clustering result: ${clusters.length} clusters/markers from ${areas.length} areas`);
        console.log('📊 Cluster details:', clusters.map(c => ({
            name: c.name,
            isCluster: c.isCluster,
            photoCount: c.isCluster ? c.photos?.length : this.dataManager.getPhotosInArea(c).length
        })));
        
        return clusters;
    }

    /**
     * クラスタリングを行うかどうかを判定
     */
    shouldClusterMarkers(zoom) {
        return zoom <= APP_CONFIG.MAP.CLUSTER_ZOOM_THRESHOLD;
    }

    /**
     * マーカーのイベントハンドラを設定
     */
    attachMarkerEvents(marker, cluster) {
        // クリックイベント
        marker.on('click', (e) => {
            console.log('🖱️ Area marker clicked:', cluster.name);
            console.log('📊 Marker click debug:', { cluster, hasEventBus: !!this.eventBus });
            this.handleMarkerClick(cluster, marker);
            L.DomEvent.stopPropagation(e);
        });

        // タップイベント（モバイル対応）
        marker.on('touchstart', (e) => {
            console.log('Area marker touched:', cluster.name);
            this.handleMarkerClick(cluster, marker);
            L.DomEvent.stopPropagation(e);
        });

        // ホバーエフェクト
        marker.on('mouseover', () => {
            if (marker.getElement()) {
                marker.getElement().classList.add('hover');
            }
        });

        marker.on('mouseout', () => {
            if (marker.getElement()) {
                marker.getElement().classList.remove('hover');
            }
        });
    }

    /**
     * マーカークリックを処理
     */
    handleMarkerClick(cluster, marker) {
        // 🎯 マーカー選択状態を更新
        this.selectMarker(cluster);
        
        // 🔄 EventBus経由でイベント送信
        if (this.eventBus) {
            this.eventBus.emit(APP_EVENTS.MARKER_CLICKED, { cluster, marker });
        }
        
        // 🔧 レガシー互換性のため従来のハンドラも呼び出し
        const handler = this.eventHandlers.get('markerClick');
        if (handler) {
            handler(cluster, marker);
        }
    }

    /**
     * 🎯 マーカーを選択状態にする
     */
    selectMarker(cluster) {
        console.log('🎯 Selecting marker for:', cluster.name);
        
        // 前の選択を解除
        this.deselectCurrentMarker();
        
        // 新しい選択を設定
        const markerInfo = this.markerLookup.get(cluster.id);
        if (markerInfo) {
            this.selectedMarker = markerInfo.marker;
            this.selectedCluster = cluster;
            
            // 選択状態のアイコンを作成
            const currentZoom = this.map.getZoom();
            const markerSize = this.getResponsiveMarkerSize(currentZoom, cluster.isCluster);
            const displayCount = markerInfo.photoCount > 999 ? '999+' : markerInfo.photoCount.toString();
            
            try {
                const selectedSvgString = this.createSVGMarker(markerSize, displayCount, true);
                const selectedIcon = L.icon({
                    iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(selectedSvgString))),
                    iconSize: [markerSize * 1.2, markerSize * 1.2],
                    iconAnchor: [markerSize * 0.6, markerSize * 0.6],
                    popupAnchor: [0, -(markerSize * 0.6 + 10)],
                    className: 'custom-marker-icon selected-marker'
                });
                
                this.selectedMarker.setIcon(selectedIcon);
                console.log('✅ Marker selected and highlighted');
                
            } catch (error) {
                console.error('❌ Failed to create selected marker icon:', error);
            }
        }
    }

    /**
     * 🎯 現在の選択を解除
     */
    deselectCurrentMarker() {
        if (this.selectedMarker && this.selectedCluster) {
            console.log('🔄 Deselecting current marker:', this.selectedCluster.name);
            
            const markerInfo = this.markerLookup.get(this.selectedCluster.id);
            if (markerInfo && markerInfo.originalIcon) {
                this.selectedMarker.setIcon(markerInfo.originalIcon);
            }
        }
        
        this.selectedMarker = null;
        this.selectedCluster = null;
    }

    /**
     * 🎯 すべてのマーカーの選択を解除
     */
    deselectAllMarkers() {
        this.deselectCurrentMarker();
        console.log('🔄 All markers deselected');
    }

    /**
     * ズーム変更時のマーカー更新
     */
    handleZoomChange() {
        const currentZoom = this.map.getZoom();
        console.log('Zoom level changed to:', currentZoom);
        
        const shouldCluster = this.shouldClusterMarkers(currentZoom);
        const wasCluster = this.lastClusterState;
        
        if (shouldCluster !== wasCluster) {
            console.log('Clustering state changed, redrawing markers');
            this.refreshAreaMarkers();
            this.lastClusterState = shouldCluster;
        } else {
            this.updateMarkerSizesSafely(currentZoom);
        }
    }

    /**
     * マーカーサイズを安全に更新
     */
    updateMarkerSizesSafely(zoom) {
        this.areaLayer.eachLayer(layer => {
            if (layer.areaData) {
                const isCluster = layer.clusterData && layer.clusterData.isCluster;
                const newSize = this.getResponsiveMarkerSize(zoom, isCluster);
                const currentIcon = layer.getIcon();
                
                if (currentIcon && currentIcon.options.iconSize[0] !== newSize) {
                    try {
                        const count = layer.clusterData ? 
                            (layer.clusterData.photos ? layer.clusterData.photos.length : 
                             this.dataManager.getPhotosInArea(layer.areaData).length) : 
                            this.dataManager.getPhotosInArea(layer.areaData).length;
                        
                        const displayCount = count > 999 ? '999+' : count.toString();
                        const svgString = this.createSVGMarker(newSize, displayCount);
                        
                        const newIcon = L.icon({
                            iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))),
                            iconSize: [newSize, newSize],
                            iconAnchor: [newSize / 2, newSize / 2],
                            popupAnchor: [0, -(newSize / 2 + 10)],
                            className: 'custom-marker-icon'
                        });
                        
                        layer.setIcon(newIcon);
                    } catch (error) {
                        console.warn('Marker size update failed:', error);
                    }
                }
            }
        });
    }

    /**
     * エリアマーカーを再描画
     */
    refreshAreaMarkers() {
        this.clearAreaMarkers();
        this.addAreaMarkers();
    }

    /**
     * エリアマーカーをクリア
     */
    clearAreaMarkers() {
        // 選択状態をリセット
        this.selectedMarker = null;
        this.selectedCluster = null;
        this.markerLookup.clear();
        
        this.areaLayer.clearLayers();
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
}