/**
 * 軽量アナリティクスとエラー追跡機能
 * プライバシーを重視し、個人情報は収集しない簡単な統計機能
 */
export class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.errors = [];
        this.maxEvents = 100; // メモリ使用量を制限
        
        this.init();
    }

    /**
     * アナリティクス初期化
     */
    init() {
        console.log('📊 Analytics initialized:', {
            sessionId: this.sessionId,
            startTime: new Date(this.startTime).toISOString()
        });
        
        // セッション開始イベント
        this.trackEvent('session_start', {
            userAgent: navigator.userAgent.substring(0, 100),
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        // ページ離脱時の統計送信（実際のAPIがある場合）
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                duration: Date.now() - this.startTime,
                eventsCount: this.events.length,
                errorsCount: this.errors.length
            });
            
            // 統計サマリーをログ出力
            this.logSessionSummary();
        });
        
        // エラーイベントのキャッチ
        window.addEventListener('error', (event) => {
            this.trackError('javascript_error', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });
        
        // Promise rejection のキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('promise_rejection', {
                reason: event.reason?.toString() || 'Unknown rejection'
            });
        });
    }

    /**
     * セッションIDを生成
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    /**
     * イベントを追跡
     * @param {string} eventName - イベント名
     * @param {Object} properties - イベントのプロパティ
     */
    trackEvent(eventName, properties = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            properties: properties
        };
        
        this.events.push(event);
        
        // メモリ使用量を制限
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
        
        console.log('📈 Event tracked:', eventName, properties);
        
        // 実際のアナリティクスサービスに送信する場合はここで実装
        // this.sendToAnalyticsService(event);
    }

    /**
     * エラーを追跡
     * @param {string} errorType - エラータイプ
     * @param {Object} errorDetails - エラー詳細
     */
    trackError(errorType, errorDetails = {}) {
        const error = {
            type: errorType,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            details: errorDetails
        };
        
        this.errors.push(error);
        
        // メモリ使用量を制限
        if (this.errors.length > 50) {
            this.errors.shift();
        }
        
        console.warn('🚨 Error tracked:', errorType, errorDetails);
        
        // 実際のエラー追跡サービスに送信する場合はここで実装
        // this.sendToErrorService(error);
    }

    /**
     * ページビューを追跡
     * @param {string} pageName - ページ名
     */
    trackPageView(pageName) {
        this.trackEvent('page_view', {
            page: pageName,
            url: window.location.href,
            referrer: document.referrer
        });
    }

    /**
     * ユーザーアクションを追跡
     * @param {string} action - アクション名
     * @param {string} category - カテゴリ
     * @param {Object} data - 追加データ
     */
    trackUserAction(action, category = 'user_interaction', data = {}) {
        this.trackEvent('user_action', {
            action: action,
            category: category,
            ...data
        });
    }

    /**
     * パフォーマンス指標を追跡
     * @param {string} metric - 指標名
     * @param {number} value - 値
     * @param {string} unit - 単位
     */
    trackPerformance(metric, value, unit = 'ms') {
        this.trackEvent('performance', {
            metric: metric,
            value: value,
            unit: unit
        });
    }

    /**
     * 画像読み込み統計を追跡
     * @param {boolean} success - 成功/失敗
     * @param {string} url - 画像URL
     * @param {number} loadTime - 読み込み時間
     */
    trackImageLoad(success, url, loadTime = null) {
        this.trackEvent('image_load', {
            success: success,
            url: url ? url.substring(0, 100) : null, // プライバシー保護のため短縮
            loadTime: loadTime
        });
    }

    /**
     * マップインタラクションを追跡
     * @param {string} interaction - インタラクション種別
     * @param {Object} data - 追加データ
     */
    trackMapInteraction(interaction, data = {}) {
        this.trackUserAction(`map_${interaction}`, 'map', data);
    }

    /**
     * 写真インタラクションを追跡
     * @param {string} interaction - インタラクション種別
     * @param {Object} data - 追加データ
     */
    trackPhotoInteraction(interaction, data = {}) {
        this.trackUserAction(`photo_${interaction}`, 'photo', data);
    }

    /**
     * セッション統計サマリーをログ出力
     */
    logSessionSummary() {
        const summary = this.getSessionSummary();
        console.log('📊 Session Summary:', summary);
    }

    /**
     * セッション統計サマリーを取得
     */
    getSessionSummary() {
        const duration = Date.now() - this.startTime;
        const eventTypes = {};
        const errorTypes = {};
        
        // イベント種別を集計
        this.events.forEach(event => {
            eventTypes[event.name] = (eventTypes[event.name] || 0) + 1;
        });
        
        // エラー種別を集計
        this.errors.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });
        
        return {
            sessionId: this.sessionId,
            duration: Math.round(duration / 1000), // 秒
            totalEvents: this.events.length,
            totalErrors: this.errors.length,
            eventTypes: eventTypes,
            errorTypes: errorTypes,
            startTime: new Date(this.startTime).toISOString(),
            endTime: new Date().toISOString()
        };
    }

    /**
     * 現在の統計を取得（デバッグ用）
     */
    getStats() {
        return {
            sessionId: this.sessionId,
            uptime: Date.now() - this.startTime,
            events: this.events.length,
            errors: this.errors.length,
            recentEvents: this.events.slice(-5), // 最新5件
            recentErrors: this.errors.slice(-3)  // 最新3件
        };
    }

    /**
     * 統計をクリア
     */
    clearStats() {
        this.events = [];
        this.errors = [];
        console.log('🧹 Analytics data cleared');
    }

    /**
     * 実際のアナリティクスサービスに送信（実装例）
     * 実際の環境では適切なエンドポイントとAPIキーを使用
     */
    sendToAnalyticsService(event) {
        // 例: Google Analytics, Mixpanel, カスタムAPIなど
        // if (window.gtag) {
        //     window.gtag('event', event.name, event.properties);
        // }
        
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(event)
        // }).catch(err => console.warn('Analytics send failed:', err));
    }

    /**
     * エラー追跡サービスに送信（実装例）
     */
    sendToErrorService(error) {
        // 例: Sentry, Bugsnag, カスタムAPIなど
        // if (window.Sentry) {
        //     window.Sentry.captureException(new Error(error.details.message));
        // }
        
        // fetch('/api/errors', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(error)
        // }).catch(err => console.warn('Error reporting failed:', err));
    }
}