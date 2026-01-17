from flask import Flask, render_template, jsonify, request, send_from_directory
import json
import os
import uuid
import re
from datetime import datetime
from werkzeug.utils import secure_filename
import urllib.request
import urllib.parse

app = Flask(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'tags.json')
GALLERY_FILE = os.path.join(os.path.dirname(__file__), 'data', 'gallery.json')
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'data', 'config.json')
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

def init_app_data():
    """Initialize application data directories and default files"""
    # Create data directory if not exists
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"✓ Created data directory: {data_dir}")

    # Create uploads directory if not exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
        print(f"✓ Created uploads directory: {UPLOAD_FOLDER}")

    # Create default tags.json with sample data if not exists
    if not os.path.exists(DATA_FILE):
        default_data = {
            "categories": [
                {
                    "id": "20240101000001",
                    "name_en": "Quality",
                    "name_zh": "质量",
                    "color": "#667eea"
                },
                {
                    "id": "20240101000002",
                    "name_en": "Style",
                    "name_zh": "风格",
                    "color": "#48bb78"
                },
                {
                    "id": "20240101000003",
                    "name_en": "Character",
                    "name_zh": "角色",
                    "color": "#f56565"
                },
                {
                    "id": "20240101000004",
                    "name_en": "Scene",
                    "name_zh": "场景",
                    "color": "#ed8936"
                }
            ],
            "tags": [
                {
                    "id": "20240101000101",
                    "name_en": "masterpiece",
                    "name_zh": "杰作",
                    "category_id": "20240101000001",
                    "weight": 1.0,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "20240101000102",
                    "name_en": "best quality",
                    "name_zh": "最佳质量",
                    "category_id": "20240101000001",
                    "weight": 1.0,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "20240101000103",
                    "name_en": "anime",
                    "name_zh": "动漫",
                    "category_id": "20240101000002",
                    "weight": 1.0,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "20240101000104",
                    "name_en": "1girl",
                    "name_zh": "一个女孩",
                    "category_id": "20240101000003",
                    "weight": 1.0,
                    "created_at": datetime.now().isoformat()
                },
                {
                    "id": "20240101000105",
                    "name_en": "outdoors",
                    "name_zh": "户外",
                    "category_id": "20240101000004",
                    "weight": 1.0,
                    "created_at": datetime.now().isoformat()
                }
            ]
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)
        print(f"✓ Created default tags.json with {len(default_data['categories'])} categories and {len(default_data['tags'])} sample tags")

    # Create default gallery.json if not exists
    if not os.path.exists(GALLERY_FILE):
        default_gallery = {
            "items": []
        }
        with open(GALLERY_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_gallery, f, ensure_ascii=False, indent=2)
        print(f"✓ Created default gallery.json")

    # Create default config.json if not exists
    if not os.path.exists(CONFIG_FILE):
        default_config = {
            "llm": {
                "enabled": False,
                "provider": "openai",
                "api_key": "",
                "base_url": "https://api.openai.com/v1",
                "model": "gpt-3.5-turbo"
            }
        }
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, ensure_ascii=False, indent=2)
        print(f"✓ Created default config.json")

    print("✓ Application initialization complete!")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_data():
    """Load tags data from JSON file"""
    if not os.path.exists(DATA_FILE):
        return {"categories": [], "tags": []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    """Save tags data to JSON file"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_gallery():
    """Load gallery data from JSON file"""
    if not os.path.exists(GALLERY_FILE):
        return {"items": []}
    with open(GALLERY_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_gallery(data):
    """Save gallery data to JSON file"""
    with open(GALLERY_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_config():
    """Load configuration from JSON file"""
    default_config = {
        "llm": {
            "enabled": False,
            "provider": "openai",  # openai, claude, gemini, ollama
            "api_key": "",
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-3.5-turbo"
        }
    }
    if not os.path.exists(CONFIG_FILE):
        return default_config
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
            # Merge with default config to ensure all keys exist
            for key in default_config:
                if key not in config:
                    config[key] = default_config[key]
            # Ensure provider field exists
            if 'provider' not in config.get('llm', {}):
                config['llm']['provider'] = 'openai'
            return config
    except:
        return default_config

def save_config(config):
    """Save configuration to JSON file"""
    os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def is_llm_configured():
    """Check if LLM service is properly configured"""
    config = load_config()
    llm = config.get('llm', {})
    return llm.get('enabled', False) and llm.get('api_key', '').strip() != ''

def call_llm_api(messages, config=None):
    """Call LLM API - supports OpenAI, Claude, Gemini, and Ollama"""
    if config is None:
        config = load_config()

    llm = config.get('llm', {})
    api_key = llm.get('api_key', '')
    base_url = llm.get('base_url', 'https://api.openai.com/v1').rstrip('/')
    model = llm.get('model', 'gpt-3.5-turbo')
    provider = llm.get('provider', 'openai')

    # Debug info
    print("=" * 50)
    print("LLM API Request Debug Info:")
    print(f"Provider: {provider}")
    print(f"Model: {model}")
    print(f"Base URL: {base_url}")

    # 根据提供商设置请求格式
    if provider == 'claude':
        # Claude API 格式
        url = f"{base_url}/messages"

        # 转换消息格式：提取 system 消息
        system_content = ""
        claude_messages = []
        for msg in messages:
            if msg['role'] == 'system':
                system_content = msg['content']
            else:
                claude_messages.append(msg)

        payload = {
            "model": model,
            "max_tokens": 4000,
            "messages": claude_messages
        }
        if system_content:
            payload["system"] = system_content

        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01"
        }
        response_parser = lambda r: r['content'][0]['text']

    elif provider == 'gemini':
        # Gemini API 格式
        # URL: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}
        url = f"{base_url}/models/{model}:generateContent"
        if api_key:
            url += f"?key={api_key}"

        # 转换消息格式为 Gemini 格式
        contents = []
        system_instruction = None

        for msg in messages:
            if msg['role'] == 'system':
                system_instruction = msg['content']
            else:
                role = 'user' if msg['role'] == 'user' else 'model'
                contents.append({
                    "role": role,
                    "parts": [{"text": msg['content']}]
                })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 4000
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        headers = {
            "Content-Type": "application/json"
        }
        response_parser = lambda r: r['candidates'][0]['content']['parts'][0]['text']

    elif provider == 'ollama':
        # Ollama API 格式
        url = f"{base_url}/api/chat"

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "num_predict": 4000
            }
        }

        headers = {
            "Content-Type": "application/json"
        }
        # Ollama 不需要 API key，但如果提供了就添加
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        response_parser = lambda r: r['message']['content']

    else:
        # OpenAI API 格式 (默认)
        url = f"{base_url}/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 4000
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        response_parser = lambda r: r['choices'][0]['message']['content']

    # 打印请求信息（隐藏敏感信息）
    safe_headers = {k: ('***' if 'key' in k.lower() or 'authorization' in k.lower() else v) for k, v in headers.items()}
    print(f"URL: {url}")
    print(f"Headers: {json.dumps(safe_headers, indent=2)}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    print("=" * 50)

    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')

        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = response_parser(result)
            return {"success": True, "content": content}
    except urllib.error.HTTPError as e:
        error_body = ""
        try:
            error_body = e.read().decode('utf-8')
            print(f"LLM API Error Response Body: {error_body}")
            error_json = json.loads(error_body)

            # 尝试提取错误信息（不同提供商格式不同）
            if provider == 'gemini':
                error_msg = error_json.get('error', {}).get('message', error_body)
            elif provider == 'claude':
                error_msg = error_json.get('error', {}).get('message', error_body)
            else:
                error_msg = error_json.get('error', {}).get('message', error_body)
        except:
            error_msg = error_body or str(e)
        print(f"LLM API HTTP error {e.code}: {error_msg}")
        return {"success": False, "error": f"HTTP {e.code}: {error_msg}"}
    except urllib.error.URLError as e:
        print(f"LLM API URL error: {e.reason}")
        return {"success": False, "error": f"连接失败: {e.reason}"}
    except Exception as e:
        print(f"LLM API error: {e}")
        return {"success": False, "error": str(e)}

def llm_translate_and_match(tags_list, categories):
    """Use LLM to translate tags and match categories"""
    if not categories:
        return None

    # Build category info for the prompt
    category_info = []
    for cat in categories:
        category_info.append(f"- ID: {cat['id']}, English: {cat['name_en']}, Chinese: {cat['name_zh']}")

    categories_text = "\n".join(category_info)
    tags_text = "\n".join([f"- {tag}" for tag in tags_list])

    prompt = f"""You are an AI art tag translation and categorization expert. Translate the following AI art/image generation tags and match them to the most appropriate category.

Available Categories:
{categories_text}

Tags to process:
{tags_text}

For each tag, provide:
1. English name (normalized, lowercase)
2. Chinese translation
3. Best matching category ID

Return ONLY a JSON array with this exact format, no other text:
[
  {{"original": "original tag", "name_en": "english name", "name_zh": "中文翻译", "category_id": "category_id_here"}},
  ...
]

Important:
- Keep tag meanings accurate for AI image generation context
- Match categories based on the tag's semantic meaning
- If a tag is already in Chinese, provide good English translation
- If a tag is already in English, provide good Chinese translation
- Use the first/most suitable category if multiple could apply"""

    messages = [
        {"role": "system", "content": "You are a helpful assistant that specializes in AI art generation terminology. You always respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    response = call_llm_api(messages)

    if response and response.get('success'):
        try:
            # Try to extract JSON from the response
            # Handle cases where LLM might add markdown code blocks
            json_str = response['content'].strip()
            if json_str.startswith('```'):
                # Remove markdown code blocks
                lines = json_str.split('\n')
                json_lines = []
                in_code = False
                for line in lines:
                    if line.startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code or not line.startswith('```'):
                        json_lines.append(line)
                json_str = '\n'.join(json_lines)

            result = json.loads(json_str)
            return result
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"Response was: {response.get('content', '')}")
            return None
    elif response:
        print(f"LLM API call failed: {response.get('error', 'Unknown error')}")

    return None

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/gallery')
def gallery():
    """Render gallery page"""
    return render_template('gallery.html')

@app.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all tags"""
    data = load_data()
    return jsonify(data)

@app.route('/api/tags', methods=['POST'])
def add_tag():
    """Add a new tag"""
    data = load_data()
    new_tag = request.json
    new_tag['id'] = datetime.now().strftime('%Y%m%d%H%M%S%f')
    new_tag['created_at'] = datetime.now().isoformat()
    data['tags'].append(new_tag)
    save_data(data)
    return jsonify({"success": True, "tag": new_tag})

@app.route('/api/tags/<tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    """Delete a tag by ID"""
    data = load_data()
    data['tags'] = [t for t in data['tags'] if t['id'] != tag_id]
    save_data(data)
    return jsonify({"success": True})

@app.route('/api/tags/<tag_id>', methods=['PUT'])
def update_tag(tag_id):
    """Update a tag by ID"""
    data = load_data()
    updated_tag = request.json
    for i, tag in enumerate(data['tags']):
        if tag['id'] == tag_id:
            updated_tag['id'] = tag_id
            updated_tag['created_at'] = tag.get('created_at', datetime.now().isoformat())
            data['tags'][i] = updated_tag
            break
    save_data(data)
    return jsonify({"success": True, "tag": updated_tag})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    data = load_data()
    return jsonify(data.get('categories', []))

@app.route('/api/categories', methods=['POST'])
def add_category():
    """Add a new category"""
    data = load_data()
    new_category = request.json
    new_category['id'] = datetime.now().strftime('%Y%m%d%H%M%S%f')
    if 'categories' not in data:
        data['categories'] = []
    data['categories'].append(new_category)
    save_data(data)
    return jsonify({"success": True, "category": new_category})

@app.route('/api/categories/<cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    """Delete a category by ID"""
    data = load_data()
    data['categories'] = [c for c in data.get('categories', []) if c['id'] != cat_id]
    save_data(data)
    return jsonify({"success": True})


@app.route('/api/categories/<cat_id>', methods=['PUT'])
def update_category(cat_id):
    """Update a category by ID"""
    data = load_data()
    updated_category = request.json

    for i, cat in enumerate(data.get('categories', [])):
        if cat['id'] == cat_id:
            updated_category['id'] = cat_id
            data['categories'][i] = updated_category
            save_data(data)
            return jsonify({"success": True, "category": updated_category})

    return jsonify({"success": False, "error": "Category not found"}), 404

# Gallery API endpoints
@app.route('/api/gallery', methods=['GET'])
def get_gallery():
    """Get all gallery items"""
    gallery = load_gallery()
    return jsonify(gallery)

@app.route('/api/gallery', methods=['POST'])
def add_gallery_item():
    """Add a new gallery item with image upload"""
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Create gallery item
        gallery = load_gallery()
        new_item = {
            "id": datetime.now().strftime('%Y%m%d%H%M%S%f'),
            "image": filename,
            "title": request.form.get('title', ''),
            "positive_prompt": request.form.get('positive_prompt', ''),
            "negative_prompt": request.form.get('negative_prompt', ''),
            "created_at": datetime.now().isoformat()
        }
        gallery['items'].insert(0, new_item)  # Add to beginning
        save_gallery(gallery)

        return jsonify({"success": True, "item": new_item})

    return jsonify({"success": False, "error": "Invalid file type"}), 400

@app.route('/api/gallery/<item_id>', methods=['PUT'])
def update_gallery_item(item_id):
    """Update a gallery item"""
    gallery = load_gallery()

    for i, item in enumerate(gallery['items']):
        if item['id'] == item_id:
            # Handle image update if new image is uploaded
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename and allowed_file(file.filename):
                    # Delete old image
                    old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], item['image'])
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)

                    # Save new image
                    ext = file.filename.rsplit('.', 1)[1].lower()
                    filename = f"{uuid.uuid4().hex}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(filepath)
                    item['image'] = filename

            # Update text fields
            item['title'] = request.form.get('title', item.get('title', ''))
            item['positive_prompt'] = request.form.get('positive_prompt', item.get('positive_prompt', ''))
            item['negative_prompt'] = request.form.get('negative_prompt', item.get('negative_prompt', ''))
            item['updated_at'] = datetime.now().isoformat()

            gallery['items'][i] = item
            save_gallery(gallery)
            return jsonify({"success": True, "item": item})

    return jsonify({"success": False, "error": "Item not found"}), 404

@app.route('/api/gallery/<item_id>', methods=['DELETE'])
def delete_gallery_item(item_id):
    """Delete a gallery item and its image"""
    gallery = load_gallery()

    for item in gallery['items']:
        if item['id'] == item_id:
            # Delete image file
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], item['image'])
            if os.path.exists(image_path):
                os.remove(image_path)
            break

    gallery['items'] = [item for item in gallery['items'] if item['id'] != item_id]
    save_gallery(gallery)
    return jsonify({"success": True})


# ============ Batch Import Functions ============

# Common AI art tag translations dictionary
TAG_TRANSLATIONS = {
    # Quality tags
    'masterpiece': '杰作', 'best quality': '最佳质量', 'high quality': '高质量',
    'ultra detailed': '超详细', 'absurdres': '超高分辨率', 'highres': '高分辨率',
    '8k': '8K', '4k': '4K', 'wallpaper': '壁纸', 'official art': '官方艺术',
    'extremely detailed': '极其详细', 'beautiful detailed': '精美详细',

    # Style tags
    'anime': '动漫', 'realistic': '写实', 'photorealistic': '照片级写实',
    'illustration': '插画', 'painting': '绘画', 'digital art': '数字艺术',
    'concept art': '概念艺术', 'watercolor': '水彩', 'oil painting': '油画',
    'sketch': '素描', 'lineart': '线稿', 'manga': '漫画',

    # Character tags
    '1girl': '一个女孩', '1boy': '一个男孩', 'solo': '单人',
    'multiple girls': '多个女孩', 'multiple boys': '多个男孩',
    'couple': '情侣', 'group': '群体',

    # Body/Face tags
    'long hair': '长发', 'short hair': '短发', 'blonde hair': '金发',
    'black hair': '黑发', 'blue eyes': '蓝眼睛', 'red eyes': '红眼睛',
    'smile': '微笑', 'blush': '脸红', 'looking at viewer': '看向观众',
    'closed eyes': '闭眼', 'open mouth': '张嘴',

    # Clothing tags
    'dress': '连衣裙', 'uniform': '制服', 'swimsuit': '泳装',
    'school uniform': '校服', 'maid': '女仆装', 'armor': '盔甲',
    'kimono': '和服', 'hoodie': '卫衣', 'jacket': '夹克',

    # Scene/Background tags
    'outdoors': '户外', 'indoors': '室内', 'nature': '自然',
    'city': '城市', 'forest': '森林', 'beach': '海滩',
    'sky': '天空', 'night': '夜晚', 'sunset': '日落',
    'mountains': '山脉', 'ocean': '海洋', 'garden': '花园',

    # Lighting tags
    'dramatic lighting': '戏剧性光照', 'soft lighting': '柔和光照',
    'backlighting': '逆光', 'sunlight': '阳光', 'moonlight': '月光',
    'cinematic lighting': '电影光照', 'rim lighting': '轮廓光',

    # Composition tags
    'full body': '全身', 'upper body': '上半身', 'portrait': '肖像',
    'close-up': '特写', 'from above': '俯视', 'from below': '仰视',
    'side view': '侧视', 'dynamic angle': '动态角度',

    # Action/Pose tags
    'standing': '站立', 'sitting': '坐着', 'lying': '躺着',
    'walking': '走路', 'running': '奔跑', 'jumping': '跳跃',
    'dancing': '跳舞', 'fighting': '战斗', 'flying': '飞行',

    # Negative tags
    'lowres': '低分辨率', 'bad anatomy': '解剖错误', 'bad hands': '手部错误',
    'text': '文字', 'error': '错误', 'missing fingers': '手指缺失',
    'extra digit': '多余手指', 'fewer digits': '手指缺少', 'cropped': '裁剪',
    'worst quality': '最差质量', 'low quality': '低质量', 'blurry': '模糊',
    'watermark': '水印', 'signature': '签名',
}

# Category keywords for matching
CATEGORY_KEYWORDS = {
    'quality': ['quality', 'detailed', 'resolution', 'res', '8k', '4k', 'hd', 'masterpiece', 'wallpaper'],
    'style': ['style', 'anime', 'realistic', 'art', 'painting', 'illustration', 'sketch', 'manga', 'watercolor', 'oil'],
    'character': ['girl', 'boy', 'man', 'woman', 'person', 'solo', 'couple', 'group', 'people'],
    'face': ['face', 'eyes', 'mouth', 'smile', 'expression', 'blush', 'looking', 'gaze'],
    'hair': ['hair', 'bangs', 'ponytail', 'braid', 'twintails', 'bun'],
    'dress': ['dress', 'uniform', 'clothes', 'outfit', 'wear', 'shirt', 'pants', 'skirt', 'suit', 'armor', 'swimsuit', 'bikini', 'maid', 'kimono'],
    'scene': ['scene', 'background', 'outdoors', 'indoors', 'nature', 'city', 'forest', 'beach', 'sky', 'room', 'street'],
    'lighting': ['lighting', 'light', 'shadow', 'glow', 'sun', 'moon', 'dark', 'bright'],
    'composition': ['body', 'portrait', 'view', 'angle', 'close', 'shot', 'full', 'upper', 'lower'],
    'action': ['standing', 'sitting', 'lying', 'walking', 'running', 'jumping', 'pose', 'action', 'dancing', 'fighting'],
    'view': ['view', 'pov', 'perspective', 'from above', 'from below', 'from side'],
    'negative': ['bad', 'worst', 'low', 'error', 'wrong', 'ugly', 'deformed', 'blurry', 'missing', 'extra', 'watermark'],
}


def translate_text(text, source_lang='auto', target_lang='zh'):
    """Translate text using Google Translate free API"""
    try:
        # Check if we have a cached translation
        text_lower = text.lower().strip()
        if target_lang == 'zh' and text_lower in TAG_TRANSLATIONS:
            return TAG_TRANSLATIONS[text_lower]

        # Use Google Translate free API
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            'client': 'gtx',
            'sl': source_lang,
            'tl': target_lang,
            'dt': 't',
            'q': text
        }

        full_url = f"{url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})

        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))
            if result and result[0]:
                translated = ''.join([item[0] for item in result[0] if item[0]])
                return translated
    except Exception as e:
        print(f"Translation error: {e}")

    return text  # Return original if translation fails


def detect_language(text):
    """Simple language detection - check if text contains Chinese characters"""
    for char in text:
        if '\u4e00' <= char <= '\u9fff':
            return 'zh'
    return 'en'


def parse_tags_input(text):
    """Parse input text into individual tags, supporting various formats"""
    # Remove common prompt syntax: (tag:weight), {tag}, [tag], <lora:xxx>
    text = re.sub(r'<[^>]+>', '', text)  # Remove <lora:xxx> etc.
    text = re.sub(r'\([^)]*:[\d.]+\)', lambda m: m.group(0)[1:m.group(0).rfind(':')], text)  # (tag:1.2) -> tag
    text = re.sub(r'[{}\[\]]', '', text)  # Remove {} and []
    text = re.sub(r':[\d.]+', '', text)  # Remove remaining :weight

    # Split by comma, newline, or semicolon
    tags = re.split(r'[,;\n]+', text)

    # Clean and filter tags
    result = []
    for tag in tags:
        tag = tag.strip()
        # Skip empty or very short tags
        if len(tag) >= 2:
            result.append(tag)

    return result


def match_category(tag_text, categories):
    """Match a tag to the most appropriate category based on keywords"""
    tag_lower = tag_text.lower()

    # First, try to match by category name keywords
    for cat in categories:
        cat_name_lower = cat.get('name_en', '').lower()
        cat_name_zh = cat.get('name_zh', '')

        # Check CATEGORY_KEYWORDS for this category
        for keyword_cat, keywords in CATEGORY_KEYWORDS.items():
            if keyword_cat.lower() in cat_name_lower or keyword_cat in cat_name_zh:
                for keyword in keywords:
                    if keyword in tag_lower:
                        return cat['id']

    # If no match found, return the first category as default, or None
    return categories[0]['id'] if categories else None


@app.route('/api/tags/parse', methods=['POST'])
def parse_tags():
    """Parse tags input and return parsed results with translations and category matches"""
    data = request.json
    input_text = data.get('text', '')

    if not input_text.strip():
        return jsonify({"success": False, "error": "No input text provided"}), 400

    # Load current data for category matching
    db_data = load_data()
    categories = db_data.get('categories', [])
    existing_tags = db_data.get('tags', [])

    # Parse input text into individual tags
    parsed_tags = parse_tags_input(input_text)

    results = []
    use_llm = is_llm_configured()

    # Try LLM-based translation and matching first
    if use_llm and categories:
        print("Using LLM for translation and category matching...")
        llm_results = llm_translate_and_match(parsed_tags, categories)

        if llm_results:
            # Process LLM results
            for llm_tag in llm_results:
                name_en = llm_tag.get('name_en', llm_tag.get('original', ''))
                name_zh = llm_tag.get('name_zh', '')
                category_id = llm_tag.get('category_id')

                # Validate category_id exists
                category = next((c for c in categories if c['id'] == category_id), None)
                if not category and categories:
                    # Fallback to first category if LLM returned invalid ID
                    category = categories[0]
                    category_id = category['id']

                # Check if tag already exists
                existing = None
                for et in existing_tags:
                    if et['name_en'].lower() == name_en.lower() or et['name_zh'] == name_zh:
                        existing = et
                        break

                results.append({
                    'original': llm_tag.get('original', name_en),
                    'name_en': name_en,
                    'name_zh': name_zh,
                    'category_id': category_id,
                    'category_name': f"{category['name_zh']} / {category['name_en']}" if category else None,
                    'category_color': category['color'] if category else '#6366f1',
                    'exists': existing is not None,
                    'existing_id': existing['id'] if existing else None,
                    'weight': 1.0,
                    'translation_source': 'llm'
                })

            return jsonify({
                "success": True,
                "tags": results,
                "total": len(results),
                "new_count": len([r for r in results if not r['exists']]),
                "method": "llm"
            })
        else:
            print("LLM failed, falling back to traditional translation...")

    # Fallback: Traditional translation and keyword matching
    print("Using traditional translation and keyword matching...")
    for tag_text in parsed_tags:
        # Detect language
        lang = detect_language(tag_text)

        # Translate if needed
        if lang == 'zh':
            name_zh = tag_text
            name_en = translate_text(tag_text, 'zh', 'en')
        else:
            name_en = tag_text
            name_zh = translate_text(tag_text, 'en', 'zh')

        # Check if tag already exists
        existing = None
        for et in existing_tags:
            if et['name_en'].lower() == name_en.lower() or et['name_zh'] == name_zh:
                existing = et
                break

        # Match category
        category_id = match_category(name_en, categories) if categories else None
        category = next((c for c in categories if c['id'] == category_id), None)

        results.append({
            'original': tag_text,
            'name_en': name_en,
            'name_zh': name_zh,
            'category_id': category_id,
            'category_name': f"{category['name_zh']} / {category['name_en']}" if category else None,
            'category_color': category['color'] if category else '#6366f1',
            'exists': existing is not None,
            'existing_id': existing['id'] if existing else None,
            'weight': 1.0,
            'translation_source': 'traditional'
        })

    return jsonify({
        "success": True,
        "tags": results,
        "total": len(results),
        "new_count": len([r for r in results if not r['exists']]),
        "method": "traditional"
    })


@app.route('/api/tags/batch', methods=['POST'])
def batch_import_tags():
    """Batch import multiple tags"""
    data = request.json
    tags_to_import = data.get('tags', [])

    if not tags_to_import:
        return jsonify({"success": False, "error": "No tags to import"}), 400

    db_data = load_data()
    imported = []
    skipped = []

    for tag_data in tags_to_import:
        # Skip if marked as existing
        if tag_data.get('exists') and not tag_data.get('force_import'):
            skipped.append(tag_data['name_en'])
            continue

        # Skip if no category assigned
        if not tag_data.get('category_id'):
            skipped.append(tag_data['name_en'])
            continue

        new_tag = {
            'id': datetime.now().strftime('%Y%m%d%H%M%S%f'),
            'name_en': tag_data['name_en'],
            'name_zh': tag_data['name_zh'],
            'category_id': tag_data['category_id'],
            'weight': tag_data.get('weight', 1.0),
            'created_at': datetime.now().isoformat()
        }

        db_data['tags'].append(new_tag)
        imported.append(new_tag)

    save_data(db_data)

    return jsonify({
        "success": True,
        "imported": len(imported),
        "skipped": len(skipped),
        "tags": imported
    })


# ============ Configuration API ============

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration (with API key masked)"""
    config = load_config()
    # Mask API key for security
    if config.get('llm', {}).get('api_key'):
        api_key = config['llm']['api_key']
        if len(api_key) > 8:
            config['llm']['api_key_masked'] = api_key[:4] + '*' * (len(api_key) - 8) + api_key[-4:]
        else:
            config['llm']['api_key_masked'] = '****'
        config['llm']['has_api_key'] = True
    else:
        config['llm']['api_key_masked'] = ''
        config['llm']['has_api_key'] = False
    # Don't send actual API key
    config['llm'].pop('api_key', None)
    return jsonify(config)

@app.route('/api/config', methods=['PUT'])
def update_config():
    """Update configuration"""
    data = request.json
    config = load_config()

    if 'llm' in data:
        llm_config = data['llm']
        if 'enabled' in llm_config:
            config['llm']['enabled'] = llm_config['enabled']
        if 'provider' in llm_config:
            config['llm']['provider'] = llm_config['provider']
        if 'api_key' in llm_config and llm_config['api_key']:
            # Only update API key if a new one is provided
            config['llm']['api_key'] = llm_config['api_key']
        if 'base_url' in llm_config:
            config['llm']['base_url'] = llm_config['base_url'].rstrip('/')
        if 'model' in llm_config:
            config['llm']['model'] = llm_config['model']

    save_config(config)
    return jsonify({"success": True})

@app.route('/api/config/test-llm', methods=['POST'])
def test_llm_connection():
    """Test LLM API connection"""
    data = request.json
    test_config = {
        'llm': {
            'provider': data.get('provider', 'openai'),
            'api_key': data.get('api_key', ''),
            'base_url': data.get('base_url', 'https://api.openai.com/v1'),
            'model': data.get('model', 'gpt-3.5-turbo')
        }
    }

    # If no API key provided, use saved one
    if not test_config['llm']['api_key']:
        saved_config = load_config()
        test_config['llm']['api_key'] = saved_config.get('llm', {}).get('api_key', '')

    # Ollama 不强制要求 API key
    provider = test_config['llm']['provider']
    if provider != 'ollama' and not test_config['llm']['api_key']:
        return jsonify({"success": False, "error": "未配置 API 密钥"}), 400

    # Simple test message
    messages = [
        {"role": "user", "content": "Say 'OK' if you can receive this message."}
    ]

    result = call_llm_api(messages, test_config)

    if result and result.get('success'):
        content = result.get('content', '')[:100]
        return jsonify({"success": True, "message": "连接成功", "response": content})
    else:
        error_msg = result.get('error', '连接失败') if result else '连接失败'
        return jsonify({"success": False, "error": error_msg}), 400


@app.route('/api/tags/analyze-relevance', methods=['POST'])
def analyze_tag_relevance():
    """Analyze relevance of tags to a specific category using LLM"""
    if not is_llm_configured():
        return jsonify({"success": False, "error": "LLM 服务未配置，请先在设置中配置"}), 400

    data = request.json
    tags_list = data.get('tags', [])
    category = data.get('category', {})

    if not tags_list or not category:
        return jsonify({"success": False, "error": "缺少必要参数"}), 400

    # Build the prompt
    tags_text = "\n".join([f"- {tag['name_en']} ({tag.get('name_zh', '')})" for tag in tags_list])

    prompt = f"""You are an AI art tag categorization expert. Analyze which tags are related to the category "{category.get('name_en', '')} / {category.get('name_zh', '')}".

Category description: Tags that belong to or are strongly associated with {category.get('name_en', '')} category in AI art generation.

Tags to analyze:
{tags_text}

Return ONLY a JSON array containing the English names of tags that are related to this category. Be selective - only include tags that clearly belong to or are strongly associated with this category.

For example, if the category is "Hair", return tags about hair color, hairstyle, hair length, etc.
If the category is "Scene/Background", return tags about locations, environments, weather, time of day, etc.

Return format (JSON array only, no other text):
["tag1", "tag2", "tag3"]

If no tags are related to this category, return an empty array: []"""

    messages = [
        {"role": "system", "content": "You are a helpful assistant that specializes in AI art generation terminology. You always respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    result = call_llm_api(messages)

    if result and result.get('success'):
        try:
            # Parse the response
            json_str = result['content'].strip()
            # Handle markdown code blocks
            if json_str.startswith('```'):
                lines = json_str.split('\n')
                json_lines = []
                in_code = False
                for line in lines:
                    if line.startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code or not line.startswith('```'):
                        json_lines.append(line)
                json_str = '\n'.join(json_lines)

            relevant_tags = json.loads(json_str)

            if not isinstance(relevant_tags, list):
                relevant_tags = []

            return jsonify({
                "success": True,
                "relevant_tags": relevant_tags,
                "category": category.get('name_en', '')
            })
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response: {e}")
            print(f"Response was: {result.get('content', '')}")
            return jsonify({"success": False, "error": "解析 AI 响应失败"}), 500
    else:
        error_msg = result.get('error', '分析失败') if result else '分析失败'
        return jsonify({"success": False, "error": error_msg}), 500


@app.route('/api/tags/optimize-order', methods=['POST'])
def optimize_tag_order():
    """Optimize the order of tags using LLM for better prompt quality"""
    if not is_llm_configured():
        return jsonify({"success": False, "error": "LLM 服务未配置，请先在设置中配置"}), 400

    data = request.json
    tags_list = data.get('tags', [])

    if not tags_list:
        return jsonify({"success": False, "error": "没有标签需要优化"}), 400

    # Build the prompt
    tags_text = "\n".join([f"- {tag['name_en']} ({tag.get('name_zh', '')})" for tag in tags_list])

    prompt = f"""You are an expert in AI image generation prompt optimization. Your task is to reorder the following tags to create the most effective prompt.

Current tags (in current order):
{tags_text}

Please reorder these tags following best practices for AI image generation:
1. Quality tags first (masterpiece, best quality, etc.)
2. Style/art style tags second (anime, realistic, oil painting, etc.)
3. Subject/character tags third (1girl, portrait, etc.)
4. Scene/environment tags fourth (outdoors, forest, beach, etc.)
5. Details and attributes last (long hair, blue eyes, specific clothing, etc.)

Return ONLY a JSON array containing the English names of tags in the optimized order:
["tag1", "tag2", "tag3", ...]

Return all tags in the optimized order. Do not add or remove any tags, only reorder them.
Response must be valid JSON array only, no explanation or other text."""

    messages = [
        {"role": "system", "content": "You are a helpful assistant that specializes in AI art generation prompt optimization. You always respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    result = call_llm_api(messages)

    if result and result.get('success'):
        try:
            # Parse the response
            json_str = result['content'].strip()
            # Handle markdown code blocks
            if json_str.startswith('```'):
                lines = json_str.split('\n')
                json_lines = []
                in_code = False
                for line in lines:
                    if line.startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code or not line.startswith('```'):
                        json_lines.append(line)
                json_str = '\n'.join(json_lines)

            optimized_tags = json.loads(json_str)

            if not isinstance(optimized_tags, list):
                return jsonify({"success": False, "error": "AI 返回格式错误"}), 500

            return jsonify({
                "success": True,
                "optimized_tags": optimized_tags
            })
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response: {e}")
            print(f"Response was: {result.get('content', '')}")
            return jsonify({"success": False, "error": "解析 AI 响应失败"}), 500
    else:
        error_msg = result.get('error', '优化失败') if result else '优化失败'
        return jsonify({"success": False, "error": error_msg}), 500


@app.route('/api/tags/convert-to-flux', methods=['POST'])
def convert_to_flux_prompt():
    """Convert selected tags to natural language suitable for Flux model"""
    if not is_llm_configured():
        return jsonify({"success": False, "error": "LLM 服务未配置，请先在设置中配置"}), 400

    data = request.json
    tags_list = data.get('tags', [])

    if not tags_list:
        return jsonify({"success": False, "error": "没有标签需要转换"}), 400

    # Build the prompt
    tags_text = "\n".join([f"- {tag['name_en']} ({tag.get('name_zh', '')})" for tag in tags_list])

    prompt = f"""You are an expert in converting AI art generation tags into natural language prompts optimized for Flux models.

Flux models work best with natural, descriptive language rather than comma-separated tags. Your task is to convert the following tags into a flowing, natural language description.

Tags to convert:
{tags_text}

Guidelines for Flux prompt conversion:
1. Write in natural, flowing sentences (not comma-separated keywords)
2. Maintain all important details from the tags
3. Use descriptive language and vivid imagery
4. Combine related concepts into coherent phrases
5. Start with the main subject, then add style, setting, and details
6. Keep the prompt concise but descriptive (2-4 sentences ideal)
7. Use artistic and evocative language

Example conversions:
- Tags: "masterpiece, 1girl, long hair, blue eyes, outdoors, sunset"
  → Flux: "A masterpiece portrait of a beautiful girl with long flowing hair and striking blue eyes, standing outdoors during a breathtaking sunset."

- Tags: "anime style, cyberpunk, city, neon lights, rain, night"
  → Flux: "An anime-style cyberpunk cityscape at night, with vibrant neon lights reflecting off rain-soaked streets in a futuristic metropolis."

Return ONLY the natural language prompt as plain text. Do not include any JSON formatting, quotes, or explanations."""

    messages = [
        {"role": "system", "content": "You are an expert at converting AI art tags into natural, flowing descriptions optimized for Flux image generation models. Always respond with plain text only."},
        {"role": "user", "content": prompt}
    ]

    result = call_llm_api(messages)

    if result and result.get('success'):
        natural_prompt = result['content'].strip()
        # Remove any quotes if LLM added them
        if natural_prompt.startswith('"') and natural_prompt.endswith('"'):
            natural_prompt = natural_prompt[1:-1]
        if natural_prompt.startswith("'") and natural_prompt.endswith("'"):
            natural_prompt = natural_prompt[1:-1]

        return jsonify({
            "success": True,
            "natural_prompt": natural_prompt
        })
    else:
        error_msg = result.get('error', '转换失败') if result else '转换失败'
        return jsonify({"success": False, "error": error_msg}), 500


@app.route('/api/tags/wish', methods=['POST'])
def wish_tags():
    """Wishing Machine - Modify or generate tags based on user instructions"""
    if not is_llm_configured():
        return jsonify({"success": False, "error": "LLM 服务未配置，请先在设置中配置"}), 400

    data = request.json
    mode = data.get('mode', 'modify')  # 'modify' or 'generate'
    user_instruction = data.get('instruction', '')
    current_tags = data.get('tags', [])

    if not user_instruction.strip():
        return jsonify({"success": False, "error": "请输入您的指令"}), 400

    # Load available tags from library for reference
    db_data = load_data()
    library_tags = db_data.get('tags', [])
    categories = db_data.get('categories', [])

    if mode == 'modify':
        # Modify existing selected tags based on user instruction
        if not current_tags:
            return jsonify({"success": False, "error": "没有已选标签可以修改"}), 400

        tags_text = ", ".join([tag['name_en'] for tag in current_tags])

        prompt = f"""You are an AI art prompt expert. The user has selected these tags:
{tags_text}

The user wants to modify them with this instruction:
"{user_instruction}"

Please modify the tag list according to the user's instruction. You can:
- Add new tags
- Remove existing tags
- Replace tags with alternatives
- Adjust the tag list to better match the instruction

Return ONLY a JSON array of tag names (English) that represents the modified tag list:
["tag1", "tag2", "tag3", ...]

Keep tags relevant to AI image generation. Be creative but practical."""

    else:  # mode == 'generate'
        # Generate new tags based on user instruction and tag library
        library_examples = [tag['name_en'] for tag in library_tags[:30]]  # Sample of available tags
        examples_text = ", ".join(library_examples)

        prompt = f"""You are an AI art prompt expert. The user wants to generate a set of tags with this instruction:
"{user_instruction}"

Here are some example tags from the available tag library for reference:
{examples_text}

Please generate a comprehensive set of tags (10-20 tags) that match the user's instruction. Include:
- Quality tags (masterpiece, best quality, etc.)
- Style tags
- Subject/character tags
- Scene/background tags
- Detail tags

Return ONLY a JSON array of tag names (English):
["tag1", "tag2", "tag3", ...]

Make sure tags are relevant to AI image generation and follow common prompt conventions."""

    messages = [
        {"role": "system", "content": "You are an expert in AI art generation prompts. You always respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]

    result = call_llm_api(messages)

    if result and result.get('success'):
        try:
            # Parse the response
            json_str = result['content'].strip()
            # Handle markdown code blocks
            if json_str.startswith('```'):
                lines = json_str.split('\n')
                json_lines = []
                in_code = False
                for line in lines:
                    if line.startswith('```'):
                        in_code = not in_code
                        continue
                    if in_code or not line.startswith('```'):
                        json_lines.append(line)
                json_str = '\n'.join(json_lines)

            tag_names = json.loads(json_str)

            if not isinstance(tag_names, list):
                return jsonify({"success": False, "error": "AI 返回格式错误"}), 500

            # Match tags with library and prepare response
            result_tags = []
            for tag_name in tag_names:
                # Find matching tag in library
                matching_tag = None
                for lib_tag in library_tags:
                    if lib_tag['name_en'].lower() == tag_name.lower():
                        matching_tag = lib_tag
                        break

                if matching_tag:
                    result_tags.append(matching_tag)
                else:
                    # Create a temporary tag structure for new tags
                    result_tags.append({
                        'id': f'temp_{tag_name}',
                        'name_en': tag_name,
                        'name_zh': tag_name,
                        'category_id': categories[0]['id'] if categories else None,
                        'weight': 1.0,
                        'is_new': True
                    })

            return jsonify({
                "success": True,
                "tags": result_tags,
                "mode": mode
            })
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response: {e}")
            print(f"Response was: {result.get('content', '')}")
            return jsonify({"success": False, "error": "解析 AI 响应失败"}), 500
    else:
        error_msg = result.get('error', '处理失败') if result else '处理失败'
        return jsonify({"success": False, "error": error_msg}), 500


if __name__ == '__main__':
    # Initialize app data on startup
    print("\n" + "="*60)
    print("AI Tag Manager - Initializing...")
    print("="*60)
    init_app_data()
    print("="*60)
    print("Starting server on http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(debug=True, port=5000)
