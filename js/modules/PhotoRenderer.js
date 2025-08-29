import { ImageRenderer } from '../utils/ImageRenderer.js';
import { APP_EVENTS } from '../utils/EventEmitter.js';

/**
 * 写真表示処理を専門に扱うクラス
 * グリッド/タイムライン表示の責任を分離し、コードの重複を除去
 */
export class PhotoRenderer {
    constructor(eventBus, analytics = null) {
        this.eventBus = eventBus;
        this.analytics = analytics;
    }

    /**
     * 写真を指定モードで描画
     * @param {Array} photos - 写真配列
     * @param {string} mode - 表示モード ('grid' | 'timeline')
     * @param {number} page - ページ番号
     */
    renderPhotos(photos, mode, page) {
        const container = mode === 'grid' ? 
            document.getElementById('areaPhotosGrid') : 
            document.getElementById('areaPhotosTimeline');
            
        if (!container) {
            console.warn('⚠️ Photo display container not found for mode:', mode);
            return;
        }
        
        container.innerHTML = '';
        
        if (mode === 'grid') {
            this.renderGridPhotos(photos, container, page);
        } else {
            this.renderTimelinePhotos(photos, container, page);
        }
        
        // スクロール状況をデバッグ
        this.debugScrollStatus(container, mode, photos.length);
    }

    /**
     * グリッド表示で写真を描画
     */
    renderGridPhotos(photos, container, page) {
        const photosPerPage = 12;
        const startIndex = (page - 1) * photosPerPage;
        const endIndex = Math.min(startIndex + photosPerPage, photos.length);
        const pagePhotos = photos.slice(startIndex, endIndex);
        
        pagePhotos.forEach(photo => {
            const photoElement = this.createGridPhotoElement(photo);
            container.appendChild(photoElement);
        });
    }

    /**
     * グリッド用の写真要素を作成
     */
    createGridPhotoElement(photo) {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-item';
        
        // 画像要素を作成（ImageRendererを使用）
        const img = ImageRenderer.createGridImage(photo, this.analytics);
        
        // オーバーレイを作成
        const overlay = document.createElement('div');
        overlay.className = 'photo-overlay';
        overlay.innerHTML = `
            <h4>${photo.title}</h4>
            <p>${new Date(photo.taken_at).toLocaleDateString('ja-JP')}</p>
        `;
        
        photoElement.appendChild(img);
        photoElement.appendChild(overlay);
        
        // クリックイベントを追加
        photoElement.addEventListener('click', () => {
            console.log('🖱️ Grid photo clicked:', photo.title);
            this.eventBus.emit(APP_EVENTS.PHOTO_CLICKED, photo);
        });
        
        return photoElement;
    }

    /**
     * タイムライン表示で写真を描画
     */
    renderTimelinePhotos(photos, container, page) {
        // 撮影日でソート
        const sortedPhotos = [...photos].sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));
        
        // 日付でグループ化
        const photosByDate = this.groupPhotosByDate(sortedPhotos);
        
        // タイムライン表示を構築
        Object.entries(photosByDate).forEach(([date, datePhotos]) => {
            const dateSection = this.createDateSection(date, datePhotos);
            container.appendChild(dateSection);
        });
    }

    /**
     * 写真を日付でグループ化
     */
    groupPhotosByDate(photos) {
        const photosByDate = {};
        photos.forEach(photo => {
            const date = new Date(photo.taken_at).toLocaleDateString('ja-JP');
            if (!photosByDate[date]) {
                photosByDate[date] = [];
            }
            photosByDate[date].push(photo);
        });
        return photosByDate;
    }

    /**
     * 日付セクションを作成
     */
    createDateSection(date, datePhotos) {
        const dateSection = document.createElement('div');
        dateSection.className = 'timeline-date-section';
        
        // 日付ヘッダーを作成
        const dateHeader = document.createElement('div');
        dateHeader.className = 'timeline-date-header';
        dateHeader.innerHTML = `
            <h4>${date}</h4>
            <span class="photo-count">${datePhotos.length}枚</span>
        `;
        
        // 写真コンテナを作成
        const photosContainer = document.createElement('div');
        photosContainer.className = 'timeline-photos';
        
        // 各写真アイテムを作成
        datePhotos.forEach(photo => {
            const photoItem = this.createTimelinePhotoElement(photo);
            photosContainer.appendChild(photoItem);
        });
        
        dateSection.appendChild(dateHeader);
        dateSection.appendChild(photosContainer);
        
        return dateSection;
    }

    /**
     * タイムライン用の写真要素を作成
     */
    createTimelinePhotoElement(photo) {
        const photoItem = document.createElement('div');
        photoItem.className = 'timeline-photo-item';
        
        // 画像要素を作成（ImageRendererを使用）
        const img = ImageRenderer.createTimelineImage(photo);
        
        // 情報コンテナを作成
        const infoContainer = document.createElement('div');
        infoContainer.className = 'timeline-photo-info';
        infoContainer.innerHTML = `
            <h5>${photo.title}</h5>
            <p>${photo.description || ''}</p>
            <small>${new Date(photo.taken_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</small>
        `;
        
        photoItem.appendChild(img);
        photoItem.appendChild(infoContainer);
        
        // クリックイベントを追加
        photoItem.addEventListener('click', () => {
            console.log('🖱️ Timeline photo clicked:', photo.title);
            this.eventBus.emit(APP_EVENTS.PHOTO_CLICKED, photo);
        });
        
        return photoItem;
    }

    /**
     * スクロール状況をデバッグ
     */
    debugScrollStatus(container, mode, photosCount) {
        setTimeout(() => {
            const containerStyles = getComputedStyle(container);
            const scrollInfo = {
                mode: mode,
                containerHeight: container.offsetHeight,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                canScroll: container.scrollHeight > container.offsetHeight,
                maxHeight: containerStyles.maxHeight,
                minHeight: containerStyles.minHeight,
                overflow: containerStyles.overflowY,
                padding: containerStyles.padding,
                gap: containerStyles.gap,
                scrollDiff: container.scrollHeight - container.offsetHeight,
                photosCount: photosCount
            };
            console.log('🔍 Container scroll debug:', scrollInfo);
            
            if (scrollInfo.canScroll) {
                console.log('✅ スクロール機能が有効になりました！');
            } else {
                console.log('⚠️ スクロールが発生しません。コンテンツ高さが不足している可能性があります。');
            }
        }, 200);
    }

    /**
     * 表示モードを切り替え
     */
    updateDisplayMode(mode, page = 1) {
        const gridContainer = document.getElementById('areaPhotosGrid');
        const timelineContainer = document.getElementById('areaPhotosTimeline');
        
        if (!gridContainer || !timelineContainer) {
            console.warn('⚠️ Photo display containers not found');
            return;
        }
        
        // コンテナの表示/非表示を切り替え
        if (mode === 'grid') {
            gridContainer.style.display = 'grid';
            timelineContainer.style.display = 'none';
        } else if (mode === 'timeline') {
            gridContainer.style.display = 'none';
            timelineContainer.style.display = 'block';
        }
    }
}