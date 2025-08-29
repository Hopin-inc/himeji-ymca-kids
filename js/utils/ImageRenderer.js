import { ImageHandler } from './ImageHandler.js';

/**
 * 画像レンダリングの共通処理を提供するユーティリティクラス
 * コード重複を除去し、一貫した画像処理を実現
 */
export class ImageRenderer {
    /**
     * 共通の画像設定を適用
     * @param {HTMLImageElement} img - 画像要素
     * @param {Object} photo - 写真データ
     * @param {Object} options - 設定オプション
     */
    static setupImageWithFallback(img, photo, options = {}) {
        const {
            width = 200,
            height = 200,
            showLoadingState = true,
            onError = null,
            onLoad = null,
            context = 'default'
        } = options;

        // 代替URLを生成
        const retryUrls = ImageHandler.generateAlternativeUrls(img.src);
        
        // 標準的なフォールバック設定を適用
        ImageHandler.setupImageFallback(img, {
            width,
            height,
            showLoadingState,
            retryUrls,
            onError: (imgElement) => {
                console.warn(`🚫 ${context}画像の読み込みに失敗 (全URL試行済み): ${photo.title} (ID: ${photo.id})`);
                console.log(`🎨 フォールバック画像を表示しました: ${photo.title}`);
                if (onError) onError(imgElement);
            },
            onLoad: (imgElement) => {
                console.log(`✅ ${context}画像読み込み完了: ${photo.title}`);
                if (onLoad) onLoad(imgElement);
            }
        });
    }

    /**
     * グリッド用の画像要素を作成
     */
    static createGridImage(photo, analytics = null) {
        const img = document.createElement('img');
        img.src = photo.thumbnail_url || photo.image_url;
        img.alt = photo.title;
        img.loading = 'lazy';
        
        const imageLoadStart = performance.now();
        
        this.setupImageWithFallback(img, photo, {
            width: 200,
            height: 200,
            context: 'グリッド',
            onError: () => {
                if (analytics) {
                    analytics.trackImageLoad(false, photo.thumbnail_url || photo.image_url);
                }
            },
            onLoad: () => {
                if (analytics) {
                    const loadTime = performance.now() - imageLoadStart;
                    analytics.trackImageLoad(true, photo.thumbnail_url || photo.image_url, Math.round(loadTime));
                }
            }
        });
        
        return img;
    }

    /**
     * タイムライン用の画像要素を作成
     */
    static createTimelineImage(photo) {
        const img = document.createElement('img');
        img.src = photo.thumbnail_url || photo.image_url;
        img.alt = photo.title;
        img.loading = 'lazy';
        
        this.setupImageWithFallback(img, photo, {
            width: 120,
            height: 120,
            context: 'タイムライン'
        });
        
        return img;
    }

    /**
     * モーダル用の画像要素を作成
     */
    static createModalImage(photo) {
        const img = document.createElement('img');
        img.src = photo.image_url || photo.thumbnail_url;
        img.alt = photo.title || '写真';
        img.style.cssText = 'width: 100%; height: auto; border-radius: 8px;';
        
        this.setupImageWithFallback(img, photo, {
            width: 600,
            height: 400,
            context: 'モーダル'
        });
        
        return img;
    }
}