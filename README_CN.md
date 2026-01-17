# AI Tag Manager 🎨

<div align="center">
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.0+-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**专为 AI 图像生成设计的强大 Web 标签管理与提示词生成系统**

[功能特性](#功能特性) • [演示](#演示) • [安装](#安装) • [使用说明](#使用说明) • [API文档](#api文档) • [参与贡献](#参与贡献)

[English Document](README.md)

---

## 📖 项目简介

AI Tag Manager 是一个专为 Stable Diffusion、NovelAI、Midjourney 等 AI 图像生成工具设计的综合性 Web 应用。集成了大模型服务，可以利用AI管理标签和生成用户需要的标签，比如用AI指令更换人物动作。

<img src="doc/main.jpg" alt="main" style="zoom:80%;" />

### 🎯 核心亮点

- **🏷️ 标签库管理** - 按自定义颜色分类组织标签
- **✨ AI 智能功能** - 智能标签优化、Flux 提示词转换、AI 许愿机
- **📝 多格式支持** - SD、NAI 和纯文本提示词格式
- **🖼️ 画廊系统** - 存储和追踪生成的图像及其提示词
- **🔌 多 LLM 支持** - 集成 OpenAI、Claude、Gemini 和本地 Ollama
- **📱 响应式设计** - 完美支持桌面和移动设备

---

## ✨ 功能特性

### 1️⃣支持一键导入

导入多个tag，并用ai针对自己设定的类别进行分别识别：

<img src="doc/auto_detect.jpg" alt="auto_detect" style="zoom:25%;" />

### 2️⃣AI许愿机

基于已选中的tag进行动作调整或者风格编辑，输入指令后，ai自动从tag中挑选合适的标签。也可以直接根据用户质量挑选tag生成。

<img src="doc/ai2tag.jpg" alt="ai2tag" style="zoom:25%;" />

### 3️⃣批量编辑

移除所有动作相关的词汇，或者让AI分析哪些词汇与选择类别相关，然后高亮相关词汇，用户自己决定删除哪些tag，可以及其方便的修改人物动作，衣服或背景等。

<img src="doc/prompt_editor.jpg" alt="prompt_editor" style="zoom:35%;" />



### 4️⃣一键优化

点击魔法按钮一键优化提示词顺序，当你挑选了一大堆提示词后，顺序混乱，可以让AI一件优化顺序，让模型更好的理解提示词。

### 5️⃣tag转化自然语言

当你使用的是flux类型的模型，依然可以使用tag组合，然后ai将tag组合成句子

<img src="doc/convert.jpg" alt="convert" style="zoom:30%;" />



### 6️⃣支持画廊

当你创建过一些优秀作品，可以上传到画廊，连同其提示词一起上传，方便后续复现或迭代修改

<img src="doc/uploads.jpg" alt="uploads" style="zoom:50%;" />

支持多种 AI 服务：
- **OpenAI (GPT)** - GPT-3.5、GPT-4、GPT-4-turbo
- **Anthropic (Claude)** - Claude 3 Haiku、Sonnet、Opus
- **Google (Gemini)** - Gemini Pro、Gemini 1.5 Pro
- **Ollama (本地)** - 无需 API 密钥即可在本地运行模型

---

## 🚀 快速开始

### 环境要求
- Python 3.7 或更高版本
- pip 包管理器

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/AI2IMG_Tag.git
cd AI2IMG_Tag
```

2. **安装依赖**
```bash
pip install flask
```

3. **运行应用**
```bash
python app.py
```

4. **访问应用**

在浏览器中打开：`http://localhost:5000`

### 首次运行

首次启动时，应用会自动创建：
- `data/` 目录及示例数据
- `data/tags.json` 包含示例标签和分类
- `data/gallery.json` 用于画廊项目
- `data/config.json` 用于 LLM 配置
- `static/uploads/` 用于图片上传

**无需手动设置！**

---

## 📚 使用说明

### 管理标签

1. 点击 **"添加标签"** 按钮
2. 填写中英文名称
3. 选择分类
4. 设置权重值（可选）
5. 点击 **保存**

### 生成提示词

1. 从标签库中点击标签进行选择
2. 选中的标签会出现在右侧面板
3. 选择您喜欢的格式（SD/NAI/纯文本）
4. 使用 AI 功能：
   - **✨ AI 优化**：智能重新排序标签
   - **💬 Flux 转换**：转换为自然语言
   - **✏️ 编辑**：使用提示词编辑器修改
5. 点击 **复制** 获取您的提示词

### 使用 AI 许愿机

1. 点击头部的 **"✨ AI 许愿机"** 按钮
2. 选择模式：
   - **修改**：调整当前选中的标签
   - **生成**：从标签库创建新标签
3. 输入您的自然语言指令
4. 点击 **执行许愿**
5. AI 处理您的请求并自动更新标签

### 管理画廊

1. 导航到 **画廊** 页面
2. 拖放或点击上传图片
3. 填写标题和使用的提示词
4. 点击 **上传** 保存
5. 根据需要查看、编辑或删除项目

---

## 🔧 配置

### LLM 设置

1. 点击 **⚙️ 设置** 按钮
2. 启用 **"大模型服务"** 开关
3. 选择您的服务提供商：
   - OpenAI (GPT)
   - Anthropic (Claude)
   - Google (Gemini)
   - Ollama (本地)
4. 配置设置：
   - API 密钥（Ollama 不需要）
   - Base URL（自动填充）
   - 模型名称
5. 点击 **测试连接** 进行验证
6. 点击 **保存设置**

### 使用本地 Ollama

完全离线的 LLM 功能：

1. 从 [https://ollama.ai](https://ollama.ai) 安装 Ollama
2. 下载模型：
```bash
ollama pull llama2
# 或其他模型
ollama pull mistral
ollama pull qwen
```
3. 在应用中配置：
   - 服务提供商：**Ollama (本地)**
   - Base URL：`http://localhost:11434`
   - 模型：`llama2`（或您下载的模型）
   - API 密钥：留空

---

## 📡 API 文档

### 标签相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/tags` | 获取所有标签和分类 |
| POST | `/api/tags` | 创建新标签 |
| PUT | `/api/tags/<id>` | 更新标签 |
| DELETE | `/api/tags/<id>` | 删除标签 |
| POST | `/api/tags/parse` | 使用 AI 解析和翻译标签 |
| POST | `/api/tags/optimize-order` | AI 优化标签顺序 |
| POST | `/api/tags/convert-to-flux` | 转换为 Flux 自然语言 |
| POST | `/api/tags/wish` | AI 许愿机端点 |

### 分类相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取所有分类 |
| POST | `/api/categories` | 创建新分类 |
| PUT | `/api/categories/<id>` | 更新分类 |
| DELETE | `/api/categories/<id>` | 删除分类 |

### 画廊相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/gallery` | 获取所有画廊项目 |
| POST | `/api/gallery` | 上传新作品 |
| PUT | `/api/gallery/<id>` | 更新画廊项目 |
| DELETE | `/api/gallery/<id>` | 删除画廊项目 |

### 配置相关

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/config` | 获取当前 LLM 配置 |
| PUT | `/api/config` | 更新 LLM 配置 |
| POST | `/api/config/test-llm` | 测试 LLM 连接 |

---

## 🏗️ 项目结构

```
AI2IMG_Tag/
├── app.py                  # Flask 后端应用
├── data/
│   ├── tags.json          # 标签和分类数据库
│   ├── gallery.json       # 画廊数据库
│   └── config.json        # LLM 配置
├── static/
│   ├── script.js          # 主页面 JavaScript
│   ├── gallery.js         # 画廊页面 JavaScript
│   ├── style.css          # 样式文件
│   └── uploads/           # 用户上传的图片
├── templates/
│   ├── index.html         # 主页面（标签管理）
│   └── gallery.html       # 画廊页面
├── README.md              # 英文文档
└── README_CN.md           # 中文文档
```

---

## 🛠️ 技术栈

### 后端
- **Flask** - Python Web 框架
- **Python 3.7+** - 核心编程语言
- **JSON** - 基于文件的数据存储

### 前端
- **HTML5** - 语义化标记
- **CSS3** - 现代样式与动画
- **Vanilla JavaScript** - 无框架依赖

---

## 📊 数据结构

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

### 画廊数据 (gallery.json)
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

---

## 🤝 参与贡献

欢迎贡献！请随时提交 Pull Request。对于重大更改，请先开一个 issue 讨论您想要更改的内容。

### 开发设置

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/AmazingFeature`
3. 提交您的更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 开启一个 Pull Request

---

## 📝 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**用 ❤️ 为 AI 艺术家打造**

⭐ 如果这个项目对您有帮助，请在 GitHub 上给我们一个星星！

</div>
