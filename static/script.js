// Global State
let tags = [];
let categories = [];
let selectedTags = [];
let currentFilter = 'all';
let parsedImportTags = []; // For batch import
let insertAfterIndex = -1; // 插入位置：-1 表示末尾，其他值表示在该索引后插入

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
            <span>全部 All</span>
        </button>
    `;

    categories.forEach(cat => {
        container.innerHTML += `
            <button class="category-btn ${currentFilter === cat.id ? 'active' : ''}"
                    data-category="${cat.id}"
                    onclick="filterByCategory('${cat.id}')"
                    style="--cat-color: ${cat.color}">
                <span>${cat.name_zh} ${cat.name_en}</span>
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
        // 如果已选中，则移除
        selectedTags.splice(index, 1);
        // 如果移除的位置在插入点之前或就是插入点，调整插入点
        if (insertAfterIndex >= index) {
            insertAfterIndex = Math.max(-1, insertAfterIndex - 1);
        }
    } else {
        // 添加标签到指定位置
        if (insertAfterIndex >= 0 && insertAfterIndex < selectedTags.length) {
            // 插入到指定位置后面
            selectedTags.splice(insertAfterIndex + 1, 0, tag);
            insertAfterIndex++; // 移动插入点到新添加的标签
        } else {
            // 添加到末尾
            selectedTags.push(tag);
            insertAfterIndex = selectedTags.length - 1;
        }
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
        insertAfterIndex = -1;
        return;
    }

    container.innerHTML = selectedTags.map((tag, index) => {
        const category = categories.find(c => c.id === tag.category_id);
        const catColor = category ? category.color : '#6366f1';
        const isInsertPoint = index === insertAfterIndex;

        return `
            <div class="tag-item ${isInsertPoint ? 'insert-point' : ''}"
                 data-id="${tag.id}"
                 data-index="${index}"
                 onclick="handleSelectedTagClick(event, '${tag.id}', ${index})"
                 title="左键点击设为插入点，右键点击移除">
                <span class="tag-en">${tag.name_en}</span>
                <span class="tag-zh">${tag.name_zh}</span>
                ${tag.weight && tag.weight !== 1 ? `<span class="tag-weight">${tag.weight}</span>` : ''}
                <span class="tag-category-dot" style="background: ${catColor}"></span>
                ${isInsertPoint ? '<span class="insert-indicator">▼</span>' : ''}
            </div>
        `;
    }).join('');

    // 添加右键菜单事件
    container.querySelectorAll('.tag-item').forEach(item => {
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const tagId = item.dataset.id;
            removeSelectedTag(tagId);
        });
    });
}

// 处理已选标签点击
function handleSelectedTagClick(event, tagId, index) {
    event.stopPropagation();

    // 左键点击设为插入点
    if (event.button === 0) {
        setInsertPoint(index);
    }
}

// 设置插入点
function setInsertPoint(index) {
    if (insertAfterIndex === index) {
        // 如果点击的是当前插入点，取消选中（设为末尾）
        insertAfterIndex = selectedTags.length - 1;
    } else {
        insertAfterIndex = index;
    }
    renderSelectedTags();
}

// Remove Selected Tag
function removeSelectedTag(tagId) {
    const index = selectedTags.findIndex(t => t.id === tagId);
    if (index > -1) {
        selectedTags.splice(index, 1);
        // 调整插入点
        if (insertAfterIndex >= index) {
            insertAfterIndex = Math.max(-1, insertAfterIndex - 1);
        }
        // 如果删除后列表为空或插入点超出范围
        if (selectedTags.length === 0) {
            insertAfterIndex = -1;
        } else if (insertAfterIndex >= selectedTags.length) {
            insertAfterIndex = selectedTags.length - 1;
        }
    }
    renderTags();
    renderSelectedTags();
    generatePrompt();
}

// Clear All Selected Tags
function clearSelected() {
    selectedTags = [];
    insertAfterIndex = -1;
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

// Provider configurations
const PROVIDER_CONFIGS = {
    openai: {
        name: 'OpenAI (GPT)',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        requireApiKey: true,
        hints: {
            provider: '兼容 OpenAI API 格式的服务',
            baseUrl: 'OpenAI 官方 API 地址',
            model: '如 gpt-3.5-turbo, gpt-4, gpt-4-turbo 等'
        }
    },
    claude: {
        name: 'Anthropic (Claude)',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-haiku-20240307',
        requireApiKey: true,
        hints: {
            provider: 'Anthropic Claude API',
            baseUrl: 'Anthropic 官方 API 地址',
            model: '如 claude-3-haiku-20240307, claude-3-sonnet-20240229, claude-3-opus-20240229 等'
        }
    },
    gemini: {
        name: 'Google (Gemini)',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        requireApiKey: true,
        hints: {
            provider: 'Google Gemini API',
            baseUrl: 'Google AI Studio API 地址',
            model: '如 gemini-pro, gemini-1.5-pro, gemini-1.5-flash 等'
        }
    },
    ollama: {
        name: 'Ollama (本地)',
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        requireApiKey: false,
        hints: {
            provider: '本地运行的 Ollama 服务',
            baseUrl: 'Ollama 本地服务地址，默认为 http://localhost:11434',
            model: '如 llama2, mistral, codellama, qwen 等（需先 ollama pull 下载）'
        }
    }
};

function updateProviderSettings() {
    const provider = document.getElementById('llmProvider').value;
    const config = PROVIDER_CONFIGS[provider];

    if (!config) return;

    // Update placeholders
    document.getElementById('llmBaseUrl').placeholder = config.baseUrl;
    document.getElementById('llmModel').placeholder = config.model;

    // Update hints
    document.getElementById('providerHint').textContent = config.hints.provider;
    document.getElementById('baseUrlHint').textContent = config.hints.baseUrl;
    document.getElementById('modelHint').textContent = config.hints.model;

    // Update API key requirement
    const apiKeyRequired = document.getElementById('apiKeyRequired');
    const apiKeyInput = document.getElementById('llmApiKey');

    if (config.requireApiKey) {
        apiKeyRequired.style.display = 'inline';
        apiKeyInput.placeholder = apiKeyInput.placeholder.includes('已配置') ? apiKeyInput.placeholder : 'sk-...';
    } else {
        apiKeyRequired.style.display = 'none';
        apiKeyInput.placeholder = '可选（Ollama 本地服务通常不需要）';
    }
}

async function openSettingsModal() {
    // Load current config
    try {
        const response = await fetch('/api/config');
        const config = await response.json();

        // Populate form
        const llm = config.llm || {};
        document.getElementById('llmEnabled').checked = llm.enabled || false;
        document.getElementById('llmProvider').value = llm.provider || 'openai';
        document.getElementById('llmBaseUrl').value = llm.base_url || 'https://api.openai.com/v1';
        document.getElementById('llmModel').value = llm.model || 'gpt-3.5-turbo';
        document.getElementById('llmApiKey').value = ''; // Don't show actual key
        document.getElementById('llmApiKey').placeholder = llm.has_api_key ? '已配置 (留空保持不变)' : 'sk-...';

        // Update provider-specific settings
        updateProviderSettings();

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
                provider: document.getElementById('llmProvider').value,
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
            provider: document.getElementById('llmProvider').value,
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


// ============ Prompt Editor Functions ============

let editorTags = []; // Tags in the editor

function openPromptEditor() {
    // Reset state
    editorTags = [];
    document.getElementById('promptEditorInput').value = '';
    document.getElementById('editorTagsSection').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';

    // If there are selected tags, auto-load them
    if (selectedTags.length > 0) {
        loadSelectedTagsToEditor();
    }

    openModal('promptEditorModal');
}

function loadSelectedTagsToEditor() {
    if (selectedTags.length === 0) {
        showToast('没有已选标签', 'error');
        return;
    }

    // Generate prompt from selected tags
    const format = document.querySelector('input[name="weightFormat"]:checked').value;
    const promptParts = selectedTags.map(tag => {
        const weight = tag.weight || 1;
        if (format === 'sd' && weight !== 1) {
            return `(${tag.name_en}:${weight})`;
        }
        return tag.name_en;
    });

    document.getElementById('promptEditorInput').value = promptParts.join(', ');

    // Convert selected tags to editor tags
    editorTags = selectedTags.map(tag => ({
        ...tag,
        checked: false,
        fromLibrary: true // Mark as from library
    }));

    renderEditorTags();
}

// 本地匹配解析 - 从已有标签库中匹配，不调用 LLM
function localMatchTags() {
    const input = document.getElementById('promptEditorInput').value.trim();
    if (!input) {
        showToast('请输入 Prompt', 'error');
        return;
    }

    const btn = document.getElementById('localMatchBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;

    try {
        // 解析输入文本为单独的标签
        const parsedTagStrings = parseInputText(input);

        // 从本地标签库匹配
        editorTags = parsedTagStrings.map(tagStr => {
            const normalizedTag = tagStr.toLowerCase().trim();

            // 尝试从标签库中精确匹配或模糊匹配
            const existingTag = tags.find(t =>
                t.name_en.toLowerCase() === normalizedTag ||
                t.name_zh === tagStr ||
                t.name_en.toLowerCase().includes(normalizedTag) ||
                normalizedTag.includes(t.name_en.toLowerCase())
            );

            if (existingTag) {
                return {
                    id: existingTag.id,
                    name_en: existingTag.name_en,
                    name_zh: existingTag.name_zh,
                    category_id: existingTag.category_id,
                    weight: existingTag.weight || 1,
                    checked: false,
                    fromLibrary: true,
                    isNew: false
                };
            } else {
                // 未匹配到的标签
                return {
                    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name_en: tagStr,
                    name_zh: tagStr,
                    category_id: null,
                    weight: 1,
                    checked: false,
                    fromLibrary: false,
                    isNew: true
                };
            }
        });

        const matchedCount = editorTags.filter(t => t.fromLibrary).length;
        const newCount = editorTags.filter(t => t.isNew).length;

        renderEditorTags();
        showToast(`解析 ${editorTags.length} 个标签，匹配 ${matchedCount} 个，未匹配 ${newCount} 个`, 'success');
    } catch (error) {
        showToast('解析失败', 'error');
        console.error(error);
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btn.disabled = false;
    }
}

// 解析输入文本为标签数组
function parseInputText(text) {
    // 移除常见的 prompt 语法: <lora:xxx>, (tag:weight), {tag}, [tag]
    let cleaned = text.replace(/<[^>]+>/g, ''); // 移除 <lora:xxx> 等
    cleaned = cleaned.replace(/\([^)]*:([\d.]+)\)/g, (match, weight) => {
        // (tag:1.2) -> tag
        return match.substring(1, match.lastIndexOf(':'));
    });
    cleaned = cleaned.replace(/[{}\[\]]/g, ''); // 移除 {} 和 []
    cleaned = cleaned.replace(/:[\d.]+/g, ''); // 移除剩余的 :weight

    // 按逗号、换行或分号分割
    const parts = cleaned.split(/[,;\n]+/);

    // 清理并过滤
    return parts
        .map(p => p.trim())
        .filter(p => p.length >= 2);
}

// AI 智能解析 - 调用 LLM 服务
async function smartParseTags() {
    const input = document.getElementById('promptEditorInput').value.trim();
    if (!input) {
        showToast('请输入 Prompt', 'error');
        return;
    }

    const btn = document.getElementById('smartParseBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;

    try {
        const response = await fetch('/api/tags/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input })
        });

        const result = await response.json();

        if (result.success) {
            // Convert parsed tags to editor format
            editorTags = result.tags.map(tag => {
                // Check if tag exists in library
                const existingTag = tags.find(t =>
                    t.name_en.toLowerCase() === tag.name_en.toLowerCase()
                );

                return {
                    id: existingTag ? existingTag.id : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name_en: tag.name_en,
                    name_zh: tag.name_zh || tag.name_en,
                    category_id: existingTag ? existingTag.category_id : tag.category_id,
                    weight: tag.weight || 1,
                    checked: false,
                    fromLibrary: !!existingTag,
                    isNew: !existingTag
                };
            });

            const method = result.method === 'llm' ? 'AI智能' : '传统';
            renderEditorTags();
            showToast(`${method}解析出 ${editorTags.length} 个标签`, 'success');
        } else {
            showToast(result.error || '解析失败', 'error');
        }
    } catch (error) {
        showToast('解析请求失败', 'error');
        console.error(error);
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btn.disabled = false;
    }
}

// 保留旧函数名以兼容
async function parsePromptToTags() {
    await smartParseTags();
}

function renderEditorTags() {
    const container = document.getElementById('editorTagsContainer');
    const tagsSection = document.getElementById('editorTagsSection');
    const filterSection = document.getElementById('filterSection');
    const countBadge = document.getElementById('editorTagsCount');

    if (editorTags.length === 0) {
        tagsSection.style.display = 'none';
        filterSection.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    tagsSection.style.display = 'block';
    filterSection.style.display = 'block';

    // Load categories to both filter selects
    loadFilterCategories();

    // Update count badge
    if (countBadge) {
        countBadge.textContent = editorTags.length;
    }

    container.innerHTML = editorTags.map((tag, index) => {
        const category = categories.find(c => c.id === tag.category_id);
        const categoryName = category ? category.name_zh : '未分类';

        return `
            <div class="editor-tag-item ${tag.checked ? 'checked' : ''}"
                 data-index="${index}"
                 onclick="toggleEditorTag(${index})">
                <span class="tag-checkbox"></span>
                <div class="tag-info">
                    <span class="tag-en">${tag.name_en}</span>
                    <span class="tag-zh">${tag.name_zh}</span>
                </div>
                <span class="tag-category-badge">${categoryName}</span>
            </div>
        `;
    }).join('');
}

// 加载筛选类别选项
function loadFilterCategories() {
    const normalSelect = document.getElementById('normalFilterCategory');
    const smartSelect = document.getElementById('smartSelectCategory');

    if (!normalSelect || !smartSelect) return;

    const optionsHtml = categories.map(cat =>
        `<option value="${cat.id}">${cat.name_zh} / ${cat.name_en}</option>`
    ).join('');

    normalSelect.innerHTML = optionsHtml;
    smartSelect.innerHTML = optionsHtml;
}

// 普通筛选 - 根据标签的分类信息筛选
function normalFilterByCategory() {
    const categoryId = document.getElementById('normalFilterCategory').value;
    if (!categoryId) {
        showToast('请选择类别', 'error');
        return;
    }

    let matchedCount = 0;
    editorTags.forEach(tag => {
        if (tag.category_id === categoryId) {
            tag.checked = true;
            matchedCount++;
        }
    });

    if (matchedCount > 0) {
        renderEditorTags();
        const category = categories.find(c => c.id === categoryId);
        showToast(`已选中 ${matchedCount} 个 ${category?.name_zh || ''} 类别的标签`, 'success');
    } else {
        showToast('没有找到该类别的标签', 'error');
    }
}

function toggleEditorTag(index) {
    if (editorTags[index]) {
        editorTags[index].checked = !editorTags[index].checked;
        renderEditorTags();
    }
}

function selectAllEditorTags() {
    editorTags.forEach(tag => tag.checked = true);
    renderEditorTags();
}

function deselectAllEditorTags() {
    editorTags.forEach(tag => tag.checked = false);
    renderEditorTags();
}

function removeSelectedEditorTags() {
    const checkedCount = editorTags.filter(t => t.checked).length;
    if (checkedCount === 0) {
        showToast('请先选择要移除的标签', 'error');
        return;
    }

    editorTags = editorTags.filter(tag => !tag.checked);
    renderEditorTags();
    showToast(`已移除 ${checkedCount} 个标签`, 'success');
}

async function smartSelectByCategory() {
    if (editorTags.length === 0) {
        showToast('没有可分析的标签', 'error');
        return;
    }

    const categoryId = document.getElementById('smartSelectCategory').value;
    const category = categories.find(c => c.id === categoryId);

    if (!category) {
        showToast('请选择一个类别', 'error');
        return;
    }

    const btn = document.getElementById('smartSelectBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;

    try {
        const response = await fetch('/api/tags/analyze-relevance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tags: editorTags.map(t => ({ name_en: t.name_en, name_zh: t.name_zh })),
                category: {
                    id: category.id,
                    name_en: category.name_en,
                    name_zh: category.name_zh
                }
            })
        });

        const result = await response.json();

        if (result.success) {
            // Update checked state based on relevance
            const relevantTags = result.relevant_tags || [];
            editorTags.forEach(tag => {
                tag.checked = relevantTags.some(rt =>
                    rt.toLowerCase() === tag.name_en.toLowerCase()
                );
            });

            renderEditorTags();

            const selectedCount = editorTags.filter(t => t.checked).length;
            showToast(`AI 选中了 ${selectedCount} 个与"${category.name_zh}"相关的标签`, 'success');
        } else {
            showToast(result.error || '分析失败', 'error');
        }
    } catch (error) {
        showToast('分析请求失败', 'error');
        console.error(error);
    } finally {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        btn.disabled = false;
    }
}

function applyEditorChanges() {
    // Update selectedTags based on remaining editorTags
    selectedTags = editorTags.map(tag => {
        // If tag is from library, find the original
        if (tag.fromLibrary) {
            const originalTag = tags.find(t => t.id === tag.id);
            if (originalTag) {
                return originalTag;
            }
        }
        // Return the tag as is (might be a new tag not in library)
        return {
            id: tag.id,
            name_en: tag.name_en,
            name_zh: tag.name_zh,
            category_id: tag.category_id,
            weight: tag.weight
        };
    });

    // Reset insert point
    insertAfterIndex = selectedTags.length > 0 ? selectedTags.length - 1 : -1;

    // Update UI
    renderTags();
    renderSelectedTags();
    generatePrompt();

    closeModal('promptEditorModal');
    showToast('更改已应用', 'success');
}
