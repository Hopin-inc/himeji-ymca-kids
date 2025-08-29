import { APP_CONFIG, EVENTS } from './config/constants.js';
import { DataManager } from './modules/DataManager.js';
import { MapManager } from './modules/MapManager.js';
import { MarkerManager } from './modules/MarkerManager.js';
import { UIManager } from './modules/UIManager.js';
import { createAppEventEmitter, APP_EVENTS } from './utils/EventEmitter.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { ImageHandler } from './utils/ImageHandler.js';
import { ProgressManager } from './utils/ProgressManager.js';
import { Analytics } from './utils/Analytics.js';
import { LogoProcessor } from './utils/LogoProcessor.js';

/**
 * リファクタリングされたメインアプリケーションクラス
 * 各機能モジュールのコーディネーターとして機能
 */
class PhotoMapApp {
    constructor() {
        console.log('🏗️ PhotoMapApp constructor called');
        
        this.dataManager = null;
        this.mapManager = null;
        this.markerManager = null;
        this.uiManager = null;
        this.progressManager = null;
        this.analytics = null;
        
        // 🎯 統一イベントシステム
        this.eventBus = createAppEventEmitter();
        this.eventBus.setDebugMode(false); // プロダクションモード
        
        console.log('🎯 EventBus created, starting initialization...');
        
        // Initialize the application
        this.init();
    }

    /**
     * アプリケーションを初期化
     */
    async init() {
        try {
            console.log('🚀 PhotoMapApp initialization started (Refactored Version)');
            console.log('📍 Environment check:', {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                userAgent: navigator.userAgent.substring(0, 100) + '...'
            });

            // 📊 アナリティクスを初期化
            console.log('📊 Initializing Analytics...');
            this.analytics = new Analytics();
            this.analytics.trackPageView('taishi_no_ashita');
            
            // 🔄 進捗管理を初期化
            console.log('🔄 Initializing ProgressManager...');
            this.progressManager = new ProgressManager();
            console.log('✅ ProgressManager initialized');

            // Phase 1: データ管理の初期化
            this.progressManager.startStep(0); // データ読み込み
            console.log('📊 Initializing data management...');
            this.dataManager = new DataManager();
            this.dataManager.eventBus = this.eventBus; // EventBusを渡す
            await this.dataManager.loadData();
            this.progressManager.updateStepProgress(100);

            // Phase 2: 地図管理の初期化
            this.progressManager.startStep(1); // 地図準備
            console.log('🗺️ Initializing map...');
            this.mapManager = new MapManager('map');
            await this.mapManager.initMap();
            this.progressManager.updateStepProgress(70);

            // Phase 3: マーカー管理の初期化
            console.log('📍 Initializing markers...');
            this.markerManager = new MarkerManager(this.mapManager.getMap(), this.dataManager, this.eventBus);
            this.progressManager.updateStepProgress(100);
            
            // Phase 4: UI管理の初期化とイメージ準備
            this.progressManager.startStep(2); // 画像準備
            console.log('🎛️ Initializing UI...');
            this.uiManager = new UIManager(this.dataManager);
            this.uiManager.eventBus = this.eventBus; // EventBusを渡す
            this.progressManager.updateStepProgress(30);

            // Phase 5: イベントハンドラの設定
            console.log('🔗 Setting up event handlers...');
            this.setupEventHandlers();
            this.progressManager.updateStepProgress(50);

            // Phase 6: マーカーを追加
            console.log('🎯 Adding markers...');
            await this.markerManager.addAreaMarkers();
            this.progressManager.updateStepProgress(80);

            // Phase 7: UIイベントリスナーを設定
            console.log('🎛️ Setting up UI event listeners...');
            this.uiManager.initEventListeners();
            this.progressManager.updateStepProgress(100);

            // Phase 8: ローディング完了
            console.log('✅ All initialization completed!');
            this.progressManager.completeAll();
            
            // ロゴ画像は既にクリーンなので追加処理不要
            
            // パフォーマンス統計を記録
            const initTime = performance.now() - this.analytics.startTime;
            this.analytics.trackPerformance('app_initialization', Math.round(initTime), 'ms');
            this.analytics.trackEvent('app_ready', {
                photos_count: this.dataManager.photos.length,
                areas_count: this.dataManager.areas.length
            });

            console.log('🎉 PhotoMapApp initialization completed successfully');
    
    // 🔍 スクロールテスト用
    setTimeout(() => {
        const areas = this.dataManager.areas.filter(area => area.is_active);
        if (areas.length > 0) {
            console.log('🔍 Testing scroll with area:', areas[0].name);
            this.markerManager.handleMarkerClick(areas[0], null);
        }
    }, 2000);
    
    // 🧪 テスト: マーカークリック→表示モード切り替えをテスト
    setTimeout(() => {
        console.log('🧪 Testing marker click and display mode toggle...');
        // テスト関数は削除済み - 基本動作テストは完了
    }, 2000);

        } catch (error) {
            console.error('❌ Initialization error:', error);
            console.error('Error stack:', error.stack);
            
            // エラー時の進捗表示
            if (this.progressManager) {
                this.progressManager.showError(
                    `初期化中にエラーが発生しました: ${error.message}`
                );
            } else if (this.uiManager) {
                this.uiManager.hideLoading();
            }
            
            // フォールバック初期化を試行
            try {
                console.log('🔄 Attempting fallback initialization...');
                await this.fallbackInitialization();
            } catch (fallbackError) {
                console.error('❌ Fallback initialization also failed:', fallbackError);
                if (this.progressManager) {
                    this.progressManager.showError(
                        'アプリケーションの初期化に失敗しました。ページを再読み込みしてください。'
                    );
                } else {
                    this.showProductionError(error);
                }
            }
        }
    }

    /**
     * 🎯 統一イベントシステムによるモジュール間通信設定
     */
    setupEventHandlers() {
        // データ関連イベント
        this.eventBus.on(APP_EVENTS.DATA_LOADED, (eventData) => {
            console.log('📊 Data loaded successfully:', eventData.data);
            this.eventBus.emit(APP_EVENTS.MARKERS_UPDATED);
        });

        this.eventBus.on(APP_EVENTS.DATA_ERROR, (eventData) => {
            console.error('📊 Data loading failed:', eventData.data);
        });

        // 地図関連イベント
        this.eventBus.on(APP_EVENTS.MAP_ZOOM_CHANGED, (eventData) => {
            this.markerManager.handleZoomChange();
        });

        this.eventBus.on(APP_EVENTS.MAP_CLICKED, (eventData) => {
            this.eventBus.emit(APP_EVENTS.AREA_SELECTED, null); // エリア選択解除
        });

        this.eventBus.on(APP_EVENTS.MAP_LOCATION_SELECTED, (eventData) => {
            this.uiManager.updateLocationDisplay(eventData.data);
        });

        this.eventBus.on(APP_EVENTS.MAP_LOCATION_SELECTION_CANCELLED, () => {
            this.uiManager.hideAddPhotoModal();
        });

        // マーカー関連イベント
        this.eventBus.on(APP_EVENTS.MARKER_CLICKED, (eventData) => {
            const { cluster, marker } = eventData.data;
            this.analytics.trackMapInteraction('marker_click', {
                area_name: cluster.name,
                photos_count: this.dataManager.getPhotosInArea(cluster).length
            });
            this.selectArea(cluster, marker);
            this.eventBus.emit(APP_EVENTS.AREA_SELECTED, cluster);
        });

        this.eventBus.on(APP_EVENTS.MARKERS_UPDATED, () => {
            this.markerManager.refreshAreaMarkers();
        });

        // UI関連イベント
        this.eventBus.on(APP_EVENTS.AREA_SELECTED, (eventData) => {
            const data = eventData.data;
            if (data) {
                this.uiManager.showAreaInfo(data);
            } else {
                this.uiManager.hideAreaInfo();
            }
        });

        this.eventBus.on(APP_EVENTS.PHOTO_SUBMITTED, (eventData) => {
            this.handlePhotoSubmission();
        });

        this.eventBus.on(APP_EVENTS.PHOTO_CLICKED, (eventData) => {
            const photo = eventData.data || eventData;
            console.log('📸 Photo clicked:', photo.title);
            
            // アナリティクス統計
            this.analytics.trackPhotoInteraction('view', {
                photo_title: photo.title,
                photo_location: photo.location
            });
            
            this.showPhotoDetail(photo);
        });

        this.eventBus.on(APP_EVENTS.DISPLAY_MODE_CHANGED, (eventData) => {
            const data = eventData.data;
            
            // アナリティクス統計
            this.analytics.trackUserAction('display_mode_change', 'ui', {
                new_mode: data.mode,
                page: data.page
            });
            
            this.refreshPhotoDisplay(data.mode, data.page);
        });

        // 検索・ソート関連イベントは削除されました

        // エラー関連イベント
        this.eventBus.on(APP_EVENTS.ERROR_OCCURRED, (eventData) => {
            console.error('🚨 Application error:', eventData.data);
        });

        // 従来の直接呼び出しも一部残す（UI操作系）
        this.setupDirectUIHandlers();
        
        // 写真表示関連のハンドラを設定
        this.setupPhotoDisplayHandlers();
    }

    /**
     * 直接的なUI操作ハンドラ（EventBusが不適切な部分）
     */
    setupDirectUIHandlers() {
        // 地図センタリング（即座に実行が必要）
        this.uiManager.addEventListener('centerMap', () => {
            this.mapManager.centerMapOnLocation();
        });

        // 位置選択開始（UIフローが複雑）
        this.uiManager.addEventListener('selectLocation', () => {
            this.uiManager.hideAddPhotoModal();
            this.mapManager.startLocationSelection();
        });

        // 位置選択キャンセル
        this.uiManager.addEventListener('cancelLocationSelection', () => {
            this.mapManager.cancelLocationSelection();
            this.uiManager.showAddPhotoModal();
        });

        // 位置選択モード確認
        this.uiManager.addEventListener('isLocationSelectionMode', () => {
            return this.mapManager.isSelectingLocation;
        });
    }

    /**
     * エリア選択を処理
     */
    selectArea(area, marker) {
        if (!area) {
            console.warn('⚠️ No area data provided to selectArea');
            return;
        }
        
        // クラスターの場合はズームイン
        if (area.isCluster) {
            const zoom = Math.min(this.mapManager.getZoom() + 2, APP_CONFIG.MAP.MAX_ZOOM);
            this.mapManager.centerMapOnLocation(area.center_lat, area.center_lng, zoom);
        }
    }

    /**
     * 写真投稿を処理
     */
    async handlePhotoSubmission() {
        console.log('📸 Processing photo submission...');
        
        try {
            // フォームデータを取得
            const form = document.getElementById('addPhotoForm');
            if (!form) {
                throw new Error('Add photo form not found');
            }

            const formData = new FormData(form);
            const location = this.mapManager.selectedLocation;

            if (!location) {
                alert('位置を選択してください。');
                return;
            }

            // 写真データを作成
            const photoData = {
                id: `photo_${Date.now()}`,
                title: formData.get('title'),
                description: formData.get('description'),
                image_url: formData.get('imageUrl'),
                thumbnail_url: formData.get('imageUrl'), // サムネイルは同じURLを使用
                latitude: location.lat,
                longitude: location.lng,
                taken_at: new Date().toISOString(),
                location: formData.get('location'),
                tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                is_featured: false,
                view_count: 0
            };

            console.log('📸 Photo data prepared:', photoData);

            // データマネージャーに写真を追加（実装は簡素化）
            this.dataManager.photos.push(photoData);
            this.dataManager.filteredPhotos.push(photoData);

            // マーカーを更新
            this.markerManager.refreshAreaMarkers();

            // UIをリセット
            this.uiManager.hideAddPhotoModal();
            this.mapManager.selectedLocation = null;

            console.log('✅ Photo added successfully');
            alert('写真が正常に追加されました！');

        } catch (error) {
            console.error('❌ Photo submission failed:', error);
            alert('写真の追加に失敗しました。もう一度お試しください。');
        }
    }

    /**
     * 写真表示を更新（検索・ソート対応）
     */
    refreshPhotoDisplay(mode = 'grid', page = 1) {
        console.log(`📱 Refreshing photo display: ${mode} mode, page ${page}`);
        
        if (!this.uiManager.selectedArea || !this.dataManager) {
            console.warn('⚠️ No area selected or DataManager not available');
            return;
        }

        // フィルタリングされた写真を取得
        const photosInArea = this.dataManager.getPhotosInArea(this.uiManager.selectedArea);
        console.log(`🔍 Found ${photosInArea.length} photos in area after filtering`);
        
        // コンテナを取得
        const gridContainer = document.getElementById('areaPhotosGrid');
        const timelineContainer = document.getElementById('areaPhotosTimeline');
        
        if (!gridContainer || !timelineContainer) {
            console.error('❌ Photo containers not found');
            return;
        }
        
        // 既存の写真をクリア
        gridContainer.innerHTML = '';
        timelineContainer.innerHTML = '';
        
        // 表示モードに応じて描画
        if (mode === 'grid') {
            gridContainer.style.display = 'grid';
            timelineContainer.style.display = 'none';
            this.renderGridPhotos(photosInArea, gridContainer, page);
        } else {
            gridContainer.style.display = 'none';
            timelineContainer.style.display = 'block';
            this.renderTimelinePhotos(photosInArea, timelineContainer, page);
        }
        
        // デバッグ: スクロール状況を確認
        setTimeout(() => {
            const container = mode === 'grid' ? gridContainer : timelineContainer;
            const containerStyles = getComputedStyle(container);
            const scrollInfo = {
                mode: mode,
                containerHeight: container.offsetHeight,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                canScroll: container.scrollHeight > container.offsetHeight,
                maxHeight: containerStyles.maxHeight,
                minHeight: containerStyles.minHeight,
                overflow: containerStyles.overflowY,
                padding: containerStyles.padding,
                gap: containerStyles.gap,
                scrollDiff: container.scrollHeight - container.offsetHeight,
                photosCount: photosInArea.length
            };
            console.log('🔍 Container scroll debug:', scrollInfo);
            
            // スクロール可能な場合は成功メッセージ
            if (scrollInfo.canScroll) {
                console.log('✅ スクロール機能が有効になりました！');
            } else {
                console.log('⚠️ スクロールが発生しません。コンテンツ高さが不足している可能性があります。');
            }
        }, 200);
    }

    /**
     * 写真詳細モーダルを表示
     */
    showPhotoDetail(photo) {
        if (!photo) {
            console.warn('⚠️ No photo data provided for detail view');
            return;
        }

        console.log('📸 Showing photo detail:', photo.title);

        // モーダル要素を取得
        const modal = document.getElementById('photoModal');
        const modalTitle = document.getElementById('modalPhotoTitle');
        const modalImage = modal.querySelector('.photo-container img');
        const modalDescription = document.getElementById('modalPhotoDescription');
        const modalDate = document.getElementById('modalPhotoDate');
        const modalLocation = document.getElementById('modalPhotoLocation');
        const modalTags = document.getElementById('modalPhotoTags');

        if (!modal) {
            console.error('❌ Photo modal not found');
            return;
        }

        // モーダル内容を更新
        if (modalTitle) modalTitle.textContent = photo.title || '写真詳細';
        
        // 画像を更新（フォールバック機能付き）
        if (modalImage) {
            modalImage.src = photo.image_url || photo.thumbnail_url;
            modalImage.alt = photo.title || '写真';
            
            // 改良されたフォールバック機能を適用（代替URL試行付き）
            const retryUrls = ImageHandler.generateAlternativeUrls(modalImage.src);
            ImageHandler.setupImageFallback(modalImage, {
                width: 600,
                height: 400,
                showLoadingState: true,
                retryUrls: retryUrls,
                onError: (imgElement) => {
                    console.warn(`📸 モーダル画像の読み込みに失敗 (全URL試行済み): ${photo.title}`, photo.id);
                },
                onLoad: (imgElement) => {
                    console.log(`✅ モーダル画像読み込み完了: ${photo.title}`);
                }
            });
        } else {
            // 画像要素が存在しない場合は作成
            const photoContainer = modal.querySelector('.photo-container');
            if (photoContainer) {
                const img = document.createElement('img');
                img.src = photo.image_url || photo.thumbnail_url;
                img.alt = photo.title || '写真';
                img.style.cssText = 'width: 100%; height: auto; border-radius: 8px;';
                
                // 既存の画像があれば置換
                const existingImg = photoContainer.querySelector('img');
                if (existingImg) {
                    photoContainer.replaceChild(img, existingImg);
                } else {
                    photoContainer.appendChild(img);
                }

                // 改良されたフォールバック機能を適用（代替URL試行付き）
                const retryUrls = ImageHandler.generateAlternativeUrls(img.src);
                ImageHandler.setupImageFallback(img, {
                    width: 600,
                    height: 400,
                    showLoadingState: true,
                    retryUrls: retryUrls
                });
            }
        }

        // その他の情報を更新
        if (modalDescription) modalDescription.textContent = photo.description || '';
        if (modalDate) modalDate.textContent = new Date(photo.taken_at).toLocaleDateString('ja-JP');
        if (modalLocation) modalLocation.textContent = photo.location || '';
        
        if (modalTags && photo.tags) {
            modalTags.innerHTML = photo.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }

        // モーダルを表示
        modal.style.display = 'flex';
        
        // モーダルクローズイベントを設定
        this.setupModalCloseEvents(modal);
    }

    /**
     * モーダルクローズイベントを設定
     */
    setupModalCloseEvents(modal) {
        const closeBtn = modal.querySelector('#closeModal');
        const backdrop = modal.querySelector('#modalBackdrop');

        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        if (backdrop) {
            backdrop.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // ESCキーでクローズ
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);
    }

    /**
     * フォールバック初期化
     */
    async fallbackInitialization() {
        console.log('🔄 Running fallback initialization...');
        
        // 最小限のマップ初期化
        if (!this.mapManager) {
            this.mapManager = new MapManager('map');
            await this.mapManager.initMap();
        }

        // 最小限のUI初期化
        if (!this.uiManager) {
            this.uiManager = new UIManager(null);
            this.uiManager.initEventListeners();
        }

        this.uiManager.hideLoading();
        this.showFallbackMessage();
    }

    /**
     * フォールバックメッセージを表示
     */
    showFallbackMessage() {
        const fallbackPanel = document.createElement('div');
        fallbackPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
        `;

        fallbackPanel.innerHTML = `
            <h3>🗺️ マップが利用可能です</h3>
            <p>データの読み込みに問題がありましたが、<br>基本的なマップ機能は使用できます。</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: #007AFF;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">OK</button>
        `;

        document.body.appendChild(fallbackPanel);

        // 自動削除
        setTimeout(() => {
            if (fallbackPanel.parentNode) {
                fallbackPanel.parentNode.removeChild(fallbackPanel);
            }
        }, 10000);
    }







    /**
     * 写真表示関連のハンドラを設定
     */
    setupPhotoDisplayHandlers() {
        // 写真表示の更新ハンドラを登録
        this.uiManager.addEventListener('refreshPhotos', (mode, page) => {
            this.updatePhotoDisplay(mode, page);
        });
    }

    /**
     * 写真表示を更新
     */
    updatePhotoDisplay(mode, page = 1) {
        
        const gridContainer = document.getElementById('areaPhotosGrid');
        const timelineContainer = document.getElementById('areaPhotosTimeline');
        
        if (!gridContainer || !timelineContainer) {
            console.warn('⚠️ Photo display containers not found');
            return;
        }
        
        // コンテナの表示/非表示を切り替え
        if (mode === 'grid') {
            gridContainer.style.display = 'grid';
            timelineContainer.style.display = 'none';
        } else if (mode === 'timeline') {
            gridContainer.style.display = 'none';
            timelineContainer.style.display = 'block';
        }
        
        // 表示モードに応じて写真を再描画
        if (this.uiManager.selectedArea) {
            const photos = this.dataManager.getPhotosInArea(this.uiManager.selectedArea);
            this.renderPhotos(photos, mode, page);
        }
    }

    /**
     * 写真を描画
     */
    renderPhotos(photos, mode, page) {
        
        const container = mode === 'grid' ? 
            document.getElementById('areaPhotosGrid') : 
            document.getElementById('areaPhotosTimeline');
            
        if (!container) return;
        
        container.innerHTML = '';
        
        if (mode === 'grid') {
            this.renderGridPhotos(photos, container, page);
        } else {
            this.renderTimelinePhotos(photos, container, page);
        }
        
        // 🔍 デバッグ: スクロール状況を確認
        setTimeout(() => {
            const containerStyles = getComputedStyle(container);
            const scrollInfo = {
                mode: mode,
                containerHeight: container.offsetHeight,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                canScroll: container.scrollHeight > container.offsetHeight,
                maxHeight: containerStyles.maxHeight,
                minHeight: containerStyles.minHeight,
                overflow: containerStyles.overflowY,
                padding: containerStyles.padding,
                gap: containerStyles.gap,
                scrollDiff: container.scrollHeight - container.offsetHeight,
                photosCount: photos.length
            };
            console.log('🔍 Container scroll debug:', scrollInfo);
            
            // スクロール可能な場合は成功メッセージ
            if (scrollInfo.canScroll) {
                console.log('✅ スクロール機能が有効になりました！');
            } else {
                console.log('⚠️ スクロールが発生しません。コンテンツ高さが不足している可能性があります。');
            }
        }, 200);
    }

    /**
     * グリッド表示で写真を描画
     */
    renderGridPhotos(photos, container, page) {
        const photosPerPage = 12;
        const startIndex = (page - 1) * photosPerPage;
        const endIndex = Math.min(startIndex + photosPerPage, photos.length);
        const pagePhotos = photos.slice(startIndex, endIndex);
        
        pagePhotos.forEach(photo => {
            const photoElement = document.createElement('div');
            photoElement.className = 'photo-item';
            
            // 🖼️ 新しいImageHandlerを使用
            const img = document.createElement('img');
            img.src = photo.thumbnail_url || photo.image_url;
            img.alt = photo.title;
            img.loading = 'lazy';
            
            // 改良されたフォールバック機能を設定（代替URL試行付き）
            const retryUrls = ImageHandler.generateAlternativeUrls(img.src);
            const imageLoadStart = performance.now();
            ImageHandler.setupImageFallback(img, {
                width: 200,
                height: 200,
                showLoadingState: true,
                retryUrls: retryUrls,
                onError: (imgElement) => {
                    console.warn(`🚫 グリッド画像の読み込みに失敗 (全URL試行済み): ${photo.title} (ID: ${photo.id})`);
                    console.log(`🎨 フォールバック画像を表示しました: ${photo.title}`);
                    
                    // アナリティクス統計
                    if (this.analytics) {
                        this.analytics.trackImageLoad(false, photo.thumbnail_url || photo.image_url);
                    }
                },
                onLoad: (imgElement) => {
                    console.log(`✅ グリッド画像読み込み完了: ${photo.title}`);
                    
                    // アナリティクス統計
                    if (this.analytics) {
                        const loadTime = performance.now() - imageLoadStart;
                        this.analytics.trackImageLoad(true, photo.thumbnail_url || photo.image_url, Math.round(loadTime));
                    }
                }
            });
            
            const overlay = document.createElement('div');
            overlay.className = 'photo-overlay';
            overlay.innerHTML = `
                <h4>${photo.title}</h4>
                <p>${new Date(photo.taken_at).toLocaleDateString('ja-JP')}</p>
            `;
            
            photoElement.appendChild(img);
            photoElement.appendChild(overlay);
            container.appendChild(photoElement);
            
            // クリックイベントを追加
            photoElement.addEventListener('click', () => {
                console.log('🖱️ Grid photo clicked:', photo.title);
                this.eventBus.emit(APP_EVENTS.PHOTO_CLICKED, photo);
            });
        });
    }

    /**
     * タイムライン表示で写真を描画
     */
    renderTimelinePhotos(photos, container, page) {
        // 撮影日でソート
        const sortedPhotos = [...photos].sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));
        
        // 日付でグループ化
        const photosByDate = {};
        sortedPhotos.forEach(photo => {
            const date = new Date(photo.taken_at).toLocaleDateString('ja-JP');
            if (!photosByDate[date]) {
                photosByDate[date] = [];
            }
            photosByDate[date].push(photo);
        });
        
        // タイムライン表示を構築
        Object.entries(photosByDate).forEach(([date, datePhotos]) => {
            const dateSection = document.createElement('div');
            dateSection.className = 'timeline-date-section';
            
            // 日付ヘッダーを作成
            const dateHeader = document.createElement('div');
            dateHeader.className = 'timeline-date-header';
            dateHeader.innerHTML = `
                <h4>${date}</h4>
                <span class="photo-count">${datePhotos.length}枚</span>
            `;
            
            // 写真コンテナを作成
            const photosContainer = document.createElement('div');
            photosContainer.className = 'timeline-photos';
            
            // 🖼️ 各写真アイテムを個別に作成（ImageHandler使用）
            datePhotos.forEach(photo => {
                const photoItem = document.createElement('div');
                photoItem.className = 'timeline-photo-item';
                
                // 画像要素を作成
                const img = document.createElement('img');
                img.src = photo.thumbnail_url || photo.image_url;
                img.alt = photo.title;
                img.loading = 'lazy';
                
                // 改良されたフォールバック機能を設定（代替URL試行付き）
                const retryUrls = ImageHandler.generateAlternativeUrls(img.src);
                ImageHandler.setupImageFallback(img, {
                    width: 120,
                    height: 120,
                    showLoadingState: true,
                    retryUrls: retryUrls,
                    onError: (imgElement) => {
                        console.warn(`🚫 タイムライン画像の読み込みに失敗 (全URL試行済み): ${photo.title} (ID: ${photo.id})`);
                        console.log(`🎨 フォールバック画像を表示しました: ${photo.title}`);
                    },
                    onLoad: (imgElement) => {
                        console.log(`✅ タイムライン画像読み込み完了: ${photo.title}`);
                    }
                });
                
                // 情報コンテナを作成
                const infoContainer = document.createElement('div');
                infoContainer.className = 'timeline-photo-info';
                infoContainer.innerHTML = `
                    <h5>${photo.title}</h5>
                    <p>${photo.description || ''}</p>
                    <small>${new Date(photo.taken_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</small>
                `;
                
                // 写真アイテムを組み立て
                photoItem.appendChild(img);
                photoItem.appendChild(infoContainer);
                photosContainer.appendChild(photoItem);
                
                // クリックイベントを追加
                photoItem.addEventListener('click', () => {
                    console.log('🖱️ Timeline photo clicked:', photo.title);
                    this.eventBus.emit(APP_EVENTS.PHOTO_CLICKED, photo);
                });
            });
            
            // 日付セクションを組み立て
            dateSection.appendChild(dateHeader);
            dateSection.appendChild(photosContainer);
            container.appendChild(dateSection);
        });
    }



    /**
     * プロダクション環境でのエラー表示
     */
    showProductionError(error) {
        const errorPanel = document.createElement('div');
        errorPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        errorPanel.innerHTML = `
            <h3>⚠️ アプリケーションエラー</h3>
            <p>申し訳ありません。アプリケーションの初期化中にエラーが発生しました。</p>
            <p>ページを再読み込みしてもう一度お試しください。</p>
            <button onclick="window.location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: white;
                color: #d32f2f;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            ">再読み込み</button>
        `;

        document.body.appendChild(errorPanel);
    }
}

// アプリケーションの開始
function startApp() {
    console.log('📄 Starting PhotoMapApp...');
    
    // Leafletライブラリの確認
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library not loaded');
        return;
    }
    
    console.log('✅ Leaflet library loaded:', L.version);
    
    // Cloudflareのチャレンジ完了を待機
    console.log('⏰ Waiting for potential Cloudflare challenges to complete...');
    setTimeout(() => {
        console.log('🚀 Creating PhotoMapApp instance...');
        const app = new PhotoMapApp();
        console.log('✅ PhotoMapApp instance created:', app);
    }, APP_CONFIG.UI.LOADING_DELAY_MS);
}

// DOMが既に読み込み済みかチェック
if (document.readyState === 'loading') {
    // まだ読み込み中の場合はDOMContentLoadedを待つ
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    // 既に読み込み済みの場合は即座に開始
    startApp();
}