import { Analytics } from '../utils/Analytics.js';

/**
 * 感想収集ダイアログを管理するクラス
 * 写真追加機能をGoogleフォームでの感想収集に変更
 */
export class FeedbackDialog {
    constructor(analytics = null) {
        this.analytics = analytics;
        this.dialog = null;
        this.isVisible = false;
        
        // Google フォームのURL（実際のURLに置き換えてください）
        this.googleFormUrl = 'https://forms.gle/YOUR_GOOGLE_FORM_ID';
        
        this.createDialog();
        this.bindEvents();
    }

    /**
     * ダイアログを表示
     */
    show() {
        if (!this.dialog) {
            this.createDialog();
        }
        
        this.dialog.style.display = 'flex';
        this.isVisible = true;
        
        // アナリティクス統計
        if (this.analytics) {
            this.analytics.trackUserAction('feedback_dialog_opened', 'ui', {
                source: 'feedback_button'
            });
        }
        
        console.log('💬 Feedback dialog opened');
    }

    /**
     * ダイアログを非表示
     */
    hide() {
        if (this.dialog) {
            this.dialog.style.display = 'none';
            this.isVisible = false;
            
            console.log('💬 Feedback dialog closed');
        }
    }

    /**
     * ダイアログのHTML要素を作成
     */
    createDialog() {
        // 既存の要素をチェック
        this.dialog = document.getElementById('feedbackDialog');
        if (this.dialog) {
            return;
        }

        // ダイアログ要素を作成
        this.dialog = document.createElement('div');
        this.dialog.id = 'feedbackDialog';
        this.dialog.className = 'feedback-dialog';
        this.dialog.style.display = 'none';

        this.dialog.innerHTML = `
            <div class="dialog-backdrop" id="feedbackBackdrop"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="header-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h3>太子のあしたへの想い</h3>
                    <button id="closeFeedbackDialog" class="close-btn" aria-label="ダイアログを閉じる">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="dialog-body">
                    <div class="message-section">
                        <div class="message-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="message-content">
                            <h4>あなたの想いを聞かせてください</h4>
                            <p>太子町の子どもたちの笑顔あふれる未来について、あなたはどう思いますか？</p>
                            <p>ご感想やメッセージを、ぜひGoogleフォームでお聞かせください。</p>
                        </div>
                    </div>
                    
                    <div class="features-section">
                        <h5>📝 こんなことをお聞かせください</h5>
                        <ul class="features-list">
                            <li><i class="fas fa-smile"></i> 写真を見た感想</li>
                            <li><i class="fas fa-lightbulb"></i> 太子町への想いやアイデア</li>
                            <li><i class="fas fa-hands-helping"></i> 子どもたちへの応援メッセージ</li>
                            <li><i class="fas fa-star"></i> YMCAの活動についてのご意見</li>
                        </ul>
                    </div>
                </div>
                
                <div class="dialog-footer">
                    <button id="openGoogleForm" class="primary-btn">
                        <i class="fas fa-external-link-alt"></i>
                        感想を送る（Googleフォーム）
                    </button>
                    <button id="cancelFeedback" class="secondary-btn">
                        後で送る
                    </button>
                </div>
            </div>
        `;

        // ダイアログをbodyに追加
        document.body.appendChild(this.dialog);
        
        // CSSスタイルを動的に追加
        this.addDialogStyles();
    }

    /**
     * ダイアログのCSSスタイルを追加
     */
    addDialogStyles() {
        // 既存のスタイルをチェック
        if (document.getElementById('feedbackDialogStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'feedbackDialogStyles';
        style.innerHTML = `
            .feedback-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .dialog-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
            }

            .dialog-content {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                animation: dialogSlideIn 0.3s ease-out;
                display: flex;
                flex-direction: column;
            }

            @keyframes dialogSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .dialog-header {
                display: flex;
                align-items: center;
                padding: 24px 24px 16px;
                border-bottom: 1px solid #e5e5e5;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                flex-shrink: 0;
            }

            .header-icon {
                margin-right: 12px;
                font-size: 24px;
                color: #ffeb3b;
            }

            .dialog-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                flex: 1;
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 8px;
                border-radius: 8px;
                transition: background-color 0.2s;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .dialog-body {
                padding: 24px;
                overflow-y: auto;
                max-height: 400px;
                flex: 1;
            }

            .message-section {
                display: flex;
                margin-bottom: 24px;
            }

            .message-icon {
                margin-right: 16px;
                font-size: 24px;
                color: #667eea;
                margin-top: 4px;
            }

            .message-content h4 {
                margin: 0 0 8px;
                font-size: 16px;
                color: #333;
            }

            .message-content p {
                margin: 0 0 8px;
                color: #666;
                line-height: 1.5;
                font-size: 14px;
            }

            .features-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 12px;
                border-left: 4px solid #667eea;
            }

            .features-section h5 {
                margin: 0 0 16px;
                font-size: 15px;
                color: #333;
            }

            .features-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .features-list li {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                color: #555;
                font-size: 14px;
            }

            .features-list li:last-child {
                margin-bottom: 0;
            }

            .features-list i {
                margin-right: 12px;
                color: #667eea;
                width: 18px;
                text-align: center;
            }

            .dialog-footer {
                display: flex;
                gap: 12px;
                padding: 20px 24px 32px;
                background: #f8f9fa;
                flex-shrink: 0;
            }

            .primary-btn {
                flex: 1;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 14px 20px;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .primary-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            }

            .secondary-btn {
                background: #e9ecef;
                color: #6c757d;
                border: none;
                padding: 14px 20px;
                border-radius: 10px;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .secondary-btn:hover {
                background: #dee2e6;
                color: #495057;
            }

            /* ボタン下部の追加マージン */
            .primary-btn,
            .secondary-btn {
                margin-bottom: 4px;
            }

            /* モバイル対応 */
            @media (max-width: 480px) {
                .dialog-content {
                    width: 95%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }

                .dialog-header {
                    padding: 18px 18px 12px;
                    flex-shrink: 0;
                }

                .dialog-header h3 {
                    font-size: 17px;
                }

                .dialog-body {
                    padding: 18px;
                    flex: 1;
                    overflow-y: auto;
                    max-height: none;
                    /* ボディ部分のコンテンツ間隔を詰める */
                }

                .message-section {
                    margin-bottom: 18px;
                }

                .features-section {
                    padding: 16px;
                }

                .features-section h5 {
                    margin-bottom: 12px;
                    font-size: 14px;
                }

                .features-list li {
                    margin-bottom: 10px;
                    font-size: 13px;
                }

                .dialog-footer {
                    flex-direction: column;
                    padding: 14px 18px 24px;
                    flex-shrink: 0;
                    gap: 10px;
                }

                .primary-btn,
                .secondary-btn {
                    font-size: 14px;
                    padding: 12px 16px;
                    margin-bottom: 0;
                }
            }

            /* より小さなモバイル端末向け追加対応 */
            @media (max-width: 360px) {
                .dialog-content {
                    max-height: 95vh;
                    width: 98%;
                }

                .dialog-header {
                    padding: 16px 16px 10px;
                }

                .dialog-body {
                    padding: 16px;
                }

                .dialog-footer {
                    padding: 12px 16px 20px;
                }

                .message-content h4 {
                    font-size: 15px;
                }

                .message-content p {
                    font-size: 13px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * イベントリスナーをバインド
     */
    bindEvents() {
        // ESCキーでクローズ
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // ダイアログ内のボタンイベントは動的に設定
        document.addEventListener('click', (e) => {
            if (!this.isVisible) return;

            // クローズボタン
            if (e.target.id === 'closeFeedbackDialog' || e.target.closest('#closeFeedbackDialog')) {
                this.hide();
            }

            // バックドロップクリック
            if (e.target.id === 'feedbackBackdrop') {
                this.hide();
            }

            // Googleフォームを開く
            if (e.target.id === 'openGoogleForm' || e.target.closest('#openGoogleForm')) {
                this.openGoogleForm();
            }

            // キャンセル
            if (e.target.id === 'cancelFeedback' || e.target.closest('#cancelFeedback')) {
                this.hide();
            }
        });
    }

    /**
     * Googleフォームを新しいタブで開く
     */
    openGoogleForm() {
        console.log('📝 Opening Google Form for feedback');
        
        // アナリティクス統計
        if (this.analytics) {
            this.analytics.trackUserAction('google_form_opened', 'external_link', {
                source: 'feedback_dialog'
            });
        }

        // Googleフォームを新しいタブで開く
        window.open(this.googleFormUrl, '_blank', 'noopener,noreferrer');
        
        // ダイアログを閉じる
        this.hide();
        
        // 感謝メッセージを表示
        this.showThankYouMessage();
    }

    /**
     * 感謝メッセージを表示
     */
    showThankYouMessage() {
        const thankYouToast = document.createElement('div');
        thankYouToast.className = 'thank-you-toast';
        thankYouToast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-heart"></i>
                <span>感想フォームを開きました。ありがとうございます！</span>
            </div>
        `;

        // トーストスタイル
        thankYouToast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 50px;
            box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
            z-index: 10001;
            animation: toastSlideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // トーストアニメーション
        const toastStyle = document.createElement('style');
        toastStyle.innerHTML = `
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .toast-content i {
                color: #ffeb3b;
            }
        `;
        document.head.appendChild(toastStyle);

        document.body.appendChild(thankYouToast);

        // 3秒後に自動削除
        setTimeout(() => {
            thankYouToast.remove();
            toastStyle.remove();
        }, 3000);
    }

    /**
     * GoogleフォームのURLを設定
     */
    setGoogleFormUrl(url) {
        this.googleFormUrl = url;
        console.log('📝 Google Form URL updated:', url);
    }

    /**
     * ダイアログが表示中かチェック
     */
    getIsVisible() {
        return this.isVisible;
    }

    /**
     * ダイアログを破棄
     */
    destroy() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }
        
        const styles = document.getElementById('feedbackDialogStyles');
        if (styles) {
            styles.remove();
        }
        
        this.isVisible = false;
        console.log('💬 Feedback dialog destroyed');
    }
}