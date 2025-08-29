import { APP_CONFIG } from '../config/constants.js';

/**
 * UI管理を担当するクラス
 * パネル表示、モーダル、ページネーション、イベントリスナーを管理
 */
export class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentPhotoIndex = 0;
        this.currentPage = 1;
        this.displayMode = APP_CONFIG.UI.DEFAULT_DISPLAY_MODE;
        this.selectedArea = null;
        this.eventHandlers = new Map();
    }

    /**
     * イベントリスナーを初期化
     */
    initEventListeners() {
        console.log('🎛️ Setting up UI event listeners...');

        // Map controls
        this.setupMapControls();
        
        // Area info panel
        this.setupAreaInfoPanel();
        
        // Photo search and filtering
        this.setupPhotoControls();
        
        // Display mode controls
        this.setupDisplayModeControls();
        
        // Modal controls
        this.setupModalControls();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    /**
     * マップコントロールを設定
     */
    setupMapControls() {
        const centerBtn = document.getElementById('centerBtn');
        if (centerBtn) {
            centerBtn.addEventListener('click', () => {
                const handler = this.eventHandlers.get('centerMap');
                if (handler) handler();
            });
        }

        const feedbackBtn = document.getElementById('feedbackBtn');
        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => {
                console.log('💬 Feedback button clicked (handled by main app)');
                // メインアプリケーションで処理されるため、ここでは何もしない
            });
        }
    }

    /**
     * エリア情報パネルを設定
     */
    setupAreaInfoPanel() {
        const closeAreaInfo = document.getElementById('closeAreaInfo');
        if (closeAreaInfo) {
            closeAreaInfo.addEventListener('click', () => {
                this.hideAreaInfo();
            });
        }
    }

    /**
     * 写真コントロールを設定（検索・ソート機能削除）
     */
    setupPhotoControls() {
        // 検索・ソート機能は削除されました
        // 必要に応じて他の写真関連コントロールをここに追加
        console.log('📷 Photo controls setup (search/sort removed for simplicity)');
    }

    /**
     * 表示モードコントロールを設定
     */
    setupDisplayModeControls() {
        const gridModeBtn = document.getElementById('gridModeBtn');
        const timelineModeBtn = document.getElementById('timelineModeBtn');
        
        if (gridModeBtn) {
            gridModeBtn.addEventListener('click', () => {
                this.setDisplayMode('grid');
            });
        }

        if (timelineModeBtn) {
            timelineModeBtn.addEventListener('click', () => {
                this.setDisplayMode('timeline');
            });
        }
    }

    /**
     * モーダルコントロールを設定
     */
    setupModalControls() {
        // Photo modal navigation
        const prevPhotoBtn = document.getElementById('prevPhoto');
        if (prevPhotoBtn) {
            prevPhotoBtn.addEventListener('click', () => this.navigatePhoto(-1));
        }

        const nextPhotoBtn = document.getElementById('nextPhoto');
        if (nextPhotoBtn) {
            nextPhotoBtn.addEventListener('click', () => this.navigatePhoto(1));
        }

        // Close modals
        const closePhotoModal = document.getElementById('closePhotoModal');
        if (closePhotoModal) {
            closePhotoModal.addEventListener('click', () => this.hidePhotoModal());
        }

        // Add photo modal
        const closeAddPhotoModal = document.getElementById('closeAddPhotoModal');
        if (closeAddPhotoModal) {
            closeAddPhotoModal.addEventListener('click', () => this.hideAddPhotoModal());
        }

        const selectLocationBtn = document.getElementById('selectLocationBtn');
        if (selectLocationBtn) {
            selectLocationBtn.addEventListener('click', () => {
                const handler = this.eventHandlers.get('selectLocation');
                if (handler) handler();
            });
        }

        const submitPhotoBtn = document.getElementById('submitPhotoBtn');
        if (submitPhotoBtn) {
            submitPhotoBtn.addEventListener('click', () => this.handlePhotoSubmission());
        }
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Photo modal navigation
            if (this.isPhotoModalOpen()) {
                if (e.key === 'ArrowLeft') {
                    this.navigatePhoto(-1);
                } else if (e.key === 'ArrowRight') {
                    this.navigatePhoto(1);
                } else if (e.key === 'Escape') {
                    this.hidePhotoModal();
                }
            } 
            // Location selection mode
            else if (this.isLocationSelectionMode()) {
                if (e.key === 'Escape') {
                    const handler = this.eventHandlers.get('cancelLocationSelection');
                    if (handler) handler();
                }
            } 
            // General shortcuts
            else if (e.key === 'Escape') {
                this.hideAreaInfo();
            }
        });
    }

    /**
     * エリア情報を表示
     */
    showAreaInfo(area) {
        this.selectedArea = area;
        const panel = document.getElementById('areaInfoPanel');
        const areaName = document.getElementById('areaInfoName');
        const areaDescription = document.getElementById('areaInfoDescription');
        const areaPhotosContainer = document.getElementById('areaPhotosGrid');

        if (!panel || !areaName || !areaDescription || !areaPhotosContainer) {
            console.error('⚠️ UIManager: Required panel elements not found');
            return;
        }

        // Set area information
        areaName.textContent = area.name || 'エリア名未設定';
        areaDescription.textContent = area.description || 'エリアの説明がありません';

        // Get photos in this area
        const photosInArea = this.dataManager ? this.dataManager.getPhotosInArea(area) : [];
        
        // Update area statistics
        const photoCountElement = document.getElementById('areaPhotoCount');
        const areaCategoryElement = document.getElementById('areaCategory');
        const areaLastUpdateElement = document.getElementById('areaLastUpdate');
        
        if (photoCountElement) {
            photoCountElement.textContent = `${photosInArea.length}枚の写真`;
        }
        
        if (areaCategoryElement && area.category) {
            areaCategoryElement.textContent = area.category;
        }
        
        if (areaLastUpdateElement && photosInArea.length > 0) {
            // 最新の写真の日付を表示
            const latestPhoto = photosInArea.sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at))[0];
            const date = new Date(latestPhoto.taken_at).toLocaleDateString('ja-JP');
            areaLastUpdateElement.textContent = date;
        }
        
        // Update area color dot
        const colorDotElement = document.getElementById('areaColorDot');
        if (colorDotElement && area.color) {
            colorDotElement.style.backgroundColor = area.color;
        }

        // Display photos using current display mode
        this.refreshPhotoDisplay();

        // Show panel
        panel.style.display = 'block';
        setTimeout(() => panel.classList.add('visible'), 10);

        console.log('📋 Area info panel shown for:', area.name);
    }

    /**
     * エリア情報を非表示
     */
    hideAreaInfo() {
        const panel = document.getElementById('areaInfoPanel');
        if (panel) {
            panel.classList.remove('visible');
            setTimeout(() => {
                panel.style.display = 'none';
            }, 300);
        }
        this.selectedArea = null;
        console.log('📋 Area info panel hidden');
    }

    /**
     * エリア内の写真を表示
     */
    displayAreaPhotos(photos, container) {
        if (!container) return;

        container.innerHTML = '';

        if (photos.length === 0) {
            container.innerHTML = '<p class="no-photos">このエリアには写真がありません。</p>';
            return;
        }

        photos.forEach((photo, index) => {
            const photoElement = this.createPhotoGridItem(photo, index);
            container.appendChild(photoElement);
        });
    }

    /**
     * 写真グリッドアイテムを作成
     */
    createPhotoGridItem(photo, index) {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-photo';
        
        gridItem.innerHTML = `
            <img src="${photo.thumbnail_url}" alt="${photo.title}" loading="lazy" 
                 onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik03NSA3NUg3NUM2Ny4yNjggNzUgNjEgODEuMjY4IDYxIDg5VjExMUM2MSAxMTguNzMyIDY3LjI2OCAxMjUgNzUgMTI1SDEyNUMxMzIuNzMyIDEyNSAxMzkgMTE4LjczMiAxMzkgMTExVjg5QzEzOSA4MS4yNjggMTMyLjczMiA3NSAxMjUgNzVINzVaIiBmaWxsPSIjNTU1Ii8+CjxjaXJjbGUgY3g9Ijg3LjUiIGN5PSI5NSIgcj0iNy41IiBmaWxsPSIjNzc3Ii8+CjxwYXRoIGQ9Ik03MiAxMTVMOTQgOTNMMTE4IDEwNUgxMjhIMTI4SDcyWiIgZmlsbD0iIzc3NyIvPgo8dGV4dCB4PSIxMDAiIHk9IjE2MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lhpnnnJ/jgYzloqHjgb/jgb7jgZfjgZ88L3RleHQ+Cjwvc3ZnPg=='" />
            <div class="photo-overlay">
                <h4>${photo.title}</h4>
                <p>${photo.location || ''}</p>
            </div>
        `;

        gridItem.addEventListener('click', () => {
            this.showPhotoModal(index);
        });

        return gridItem;
    }

    /**
     * 写真モーダルを表示
     */
    showPhotoModal(photoIndex) {
        const photos = this.selectedArea ? 
            this.dataManager.getPhotosInArea(this.selectedArea) : 
            this.dataManager.getFilteredPhotos();

        this.currentPhotoIndex = photoIndex;
        const photo = photos[photoIndex];

        if (!photo) return;

        const modal = document.getElementById('photoModal');
        const modalTitle = document.getElementById('modalPhotoTitle');
        const modalImage = document.getElementById('modalPhotoImage');
        const modalDescription = document.getElementById('modalPhotoDescription');
        const modalLocation = document.getElementById('modalPhotoLocation');

        if (!modal || !modalTitle || !modalImage || !modalDescription || !modalLocation) {
            console.warn('Photo modal elements not found');
            return;
        }

        // Update modal content
        modalTitle.textContent = photo.title;
        modalImage.src = photo.image_url;
        modalImage.onerror = function() {
            this.onerror = null;
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMjIyIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDM1MEMzMzUuMDg4IDI1MCAzMjMgMjYyLjA4OCAzMjMgMjc3VjMyM0MzMjMgMzM3LjkxMiAzMzUuMDg4IDM1MCAzNTAgMzUwSDQ1MEM0NjQuOTEyIDM1MCA0NzcgMzM3LjkxMiA0NzcgMzIzVjI3N0M0NzcgMjYyLjA4OCA0NjQuOTEyIDI1MCA0NTAgMjUwSDM1MFoiIGZpbGw9IiM1NTUiLz4KPGNpcmNsZSBjeD0iMzc1IiBjeT0iMjkwIiByPSIyMCIgZmlsbD0iIzc3NyIvPgo8cGF0aCBkPSJNMzQwIDMzMEwzOTAgMjgwTDQzMCAzMDBMNDIwIDMzMEgzNjBMMzQwIDMzMFoiIGZpbGw9IiM3NzciLz4KPHR4dCB4PSI0MDAiIHk9IjQwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lhpnnnJ/jgYzloqHjgb/jgb7jgZfjgZ88L3R4dD4KPC9zdmc+';
        };
        modalDescription.textContent = photo.description || '';
        modalLocation.textContent = photo.location || '';

        // Show modal
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);
    }

    /**
     * 写真モーダルを非表示
     */
    hidePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * 写真ナビゲーション
     */
    navigatePhoto(direction) {
        const photos = this.selectedArea ? 
            this.dataManager.getPhotosInArea(this.selectedArea) : 
            this.dataManager.getFilteredPhotos();

        this.currentPhotoIndex += direction;

        if (this.currentPhotoIndex < 0) {
            this.currentPhotoIndex = photos.length - 1;
        } else if (this.currentPhotoIndex >= photos.length) {
            this.currentPhotoIndex = 0;
        }

        this.showPhotoModal(this.currentPhotoIndex);
    }

    /**
     * 写真追加モーダルを表示
     */
    showAddPhotoModal() {
        const modal = document.getElementById('addPhotoModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('visible'), 10);
        }
    }

    /**
     * 写真追加モーダルを非表示
     */
    hideAddPhotoModal() {
        const modal = document.getElementById('addPhotoModal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
                this.resetAddPhotoForm();
            }, 300);
        }
    }

    /**
     * 写真追加フォームをリセット
     */
    resetAddPhotoForm() {
        const form = document.getElementById('addPhotoForm');
        if (form) {
            form.reset();
        }

        // Reset location display
        const locationDisplay = document.getElementById('selectedLocationDisplay');
        if (locationDisplay) {
            locationDisplay.style.display = 'none';
        }
    }

    /**
     * 表示モードを設定
     */
    setDisplayMode(mode) {
        this.displayMode = mode;
        
        const gridBtn = document.getElementById('gridModeBtn');
        const timelineBtn = document.getElementById('timelineModeBtn');
        
        if (gridBtn && timelineBtn) {
            gridBtn.classList.toggle('active', mode === 'grid');
            timelineBtn.classList.toggle('active', mode === 'timeline');
        }

        this.refreshPhotoDisplay();
    }

    /**
     * 写真表示を更新
     */
    refreshPhotoDisplay() {
        const handler = this.eventHandlers.get('refreshPhotos');
        
        if (handler) {
            handler(this.displayMode, this.currentPage);
        } else {
            console.warn('⚠️ UIManager: No refreshPhotos handler registered');
        }
    }

    /**
     * ローディングオーバーレイを非表示
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.visibility = 'hidden';
            loadingOverlay.style.opacity = '0';
            loadingOverlay.setAttribute('aria-hidden', 'true');
            
            console.log('✅ Loading overlay hidden successfully');
        } else {
            console.warn('⚠️ Loading overlay element not found');
        }
    }

    /**
     * 写真投稿を処理
     */
    handlePhotoSubmission() {
        const handler = this.eventHandlers.get('submitPhoto');
        if (handler) {
            handler();
        }
    }

    /**
     * 位置選択完了を処理
     */
    updateLocationDisplay(location) {
        const locationDisplay = document.getElementById('selectedLocationDisplay');
        const latElement = document.getElementById('selectedLat');
        const lngElement = document.getElementById('selectedLng');

        if (locationDisplay && latElement && lngElement) {
            latElement.textContent = location.lat.toFixed(6);
            lngElement.textContent = location.lng.toFixed(6);
            locationDisplay.style.display = 'block';
        }
    }

    // Helper methods
    isPhotoModalOpen() {
        const modal = document.getElementById('photoModal');
        return modal && modal.style.display === 'flex';
    }

    isLocationSelectionMode() {
        const handler = this.eventHandlers.get('isLocationSelectionMode');
        return handler ? handler() : false;
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