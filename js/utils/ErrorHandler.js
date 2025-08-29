/**
 * 統一エラーハンドリングクラス
 * アプリケーション全体のエラー処理を一元管理
 */
export class ErrorHandler {
    static errorCounts = new Map();
    static maxRetries = 3;
    static userNotificationShown = new Set();

    /**
     * エラーレベルの定義
     */
    static ERROR_LEVELS = {
        FATAL: 'fatal',      // アプリ停止レベル
        ERROR: 'error',      // 機能停止レベル
        WARNING: 'warning',  // 警告レベル
        INFO: 'info'         // 情報レベル
    };

    /**
     * エラーカテゴリの定義
     */
    static ERROR_CATEGORIES = {
        NETWORK: 'network',           // ネットワーク関連
        DATA: 'data',                 // データ関連
        MAP: 'map',                   // 地図関連
        UI: 'ui',                     // UI関連
        VALIDATION: 'validation',     // バリデーション
        INITIALIZATION: 'init',       // 初期化関連
        MARKER: 'marker',            // マーカー関連
        UNKNOWN: 'unknown'           // 不明
    };

    /**
     * メインエラーハンドリング関数
     * @param {Error} error - エラーオブジェクト
     * @param {string} context - エラー発生コンテキスト
     * @param {Object} options - オプション設定
     */
    static async handle(error, context = 'Unknown', options = {}) {
        const {
            level = this.ERROR_LEVELS.ERROR,
            category = this.ERROR_CATEGORIES.UNKNOWN,
            showToUser = false,
            fallback = null,
            retry = false,
            component = 'System'
        } = options;

        // エラー情報を構造化
        const errorInfo = this.createErrorInfo(error, context, level, category, component);
        
        // ログ出力
        this.logError(errorInfo);
        
        // エラーカウンターを更新
        this.updateErrorCount(context);
        
        // ユーザー通知（必要に応じて）
        if (showToUser) {
            await this.showUserNotification(errorInfo);
        }
        
        // リトライ処理
        if (retry && this.shouldRetry(context)) {
            return { retry: true, errorInfo };
        }
        
        // フォールバック実行
        if (fallback && typeof fallback === 'function') {
            try {
                const result = await fallback(errorInfo);
                console.log(`✅ Fallback executed successfully for: ${context}`);
                return { success: true, result, errorInfo };
            } catch (fallbackError) {
                const fallbackErrorInfo = this.createErrorInfo(
                    fallbackError, 
                    `${context} (Fallback)`,
                    this.ERROR_LEVELS.FATAL,
                    category,
                    component
                );
                this.logError(fallbackErrorInfo);
                return { success: false, errorInfo: fallbackErrorInfo };
            }
        }
        
        return { success: false, errorInfo };
    }

    /**
     * 構造化されたエラー情報を作成
     */
    static createErrorInfo(error, context, level, category, component) {
        return {
            timestamp: new Date().toISOString(),
            level,
            category,
            component,
            context,
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace available',
            name: error.name || 'Error',
            userAgent: navigator.userAgent,
            url: window.location.href,
            errorId: this.generateErrorId()
        };
    }

    /**
     * エラーログを出力
     */
    static logError(errorInfo) {
        const emoji = this.getErrorEmoji(errorInfo.level);
        const prefix = `${emoji} [${errorInfo.level.toUpperCase()}]`;
        
        const logMessage = `${prefix} ${errorInfo.context}: ${errorInfo.message}`;
        
        switch (errorInfo.level) {
            case this.ERROR_LEVELS.FATAL:
                console.error(logMessage, errorInfo);
                break;
            case this.ERROR_LEVELS.ERROR:
                console.error(logMessage, errorInfo);
                break;
            case this.ERROR_LEVELS.WARNING:
                console.warn(logMessage, errorInfo);
                break;
            case this.ERROR_LEVELS.INFO:
                console.info(logMessage, errorInfo);
                break;
            default:
                console.log(logMessage, errorInfo);
        }
    }

    /**
     * ユーザー通知を表示
     */
    static async showUserNotification(errorInfo) {
        const notificationKey = `${errorInfo.category}-${errorInfo.context}`;
        
        // 同じエラーの重複通知を防ぐ
        if (this.userNotificationShown.has(notificationKey)) {
            return;
        }
        
        this.userNotificationShown.add(notificationKey);
        
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const notificationPanel = this.createNotificationPanel(userMessage, errorInfo.level);
        
        document.body.appendChild(notificationPanel);
        
        // 自動削除
        setTimeout(() => {
            if (notificationPanel.parentNode) {
                notificationPanel.remove();
            }
            this.userNotificationShown.delete(notificationKey);
        }, 8000);
    }

    /**
     * ユーザーフレンドリーなメッセージを生成
     */
    static getUserFriendlyMessage(errorInfo) {
        const messageMap = {
            [this.ERROR_CATEGORIES.NETWORK]: {
                title: 'ネットワークエラー',
                message: 'インターネット接続を確認してください。'
            },
            [this.ERROR_CATEGORIES.DATA]: {
                title: 'データ読み込みエラー',
                message: 'データの読み込みに失敗しました。しばらく待ってから再試行してください。'
            },
            [this.ERROR_CATEGORIES.MAP]: {
                title: '地図エラー',
                message: '地図の表示に問題が発生しました。ページを再読み込みしてください。'
            },
            [this.ERROR_CATEGORIES.UI]: {
                title: 'UI操作エラー',
                message: '操作を完了できませんでした。もう一度お試しください。'
            },
            [this.ERROR_CATEGORIES.VALIDATION]: {
                title: '入力エラー',
                message: '入力内容を確認してください。'
            },
            [this.ERROR_CATEGORIES.MARKER]: {
                title: 'マーカー表示エラー',
                message: 'マーカーの表示に問題が発生しました。'
            }
        };
        
        return messageMap[errorInfo.category] || {
            title: 'エラーが発生しました',
            message: 'システムエラーが発生しました。ページを再読み込みしてください。'
        };
    }

    /**
     * 通知パネルを作成
     */
    static createNotificationPanel(userMessage, level) {
        const panel = document.createElement('div');
        const isError = level === this.ERROR_LEVELS.FATAL || level === this.ERROR_LEVELS.ERROR;
        
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${isError ? 'rgba(244, 67, 54, 0.95)' : 'rgba(255, 152, 0, 0.95)'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 350px;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${isError ? '⚠️' : '💡'}</span>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">${userMessage.title}</div>
                    <div style="font-size: 14px; opacity: 0.9;">${userMessage.message}</div>
                </div>
            </div>
        `;
        
        // クリックで閉じる
        panel.addEventListener('click', () => panel.remove());
        
        return panel;
    }

    /**
     * リトライ判定
     */
    static shouldRetry(context) {
        const currentCount = this.errorCounts.get(context) || 0;
        return currentCount < this.maxRetries;
    }

    /**
     * エラーカウンターを更新
     */
    static updateErrorCount(context) {
        const currentCount = this.errorCounts.get(context) || 0;
        this.errorCounts.set(context, currentCount + 1);
    }

    /**
     * エラーレベル用絵文字を取得
     */
    static getErrorEmoji(level) {
        const emojiMap = {
            [this.ERROR_LEVELS.FATAL]: '💥',
            [this.ERROR_LEVELS.ERROR]: '❌',
            [this.ERROR_LEVELS.WARNING]: '⚠️',
            [this.ERROR_LEVELS.INFO]: 'ℹ️'
        };
        return emojiMap[level] || '🐛';
    }

    /**
     * ユニークなエラーIDを生成
     */
    static generateErrorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * エラー統計を取得
     */
    static getErrorStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
            errorsByContext: Object.fromEntries(this.errorCounts),
            mostFrequentError: this.getMostFrequentError()
        };
    }

    /**
     * 最も頻繁なエラーを取得
     */
    static getMostFrequentError() {
        let maxCount = 0;
        let mostFrequent = null;
        
        for (const [context, count] of this.errorCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = context;
            }
        }
        
        return mostFrequent ? { context: mostFrequent, count: maxCount } : null;
    }

    /**
     * エラーカウンターをリセット
     */
    static resetErrorCounts() {
        this.errorCounts.clear();
        this.userNotificationShown.clear();
    }
}

// CSS アニメーションを追加
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);