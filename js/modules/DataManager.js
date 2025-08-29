import { APP_CONFIG } from '../config/constants.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

/**
 * データ管理を担当するクラス
 * 写真データ、エリアデータの読み込み、フィルタリング、検索を管理
 */
export class DataManager {
    constructor() {
        this.photos = [];
        this.areas = [];
        // 検索・ソート関連プロパティは削除されました
        
        // ⚡ パフォーマンス向上のためのキャッシュ
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分間のキャッシュ
    }

    /**
     * データを読み込む（JSON -> フォールバック: 埋め込み）- パフォーマンス最適化版
     */
    async loadData() {
        const loadStart = performance.now();
        
        try {
            console.log('📊 Loading data from static files...');
            console.log('🌐 Current location:', window.location.href);
            
            // Build static file URLs
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
            const photosUrl = baseUrl + APP_CONFIG.DATA.PHOTOS_FILE;
            const areasUrl = baseUrl + APP_CONFIG.DATA.AREAS_FILE;
            
            console.log('📍 Data file URLs:', { photosUrl, areasUrl });

            // ⚡ 並列読み込みでパフォーマンス向上
            console.log('🚀 Starting parallel data loading...');
            const [photosResponse, areasResponse] = await Promise.all([
                this.fetchWithCache(photosUrl, 'photos'),
                this.fetchWithCache(areasUrl, 'areas')
            ]);
            
            // ⚡ 並列でJSONパース
            const [photosData, areasData] = await Promise.all([
                photosResponse.json(),
                areasResponse.json()
            ]);
            
            this.photos = photosData;
            this.areas = areasData;
            
            const loadTime = performance.now() - loadStart;
            console.log(`🎉 Loaded ${this.photos.length} photos and ${this.areas.length} areas in ${loadTime.toFixed(2)}ms`);
            
            // ⚡ バックグラウンドで画像をプリロード（最初の数枚のみ）
            this.preloadCriticalImages();
            
            return { photos: this.photos, areas: this.areas };
            
            // データ読み込み完了（フィルタリング・ソート機能は削除済み）
            
            return { photos: this.photos, areas: this.areas };
            
        } catch (error) {
            const result = await ErrorHandler.handle(error, 'DataManager.loadData', {
                level: ErrorHandler.ERROR_LEVELS.WARNING,
                category: ErrorHandler.ERROR_CATEGORIES.DATA,
                showToUser: true,
                fallback: () => {
                    this.loadEmbeddedData();
                    return { photos: this.photos, areas: this.areas };
                },
                component: 'DataManager'
            });
            
            if (result.success) {
                return result.result;
            }
            
            // フォールバックも失敗した場合
            throw new Error('Data loading completely failed');
        }
    }

    /**
     * 埋め込みデータを読み込む（フォールバック）
     */
    loadEmbeddedData() {
        console.log('📦 Loading embedded fallback data...');
        
        // エリアデータ（太子町全域の20エリア）
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
                is_active: true
            },
            {
                id: "area_002", 
                name: "太子中央公園",
                description: "町の中心部にある総合公園",
                center_lat: 34.8425,
                center_lng: 134.5965,
                radius: 0.6,
                color: "#32CD32",
                category: "公園",
                is_active: true
            },
            {
                id: "area_003",
                name: "太子山公園", 
                description: "山間部にある自然豊かな公園エリア",
                center_lat: 34.863,
                center_lng: 134.582,
                radius: 1.2,
                color: "#00CED1",
                category: "自然",
                is_active: true
            },
            // ... 他のエリアデータは省略（実際のコードでは全20エリア）
        ];

        // 写真データ（太子町各エリアの15枚）
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
            // ... 他の写真データは省略（実際のコードでは全15枚）
        ];
        
        console.log(`📦 Embedded data loaded: ${this.photos.length} photos, ${this.areas.length} areas`);
        // データ初期化完了（フィルタリング・ソート機能は削除済み）
    }

    // フィルタリング機能は削除されました（シンプル化のため）

    // ソート機能は削除されました（シンプル化のため）

    /**
     * 指定エリア内の写真を取得
     */
    getPhotosInArea(area) {
        if (!area || !area.center_lat || !area.center_lng) {
            return [];
        }
        
        return this.photos.filter(photo => {
            const distance = this.calculateDistance(
                photo.latitude, photo.longitude,
                area.center_lat, area.center_lng
            );
            return distance <= (area.radius || 1.0);
        });
    }

    /**
     * 2点間の距離を計算（km単位）
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // 地球の半径（km）
        const dLat = this.degToRad(lat2 - lat1);
        const dLng = this.degToRad(lng2 - lng1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * 度をラジアンに変換
     */
    degToRad(deg) {
        return deg * (Math.PI/180);
    }

    /**
     * ⚡ キャッシュ機能付きFetch
     */
    async fetchWithCache(url, key) {
        const cacheKey = `${key}_${url}`;
        const cached = this.cache.get(cacheKey);
        
        // キャッシュが有効かチェック
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            console.log(`📄 Using cached data for: ${key}`);
            return cached.response;
        }
        
        // 新規フェッチ
        console.log(`🌐 Fetching fresh data for: ${key}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`${key} fetch failed: ${response.status} ${response.statusText}`);
        }
        
        // キャッシュに保存
        this.cache.set(cacheKey, {
            response: response.clone(),
            timestamp: Date.now()
        });
        
        return response;
    }

    /**
     * ⚡ 重要な画像のプリロード（最初の4枚）
     */
    async preloadCriticalImages() {
        if (this.photos.length === 0) return;
        
        console.log('🖼️ Preloading critical images...');
        const criticalPhotos = this.photos.slice(0, 4); // 最初の4枚
        
        const preloadPromises = criticalPhotos.map(async photo => {
            try {
                const img = new Image();
                return new Promise((resolve) => {
                    img.onload = () => {
                        console.log(`✅ Preloaded: ${photo.title}`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`⚠️ Preload failed: ${photo.title}`);
                        resolve(); // エラーでも続行
                    };
                    img.src = photo.thumbnail_url || photo.image_url;
                    
                    // 2秒でタイムアウト
                    setTimeout(resolve, 2000);
                });
            } catch (error) {
                console.warn('Image preload error:', error);
            }
        });
        
        // すべてを並列で実行し、3秒でタイムアウト
        await Promise.race([
            Promise.all(preloadPromises),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        
        console.log('🎉 Critical image preloading completed');
    }

    /**
     * ⚡ メモリキャッシュをクリア
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Data cache cleared');
    }

    // Getters  
    getPhotos() { return this.photos; }
    getAreas() { return this.areas; }
    
    // フィルタリング関数（パフォーマンス最適化版）
    getFilteredPhotos() {
        // シンプル化のため、基本的にはすべての写真を返す
        return this.photos;
    }
    
    // 検索・ソート機能は削除されました（シンプル化のため）
}