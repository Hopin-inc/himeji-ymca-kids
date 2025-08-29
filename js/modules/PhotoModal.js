import { ImageRenderer } from '../utils/ImageRenderer.js';

/**
 * 写真詳細モーダルを専門に扱うクラス
 * モーダル表示ロジックを分離し、再利用可能にする
 */
export class PhotoModal {
    constructor(analytics = null) {
        this.analytics = analytics;
        this.currentPhoto = null;
        this.modal = null;
        
        this.bindEvents();
    }

    /**
     * 写真詳細モーダルを表示
     */
    show(photo) {
        if (!photo) {
            console.warn('⚠️ No photo data provided for detail view');
            return;
        }

        console.log('📸 Showing photo detail:', photo.title);
        this.currentPhoto = photo;

        // モーダル要素を取得
        this.modal = document.getElementById('photoModal');
        if (!this.modal) {
            console.error('❌ Photo modal not found');
            return;
        }

        this.updateModalContent();
        this.displayModal();
        this.setupCloseEvents();
    }

    /**
     * モーダルコンテンツを更新
     */
    updateModalContent() {
        this.updateTitle();
        this.updateImage();
        this.updateMetadata();
    }

    /**
     * タイトルを更新
     */
    updateTitle() {
        const modalTitle = document.getElementById('modalPhotoTitle');
        if (modalTitle) {
            modalTitle.textContent = this.currentPhoto.title || '写真詳細';
        }
    }

    /**
     * 画像を更新
     */
    updateImage() {
        const modalImage = this.modal.querySelector('.photo-container img');
        const photoContainer = this.modal.querySelector('.photo-container');
        
        if (modalImage) {
            // 既存の画像要素がある場合は更新
            this.updateExistingImage(modalImage);
        } else if (photoContainer) {
            // 画像要素が存在しない場合は作成
            this.createNewImage(photoContainer);
        }
    }

    /**
     * 既存の画像要素を更新
     */
    updateExistingImage(modalImage) {
        modalImage.src = this.currentPhoto.image_url || this.currentPhoto.thumbnail_url;
        modalImage.alt = this.currentPhoto.title || '写真';
        
        // ImageRendererを使用してフォールバック機能を適用
        ImageRenderer.setupImageWithFallback(modalImage, this.currentPhoto, {
            width: 600,
            height: 400,
            context: 'モーダル'
        });
    }

    /**
     * 新しい画像要素を作成
     */
    createNewImage(photoContainer) {
        const img = ImageRenderer.createModalImage(this.currentPhoto);
        
        // 既存の画像があれば置換
        const existingImg = photoContainer.querySelector('img');
        if (existingImg) {
            photoContainer.replaceChild(img, existingImg);
        } else {
            photoContainer.appendChild(img);
        }
    }

    /**
     * メタデータを更新
     */
    updateMetadata() {
        this.updateDescription();
        this.updateDate();
        this.updateLocation();
        this.updateTags();
    }

    /**
     * 説明を更新
     */
    updateDescription() {
        const modalDescription = document.getElementById('modalPhotoDescription');
        if (modalDescription) {
            modalDescription.textContent = this.currentPhoto.description || '';
        }
    }

    /**
     * 日付を更新
     */
    updateDate() {
        const modalDate = document.getElementById('modalPhotoDate');
        if (modalDate) {
            modalDate.textContent = new Date(this.currentPhoto.taken_at).toLocaleDateString('ja-JP');
        }
    }

    /**
     * 位置情報を更新
     */
    updateLocation() {
        const modalLocation = document.getElementById('modalPhotoLocation');
        if (modalLocation) {
            modalLocation.textContent = this.currentPhoto.location || '';
        }
    }

    /**
     * タグを更新
     */
    updateTags() {
        const modalTags = document.getElementById('modalPhotoTags');
        if (modalTags && this.currentPhoto.tags) {
            modalTags.innerHTML = this.currentPhoto.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('');
        }
    }

    /**
     * モーダルを表示
     */
    displayModal() {
        this.modal.style.display = 'flex';
        
        // アナリティクス統計
        if (this.analytics) {
            this.analytics.trackPhotoInteraction('view', {
                photo_title: this.currentPhoto.title,
                photo_location: this.currentPhoto.location
            });
        }
    }

    /**
     * モーダルを非表示
     */
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.currentPhoto = null;
        }
    }

    /**
     * クローズイベントを設定
     */
    setupCloseEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('#closeModal');
        const backdrop = this.modal.querySelector('#modalBackdrop');

        // クローズボタン
        if (closeBtn) {
            closeBtn.onclick = () => this.hide();
        }

        // バックドロップクリック
        if (backdrop) {
            backdrop.onclick = () => this.hide();
        }
    }

    /**
     * グローバルイベントをバインド
     */
    bindEvents() {
        // ESCキーでクローズ
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display === 'flex') {
                this.hide();
            }
        });
    }

    /**
     * 現在表示中の写真を取得
     */
    getCurrentPhoto() {
        return this.currentPhoto;
    }

    /**
     * モーダルが表示中かチェック
     */
    isVisible() {
        return this.modal && this.modal.style.display === 'flex';
    }
}