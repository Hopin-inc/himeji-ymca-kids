/**
 * EventEmitter - Pub/Subパターンによるモジュール間疎結合化
 * Observer パターンの実装で、依存関係を最小化
 */
export class EventEmitter {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.maxListeners = 100; // メモリリーク防止
        this.debugMode = false;
    }

    /**
     * イベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} listener - リスナー関数
     * @param {Object} options - オプション
     */
    on(eventName, listener, options = {}) {
        const { 
            context = null, 
            priority = 0,
            once = false 
        } = options;

        if (typeof listener !== 'function') {
            throw new Error(`Listener must be a function, got ${typeof listener}`);
        }

        // メモリリーク防止
        const existingListeners = this.events.get(eventName) || [];
        if (existingListeners.length >= this.maxListeners) {
            console.warn(`⚠️ EventEmitter: Too many listeners for event "${eventName}". Possible memory leak?`);
        }

        const listenerObj = {
            listener,
            context,
            priority,
            once,
            id: this.generateId()
        };

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName);
        listeners.push(listenerObj);

        // 優先度で並び替え（高い優先度が先に実行される）
        listeners.sort((a, b) => b.priority - a.priority);

        if (this.debugMode) {
            console.log(`📡 EventEmitter: Added listener for "${eventName}" (ID: ${listenerObj.id})`);
        }

        return listenerObj.id;
    }

    /**
     * 一回だけ実行されるイベントリスナーを登録
     */
    once(eventName, listener, options = {}) {
        return this.on(eventName, listener, { ...options, once: true });
    }

    /**
     * イベントを発火
     * @param {string} eventName - イベント名
     * @param {any} data - イベントデータ
     * @param {Object} options - オプション
     */
    async emit(eventName, data = null, options = {}) {
        const { 
            async = false,
            timeout = 5000 
        } = options;

        const listeners = this.events.get(eventName);
        if (!listeners || listeners.length === 0) {
            if (this.debugMode) {
                console.log(`📡 EventEmitter: No listeners for "${eventName}"`);
            }
            return [];
        }

        if (this.debugMode) {
            console.log(`📡 EventEmitter: Emitting "${eventName}" to ${listeners.length} listeners`);
        }

        const eventData = {
            type: eventName,
            data,
            timestamp: Date.now(),
            emitter: this
        };

        const results = [];
        const listenersToRemove = [];

        for (const listenerObj of listeners) {
            try {
                let result;

                if (async) {
                    // 非同期実行（タイムアウト付き）
                    result = await Promise.race([
                        Promise.resolve(listenerObj.listener.call(listenerObj.context, eventData)),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error(`Listener timeout for ${eventName}`)), timeout)
                        )
                    ]);
                } else {
                    // 同期実行
                    result = listenerObj.listener.call(listenerObj.context, eventData);
                }

                results.push({ id: listenerObj.id, result, success: true });

                // 一回限りのリスナーをマーク
                if (listenerObj.once) {
                    listenersToRemove.push(listenerObj.id);
                }

            } catch (error) {
                console.error(`❌ EventEmitter: Error in listener for "${eventName}":`, error);
                results.push({ 
                    id: listenerObj.id, 
                    error: error.message, 
                    success: false 
                });
            }
        }

        // 一回限りのリスナーを削除
        for (const id of listenersToRemove) {
            this.off(eventName, id);
        }

        return results;
    }

    /**
     * イベントリスナーを削除
     * @param {string} eventName - イベント名
     * @param {string|Function} listenerOrId - リスナー関数またはID
     */
    off(eventName, listenerOrId = null) {
        if (!listenerOrId) {
            // 全てのリスナーを削除
            this.events.delete(eventName);
            if (this.debugMode) {
                console.log(`📡 EventEmitter: Removed all listeners for "${eventName}"`);
            }
            return true;
        }

        const listeners = this.events.get(eventName);
        if (!listeners) return false;

        const isId = typeof listenerOrId === 'string';
        const index = listeners.findIndex(l => 
            isId ? l.id === listenerOrId : l.listener === listenerOrId
        );

        if (index !== -1) {
            const removed = listeners.splice(index, 1)[0];
            if (this.debugMode) {
                console.log(`📡 EventEmitter: Removed listener for "${eventName}" (ID: ${removed.id})`);
            }
            return true;
        }

        return false;
    }

    /**
     * 指定したコンテキストの全リスナーを削除
     */
    offAll(context) {
        let removedCount = 0;

        for (const [eventName, listeners] of this.events) {
            const initialLength = listeners.length;
            this.events.set(eventName, listeners.filter(l => l.context !== context));
            removedCount += initialLength - listeners.length;
        }

        if (this.debugMode) {
            console.log(`📡 EventEmitter: Removed ${removedCount} listeners for context:`, context);
        }

        return removedCount;
    }

    /**
     * イベントの存在確認
     */
    hasListeners(eventName) {
        const listeners = this.events.get(eventName);
        return listeners && listeners.length > 0;
    }

    /**
     * リスナー数を取得
     */
    getListenerCount(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.length : 0;
    }

    /**
     * 全イベントをクリア
     */
    clear() {
        this.events.clear();
        this.onceEvents.clear();
        if (this.debugMode) {
            console.log('📡 EventEmitter: Cleared all events');
        }
    }

    /**
     * デバッグモードの切り替え
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`📡 EventEmitter: Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * 統計情報を取得
     */
    getStats() {
        const stats = {
            totalEvents: this.events.size,
            totalListeners: 0,
            eventBreakdown: {}
        };

        for (const [eventName, listeners] of this.events) {
            stats.totalListeners += listeners.length;
            stats.eventBreakdown[eventName] = {
                listenerCount: listeners.length,
                priorities: listeners.map(l => l.priority),
                onceListeners: listeners.filter(l => l.once).length
            };
        }

        return stats;
    }

    /**
     * プリセットイベントを定義（型安全性向上）
     */
    static createTypedEmitter(eventTypes) {
        const emitter = new EventEmitter();
        
        // 定義されたイベントタイプのみ許可
        const originalOn = emitter.on;
        const originalEmit = emitter.emit;

        emitter.on = function(eventName, listener, options) {
            if (eventTypes && !eventTypes.includes(eventName)) {
                console.warn(`⚠️ EventEmitter: Undefined event type "${eventName}". Available: ${eventTypes.join(', ')}`);
            }
            return originalOn.call(this, eventName, listener, options);
        };

        emitter.emit = function(eventName, data, options) {
            if (eventTypes && !eventTypes.includes(eventName)) {
                console.warn(`⚠️ EventEmitter: Undefined event type "${eventName}". Available: ${eventTypes.join(', ')}`);
            }
            return originalEmit.call(this, eventName, data, options);
        };

        return emitter;
    }

    /**
     * ユニークIDを生成
     */
    generateId() {
        return 'listener_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }
}

/**
 * アプリケーション専用のイベントタイプ
 */
export const APP_EVENTS = {
    // データ関連
    DATA_LOADED: 'data:loaded',
    DATA_ERROR: 'data:error',
    
    // 地図関連
    MAP_READY: 'map:ready',
    MAP_ZOOM_CHANGED: 'map:zoomChanged',
    MAP_CLICKED: 'map:clicked',
    MAP_LOCATION_SELECTED: 'map:locationSelected',
    MAP_LOCATION_SELECTION_CANCELLED: 'map:locationSelectionCancelled',
    
    // マーカー関連
    MARKER_CLICKED: 'marker:clicked',
    MARKER_CREATED: 'marker:created',
    MARKERS_UPDATED: 'markers:updated',
    
    // UI関連
    AREA_SELECTED: 'ui:areaSelected',
    PHOTO_SELECTED: 'ui:photoSelected',
    PHOTO_CLICKED: 'ui:photoClicked',
    PHOTO_SUBMITTED: 'ui:photoSubmitted',
    DISPLAY_MODE_CHANGED: 'ui:displayModeChanged',
    
    // エラー関連
    ERROR_OCCURRED: 'error:occurred',
    WARNING_OCCURRED: 'error:warning'
};

/**
 * アプリケーション用のTyped EventEmitter
 */
export const createAppEventEmitter = () => {
    return EventEmitter.createTypedEmitter(Object.values(APP_EVENTS));
};