/**
 * 画像処理とフォールバック機能を提供するユーティリティクラス
 */
export class ImageHandler {
    /**
     * 美しいフォールバック画像のSVGを生成
     */
    static createFallbackSVG(width = 200, height = 200, isDark = false) {
        const bgColor = isDark ? '#2c2c2e' : '#f2f2f7';
        const iconColor = isDark ? '#8e8e93' : '#c7c7cc';
        const textColor = isDark ? '#8e8e93' : '#8e8e93';
        
        // UTF-8文字を含むSVGをURLエンコーディングで処理
        const svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" fill="${bgColor}" rx="12"/>
            <g transform="translate(${width/2 - 25}, ${height/2 - 25})">
                <rect x="10" y="15" width="30" height="20" rx="3" fill="${iconColor}"/>
                <circle cx="18" cy="22" r="2.5" fill="${bgColor}"/>
                <path d="M15 30 L25 20 L35 25 L30 30 H15Z" fill="${iconColor}"/>
            </g>
            <text x="${width/2}" y="${height - 20}" font-family="SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif" 
                  font-size="12" fill="${textColor}" text-anchor="middle" font-weight="500">
                No Image
            </text>
        </svg>`;
        
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    }

    /**
     * ダークモード検知
     */
    static isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * 画像要素にフォールバック機能を追加
     * @param {HTMLImageElement} imgElement - 画像要素
     * @param {Object} options - オプション
     */
    static setupImageFallback(imgElement, options = {}) {
        const { 
            width = 200, 
            height = 200,
            showLoadingState = true,
            onError = null,
            onLoad = null,
            retryUrls = [] // 代替URL配列
        } = options;

        // ローディング状態の設定
        if (showLoadingState) {
            imgElement.classList.add('image-loading');
        }

        let retryIndex = 0;
        const originalSrc = imgElement.src;

        // エラーハンドリング（リトライ機能付き）
        imgElement.onerror = function() {
            // 代替URLがある場合はリトライ
            if (retryUrls && retryIndex < retryUrls.length) {
                const nextUrl = retryUrls[retryIndex++];
                console.log(`🔄 画像読み込みリトライ (${retryIndex}/${retryUrls.length}):`, nextUrl);
                this.src = nextUrl;
                return; // リトライするのでフォールバックは実行しない
            }

            // すべてのURLが失敗した場合のフォールバック
            this.onerror = null; // 無限ループ防止
            
            const isDark = ImageHandler.isDarkMode();
            this.src = ImageHandler.createFallbackSVG(width, height, isDark);
            this.classList.add('image-fallback');
            this.classList.remove('image-loading');
            
            // カスタムエラーハンドラー実行
            if (onError && typeof onError === 'function') {
                onError(this);
            }
            
            console.warn('❌ 画像の読み込みに失敗しました (全てのURL試行済み):', {
                original: originalSrc,
                retried: retryUrls,
                fallback: 'SVG表示'
            });
        };

        // 読み込み完了時の処理
        imgElement.onload = function() {
            this.classList.remove('image-loading');
            this.classList.add('image-loaded');
            
            // 成功ログ
            if (retryIndex > 0) {
                console.log(`✅ 画像読み込み成功 (${retryIndex}回目のリトライで成功):`, this.src);
            } else {
                console.log('✅ 画像読み込み成功:', this.currentSrc || this.src);
            }
            
            // カスタム読み込み完了ハンドラー実行
            if (onLoad && typeof onLoad === 'function') {
                onLoad(this);
            }
        };

        // 元のsrcを保存（デバッグ用）
        if (originalSrc) {
            imgElement.setAttribute('data-original-src', originalSrc);
        }
    }

    /**
     * 画像プリロード機能（CORS/ORBエラー対策強化版）
     * @param {string} src - 画像URL
     * @param {Function} onLoad - 読み込み完了時のコールバック
     * @param {Function} onError - エラー時のコールバック
     * @param {Array} retryUrls - 代替URL配列
     */
    static preloadImage(src, onLoad = null, onError = null, retryUrls = []) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // CORS対策：crossOrigin属性を設定
            if (src.includes('unsplash.com') || src.includes('picsum.photos')) {
                img.crossOrigin = 'anonymous';
            }
            
            let retryIndex = 0;
            
            const tryLoad = (currentSrc) => {
                img.onload = function() {
                    if (onLoad) onLoad(this);
                    resolve(this);
                };
                
                img.onerror = function() {
                    // 代替URLがある場合はリトライ
                    if (retryUrls && retryIndex < retryUrls.length) {
                        const nextUrl = retryUrls[retryIndex++];
                        console.log(`🔄 プリロードリトライ (${retryIndex}/${retryUrls.length}):`, nextUrl);
                        tryLoad(nextUrl);
                        return;
                    }
                    
                    // すべて失敗
                    if (onError) onError(this);
                    reject(new Error(`Failed to load image after ${retryIndex + 1} attempts: ${src}`));
                };
                
                img.src = currentSrc;
            };
            
            tryLoad(src);
        });
    }

    /**
     * 複数画像の一括プリロード
     * @param {Array} urls - 画像URLの配列
     * @param {Function} onProgress - 進捗コールバック
     */
    static async preloadImages(urls, onProgress = null) {
        const results = [];
        let loaded = 0;
        
        for (const url of urls) {
            try {
                const img = await this.preloadImage(url);
                results.push({ url, success: true, image: img });
            } catch (error) {
                results.push({ url, success: false, error });
            }
            
            loaded++;
            if (onProgress) {
                onProgress(loaded, urls.length, loaded / urls.length);
            }
        }
        
        return results;
    }

    /**
     * レスポンシブ画像のsrcset生成
     * @param {string} baseUrl - ベースURL
     * @param {Array} sizes - サイズ配列 [{width: 200, quality: 80}, ...]
     */
    static generateSrcSet(baseUrl, sizes = []) {
        if (!baseUrl.includes('unsplash.com') && !baseUrl.includes('images.unsplash.com')) {
            return ''; // Unsplash以外は対応しない
        }

        return sizes.map(({ width, quality = 80 }) => {
            const url = baseUrl.replace(/w=\d+/, `w=${width}`).replace(/q=\d+/, `q=${quality}`);
            return `${url} ${width}w`;
        }).join(', ');
    }

    /**
     * 画像の遅延読み込み設定（改良版）
     * @param {HTMLImageElement} imgElement - 画像要素
     * @param {string} src - 画像URL
     * @param {Object} options - オプション
     */
    static setupLazyLoading(imgElement, src, options = {}) {
        const { threshold = 0.1, rootMargin = '50px', retryUrls = [] } = options;

        // Intersection Observer対応チェック
        if (!('IntersectionObserver' in window)) {
            // 非対応ブラウザでは即座に読み込み
            imgElement.src = src;
            this.setupImageFallback(imgElement, { ...options, retryUrls });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // CORS対策
                    if (src.includes('unsplash.com') || src.includes('picsum.photos')) {
                        img.crossOrigin = 'anonymous';
                    }
                    
                    img.src = src;
                    this.setupImageFallback(img, { ...options, retryUrls });
                    observer.unobserve(img);
                }
            });
        }, { threshold, rootMargin });

        observer.observe(imgElement);
    }

    /**
     * 代替URL生成（Unsplash/Picsum用）
     * @param {string} originalUrl - 元のURL
     * @returns {Array} 代替URL配列
     */
    static generateAlternativeUrls(originalUrl) {
        const alternatives = [];
        
        if (originalUrl.includes('images.unsplash.com')) {
            // Unsplashの場合、CDNとサイズ変更を試行
            const baseUrl = originalUrl.split('?')[0];
            alternatives.push(
                originalUrl.replace('images.unsplash.com', 'unsplash.com'), // CDN変更
                `${baseUrl}?w=400&q=75&fit=crop&auto=format`, // 品質調整
                `${baseUrl}?w=300&q=60&fit=crop&auto=format`  // さらに軽量化
            );
        } else if (originalUrl.includes('picsum.photos')) {
            // Lorem Picsumの場合
            const parts = originalUrl.split('/');
            const width = parts[parts.length - 2] || '400';
            const height = parts[parts.length - 1] || '300';
            alternatives.push(
                `https://picsum.photos/400/300`,
                `https://picsum.photos/id/1/${width}/${height}`,
                `https://via.placeholder.com/${width}x${height}/cccccc/666666?text=No+Image`
            );
        }
        
        return alternatives;
    }
}

/**
 * ダークモード変更の監視
 */
export function watchDarkModeChanges(callback) {
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(callback);
        return () => mediaQuery.removeListener(callback);
    }
    return () => {}; // cleanup function
}