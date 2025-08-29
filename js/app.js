// Photo Map Application with Area Polygons
class PhotoMapApp {
    constructor() {
        this.map = null;
        this.photos = [];
        this.areas = [];
        this.currentAreaPhotos = [];
        this.currentPhotoIndex = 0;
        this.selectedArea = null;
        
        // Layer groups
        this.photoLayer = null;
        this.areaLayer = null;
        
        // Pagination for large photo sets
        this.currentPage = 1;
        this.photosPerPage = 12;
        this.filteredPhotos = [];
        this.searchQuery = '';
        this.sortOrder = 'newest';
        
        // 🎯 Display mode management
        this.displayMode = 'grid'; // 'grid' or 'timeline'
        
        // Photo adding state
        this.isSelectingLocation = false;
        this.selectedLocation = null;
        this.tempMapClickHandler = null;
        
        // Clustering state tracking
        this.lastClusterState = null;
        

        
        // Configuration
        this.config = {
            center: [34.843, 134.5972], // 太子町中心地点
            zoom: 13,
            maxZoom: 18,
            minZoom: 10
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 PhotoMapApp initialization started');
            console.log('📍 Environment check:', {
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                userAgent: navigator.userAgent
            });
            
            console.log('📊 Loading data...');
            await this.loadData();
            
            console.log('🗺️ Initializing map...');
            this.initMap();
            
            console.log('🎛️ Setting up event listeners...');
            this.initEventListeners();
            
            console.log('✅ Hiding loading overlay...');
            this.hideLoading();
            
            console.log('🎉 PhotoMapApp initialization completed successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            console.error('Error stack:', error.stack);
            this.hideLoading(); // エラー時も必ずローディングを隠す
            
            // 🧪 btoa error specific handling
            if (error.message.includes('btoa') || error.message.includes('Latin1')) {
                console.error('🚨 Character encoding error detected. This has been fixed in the latest code.');
            }
            
            // Try to initialize map without data as fallback
            try {
                console.log('🔄 Attempting fallback initialization...');
                this.initMap();
                this.initEventListeners();
                this.showFallbackMessage();
            } catch (mapError) {
                console.error('❌ Fallback initialization also failed:', mapError);
                this.hideLoading(); // フォールバック失敗時もローディングを隠す
                this.showProductionError(error);
            }
        }
    }
    
    async loadData() {
        try {
            console.log('📊 Loading data from static files...');
            console.log('🌐 Current location:', window.location.href);
            
            // Build static file URLs
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
            const photosUrl = baseUrl + '/data/photos.json';
            const areasUrl = baseUrl + '/data/areas.json';
            
            console.log('📍 Data file URLs:', { photosUrl, areasUrl });
            
            // Load photos from static JSON
            console.log('📸 Loading photos from JSON...');
            const photosResponse = await fetch(photosUrl);
            if (!photosResponse.ok) {
                throw new Error(`Failed to load photos.json: ${photosResponse.status}`);
            }
            this.photos = await photosResponse.json();
            
            // Load areas from static JSON
            console.log('🏞️ Loading areas from JSON...');
            const areasResponse = await fetch(areasUrl);
            if (!areasResponse.ok) {
                throw new Error(`Failed to load areas.json: ${areasResponse.status}`);
            }
            this.areas = await areasResponse.json();
            
            console.log(`🎉 Loaded ${this.photos.length} photos and ${this.areas.length} areas from static files`);
        } catch (error) {
            console.error('❌ Error loading static data:', error);
            
            // Fallback to embedded data if files fail to load
            console.log('🔄 Falling back to embedded data...');
            this.loadEmbeddedData();
        }
    }
    

    
    loadEmbeddedData() {
        console.log('📦 Loading embedded fallback data...');
        
        // Embedded areas data
        this.areas = [
            {
                id: "area_001",
                name: "太子アグリパーク",
                description: "農業体験と自然学習ができる公園エリア",
                center_lat: 34.8515,
                center_lng: 134.6021,
                radius: 0.8,
                color: "#32CD32",
                category: "公園",
                is_active: true,
                priority: 1
            },
            {
                id: "area_002", 
                name: "太子中央公園",
                description: "町の中心部にある大型公園",
                center_lat: 34.843,
                center_lng: 134.5972,
                radius: 0.6,
                color: "#4CAF50",
                category: "市民公園",
                is_active: true,
                priority: 2
            },
            {
                id: "area_003",
                name: "太子山公園", 
                description: "山間部の自然公園エリア",
                center_lat: 34.865,
                center_lng: 134.585,
                radius: 1.2,
                color: "#8BC34A",
                category: "山岳",
                is_active: true,
                priority: 3
            }
        ];
        
        // Embedded photos data (sample)
        this.photos = [
            {
                id: "photo_001",
                title: "アグリパークの花畑",
                description: "色とりどりの花々が咲き誇る美しい風景",
                image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
                thumbnail_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
                latitude: 34.8505,
                longitude: 134.6015,
                taken_at: "2024-03-15T10:30:00Z",
                location: "太子アグリパーク",
                tags: ["花", "公園", "春"],
                is_featured: true,
                view_count: 245
            },
            {
                id: "photo_002",
                title: "中央公園の桜",
                description: "春の訪れを告げる美しい桜の花",
                image_url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=600&fit=crop",
                thumbnail_url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&h=200&fit=crop",
                latitude: 34.8425,
                longitude: 134.5965,
                taken_at: "2024-04-08T08:15:00Z",
                location: "太子中央公園",
                tags: ["桜", "春", "公園"],
                is_featured: false,
                view_count: 189
            },
            {
                id: "photo_003",
                title: "山間の散歩道",
                description: "緑豊かな山間を抜ける静かな散歩道",
                image_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
                thumbnail_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
                latitude: 34.863,
                longitude: 134.582,
                taken_at: "2024-05-20T14:45:00Z",
                location: "太子山公園",
                tags: ["山", "ハイキング", "自然"],
                is_featured: false,
                view_count: 156
            }
        ];
        
        console.log(`📦 Embedded data loaded: ${this.photos.length} photos, ${this.areas.length} areas`);
    }
    
    showFallbackMessage() {
        // Create a fallback info panel
        const fallbackPanel = document.createElement('div');
        fallbackPanel.style.cssText = `
            position: fixed;
            top: 120px;
            left: 20px;
            right: 20px;
            background: rgba(0, 122, 255, 0.9);
            color: white;
            padding: 20px;
            border-radius: 12px;
            z-index: 1000;
            text-align: center;
            backdrop-filter: blur(10px);
        `;
        fallbackPanel.innerHTML = `
            <h3 style="margin-bottom: 15px;">📍 地図は表示中</h3>
            <p style="margin-bottom: 15px;">データ読み込み中のため、写真マーカーは表示されていません。</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #007AFF;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            ">再読み込み</button>
        `;
        document.body.appendChild(fallbackPanel);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (fallbackPanel.parentNode) {
                fallbackPanel.remove();
            }
        }, 10000);
    }
    
    initMap() {
        try {
            console.log('🗺️ Checking map container...');
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container element not found');
            }
            console.log('✅ Map container found:', mapContainer);
            
            console.log('🌍 Creating Leaflet map instance...');
            console.log('📍 Map config:', this.config);
            
            // Initialize map
            this.map = L.map('map', {
                zoomControl: false
            }).setView(this.config.center, this.config.zoom);
            
            console.log('✅ Leaflet map created successfully');
            
            console.log('🗺️ Adding tile layer...');
            // Add tile layer
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: this.config.maxZoom,
                minZoom: this.config.minZoom
            }).addTo(this.map);
            
            console.log('✅ Tile layer added');
            
            // Add custom zoom control
            console.log('🎛️ Adding zoom controls...');
            L.control.zoom({
                position: 'topright'
            }).addTo(this.map);
            
            // Initialize layer groups
            console.log('📍 Initializing layer groups...');
            this.photoLayer = L.layerGroup().addTo(this.map);
            this.areaLayer = L.layerGroup().addTo(this.map);
            
            // Add zoom event listener for dynamic clustering
            this.map.on('zoomend', () => {
                this.handleZoomChange();
            });
            
            console.log('🎯 Adding area markers...');
            // Add map data
            this.addAreaMarkers();
            this.addPhotoMarkers();
            
            console.log('✅ Map initialization completed');
            
        } catch (error) {
            console.error('❌ Map initialization failed:', error);
            throw error;
        }
    }
    
    addAreaMarkers() {
        console.log(`Adding area markers for ${this.areas.length} areas`);
        const currentZoom = this.map.getZoom();
        const clusters = this.shouldClusterMarkers(currentZoom) ? this.createPhotoClusters() : this.areas;
        
        clusters.forEach(cluster => {
            if (cluster.center_lat && cluster.center_lng && cluster.is_active !== false) {
                // クラスターまたはエリア内写真を取得
                const clusterPhotos = cluster.photos || this.getPhotosInArea(cluster);
                const photoCount = clusterPhotos.length;
                
                console.log(`${cluster.isCluster ? 'Cluster' : 'Area'} "${cluster.name}": ${photoCount} photos`);
                if (photoCount === 0) return; // 写真がない場合はマーカーを表示しない
                
                // 代表写真を選択（人気順 → 新着順）
                const representativePhoto = this.getRepresentativePhoto(clusterPhotos);
                const displayCount = photoCount > 999 ? '999+' : photoCount.toString();
                const badgeClass = photoCount > 99 ? 'large-count' : '';
                
                // 【真の解決策】ズーム応答型マーカーサイズ：座標精度を保ちつつ適切なサイズ
                const markerSize = this.getResponsiveMarkerSize(currentZoom, cluster.isCluster);
                
                console.log(`Creating marker for ${cluster.name}: ${displayCount} photos`);
                
                // ✨ PRODUCTION: シンプルで正確なSVGマーカー
                let areaIcon;
                
                try {
                    const count = displayCount.toString().substring(0, 3);
                    const markerSize = this.getResponsiveMarkerSize(currentZoom, cluster.isCluster);
                    
                    // 🎯 仮説検証: Base64エンコード + 明示的な透明背景
                    const svgString = 
                        '<svg width="' + markerSize + '" height="' + markerSize + '" viewBox="0 0 ' + markerSize + ' ' + markerSize + '" xmlns="http://www.w3.org/2000/svg" style="background:transparent;">' +
                        '<rect width="100%" height="100%" fill="none" opacity="0"/>' + // 明示的な透明背景
                        '<circle cx="' + (markerSize/2) + '" cy="' + (markerSize/2) + '" r="' + (markerSize/2 - 2) + '" fill="#007AFF" stroke="white" stroke-width="2"/>' +
                        '<text x="' + (markerSize/2) + '" y="' + (markerSize/2 + 4) + '" text-anchor="middle" fill="white" font-size="' + Math.floor(markerSize * 0.3) + '" font-weight="bold">' + count + '</text>' +
                        '</svg>';
                    
                    console.log('🔍 SVG Debug:', svgString.substring(0, 150) + '...');
                    
                    areaIcon = L.icon({
                        iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))),
                        iconSize: [markerSize, markerSize],
                        iconAnchor: [markerSize / 2, markerSize / 2],
                        popupAnchor: [0, -(markerSize / 2 + 10)],
                        className: 'custom-marker-icon' // CSSデバッグ用
                    });
                    
                } catch (svgError) {
                    console.warn('SVG creation failed, using fallback icon:', svgError);
                    
                    // フォールバック: シンプルなCanvas描画アイコン
                    const canvas = document.createElement('canvas');
                    const size = this.getResponsiveMarkerSize(currentZoom, cluster.isCluster);
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    
                    // 背景円
                    ctx.fillStyle = cluster.isCluster ? '#007AFF' : '#FF3B30';
                    ctx.beginPath();
                    ctx.arc(size/2, size/2, size/2 - 2, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // 白いボーダー
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // カウントテキスト
                    ctx.fillStyle = 'white';
                    ctx.font = 'bold ' + Math.floor(size * 0.25) + 'px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(displayCount, size/2, size/2 + 2);
                    
                    areaIcon = L.icon({
                        iconUrl: canvas.toDataURL(),
                        iconSize: [size, size],
                        iconAnchor: [size/2, size/2],
                        popupAnchor: [0, -(size/2 + 10)]
                    });
                }
                
                const marker = L.marker([cluster.center_lat, cluster.center_lng], {
                    icon: areaIcon,
                    interactive: true
                });
                
                // 座標精度確認（本番では無効化可能）
                const actualLatLng = marker.getLatLng();
                const latDiff = Math.abs(actualLatLng.lat - cluster.center_lat);
                const lngDiff = Math.abs(actualLatLng.lng - cluster.center_lng);
                
                if (latDiff > 0.0001 || lngDiff > 0.0001) {
                    console.warn(`Coordinate precision warning for ${cluster.name}: lat_diff=${latDiff.toFixed(8)}, lng_diff=${lngDiff.toFixed(8)}`);
                }
                
                // クリックイベント
                marker.on('click', (e) => {
                    console.log('Marker clicked:', cluster.name);
                    if (cluster.isCluster && currentZoom < this.config.maxZoom - 2) {
                        // クラスターの場合はズームイン
                        this.map.setView([cluster.center_lat, cluster.center_lng], Math.min(currentZoom + 2, this.config.maxZoom - 1));
                    } else {
                        // エリアの場合は詳細表示
                        this.showAreaInfo(cluster.areas ? cluster.areas[0] : cluster);
                        this.selectArea(cluster.areas ? cluster.areas[0] : cluster, marker);
                    }
                    L.DomEvent.stopPropagation(e);
                });
                
                // タッチイベント（モバイル対応）
                marker.on('touchstart', (e) => {
                    if (cluster.isCluster && currentZoom < this.config.maxZoom - 2) {
                        this.map.setView([cluster.center_lat, cluster.center_lng], Math.min(currentZoom + 2, this.config.maxZoom - 1));
                    } else {
                        this.showAreaInfo(cluster.areas ? cluster.areas[0] : cluster);
                        this.selectArea(cluster.areas ? cluster.areas[0] : cluster, marker);
                    }
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
                
                // クリックイベント
                marker.on('click', (e) => {
                    if (cluster.isCluster && this.map.getZoom() < this.config.maxZoom - 2) {
                        this.map.setView([cluster.center_lat, cluster.center_lng], Math.min(this.map.getZoom() + 2, this.config.maxZoom - 1));
                    } else {
                        this.showAreaInfo(cluster.areas ? cluster.areas[0] : cluster);
                        this.selectArea(cluster.areas ? cluster.areas[0] : cluster, marker);
                    }
                    L.DomEvent.stopPropagation(e);
                });
                
                // Store reference
                marker.areaData = cluster.areas ? cluster.areas[0] : cluster;
                marker.clusterData = cluster;
                
                this.areaLayer.addLayer(marker);
                console.log(`Added marker for: ${cluster.name}`);
            }
        });
    }
    
    getRepresentativePhoto(photos) {
        if (!photos || photos.length === 0) return null;
        
        // 1. おすすめ写真があればそれを優先
        const featuredPhotos = photos.filter(photo => photo.is_featured);
        if (featuredPhotos.length > 0) {
            return featuredPhotos.reduce((best, photo) => 
                (photo.view_count || 0) > (best.view_count || 0) ? photo : best
            );
        }
        
        // 2. 人気順（閲覧数）で選択
        const popularPhoto = photos.reduce((best, photo) => 
            (photo.view_count || 0) > (best.view_count || 0) ? photo : best
        );
        
        // 3. 閲覧数が同じなら新着順
        const sameViewCountPhotos = photos.filter(photo => 
            (photo.view_count || 0) === (popularPhoto.view_count || 0)
        );
        
        return sameViewCountPhotos.reduce((newest, photo) => 
            new Date(photo.taken_at) > new Date(newest.taken_at) ? photo : newest
        );
    }
    
    addPhotoMarkers() {
        // 大量写真対応: 個別ピンではなくエリア中心にカウントバッジを表示
        // 個別の写真ピンは表示しない（パフォーマンス対応）
        console.log(`Skipping individual photo pins for performance (${this.photos.length} photos)`);
    }
    

    
    createPhotoPin(photo) {
        const iconSize = 40;
        
        return L.divIcon({
            className: 'photo-pin-container',
            html: `
                <div class="photo-pin" style="
                    width: ${iconSize}px;
                    height: ${iconSize}px;
                    background-image: url('${photo.thumbnail_url}');
                    background-size: cover;
                    background-position: center;
                "></div>
            `,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize / 2, iconSize / 2]
        });
    }
    
    createPopupContent(photo, index) {
        return `
            <div class="popup-content">
                <img src="${photo.thumbnail_url}" alt="${photo.title}" class="popup-image">
                <div class="popup-title">${photo.title}</div>
                <div class="popup-location">${photo.location}</div>
                <button class="popup-view-btn" onclick="app.showPhotoModal(${index})">
                    詳細を表示
                </button>
            </div>
        `;
    }
    
    showAreaInfo(area) {
        // Get photos in this area
        const areaPhotos = this.getPhotosInArea(area);
        this.currentAreaPhotos = areaPhotos;
        this.filteredPhotos = [...areaPhotos];
        this.currentPage = 1;
        
        // Update area info panel
        document.getElementById('areaColorDot').style.backgroundColor = area.color || '#007AFF';
        document.getElementById('areaInfoName').textContent = area.name;
        document.getElementById('areaInfoDescription').textContent = area.description || '';
        document.getElementById('areaPhotoCount').textContent = `${areaPhotos.length}枚の写真`;
        document.getElementById('areaCategory').textContent = area.category || 'カテゴリなし';
        
        // Set last update time
        const lastUpdate = this.getAreaLastUpdate(areaPhotos);
        document.getElementById('areaLastUpdate').textContent = lastUpdate;
        
        // Reset search and sort
        document.getElementById('photoSearch').value = '';
        document.getElementById('sortOrder').value = 'newest';
        this.searchQuery = '';
        this.sortOrder = 'newest';
        
        // Apply initial sort
        this.sortPhotos();
        
        // Reset to grid mode when showing area info
        this.displayMode = 'grid';
        document.getElementById('gridModeBtn').classList.add('active');
        document.getElementById('timelineModeBtn').classList.remove('active');
        
        // Render photos with pagination
        this.refreshPhotoDisplay();
        
        // Show panel
        document.getElementById('areaInfoPanel').style.display = 'block';
    }
    
    hideAreaInfo() {
        document.getElementById('areaInfoPanel').style.display = 'none';
        this.clearAreaSelection();
    }
    
    selectArea(area, marker) {
        // Clear previous selection
        this.clearAreaSelection();
        
        // Set new selection with enhanced animation
        this.selectedArea = area;
        if (marker.getElement()) {
            const element = marker.getElement();
            
            // Add selection classes for enhanced animation
            element.classList.add('selected');
            element.classList.add('selecting'); // Trigger selection animation
            
            // Add pulsing effect for extra emphasis
            setTimeout(() => {
                element.classList.add('pulse-active');
            }, 100);
            
            // Store reference to marker for potential future use
            this.selectedMarker = marker;
            
            console.log(`Selected area: ${area.name} with enhanced animation`);
        }
    }
    
    clearAreaSelection() {
        if (this.selectedArea) {
            this.areaLayer.eachLayer(layer => {
                if (layer.areaData?.id === this.selectedArea.id && layer.getElement()) {
                    const element = layer.getElement();
                    
                    // Remove all selection classes with animation
                    element.classList.remove('selected');
                    element.classList.remove('selecting');
                    element.classList.remove('pulse-active');
                    
                    // Add deselecting animation
                    element.classList.add('deselecting');
                    setTimeout(() => {
                        element.classList.remove('deselecting');
                    }, 300);
                }
            });
            this.selectedArea = null;
            this.selectedMarker = null;
        }
    }
    
    getPhotosInArea(area) {
        if (!area.center_lat || !area.center_lng || !area.radius) return [];
        
        return this.photos.filter(photo => {
            if (!photo.latitude || !photo.longitude) return false;
            
            // 中心点からの距離を計算（簡易計算）
            const distance = this.calculateDistance(
                area.center_lat, area.center_lng,
                photo.latitude, photo.longitude
            );
            
            return distance <= area.radius;
        });
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球の半径（km）
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    renderAreaPhotosGrid() {
        const container = document.getElementById('areaPhotosGrid');
        const timelineContainer = document.getElementById('areaPhotosTimeline');
        const pagination = document.getElementById('photoPagination');
        const loadMoreBtn = document.getElementById('loadMorePhotos');
        
        // Show grid, hide timeline
        container.style.display = 'grid';
        timelineContainer.style.display = 'none';
        
        if (this.filteredPhotos.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.6); font-size: 14px; text-align: center; padding: 20px;">写真が見つかりません</p>';
            pagination.style.display = 'none';
            loadMoreBtn.style.display = 'none';
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(this.filteredPhotos.length / this.photosPerPage);
        const startIndex = (this.currentPage - 1) * this.photosPerPage;
        const endIndex = Math.min(startIndex + this.photosPerPage, this.filteredPhotos.length);
        const pagePhotos = this.filteredPhotos.slice(startIndex, endIndex);
        
        // Render photos
        const gridHtml = pagePhotos.map((photo, index) => {
            const globalIndex = this.photos.findIndex(p => p.id === photo.id);
            const date = new Date(photo.taken_at);
            const dateStr = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
            
            return `
                <div class="grid-photo" onclick="app.showPhotoModal(${globalIndex})">
                    <img src="${photo.thumbnail_url}" 
                         alt="${photo.title}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik05MCA3MEg5MEM4NC40NzcyIDcwIDgwIDc0LjQ3NzIgODAgODBWMTIwQzgwIDEyNS41MjMgODQuNDc3MiAxMzAgOTAgMTMwSDExMEMxMTUuNTIzIDEzMCAxMjAgMTI1LjUyMyAxMjAgMTIwVjgwQzEyMCA3NC40NzcyIDExNS41MjMgNzAgMTEwIDcwSDkwWiIgZmlsbD0iIzY2NiIvPgo8Y2lyY2xlIGN4PSI5NSIgY3k9IjkwIiByPSI4IiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik04NSAxMTBMMTA1IDkwTDExNSAxMDBMMTEwIDExNUg5MEw4NSAxMTBaIiBmaWxsPSIjOTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWGmeecn+acquiqreOBvzwvdGV4dD4KPC9zdmc+';">
                    <div class="photo-overlay">
                        <div class="photo-title">${photo.title}</div>
                        <div class="photo-date">${dateStr}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = gridHtml;
        
        // Update pagination
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            document.getElementById('pageInfo').textContent = `${this.currentPage} / ${totalPages}`;
            document.getElementById('prevPage').disabled = this.currentPage === 1;
            document.getElementById('nextPage').disabled = this.currentPage === totalPages;
        } else {
            pagination.style.display = 'none';
        }
        
        // Show load more if applicable
        if (this.filteredPhotos.length > this.photosPerPage && this.currentPage < totalPages) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    // 🎯 Display Mode Management
    setDisplayMode(mode) {
        this.displayMode = mode;
        
        // Update button states
        document.getElementById('gridModeBtn').classList.toggle('active', mode === 'grid');
        document.getElementById('timelineModeBtn').classList.toggle('active', mode === 'timeline');
        
        // Update display
        this.refreshPhotoDisplay();
        
        console.log(`Display mode changed to: ${mode}`);
    }
    
    refreshPhotoDisplay() {
        if (this.displayMode === 'grid') {
            this.renderAreaPhotosGrid();
        } else {
            this.renderAreaPhotosTimeline();
        }
    }
    
    // 🎯 Timeline Display Implementation
    renderAreaPhotosTimeline() {
        const container = document.getElementById('areaPhotosTimeline');
        const gridContainer = document.getElementById('areaPhotosGrid');
        const pagination = document.getElementById('photoPagination');
        
        // Show timeline, hide grid
        container.style.display = 'block';
        gridContainer.style.display = 'none';
        
        if (!this.filteredPhotos || this.filteredPhotos.length === 0) {
            container.innerHTML = '<div class="timeline-empty-state"><p>このエリアには写真がありません</p></div>';
            pagination.style.display = 'none';
            return;
        }
        
        // パフォーマンス対応：大量写真の場合はページング
        const useTimelinePagination = this.filteredPhotos.length > 50;
        let displayPhotos = this.filteredPhotos;
        
        // ページング表示の制御
        if (useTimelinePagination) {
            pagination.style.display = 'flex';
        } else {
            pagination.style.display = 'none';
        }
        
        if (useTimelinePagination) {
            const startIndex = (this.currentPage - 1) * this.photosPerPage;
            const endIndex = Math.min(startIndex + this.photosPerPage, this.filteredPhotos.length);
            displayPhotos = this.filteredPhotos.slice(startIndex, endIndex);
            
            // Update pagination for timeline
            const totalPages = Math.ceil(this.filteredPhotos.length / this.photosPerPage);
            document.getElementById('pageInfo').textContent = `${this.currentPage} / ${totalPages}`;
            document.getElementById('prevPage').disabled = this.currentPage === 1;
            document.getElementById('nextPage').disabled = this.currentPage === totalPages;
        }
        
        // Group photos by date
        const photosByDate = this.groupPhotosByDate(displayPhotos);
        
        // Render timeline
        const timelineHtml = Object.keys(photosByDate)
            .sort((a, b) => new Date(b) - new Date(a)) // Newest first
            .map(dateKey => {
                const date = new Date(dateKey + 'T00:00:00'); // タイムゾーン問題を防ぐ
                const dateStr = date.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short'
                });
                
                const photosHtml = photosByDate[dateKey].map(photo => {
                    const globalIndex = this.photos.findIndex(p => p.id === photo.id);
                    const timeStr = new Date(photo.taken_at).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    const tags = photo.tags || [];
                    const tagsHtml = tags.slice(0, 3).map(tag => 
                        `<span class="timeline-tag">${tag}</span>`
                    ).join('');
                    
                    return `
                        <div class="timeline-item">
                            <img src="${photo.thumbnail_url}" 
                                 alt="${photo.title}"
                                 class="timeline-photo"
                                 onclick="app.showPhotoModal(${globalIndex})"
                                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik05MCA3MEg5MEM4NC40NzcyIDcwIDgwIDc0LjQ3NzIgODAgODBWMTIwQzgwIDEyNS41MjMgODQuNDc3MiAxMzAgOTAgMTMwSDExMEMxMTUuNTIzIDEzMCAxMjAgMTI1LjUyMyAxMjAgMTIwVjgwQzEyMCA3NC40NzcyIDExNS41MjMgNzAgMTEwIDcwSDkwWiIgZmlsbD0iIzY2NiIvPgo8Y2lyY2xlIGN4PSI5NSIgY3k9IjkwIiByPSI4IiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik04NSAxMTBMMTA1IDkwTDExNSAxMDBMMTEwIDExNUg5MEw4NSAxMTBaIiBmaWxsPSIjOTk5Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWGmeecn+acquiqreOBvzwvdGV4dD4KPC9zdmc+';">
                            <div class="timeline-content">
                                <div class="timeline-title" onclick="app.showPhotoModal(${globalIndex})">
                                    ${photo.title}
                                </div>
                                <div class="timeline-meta">
                                    <div class="timeline-date">${timeStr}</div>
                                    ${photo.location ? `
                                        <div class="timeline-location">
                                            <i class="fas fa-map-marker-alt"></i>
                                            ${photo.location}
                                        </div>
                                    ` : ''}
                                </div>
                                ${tagsHtml ? `<div class="timeline-tags">${tagsHtml}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
                
                return `
                    <div class="timeline-date-group">
                        <h4 class="timeline-date-header">
                            ${dateStr}
                        </h4>
                        ${photosHtml}
                    </div>
                `;
            }).join('');
        
        container.innerHTML = timelineHtml;
        
        // パフォーマンス情報をログ出力
        const photoCount = Object.values(photosByDate).reduce((sum, photos) => sum + photos.length, 0);
        console.log(`Timeline rendered: ${photoCount} photos in ${Object.keys(photosByDate).length} date groups`);
        
        // 大量データの警告
        if (photoCount > 100) {
            console.warn(`Large timeline dataset (${photoCount} photos). Consider enabling pagination.`);
        }
    }
    
    groupPhotosByDate(photos) {
        const groups = {};
        
        photos.forEach(photo => {
            // 安全な日付処理
            if (!photo.taken_at) {
                console.warn('Photo missing taken_at:', photo.id);
                return;
            }
            
            const date = new Date(photo.taken_at);
            // 無効な日付をチェック
            if (isNaN(date.getTime())) {
                console.warn('Invalid date for photo:', photo.id, photo.taken_at);
                return;
            }
            
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
            
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(photo);
        });
        
        // Sort photos within each date group by time (newest first within each day)
        Object.keys(groups).forEach(dateKey => {
            groups[dateKey].sort((a, b) => {
                const timeA = new Date(a.taken_at).getTime();
                const timeB = new Date(b.taken_at).getTime();
                return timeB - timeA; // Newest first
            });
        });
        
        return groups;
    }
    
    getAreaLastUpdate(photos) {
        if (photos.length === 0) return '更新なし';
        
        const latestPhoto = photos.reduce((latest, photo) => {
            return new Date(photo.taken_at) > new Date(latest.taken_at) ? photo : latest;
        });
        
        const date = new Date(latestPhoto.taken_at);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    sortPhotos() {
        switch (this.sortOrder) {
            case 'newest':
                this.filteredPhotos.sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));
                break;
            case 'oldest':
                this.filteredPhotos.sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at));
                break;
            case 'popular':
                this.filteredPhotos.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                break;
        }
    }
    
    filterPhotos() {
        this.filteredPhotos = this.currentAreaPhotos.filter(photo => {
            if (!this.searchQuery) return true;
            
            const query = this.searchQuery.toLowerCase();
            return photo.title.toLowerCase().includes(query) ||
                   (photo.description && photo.description.toLowerCase().includes(query)) ||
                   (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(query)));
        });
        
        this.sortPhotos();
        this.currentPage = 1;
        this.renderAreaPhotosGrid();
    }
    
    changePage(direction) {
        const totalPages = Math.ceil(this.filteredPhotos.length / this.photosPerPage);
        
        if (direction === 1 && this.currentPage < totalPages) {
            this.currentPage++;
        } else if (direction === -1 && this.currentPage > 1) {
            this.currentPage--;
        }
        
        this.renderAreaPhotosGrid();
        
        // Scroll to top of photos grid
        document.getElementById('areaPhotosGrid').scrollTop = 0;
    }
    
    loadMorePhotos() {
        this.photosPerPage += 12;
        this.renderAreaPhotosGrid();
    }
    
    // Photo Adding Functions
    showAddPhotoModal() {
        // Check if we're in a development environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            document.getElementById('addPhotoModal').style.display = 'flex';
            this.resetAddPhotoForm();
            this.testAPIConnection();
        } else {
            // Production environment - show info message
            this.showProductionInfo();
        }
    }
    
    showProductionInfo() {
        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 122, 255, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            backdrop-filter: blur(10px);
        `;
        infoPanel.innerHTML = `
            <h3 style="margin-bottom: 20px;">📸 写真マップ</h3>
            <p style="margin-bottom: 15px;">このデモでは静的データを使用しています。</p>
            <p style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">
                新しい写真の追加は開発環境でのみ利用可能です。
            </p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #007AFF;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
            ">OK</button>
        `;
        document.body.appendChild(infoPanel);
    }
    
    async testAPIConnection() {
        try {
            console.log('Testing API connection...');
            
            // GET テスト
            const getResponse = await fetch('tables/photos?limit=1');
            console.log('GET API test response status:', getResponse.status);
            if (getResponse.ok) {
                const data = await getResponse.json();
                console.log('GET API test successful, sample data:', data);
            } else {
                console.error('GET API test failed:', getResponse.status, getResponse.statusText);
            }
            
            // POST テスト（実際にはデータを追加しない、テスト用のデータ構造チェック）
            const testPhotoData = {
                title: 'API Test Photo',
                description: 'This is a test photo for API validation',
                image_url: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=500&auto=format&fit=crop&q=60',
                thumbnail_url: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=200&h=200&fit=crop',
                latitude: 34.827966,
                longitude: 134.589815,
                taken_at: new Date().toISOString(),
                location: '太子町',
                tags: ['test', 'api'],
                is_featured: false,
                view_count: 0
            };
            
            console.log('Testing POST API with data:', testPhotoData);
            
        } catch (error) {
            console.error('API test error:', error);
        }
    }
    
    hideAddPhotoModal() {
        document.getElementById('addPhotoModal').style.display = 'none';
        
        // 位置選択中の場合は選択状態をクリア
        if (this.isSelectingLocation) {
            this.cancelLocationSelection();
        }
        
        this.resetAddPhotoForm();
    }
    
    resetAddPhotoForm() {
        document.getElementById('addPhotoForm').reset();
        document.getElementById('selectedLat').textContent = '--';
        document.getElementById('selectedLng').textContent = '--';
        this.selectedLocation = null;
        this.clearFormErrors();
    }
    
    startLocationSelection() {
        console.log('Starting location selection...');
        this.isSelectingLocation = true;
        document.getElementById('locationMarker').style.display = 'block';
        document.getElementById('selectLocationBtn').textContent = '地図をクリックして位置を選択';
        document.getElementById('selectLocationBtn').classList.add('active');
        
        // 地図のカーソルを変更
        this.map.getContainer().style.cursor = 'crosshair';
        
        // モーダルを一時的に閉じる（地図操作のため）
        document.getElementById('addPhotoModal').style.display = 'none';
        
        // 一時的にマップクリックイベントを追加
        this.tempMapClickHandler = (e) => {
            console.log('Map clicked for location:', e.latlng);
            // イベントの伝播を停止
            L.DomEvent.stopPropagation(e);
            this.onMapClickForLocation(e);
        };
        this.map.on('click', this.tempMapClickHandler);
        
        // エリアマーカーのクリックを一時的に無効化
        this.areaLayer.eachLayer(layer => {
            layer.off('click');
            layer.off('touchstart');
        });
    }
    
    cancelLocationSelection() {
        console.log('Canceling location selection...');
        this.isSelectingLocation = false;
        document.getElementById('locationMarker').style.display = 'none';
        document.getElementById('selectLocationBtn').textContent = '地図で位置を選択';
        document.getElementById('selectLocationBtn').classList.remove('active');
        
        // 地図のカーソルを元に戻す
        this.map.getContainer().style.cursor = '';
        
        // マップクリックイベントを削除
        if (this.tempMapClickHandler) {
            this.map.off('click', this.tempMapClickHandler);
            this.tempMapClickHandler = null;
        }
        
        // エリアマーカーのクリックを再度有効化
        this.reattachAreaMarkerEvents();
    }
    
    onMapClickForLocation(e) {
        console.log('Location selected:', e.latlng);
        this.selectedLocation = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };
        
        // 座標を表示
        document.getElementById('selectedLat').textContent = e.latlng.lat.toFixed(6);
        document.getElementById('selectedLng').textContent = e.latlng.lng.toFixed(6);
        
        // 位置選択状態をクリア
        this.cancelLocationSelection();
        
        // モーダルを再表示（位置選択完了時のみ）
        document.getElementById('addPhotoModal').style.display = 'flex';
        
        // 選択完了のフィードバック
        this.showSuccessMessage(`位置が選択されました\n緯度: ${e.latlng.lat.toFixed(6)}\n経度: ${e.latlng.lng.toFixed(6)}`);
    }
    
    async submitPhoto(formData) {
        try {
            console.log('Starting photo submission...');
            console.log('Form data entries:', Array.from(formData.entries()));
            
            // バリデーション
            if (!this.validatePhotoForm(formData)) {
                console.log('Form validation failed');
                return;
            }
            
            // ローディング表示
            const submitBtn = document.getElementById('submitAddPhoto');
            const originalText = submitBtn ? submitBtn.textContent : '写真を追加';
            if (submitBtn) {
                submitBtn.textContent = '追加中...';
                submitBtn.disabled = true;
            }
            
            // 写真データを準備
            const photoData = {
                title: formData.get('title'),
                description: formData.get('description') || '',
                image_url: formData.get('image_url'),
                thumbnail_url: this.generateThumbnailUrl(formData.get('image_url')),
                latitude: this.selectedLocation?.lat || 34.843,
                longitude: this.selectedLocation?.lng || 134.5972,
                taken_at: new Date().toISOString(),
                location: formData.get('location') || '太子町',
                tags: this.parseTags(formData.get('tags')),
                is_featured: false,
                view_count: 0
            };
            
            console.log('Photo data prepared:', photoData);
            console.log('Selected location:', this.selectedLocation);
            
            // APIに送信
            console.log('Sending API request to tables/photos...');
            console.log('Request body:', JSON.stringify(photoData, null, 2));
            
            let response;
            try {
                response = await fetch('tables/photos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(photoData)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`ネットワークエラー: ${fetchError.message}`);
            }
            
            console.log('API response status:', response.status);
            console.log('API response headers:', Object.fromEntries(response.headers.entries()));
            
            let responseText;
            try {
                responseText = await response.text();
                console.log('API response text:', responseText);
            } catch (textError) {
                console.error('Error reading response text:', textError);
                responseText = 'Unable to read response';
            }
            
            if (!response.ok) {
                console.error('API error response:', responseText);
                let errorMessage = `写真の追加に失敗しました (${response.status})`;
                if (response.status === 500) {
                    errorMessage += ': サーバー内部エラーが発生しました。データ形式を確認してください。';
                } else if (response.status === 404) {
                    errorMessage += ': APIエンドポイントが見つかりません。';
                } else {
                    errorMessage += `: ${responseText}`;
                }
                throw new Error(errorMessage);
            }
            
            let result;
            try {
                result = JSON.parse(responseText);
                console.log('Photo added successfully:', result);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Raw response was:', responseText);
                throw new Error('サーバーからの応答が無効です');
            }
            
            // データを更新
            console.log('Reloading data...');
            await this.loadData();
            
            // マーカーを再描画
            console.log('Refreshing area markers...');
            this.refreshAreaMarkers();
            
            // モーダルを閉じる
            this.hideAddPhotoModal();
            
            // 成功メッセージ
            this.showSuccessMessage('写真が正常に追加されました！');
            
        } catch (error) {
            console.error('Error adding photo:', error);
            console.error('Error stack:', error.stack);
            this.showErrorMessage('写真の追加に失敗しました: ' + error.message);
        } finally {
            // ボタンを元に戻す
            const submitBtn = document.getElementById('submitAddPhoto');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }
    
    validatePhotoForm(formData) {
        console.log('Validating photo form...');
        this.clearFormErrors();
        let isValid = true;
        
        // タイトルチェック
        const title = formData.get('title')?.trim();
        console.log('Title:', title);
        if (!title) {
            this.showFieldError('photoTitle', 'タイトルは必須です');
            isValid = false;
        }
        
        // 画像URLチェック
        const imageUrl = formData.get('image_url')?.trim();
        console.log('Image URL:', imageUrl);
        if (!imageUrl) {
            this.showFieldError('photoImageUrl', '画像URLは必須です');
            isValid = false;
        } else if (!this.isValidImageUrl(imageUrl)) {
            console.log('Invalid image URL format');
            this.showFieldError('photoImageUrl', '有効な画像URLを入力してください');
            isValid = false;
        }
        
        // 位置情報チェック
        console.log('Selected location:', this.selectedLocation);
        if (!this.selectedLocation) {
            this.showFieldError('selectLocationBtn', '地図上で位置を選択してください');
            isValid = false;
        }
        
        console.log('Form validation result:', isValid);
        return isValid;
    }
    
    generateThumbnailUrl(imageUrl) {
        console.log('Generating thumbnail URL for:', imageUrl);
        
        // UnsplashのURLの場合、サムネイル用のパラメータを追加
        if (imageUrl.includes('unsplash.com')) {
            let thumbnailUrl;
            if (imageUrl.includes('?')) {
                // 既存のパラメータがある場合は置き換え
                thumbnailUrl = imageUrl.split('?')[0] + '?w=200&h=200&fit=crop';
            } else {
                // パラメータがない場合は追加
                thumbnailUrl = imageUrl + '?w=200&h=200&fit=crop';
            }
            console.log('Generated thumbnail URL:', thumbnailUrl);
            return thumbnailUrl;
        }
        
        console.log('Using original URL as thumbnail:', imageUrl);
        return imageUrl; // その他のURLはそのまま使用
    }
    
    parseTags(tagsString) {
        if (!tagsString?.trim()) return [];
        return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            console.log('Validating image URL:', url);
            console.log('URL hostname:', urlObj.hostname);
            
            // より柔軟な画像URLの検証
            const isImageExtension = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
            const isUnsplash = url.includes('unsplash.com');
            const isImageHost = ['images.unsplash.com', 'unsplash.com', 'plus.unsplash.com'].includes(urlObj.hostname);
            
            const isValid = isImageExtension || isUnsplash || isImageHost;
            console.log('Image URL validation result:', {
                isImageExtension,
                isUnsplash,
                isImageHost,
                isValid
            });
            
            return isValid;
        } catch (error) {
            console.error('URL validation error:', error);
            return false;
        }
    }
    
    refreshAreaMarkers() {
        // 既存のマーカーをクリア
        this.areaLayer.clearLayers();
        
        // 新しいマーカーを追加
        this.addAreaMarkers();
    }
    
    shouldClusterMarkers(zoom) {
        // ズームレベル12以下ではクラスタリングを有効にする（より安定した切り替え）
        return zoom <= 12;
    }
    
    getResponsiveMarkerSize(zoom, isCluster) {
        // 【真の解決策】一般的なマップアプリのような段階的サイズ調整
        
        if (zoom <= 10) {
            // 超縮小：小さなドット（座標精度重視）
            return isCluster ? 16 : 12;
        } else if (zoom <= 12) {
            // 縮小：中程度のドット
            return isCluster ? 24 : 18;
        } else if (zoom <= 14) {
            // 中間：標準サイズ
            return isCluster ? 36 : 30;
        } else if (zoom <= 16) {
            // 拡大：大きめサイズ
            return isCluster ? 48 : 42;
        } else {
            // 最大拡大：最大サイズ
            return isCluster ? 60 : 54;
        }
    }
    
    // 旧関数（後方互換性のため残存）
    getMarkerSize(zoom, isCluster) {
        return this.getResponsiveMarkerSize(zoom, isCluster);
    }
    
    createPhotoClusters() {
        console.log('Creating photo clusters for low zoom level');
        const clusters = [];
        const processedAreas = new Set();
        
        this.areas.forEach(area => {
            if (processedAreas.has(area.id) || !area.is_active) return;
            
            // 近隣のエリアを検索してクラスタリング
            const nearbyAreas = this.areas.filter(otherArea => {
                if (otherArea.id === area.id || processedAreas.has(otherArea.id) || !otherArea.is_active) {
                    return false;
                }
                
                const distance = this.calculateDistance(
                    area.center_lat, area.center_lng,
                    otherArea.center_lat, otherArea.center_lng
                );
                
                // 2km以内の近隣エリアをクラスタリング
                return distance <= 2.0;
            });
            
            if (nearbyAreas.length > 0) {
                // クラスター作成
                const clusterAreas = [area, ...nearbyAreas];
                const allPhotos = [];
                let totalLat = 0, totalLng = 0;
                
                clusterAreas.forEach(clusterArea => {
                    processedAreas.add(clusterArea.id);
                    const areaPhotos = this.getPhotosInArea(clusterArea);
                    allPhotos.push(...areaPhotos);
                    totalLat += clusterArea.center_lat;
                    totalLng += clusterArea.center_lng;
                });
                
                if (allPhotos.length > 0) {
                    clusters.push({
                        id: `cluster_${area.id}`,
                        name: `${clusterAreas.map(a => a.name).join('・')}エリア`,
                        center_lat: totalLat / clusterAreas.length,
                        center_lng: totalLng / clusterAreas.length,
                        photos: allPhotos,
                        areas: clusterAreas,
                        isCluster: true,
                        is_active: true
                    });
                }
            } else {
                // 単独エリア
                const areaPhotos = this.getPhotosInArea(area);
                if (areaPhotos.length > 0) {
                    processedAreas.add(area.id);
                    clusters.push({
                        ...area,
                        photos: areaPhotos,
                        isCluster: false
                    });
                }
            }
        });
        
        console.log(`Created ${clusters.length} clusters from ${this.areas.length} areas`);
        return clusters;
    }
    
    handleZoomChange() {
        const currentZoom = this.map.getZoom();
        console.log('Zoom level changed to:', currentZoom);
        
        // クラスタリング状態が変わる場合は完全再描画
        const shouldCluster = this.shouldClusterMarkers(currentZoom);
        const wasCluster = this.lastClusterState;
        
        if (shouldCluster !== wasCluster) {
            console.log('Clustering state changed, redrawing markers');
            this.refreshAreaMarkers();
            this.lastClusterState = shouldCluster;
        } else {
            // サイズ更新を再度有効にする
            this.updateMarkerSizesSafely(currentZoom);
        }
    }
    
    updateMarkerSizesSafely(zoom) {
        // SVGマーカーでの安全なサイズ更新
        this.areaLayer.eachLayer(layer => {
            if (layer.areaData) {
                const isCluster = layer.clusterData && layer.clusterData.isCluster;
                const newSize = this.getResponsiveMarkerSize(zoom, isCluster);
                const currentIcon = layer.getIcon();
                
                if (currentIcon && currentIcon.options.iconSize[0] !== newSize) {
                    try {
                        // 新しいサイズでアイコンを再作成
                        const count = layer.clusterData ? 
                            (layer.clusterData.photos ? layer.clusterData.photos.length : 
                             this.getPhotosInArea(layer.areaData).length) : 
                            this.getPhotosInArea(layer.areaData).length;
                        
                        const displayCount = count > 999 ? '999+' : count.toString();
                        
                        // 🎯 仮説検証: Base64エンコード + 明示的な透明背景（サイズ更新版）
                        const svgString = 
                            '<svg width="' + newSize + '" height="' + newSize + '" viewBox="0 0 ' + newSize + ' ' + newSize + '" xmlns="http://www.w3.org/2000/svg" style="background:transparent;">' +
                            '<rect width="100%" height="100%" fill="none" opacity="0"/>' + // 明示的な透明背景
                            '<circle cx="' + (newSize/2) + '" cy="' + (newSize/2) + '" r="' + (newSize/2 - 2) + '" fill="#007AFF" stroke="white" stroke-width="2"/>' +
                            '<text x="' + (newSize/2) + '" y="' + (newSize/2 + 4) + '" text-anchor="middle" fill="white" font-size="' + Math.floor(newSize * 0.3) + '" font-weight="bold">' + displayCount + '</text>' +
                            '</svg>';
                        
                        const newIcon = L.icon({
                            iconUrl: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))),
                            iconSize: [newSize, newSize],
                            iconAnchor: [newSize / 2, newSize / 2],
                            popupAnchor: [0, -(newSize / 2 + 10)],
                            className: 'custom-marker-icon' // CSSデバッグ用
                        });
                        
                        layer.setIcon(newIcon);
                    } catch (error) {
                        console.warn('Marker size update failed:', error);
                    }
                }
            }
        });
    }
    
    // 旧関数（後方互換性）
    updateMarkerSizes(zoom) {
        return this.updateMarkerSizesSafely(zoom);
    }
    
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');
        
        // エラーメッセージを表示
        let errorDiv = field.parentNode.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }
    
    clearFormErrors() {
        document.querySelectorAll('.form-group input, .form-group textarea').forEach(field => {
            field.classList.remove('error');
        });
        
        document.querySelectorAll('.error-message').forEach(errorDiv => {
            errorDiv.remove();
        });
    }
    
    showSuccessMessage(message) {
        // 簡単な成功メッセージ表示（実装は簡略化）
        alert(message);
    }
    
    showErrorMessage(message) {
        // 簡単なエラーメッセージ表示（実装は簡略化）
        alert(message);
    }
    
    showProductionError(error) {
        // 本番環境でのエラー表示
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
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
        
        let errorMessage = '';
        let errorType = '';
        
        if (error.message.includes('Cloudflare')) {
            errorType = '🛡️ セキュリティ保護';
            errorMessage = `
                <p>セキュリティ保護により一時的にアクセスが制限されています。</p>
                <p style="margin: 15px 0; font-size: 14px; opacity: 0.8;">
                    数秒待ってからページを再読み込みしてください。
                </p>
            `;
        } else if (error.message.includes('Failed to fetch')) {
            errorType = '🌐 接続エラー';
            errorMessage = `
                <p>データの読み込みに失敗しました。</p>
                <p style="margin: 15px 0; font-size: 14px; opacity: 0.8;">
                    ネットワーク接続を確認してください。
                </p>
            `;
        } else {
            errorType = '🚨 アプリケーションエラー';
            errorMessage = `
                <p>地図の読み込みに失敗しました。</p>
                <p style="margin: 15px 0; font-size: 14px; opacity: 0.8;">
                    ${error.message}
                </p>
            `;
        }
        
        errorContainer.innerHTML = `
            <h3 style="margin-bottom: 20px; font-size: 20px;">${errorType}</h3>
            ${errorMessage}
            <div style="margin-top: 25px;">
                <button onclick="location.reload()" style="
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-right: 10px;
                ">ページを再読み込み</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: transparent;
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">閉じる</button>
            </div>
        `;
        document.body.appendChild(errorContainer);
    }
    
    reattachAreaMarkerEvents() {
        this.areaLayer.eachLayer(layer => {
            if (layer.areaData) {
                // クリックイベントを再アタッチ
                layer.on('click', (e) => {
                    console.log('Area marker clicked:', layer.areaData.name);
                    this.showAreaInfo(layer.areaData);
                    this.selectArea(layer.areaData, layer);
                    L.DomEvent.stopPropagation(e);
                });
                
                // タップイベント（モバイル対応）
                layer.on('touchstart', (e) => {
                    console.log('Area marker touched:', layer.areaData.name);
                    this.showAreaInfo(layer.areaData);
                    this.selectArea(layer.areaData, layer);
                    L.DomEvent.stopPropagation(e);
                });
                
                // ホバーエフェクト
                layer.on('mouseover', () => {
                    if (layer.getElement()) {
                        layer.getElement().classList.add('hover');
                    }
                });
                
                layer.on('mouseout', () => {
                    if (layer.getElement()) {
                        layer.getElement().classList.remove('hover');
                    }
                });
            }
        });
    }
    
    showPhotoModal(photoIndex) {
        this.currentPhotoIndex = photoIndex;
        const photo = this.photos[photoIndex];
        
        if (!photo) return;
        
        // Update modal content
        document.getElementById('modalPhotoTitle').textContent = photo.title;
        const modalImage = document.getElementById('modalPhotoImage');
        modalImage.src = photo.image_url;
        modalImage.onerror = function() {
            this.onerror = null;
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMjIyIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDM1MEMzMzUuMDg4IDI1MCAzMjMgMjYyLjA4OCAzMjMgMjc3VjMyM0MzMjMgMzM3LjkxMiAzMzUuMDg4IDM1MCAzNTAgMzUwSDQ1MEM0NjQuOTEyIDM1MCA0NzcgMzM3LjkxMiA0NzcgMzIzVjI3N0M0NzcgMjYyLjA4OCA0NjQuOTEyIDI1MCA0NTAgMjUwSDM1MFoiIGZpbGw9IiM1NTUiLz4KPGNpcmNsZSBjeD0iMzc1IiBjeT0iMjkwIiByPSIyMCIgZmlsbD0iIzc3NyIvPgo8cGF0aCBkPSJNMzQwIDMzMEwzOTAgMjgwTDQzMCAzMDBMNDIwIDMzMEgzNjBMMzQwIDMzMFoiIGZpbGw9IiM3NzciLz4KPHR4dCB4PSI0MDAiIHk9IjQwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lhpnnnJ/jgYzloqHjgb/jgb7jgZfjgZ88L3R4dD4KPC9zdmc+';
        };
        document.getElementById('modalPhotoDescription').textContent = photo.description || '';
        document.getElementById('modalPhotoLocation').textContent = photo.location || '';
        
        // Format date
        if (photo.taken_at) {
            const date = new Date(photo.taken_at);
            document.getElementById('modalPhotoDate').textContent = date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Render tags
        const tagsContainer = document.getElementById('modalPhotoTags');
        if (photo.tags && photo.tags.length > 0) {
            tagsContainer.innerHTML = photo.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '';
        }
        
        // Update navigation buttons
        document.getElementById('prevModalPhoto').style.display = photoIndex > 0 ? 'block' : 'none';
        document.getElementById('nextModalPhoto').style.display = photoIndex < this.photos.length - 1 ? 'block' : 'none';
        
        // Show modal
        document.getElementById('photoModal').style.display = 'flex';
    }
    
    hidePhotoModal() {
        document.getElementById('photoModal').style.display = 'none';
    }
    
    navigatePhoto(direction) {
        const newIndex = this.currentPhotoIndex + direction;
        if (newIndex >= 0 && newIndex < this.photos.length) {
            this.showPhotoModal(newIndex);
        }
    }
    

    
    centerMapOnLocation() {
        this.map.setView(this.config.center, this.config.zoom);
    }
    

    

    
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // 複数の方法でローディングを確実に隠す
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.visibility = 'hidden';
            loadingOverlay.style.opacity = '0';
            loadingOverlay.setAttribute('aria-hidden', 'true');
            
            console.log('✅ Loading overlay hidden successfully');
        } else {
            console.warn('⚠️ Loading overlay element not found');
        }
    }
    
    initEventListeners() {
        // Map controls
        document.getElementById('centerBtn').addEventListener('click', () => {
            this.centerMapOnLocation();
        });
        
        document.getElementById('addPhotoBtn').addEventListener('click', () => {
            this.showAddPhotoModal();
        });
        
        // Area info panel
        document.getElementById('closeAreaInfo').addEventListener('click', () => {
            this.hideAreaInfo();
        });
        
        // Photo search and filtering
        document.getElementById('photoSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterPhotos();
        });
        
        document.getElementById('sortOrder').addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.sortPhotos();
            this.currentPage = 1;
            this.refreshPhotoDisplay();
        });
        
        // 🎯 Display mode controls
        document.getElementById('gridModeBtn').addEventListener('click', () => {
            this.setDisplayMode('grid');
        });
        
        document.getElementById('timelineModeBtn').addEventListener('click', () => {
            this.setDisplayMode('timeline');
        });
        
        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            this.changePage(-1);
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            this.changePage(1);
        });
        
        document.getElementById('loadMorePhotos').addEventListener('click', () => {
            this.loadMorePhotos();
        });
        
        // Add photo modal events
        document.getElementById('closeAddPhotoModal').addEventListener('click', () => {
            this.hideAddPhotoModal();
        });
        
        document.getElementById('addPhotoBackdrop').addEventListener('click', () => {
            this.hideAddPhotoModal();
        });
        
        document.getElementById('cancelAddPhoto').addEventListener('click', () => {
            this.hideAddPhotoModal();
        });
        
        document.getElementById('selectLocationBtn').addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Location button clicked, current state:', this.isSelectingLocation);
            if (this.isSelectingLocation) {
                // 位置選択をキャンセルしてモーダルを再表示
                this.cancelLocationSelection();
                document.getElementById('addPhotoModal').style.display = 'flex';
            } else {
                this.startLocationSelection();
            }
        });
        
        document.getElementById('addPhotoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Form submit event triggered');
            const formData = new FormData(e.target);
            console.log('FormData created with entries:', Array.from(formData.entries()));
            this.submitPhoto(formData);
        });
        
        // Photo modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hidePhotoModal();
        });
        
        document.getElementById('modalBackdrop').addEventListener('click', () => {
            this.hidePhotoModal();
        });
        
        document.getElementById('prevModalPhoto').addEventListener('click', () => {
            this.navigatePhoto(-1);
        });
        
        document.getElementById('nextModalPhoto').addEventListener('click', () => {
            this.navigatePhoto(1);
        });
        

        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('photoModal').style.display === 'flex') {
                switch (e.key) {
                    case 'ArrowLeft':
                        this.navigatePhoto(-1);
                        break;
                    case 'ArrowRight':
                        this.navigatePhoto(1);
                        break;
                    case 'Escape':
                        this.hidePhotoModal();
                        break;
                }
            } else if (document.getElementById('addPhotoModal').style.display === 'flex') {
                if (e.key === 'Escape') {
                    this.hideAddPhotoModal();
                }
            } else if (this.isSelectingLocation) {
                if (e.key === 'Escape') {
                    this.cancelLocationSelection();
                    document.getElementById('addPhotoModal').style.display = 'flex';
                }
            } else if (e.key === 'Escape') {
                this.hideAreaInfo();
            }
        });
        
        // Map click to hide panels
        this.map.on('click', () => {
            this.hideAreaInfo();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.map.invalidateSize(), 100);
        });
    }
    

}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet library not loaded');
        const errorMsg = 'Leaflet地図ライブラリが読み込まれていません。ネットワーク接続を確認してください。';
        alert(errorMsg);
        return;
    }
    
    console.log('✅ Leaflet library loaded:', L.version);
    
    // Add a small delay to let any Cloudflare challenges complete
    console.log('⏰ Waiting for potential Cloudflare challenges to complete...');
    setTimeout(() => {
        try {
            window.app = new PhotoMapApp();
        } catch (error) {
            console.error('❌ Failed to create PhotoMapApp:', error);
        }
    }, 2000); // Wait 2 seconds
});

// Export for global access
window.PhotoMapApp = PhotoMapApp;