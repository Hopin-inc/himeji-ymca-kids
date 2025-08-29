/**
 * ローディング進捗管理クラス
 * 段階的ローディングの進捗表示とステップ管理を担当
 */
export class ProgressManager {
    constructor() {
        console.log('🔄 ProgressManager constructor called');
        
        this.steps = [
            { id: 'step-data', name: 'データ読み込み中...', weight: 40 },
            { id: 'step-map', name: '地図を準備中...', weight: 30 },
            { id: 'step-images', name: '画像を準備中...', weight: 30 }
        ];
        
        this.currentStep = 0;
        this.progress = 0; // 0-100
        
        // DOM要素を取得（エラーハンドリング付き）
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.loadingSteps = document.querySelectorAll('.loading-step');
        
        // 要素の存在チェック
        console.log('🔍 Progress elements check:', {
            progressFill: !!this.progressFill,
            progressText: !!this.progressText,
            loadingSteps: this.loadingSteps.length
        });
        
        if (!this.progressFill || !this.progressText || this.loadingSteps.length === 0) {
            console.warn('⚠️ Some progress elements not found, functionality may be limited');
        } else {
            console.log('✅ All progress elements found');
        }
    }

    /**
     * 指定ステップを開始
     * @param {number} stepIndex - ステップインデックス
     */
    startStep(stepIndex) {
        console.log(`🔄 startStep called with index: ${stepIndex}`);
        
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            console.warn(`⚠️ Invalid step index: ${stepIndex}`);
            return;
        }
        
        this.currentStep = stepIndex;
        
        // 前のステップを完了状態に
        for (let i = 0; i < stepIndex; i++) {
            this.completeStep(i);
        }
        
        // 現在のステップをアクティブに
        const stepElement = document.getElementById(this.steps[stepIndex].id);
        console.log(`🔍 Step element for ${this.steps[stepIndex].id}:`, !!stepElement);
        
        if (stepElement) {
            stepElement.classList.add('active');
            stepElement.classList.remove('completed');
            
            const icon = stepElement.querySelector('i');
            const text = stepElement.querySelector('span');
            
            if (icon) {
                icon.className = 'fas fa-circle-notch fa-spin';
            }
            if (text) {
                text.textContent = this.steps[stepIndex].name;
            }
            
            console.log(`✅ Step UI updated for: ${this.steps[stepIndex].name}`);
        } else {
            console.warn(`⚠️ Step element not found: ${this.steps[stepIndex].id}`);
        }
        
        console.log(`🔄 Progress: Starting step ${stepIndex + 1}: ${this.steps[stepIndex].name}`);
        this.updateProgress();
    }

    /**
     * 指定ステップを完了
     * @param {number} stepIndex - ステップインデックス
     */
    completeStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        
        const stepElement = document.getElementById(this.steps[stepIndex].id);
        if (stepElement) {
            stepElement.classList.add('completed');
            stepElement.classList.remove('active');
            
            const icon = stepElement.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check';
            }
        }
        
        console.log(`✅ Progress: Completed step ${stepIndex + 1}: ${this.steps[stepIndex].name}`);
        this.updateProgress();
    }

    /**
     * 現在のステップの進捗を更新
     * @param {number} stepProgress - ステップ内の進捗 (0-100)
     */
    updateStepProgress(stepProgress) {
        // 前のステップの重みを合計
        let baseProgress = 0;
        for (let i = 0; i < this.currentStep; i++) {
            baseProgress += this.steps[i].weight;
        }
        
        // 現在のステップの進捗を加算
        const currentStepWeight = this.steps[this.currentStep]?.weight || 0;
        const currentStepProgress = (stepProgress / 100) * currentStepWeight;
        
        this.progress = Math.min(100, baseProgress + currentStepProgress);
        this.updateProgress();
    }

    /**
     * 進捗表示を更新
     */
    updateProgress() {
        if (this.progressFill) {
            this.progressFill.style.width = `${this.progress}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(this.progress)}%`;
        }
    }

    /**
     * すべてのステップを完了
     */
    completeAll() {
        for (let i = 0; i < this.steps.length; i++) {
            this.completeStep(i);
        }
        
        this.progress = 100;
        this.updateProgress();
        
        console.log('🎉 All loading steps completed!');
        
        // 少し遅延してからローディングを隠す
        setTimeout(() => {
            this.hideLoading();
        }, 500);
    }

    /**
     * ローディングオーバーレイを隠す
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                loadingOverlay.style.visibility = 'hidden';
                loadingOverlay.setAttribute('aria-hidden', 'true');
                console.log('✅ Loading overlay hidden with animation');
            }, 300);
        }
    }

    /**
     * エラー状態を表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b; font-size: 48px;"></i>
                    <h2 style="color: #ff6b6b;">読み込みエラー</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" 
                            style="margin-top: 20px; padding: 12px 24px; background: #007aff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        再読み込み
                    </button>
                </div>
            `;
        }
    }

    /**
     * デバッグ: 進捗状況をログ出力
     */
    logStatus() {
        console.log('📊 Progress Status:', {
            currentStep: this.currentStep,
            progress: this.progress,
            stepName: this.steps[this.currentStep]?.name || 'Unknown'
        });
    }
}