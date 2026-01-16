// Gallery Page JavaScript

// Global State
let galleryItems = [];
let currentViewingItem = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    setupDragAndDrop();
});

// Load Gallery Data
async function loadGallery() {
    try {
        const response = await fetch('/api/gallery');
        const data = await response.json();
        galleryItems = data.items || [];
        renderGallery();
    } catch (error) {
        console.error('Failed to load gallery:', error);
        showToast('加载画廊失败', 'error');
    }
}

// Render Gallery Grid
function renderGallery() {
    const container = document.getElementById('galleryGrid');

    if (galleryItems.length === 0) {
        container.innerHTML = '<p class="empty-hint">暂无作品，点击上方按钮上传</p>';
        return;
    }

    container.innerHTML = galleryItems.map(item => `
        <div class="gallery-item" onclick="viewGalleryItem('${item.id}')">
            <img src="/static/uploads/${item.image}" alt="${item.title || 'Artwork'}" loading="lazy">
            <div class="gallery-item-overlay">
                <span class="gallery-item-title">${item.title || '未命名作品'}</span>
            </div>
            <button class="gallery-item-edit" onclick="event.stopPropagation(); openEditGalleryModal('${item.id}')" title="编辑">
                ✎
            </button>
        </div>
    `).join('');
}

// Setup Drag and Drop for Upload
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const input = document.getElementById('galleryImageInput');
            input.files = files;
            previewImage(input, 'uploadPreview', 'uploadPlaceholder');
        }
    });
}

// Preview Image before Upload
function previewImage(input, previewId, placeholderId) {
    const preview = document.getElementById(previewId);
    const placeholder = placeholderId ? document.getElementById(placeholderId) : null;

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Open Add Gallery Modal
function openAddGalleryModal() {
    document.getElementById('addGalleryForm').reset();
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'flex';
    openModal('addGalleryModal');
}

// Open Edit Gallery Modal
function openEditGalleryModal(itemId) {
    const item = galleryItems.find(i => i.id === itemId);
    if (!item) return;

    document.getElementById('editGalleryId').value = item.id;
    document.getElementById('editGalleryTitle').value = item.title || '';
    document.getElementById('editGalleryPositive').value = item.positive_prompt || '';
    document.getElementById('editGalleryNegative').value = item.negative_prompt || '';
    document.getElementById('editGalleryPreview').src = `/static/uploads/${item.image}`;
    document.getElementById('editGalleryImageInput').value = '';

    openModal('editGalleryModal');
}

// View Gallery Item
function viewGalleryItem(itemId) {
    const item = galleryItems.find(i => i.id === itemId);
    if (!item) return;

    currentViewingItem = item;

    document.getElementById('viewGalleryImage').src = `/static/uploads/${item.image}`;
    document.getElementById('viewGalleryTitle').textContent = item.title || '未命名作品';
    document.getElementById('viewPositivePrompt').textContent = item.positive_prompt || '';
    document.getElementById('viewNegativePrompt').textContent = item.negative_prompt || '';

    openModal('viewGalleryModal');
}

// Submit Add Gallery
async function submitAddGallery(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/gallery', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            galleryItems.unshift(result.item);
            renderGallery();
            closeModal('addGalleryModal');
            showToast('作品上传成功!', 'success');
        } else {
            showToast(result.error || '上传失败', 'error');
        }
    } catch (error) {
        showToast('上传失败', 'error');
    }
}

// Submit Edit Gallery
async function submitEditGallery(event) {
    event.preventDefault();
    const itemId = document.getElementById('editGalleryId').value;
    const form = event.target;
    const formData = new FormData(form);

    // Remove empty file input if no new image selected
    const imageInput = document.getElementById('editGalleryImageInput');
    if (!imageInput.files || imageInput.files.length === 0) {
        formData.delete('image');
    }

    try {
        const response = await fetch(`/api/gallery/${itemId}`, {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            const index = galleryItems.findIndex(i => i.id === itemId);
            if (index > -1) {
                galleryItems[index] = result.item;
            }
            renderGallery();
            closeModal('editGalleryModal');
            showToast('作品更新成功!', 'success');
        } else {
            showToast(result.error || '更新失败', 'error');
        }
    } catch (error) {
        showToast('更新失败', 'error');
    }
}

// Delete Gallery Item
async function deleteGalleryItem() {
    const itemId = document.getElementById('editGalleryId').value;

    if (!confirm('确定要删除这个作品吗? 此操作不可恢复。')) return;

    try {
        const response = await fetch(`/api/gallery/${itemId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            galleryItems = galleryItems.filter(i => i.id !== itemId);
            renderGallery();
            closeModal('editGalleryModal');
            showToast('作品已删除', 'success');
        }
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

// Copy Text to Clipboard
async function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    if (!text) {
        showToast('没有可复制的内容', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        showToast('已复制到剪贴板!', 'success');
    } catch (err) {
        showToast('复制失败', 'error');
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
