# AI2IMG_Tag

AI 图像生成标签管理与提示词生成系统

## 项目简介

AI2IMG_Tag 是一个专为 AI 图像生成（如 Stable Diffusion、NovelAI 等）设计的 Web 端标签管理与提示词生成工具。该应用帮助用户：

- 管理按类别组织的标签库
- 通过选择标签构建正向和负向提示词
- 支持多种权重语法格式
- 在图库中展示和管理生成的作品
- 追踪图像所使用的标签和提示词

## 功能特性

### 标签管理
- 按自定义类别组织标签
- 为标签分配权重（0.1 - 2.0）
- 双语支持（中文 + 英文）
- 使用颜色编码区分不同类别

### 提示词生成
- 支持多种权重语法格式：
  - **SD (Stable Diffusion)**：`(tag:weight)` 格式
  - **NAI (NovelAI)**：`{tag}` 表示强调，`[tag]` 表示弱化
  - **Plain**：纯文本，用逗号分隔
- 实时预览生成的提示词
- 一键复制到剪贴板

### 图库管理
- 上传和整理生成的图像
- 存储图像对应的正向/负向提示词
- 追踪哪些提示词产生了哪些效果
- 支持编辑和删除操作

### 用户界面
- Apple 风格设计美学
- 毛玻璃（Glassmorphism）视觉效果
- 响应式布局，支持多设备访问
- 基于模态框的交互方式
- Toast 通知提供即时反馈

## 技术栈

### 后端
- **Flask** - Python Web 框架
- **Python 3** - 核心编程语言
- **JSON** - 文件型数据存储

### 前端
- **HTML5** - 语义化页面结构
- **CSS3** - 现代化样式与动画
- **Vanilla JavaScript** - 原生 JS，无框架依赖

## 项目结构

```
AI2IMG_Tag/
├── app.py                    # Flask 后端应用
├── data/
│   ├── tags.json            # 标签和类别数据库
│   └── gallery.json         # 图库数据库
├── static/
│   ├── script.js            # 主页面 JavaScript
│   ├── gallery.js           # 画廊页面 JavaScript
│   ├── style.css            # 样式文件
│   └── uploads/             # 用户上传的图片目录
├── templates/
│   ├── index.html           # 主页面模板（标签管理）
│   └── gallery.html         # 画廊页面模板
└── README.md                 # 项目文档
```

## 安装与运行

### 环境要求
- Python 3.7+
- pip 包管理器

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd AI2IMG_Tag
   ```

2. **安装依赖**
   ```bash
   pip install flask
   ```

3. **启动应用**
   ```bash
   python app.py
   ```

   首次启动时，应用会自动创建所有必要的目录和文件：
   - `data/` - 数据文件目录
   - `data/tags.json` - 标签和分类数据（包含示例数据）
   - `data/gallery.json` - 图库数据
   - `data/config.json` - LLM配置文件
   - `static/uploads/` - 图片上传目录

   **无需手动创建任何文件！**

4. **访问应用**

   在浏览器中打开：`http://localhost:5000`

### 示例数据

首次启动时，系统会自动创建包含以下内容的示例数据：

**分类示例：**
- Quality (质量)
- Style (风格)
- Character (角色)
- Scene (场景)

**标签示例：**
- masterpiece (杰作)
- best quality (最佳质量)
- anime (动漫)
- 1girl (一个女孩)
- outdoors (户外)

你可以直接使用这些示例数据开始体验，也可以删除后添加自己的标签。

## 新功能：多LLM服务支持

### 支持的服务提供商

应用现在支持多种大语言模型服务：

1. **OpenAI (GPT)**
   - Base URL: `https://api.openai.com/v1`
   - 推荐模型: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`

2. **Anthropic (Claude)**
   - Base URL: `https://api.anthropic.com/v1`
   - 推荐模型: `claude-3-haiku-20240307`, `claude-3-sonnet-20240229`, `claude-3-opus-20240229`

3. **Google (Gemini)**
   - Base URL: `https://generativelanguage.googleapis.com/v1beta`
   - 推荐模型: `gemini-pro`, `gemini-1.5-pro`, `gemini-1.5-flash`

4. **Ollama (本地部署)**
   - Base URL: `http://localhost:11434`
   - 推荐模型: `llama2`, `mistral`, `codellama`, `qwen`
   - **无需API密钥**，适合本地离线使用

### LLM配置步骤

1. 点击右上角设置按钮 ⚙️
2. 启用"大模型服务"开关
3. 选择服务提供商
4. 填写配置信息：
   - API密钥（Ollama不需要）
   - API地址（自动填充默认值）
   - 模型名称
5. 点击"测试连接"验证配置
6. 保存设置

### LLM功能应用

配置LLM后，以下功能将得到增强：

- **批量导入标签**：自动翻译和智能分类
- **Prompt解析**：AI智能解析现有Prompt
- **标签筛选**：基于语义的智能筛选

### Ollama本地部署指南

使用Ollama可以完全离线运行LLM功能：

1. 安装Ollama（访问 https://ollama.ai）
2. 下载模型：
   ```bash
   ollama pull llama2
   # 或其他模型
   ollama pull mistral
   ollama pull qwen
   ```
3. 启动Ollama服务（通常自动启动）
4. 在应用中配置：
   - 服务提供商：Ollama (本地)
   - API地址：`http://localhost:11434`
   - 模型名称：`llama2`（或你下载的模型）
   - API密钥：留空

## API 接口

### 标签相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/tags` | 获取所有标签和类别 |
| POST | `/api/tags` | 添加新标签 |
| PUT | `/api/tags/<id>` | 更新标签 |
| DELETE | `/api/tags/<id>` | 删除标签 |

### 类别相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取所有类别 |
| POST | `/api/categories` | 添加类别 |
| DELETE | `/api/categories/<id>` | 删除类别 |

### 图库相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/gallery` | 获取所有图库项 |
| POST | `/api/gallery` | 上传新作品 |
| PUT | `/api/gallery/<id>` | 更新图库项 |
| DELETE | `/api/gallery/<id>` | 删除图库项 |

## 数据结构

### 标签数据 (tags.json)

```json
{
  "categories": [
    {
      "id": "cat_1234567890",
      "name_en": "Style",
      "name_zh": "风格",
      "color": "#6366f1"
    }
  ],
  "tags": [
    {
      "id": "tag_1234567890",
      "name_en": "anime",
      "name_zh": "动漫",
      "category_id": "cat_1234567890",
      "weight": 1.0,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### 图库数据 (gallery.json)

```json
{
  "items": [
    {
      "id": "item_1234567890",
      "image": "image_filename.png",
      "title": "作品标题",
      "positive_prompt": "正向提示词",
      "negative_prompt": "负向提示词",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

## 配置说明

应用使用以下默认配置（在 `app.py` 中定义）：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| UPLOAD_FOLDER | `static/uploads` | 图片上传目录 |
| ALLOWED_EXTENSIONS | `png, jpg, jpeg, gif, webp` | 允许的图片格式 |
| MAX_CONTENT_LENGTH | 16MB | 最大上传文件大小 |
| DEBUG | True | 调试模式 |
| PORT | 5000 | 服务端口 |

## 使用指南

### 添加标签

1. 点击"添加标签"按钮
2. 输入标签的中英文名称
3. 选择所属类别
4. 设置权重值
5. 点击保存

### 生成提示词

1. 在标签库中点击需要的标签
2. 选中的标签会出现在已选标签区域
3. 选择输出格式（SD/NAI/Plain）
4. 点击复制按钮获取提示词

### 上传作品

1. 切换到图库标签页
2. 拖拽图片到上传区域，或点击选择文件
3. 填写作品标题和使用的提示词
4. 点击上传保存

## 许可证

MIT License
