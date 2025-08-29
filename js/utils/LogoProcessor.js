/**
 * ロゴ画像の背景処理ユーティリティ
 * 黒背景を透明にする処理を行う
 */
export class LogoProcessor {
    /**
     * 画像の黒背景を透明にする
     * @param {HTMLImageElement} img - 処理する画像要素
     */
    static removeBlackBackground(img) {
        // 画像が読み込まれてから処理
        if (img.complete) {
            this.processImage(img);
        } else {
            img.onload = () => this.processImage(img);
        }
    }

    /**
     * Canvas を使用して画像の黒背景を透明にする
     * @param {HTMLImageElement} img - 処理する画像要素
     */
    static processImage(img) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            // 元の画像を描画
            ctx.drawImage(img, 0, 0);
            
            // 画像データを取得
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // 黒いピクセルを透明にする
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 黒っぽいピクセル（RGB値が低い）を透明にする
                if (r < 50 && g < 50 && b < 50) {
                    data[i + 3] = 0; // アルファ値を0に（透明）
                }
            }
            
            // 処理済み画像データを戻す
            ctx.putImageData(imageData, 0, 0);
            
            // 処理済み画像をimg要素に適用
            img.src = canvas.toDataURL('image/png');
            
            console.log('✅ Logo background processed successfully');
            
        } catch (error) {
            console.warn('⚠️ Logo background processing failed:', error);
            // エラーが発生した場合はCSS filterに頼る
        }
    }

    /**
     * CSSフィルターによる代替処理
     * @param {HTMLImageElement} img - 処理する画像要素
     */
    static applyCSSFilter(img) {
        img.style.filter = `
            contrast(1.3) 
            brightness(1.2) 
            saturate(1.1)
            drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))
        `;
        img.style.mixBlendMode = 'multiply';
        img.style.background = 'white';
    }

    /**
     * すべてのYMCAロゴに処理を適用
     */
    static processAllLogos() {
        const logos = document.querySelectorAll('.ymca-logo, .loading-ymca-logo');
        logos.forEach(logo => {
            // Canvas処理を試行、失敗したらCSS filter
            this.removeBlackBackground(logo);
        });
    }
}