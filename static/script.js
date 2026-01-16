// Global State
let tags = [];
let categories = [];
let selectedTags = [];
let currentFilter = 'all';
let parsedImportTags = []; // For batch import

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

// Load Data from API
async function loadData() {
    try {
        const response = await fetch('/api/tags');
        const data = await response.json();
        tags = data.tags || [];
        categories = data.categories || [];
        renderCategoryFilter();
        renderTags();
        renderCategoriesList();
    } catch (error) {
        showToast('Failed to load data', 'error');
        console.error(error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Weight format change
    document.querySelectorAll('input[name="weightFormat"]').forEach(radio => {
        radio.addEventListener('change', generatePrompt);
    });
}

// Render Category Filter Buttons
function renderCategoryFilter() {
    const container = document.querySelector('.category-filter');
    container.innerHTML = `
        <button class="category-btn ${currentFilter === 'all' ? 'active' : ''}"
                data-category="all" onclick="filterByCategory('all')">
            全部 All
        </button>
    `;

    categories.forEach(cat => {
        container.innerHTML += `
            <button class="category-btn ${currentFilter === cat.id ? 'active' : ''}"
                    data-category="${cat.id}"
                    onclick="filterByCategory('${cat.id}')"
                    style="--cat-color: ${cat.color}">
                ${cat.name_zh} ${cat.name_en}
            </button>
        `;
    });
}

// Filter Tags by Category
function filterByCategory(categoryId) {
    currentFilter = categoryId;
    renderCategoryFilter();
    renderTags();
}

// Render Tags
function renderTags() {
    const container = document.getElementById('tagsContainer');
    const filteredTags = currentFilter === 'all'
        ? tags
        : tags.filter(t => t.category_id === currentFilter);

    if (filteredTags.length === 0) {
        container.innerHTML = '<p class="empty-hint">暂无标签 / No tags yet</p>';
        return;
    }

    container.innerHTML = filteredTags.map(tag => {
        const category = categories.find(c => c.id === tag.category_id);
        const isSelected = selectedTags.some(t => t.id === tag.id);
        const catColor = category ? category.color : '#6366f1';

        return `
            <div class="tag-item ${isSelected ? 'selected' : ''}"
                 data-id="${tag.id}"
                 onclick="toggleTag('${tag.id}')"
                 style="--tag-color: ${catColor}">
                <button class="tag-edit-btn" onclick="event.stopPropagation(); openEditTagModal('${tag.id}')">
                    ✎
                </button>
                <span class="tag-en">${tag.name_en}</span>
                <span class="tag-zh">${tag.name_zh}</span>
                ${tag.weight && tag.weight !== 1 ? `<span class="tag-weight">${tag.weight}</span>` : ''}
                <span class="tag-category-dot" style="background: ${catColor}"></span>
            </div>
        `;
    }).join('');
}

// Toggle Tag Selection
function toggleTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    const index = selectedTags.findIndex(t => t.id === tagId);
    if (index > -1) {
        selectedTags.splice(index, 1);
    } else {
        selectedTags.push(tag);
    }

    renderTags();
    renderSelectedTags();
    generatePrompt();
}

// Render Selected Tags
function renderSelectedTags() {
    const container = document.getElementById('selectedTags');

    if (selectedTags.length === 0) {
        container.innerHTML = '<p class="empty-hint">点击左侧标签添加到这里</p>';
        return;
    }

    container.innerHTML = selectedTags.map(tag => {
        const category = categories.find(c => c.id === tag.category_id);
        const catColor = category ? category.color : '#6366f1';

        return `
            <div class="tag-item"
                 data-id="${tag.id}"
                 onclick="removeSelectedTag('${tag.id}')"
                 title="点击移除">
                <span class="tag-en">${tag.name_en}</span>
                <span class="tag-zh">${tag.name_zh}</span>
                ${tag.weight && tag.weight !== 1 ? `<span class="tag-weight">${tag.weight}</span>` : ''}
                <span class="tag-category-dot" style="background: ${catColor}"></span>
            </div>
        `;
    }).join('');
}

// Remove Selected Tag
function removeSelectedTag(tagId) {
    selectedTags = selectedTags.filter(t => t.id !== tagId);
    renderTags();
    renderSelectedTags();
    generatePrompt();
}

// Clear All Selected Tags
function clearSelected() {
    selectedTags = [];
    renderTags();
    renderSelectedTags();
    generatePrompt();
}

// Generate Prompt
function generatePrompt() {
    const output = document.getElementById('promptOutput');

    if (selectedTags.length === 0) {
        output.innerHTML = '<span class="placeholder">选择标签后生成 Prompt...</span>';
        return;
    }

    const format = document.querySelector('input[name="weightFormat"]:checked').value;

    const promptParts = selectedTags.map(tag => {
        const weight = tag.weight || 1;

        switch (format) {
            case 'sd':
                // Stable Diffusion format: (tag:weight)
                if (weight !== 1) {
                    return `(${tag.name_en}:${weight})`;
                }
                return tag.name_en;

            case 'nai':
                // NovelAI format: {tag} for emphasis
                if (weight > 1) {
                    const braces = Math.round((weight - 1) * 5);
                    return '{'.repeat(braces) + tag.name_en + '}'.repeat(braces);
                } else if (weight < 1) {
                    const brackets = Math.round((1 - weight) * 5);
                    return '['.repeat(brackets) + tag.name_en + ']'.repeat(brackets);
                }
                return tag.name_en;

            case 'plain':
            default:
                return tag.name_en;
        }
    });

    output.textContent = promptParts.join(', ');
}

// Copy Prompt to Clipboard
async function copyPrompt() {
    const output = document.getElementById('promptOutput');
    const text = output.textContent;

    if (!text || text.includes('选择标签后')) {
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

// Render Categories List
function renderCategoriesList() {
    const container = document.getElementById('categoriesList');

    container.innerHTML = categories.map(cat => `
        <div class="category-item" onclick="openEditCategoryModal('${cat.id}')">
            <span class="category-color" style="background: ${cat.color}"></span>
            <div class="category-name">
                <span class="category-name-en">${cat.name_en}</span>
                <span class="category-name-zh">${cat.name_zh}</span>
            </div>
            <button class="category-edit-btn" title="编辑分类">
                ✎
            </button>
        </div>
    `).join('');
}

// Render Category Select Options
function renderCategoryOptions(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = categories.map(cat =>
        `<option value="${cat.id}">${cat.name_zh} / ${cat.name_en}</option>`
    ).join('');
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openAddTagModal() {
    // 如果当前是"全部"分类，提示用户先选择一个分类
    if (currentFilter === 'all') {
        showToast('请先选择一个分类', 'error');
        return;
    }

    const currentCategory = categories.find(c => c.id === currentFilter);
    if (!currentCategory) {
        showToast('分类不存在', 'error');
        return;
    }

    document.getElementById('addTagForm').reset();

    // 显示当前分类名称，隐藏下拉框
    const categorySelectGroup = document.getElementById('categorySelectGroup');
    const categoryDisplay = document.getElementById('categoryDisplay');
    const categorySelect = document.getElementById('tagCategorySelect');

    categorySelectGroup.style.display = 'none';
    categoryDisplay.style.display = 'block';
    categoryDisplay.innerHTML = `
        <span class="category-badge" style="--cat-color: ${currentCategory.color}">
            <span class="category-badge-dot" style="background: ${currentCategory.color}"></span>
            ${currentCategory.name_zh} / ${currentCategory.name_en}
        </span>
    `;

    // 移除 required 属性，因为我们使用 currentFilter 提交
    categorySelect.removeAttribute('required');

    openModal('addTagModal');
}

function openAddCategoryModal() {
    document.getElementById('addCategoryForm').reset();
    openModal('addCategoryModal');
}

function openEditTagModal(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    renderCategoryOptions('editTagCategorySelect');
    document.getElementById('editTagId').value = tag.id;
    document.getElementById('editNameEn').value = tag.name_en;
    document.getElementById('editNameZh').value = tag.name_zh;
    document.getElementById('editTagCategorySelect').value = tag.category_id;
    document.getElementById('editWeight').value = tag.weight || 1;

    openModal('editTagModal');
}

// Form Submissions
async function submitAddTag(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // 使用当前筛选的分类（因为我们已在 openAddTagModal 中验证过）
    const tagData = {
        name_en: formData.get('name_en'),
        name_zh: formData.get('name_zh'),
        category_id: currentFilter,  // 直接使用当前分类
        weight: parseFloat(formData.get('weight')) || 1
    };

    try {
        const response = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tagData)
        });

        const result = await response.json();
        if (result.success) {
            tags.push(result.tag);
            renderTags();
            closeModal('addTagModal');
            showToast('标签添加成功!', 'success');
        }
    } catch (error) {
        showToast('添加失败', 'error');
    }
}

async function submitEditTag(event) {
    event.preventDefault();
    const tagId = document.getElementById('editTagId').value;

    const tagData = {
        name_en: document.getElementById('editNameEn').value,
        name_zh: document.getElementById('editNameZh').value,
        category_id: document.getElementById('editTagCategorySelect').value,
        weight: parseFloat(document.getElementById('editWeight').value) || 1
    };

    try {
        const response = await fetch(`/api/tags/${tagId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tagData)
        });

        const result = await response.json();
        if (result.success) {
            const index = tags.findIndex(t => t.id === tagId);
            if (index > -1) {
                tags[index] = result.tag;
            }

            // Update selected tags if modified
            const selectedIndex = selectedTags.findIndex(t => t.id === tagId);
            if (selectedIndex > -1) {
                selectedTags[selectedIndex] = result.tag;
            }

            renderTags();
            renderSelectedTags();
            generatePrompt();
            closeModal('editTagModal');
            showToast('标签更新成功!', 'success');
        }
    } catch (error) {
        showToast('更新失败', 'error');
    }
}

async function deleteCurrentTag() {
    const tagId = document.getElementById('editTagId').value;

    if (!confirm('确定要删除这个标签吗?')) return;

    try {
        const response = await fetch(`/api/tags/${tagId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            tags = tags.filter(t => t.id !== tagId);
            selectedTags = selectedTags.filter(t => t.id !== tagId);
            renderTags();
            renderSelectedTags();
            generatePrompt();
            closeModal('editTagModal');
            showToast('标签已删除', 'success');
        }
    } catch (error) {
        showToast('删除失败', 'error');
    }
}

async function submitAddCategory(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const categoryData = {
        name_en: formData.get('name_en'),
        name_zh: formData.get('name_zh'),
        color: formData.get('color')
    };

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        const result = await response.json();
        if (result.success) {
            categories.push(result.category);
            renderCategoryFilter();
            renderCategoriesList();
            closeModal('addCategoryModal');
            showToast('分类添加成功!', 'success');
        }
    } catch (error) {
        showToast('添加失败', 'error');
    }
}

function openEditCategoryModal(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    document.getElementById('editCategoryId').value = category.id;
    document.getElementById('editCategoryNameEn').value = category.name_en;
    document.getElementById('editCategoryNameZh').value = category.name_zh;
    document.getElementById('editCategoryColor').value = category.color;

    openModal('editCategoryModal');
}

async function submitEditCategory(event) {
    event.preventDefault();
    const categoryId = document.getElementById('editCategoryId').value;

    const categoryData = {
        name_en: document.getElementById('editCategoryNameEn').value,
        name_zh: document.getElementById('editCategoryNameZh').value,
        color: document.getElementById('editCategoryColor').value
    };

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        const result = await response.json();
        if (result.success) {
            const index = categories.findIndex(c => c.id === categoryId);
            if (index > -1) {
                categories[index] = result.category;
            }

            renderCategoryFilter();
            renderCategoriesList();
            renderTags(); // Refresh tags to show updated category colors
            closeModal('editCategoryModal');
            showToast('分类更新成功!', 'success');
        }
    } catch (error) {
        showToast('更新失败', 'error');
    }
}

async function deleteCurrentCategory() {
    const categoryId = document.getElementById('editCategoryId').value;

    if (!confirm('删除分类将不会删除该分类下的标签，确定要删除吗?')) return;

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
            categories = categories.filter(c => c.id !== categoryId);
            if (currentFilter === categoryId) {
                currentFilter = 'all';
            }
            renderCategoryFilter();
            renderCategoriesList();
            renderTags();
            closeModal('editCategoryModal');
            showToast('分类已删除', 'success');
        }
    } catch (error) {
        showToast('删除失败', 'error');
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


// ============ Batch Import Functions ============

function openImportModal() {
    // Reset state
    parsedImportTags = [];
    document.getElementById('importInput').value = '';
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';

    // Load category options
    const select = document.getElementById('importDefaultCategory');
    select.innerHTML = categories.map(cat =>
        `<option value="${cat.id}">${cat.name_zh} / ${cat.name_en}</option>`
    ).join('');

    openModal('importTagsModal');
}

async function parseImportTags() {
    const input = document.getElementById('importInput').value.trim();
    if (!input) {
        showToast('请输入要导入的标签', 'error');
        return;
    }

    const parseBtn = document.getElementById('parseBtn');
    const btnText = parseBtn.querySelector('.btn-text');
    const btnLoading = parseBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    parseBtn.disabled = true;

    try {
        const response = await fetch('/api/tags/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input })
        });

        const result = await response.json();

        if (result.success) {
            parsedImportTags = result.tags;

            // Apply default category to tags without matched category
            const defaultCategoryId = document.getElementById('importDefaultCategory').value;
            const defaultCategory = categories.find(c => c.id === defaultCategoryId);

            parsedImportTags.forEach(tag => {
                if (!tag.category_id && defaultCategory) {
                    tag.category_id = defaultCategory.id;
                    tag.category_name = `${defaultCategory.name_zh} / ${defaultCategory.name_en}`;
                    tag.category_color = defaultCategory.color;
                }
            });

            // Update summary
            document.getElementById('importSummary').textContent =
                `共解析 ${result.total} 个标签，其中 ${result.new_count} 个为新标签`;

            // Render preview
            renderImportPreview();

            // Switch to step 2
            document.getElementById('importStep1').style.display = 'none';
            document.getElementById('importStep2').style.display = 'block';
        } else {
            showToast(result.error || '解析失败', 'error');
        }
    } catch (error) {
        showToast('解析请求失败', 'error');
        console.error(error);
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        parseBtn.disabled = false;
    }
}

function renderImportPreview() {
    const container = document.getElementById('importPreviewList');

    container.innerHTML = parsedImportTags.map((tag, index) => `
        <div class="import-preview-item ${tag.exists ? 'exists' : ''}" data-index="${index}">
            <div class="preview-col tag-names">
                <span class="tag-en">${tag.name_en}</span>
                ${tag.exists ? '<span class="tag-exists-badge">已存在</span>' : ''}
            </div>
            <div class="preview-col">
                <input type="text" class="import-translation-input"
                       value="${tag.name_zh}"
                       onchange="updateImportTag(${index}, 'name_zh', this.value)"
                       placeholder="中文翻译">
            </div>
            <div class="preview-col">
                <select class="import-category-select"
                        onchange="updateImportTagCategory(${index}, this.value)">
                    ${categories.map(cat => `
                        <option value="${cat.id}" ${tag.category_id === cat.id ? 'selected' : ''}>
                            ${cat.name_zh}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="preview-col preview-actions">
                <button class="btn-icon-small ${tag.excluded ? 'excluded' : ''}"
                        onclick="toggleImportTag(${index})"
                        title="${tag.excluded ? '重新包含' : '排除'}">
                    ${tag.excluded ? '✓' : '✕'}
                </button>
            </div>
        </div>
    `).join('');
}

function updateImportTag(index, field, value) {
    if (parsedImportTags[index]) {
        parsedImportTags[index][field] = value;
    }
}

function updateImportTagCategory(index, categoryId) {
    if (parsedImportTags[index]) {
        const category = categories.find(c => c.id === categoryId);
        parsedImportTags[index].category_id = categoryId;
        if (category) {
            parsedImportTags[index].category_name = `${category.name_zh} / ${category.name_en}`;
            parsedImportTags[index].category_color = category.color;
        }
    }
}

function toggleImportTag(index) {
    if (parsedImportTags[index]) {
        parsedImportTags[index].excluded = !parsedImportTags[index].excluded;
        renderImportPreview();
    }
}

function backToImportStep1() {
    document.getElementById('importStep1').style.display = 'block';
    document.getElementById('importStep2').style.display = 'none';
}

async function confirmImport() {
    // Filter out excluded and existing tags
    const tagsToImport = parsedImportTags.filter(tag => !tag.excluded && !tag.exists);

    if (tagsToImport.length === 0) {
        showToast('没有可导入的新标签', 'error');
        return;
    }

    const importBtn = document.getElementById('importBtn');
    const btnText = importBtn.querySelector('.btn-text');
    const btnLoading = importBtn.querySelector('.btn-loading');

    // Show loading state
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    importBtn.disabled = true;

    try {
        const response = await fetch('/api/tags/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: tagsToImport })
        });

        const result = await response.json();

        if (result.success) {
            // Add imported tags to local state
            result.tags.forEach(tag => tags.push(tag));

            // Refresh UI
            renderTags();
            closeModal('importTagsModal');
            showToast(`成功导入 ${result.imported} 个标签!`, 'success');
        } else {
            showToast(result.error || '导入失败', 'error');
        }
    } catch (error) {
        showToast('导入请求失败', 'error');
        console.error(error);
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        importBtn.disabled = false;
    }
}


// ============ Settings Functions ============

async function openSettingsModal() {
    // Load current config
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        // Populate form
        const llm = config.llm || {};
        document.getElementById('llmEnabled').checked = llm.enabled || false;
        document.getElementById('llmBaseUrl').value = llm.base_url || 'https://api.openai.com/v1';
        document.getElementById('llmModel').value = llm.model || 'gpt-3.5-turbo';
        document.getElementById('llmApiKey').value = ''; // Don't show actual key
        document.getElementById('llmApiKey').placeholder = llm.has_api_key ? '已配置 (留空保持不变)' : 'sk-...';

        // Show API key status
        const statusEl = document.getElementById('apiKeyStatus');
        if (llm.has_api_key) {
            statusEl.textContent = `当前密钥: ${llm.api_key_masked}`;
            statusEl.style.color = 'var(--success)';
        } else {
            statusEl.textContent = '未配置 API 密钥';
            statusEl.style.color = 'var(--text-muted)';
        }

        // Toggle LLM settings visibility
        toggleLLMSettings();

        // Reset test result
        document.getElementById('testResult').textContent = '';

        openModal('settingsModal');
    } catch (error) {
        showToast('加载配置失败', 'error');
        console.error(error);
    }
}

function toggleLLMSettings() {
    const enabled = document.getElementById('llmEnabled').checked;
    const settings = document.getElementById('llmSettings');
    settings.style.opacity = enabled ? '1' : '0.5';
    settings.style.pointerEvents = enabled ? 'auto' : 'none';
}

// Add event listener for toggle
document.addEventListener('DOMContentLoaded', () => {
    const llmEnabledCheckbox = document.getElementById('llmEnabled');
    if (llmEnabledCheckbox) {
        llmEnabledCheckbox.addEventListener('change', toggleLLMSettings);
    }
});

function toggleApiKeyVisibility() {
    const input = document.getElementById('llmApiKey');
    const icon = document.getElementById('apiKeyEyeIcon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        input.type = 'password';
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

async function testLLMConnection() {
    const btn = document.getElementById('testLLMBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    const resultEl = document.getElementById('testResult');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;
    resultEl.textContent = '';

    try {
        const response = await fetch('/api/config/test-llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: document.getElementById('llmApiKey').value || '',
                base_url: document.getElementById('llmBaseUrl').value,
                model: document.getElementById('llmModel').value
            })
        });

        const result = await response.json();

        if (result.success) {
            resultEl.textContent = '连接成功!';
            resultEl.style.color = 'var(--success)';
        } else {
            resultEl.textContent = result.error || '连接失败';
            resultEl.style.color = 'var(--danger)';
        }
    } catch (error) {
        resultEl.textContent = '测试请求失败';
        resultEl.style.color = 'var(--danger)';
        console.error(error);
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btn.disabled = false;
    }
}

async function submitSettings(event) {
    event.preventDefault();

    const configData = {
        llm: {
            enabled: document.getElementById('llmEnabled').checked,
            base_url: document.getElementById('llmBaseUrl').value,
            model: document.getElementById('llmModel').value
        }
    };

    // Only include API key if a new one was entered
    const apiKey = document.getElementById('llmApiKey').value;
    if (apiKey) {
        configData.llm.api_key = apiKey;
    }

    try {
        const response = await fetch('/api/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData)
        });

        const result = await response.json();

        if (result.success) {
            closeModal('settingsModal');
            showToast('设置已保存!', 'success');
        } else {
            showToast(result.error || '保存失败', 'error');
        }
    } catch (error) {
        showToast('保存请求失败', 'error');
        console.error(error);
    }
}
