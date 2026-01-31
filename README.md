# Notion2wechatMP - 全自动 Notion 到微信公众号发布工具

一套完整的 Notion 到微信公众号自动化发布解决方案，支持一键拉取、智能配图、封面生成和发布。

## 📦 包含组件

本项目包含三个核心 Skill，共同组成完整的发布工作流：

1. **notion-publisher** - 核心发布工具
2. **baoyu-article-illustrator** - 智能文章配图
3. **baoyu-cover-image** - 封面图生成

## ✨ 主要功能

- ✅ **Notion 内容拉取** - 通过 Notion API 获取文章内容
- 🎨 **智能配图** - 自动分析文章，在合适位置生成插图
- 🖼️ **封面生成** - 自动生成微信公众号标准封面（2.35:1）
- 📤 **一键发布** - 自动上传图片到公众号服务器并发布
- 🎭 **多风格支持** - 20+ 种插画风格，9 种配色方案，6 种渲染风格
- 🌐 **图片处理** - 自动下载远程图片，替换为公众号链接

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- npm
- Notion 账号和 API Token
- 微信公众号（已认证服务号）

### 2. 安装依赖

```bash
cd skills/notion-publisher
npm install
```

### 3. 配置

创建配置文件 `~/.config/notion-publisher/config.json`：

```json
{
  "notion_key": "ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "wechat_appid": "wxXXXXXXXXXXXXXX",
  "wechat_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "author": "你的名字"
}
```

**获取配置信息：**

- **Notion Key**: 登录 Notion，点击 Setting & Members → My connections → 开发者集成 →新建集成 → 复制 Internal Integration Token
- **WeChat AppID & Secret**: 登录微信公众平台 → 开发 → 基本配置 →开发者ID（AppID）和开发者密码（AppSecret）

### 4. 使用方法

#### 完整工作流（推荐）

```bash
# 步骤 A - 拉取 Notion 内容
node skills/notion-publisher/bin/fetch.js <NOTION_PAGE_ID> > notion-publish-workspace/draft.md

# 步骤 B - 智能配图（使用 baoyu-article-illustrator）
# 这个步骤会分析文章并自动生成插图
/baoyu-article-illustrator notion-publish-workspace/draft.md --style warm

# 步骤 C - 生成封面（使用 baoyu-cover-image）
/baoyu-cover-image notion-publish-workspace/draft.md --type conceptual --palette elegant

# 步骤 D - 发布到微信公众号
node skills/notion-publisher/bin/publish.js \
  notion-publish-workspace/draft.md \
  /Users/roy/clawd/cover-image/{topic}/cover.png \
  --digest "文章摘要"
```

#### 快速发布（从 Notion ID 直接发布）

```bash
node skills/notion-publisher/bin/publish.js <NOTION_PAGE_ID> cover.png --digest "摘要"
```

注意：这种方式不包含 AI 插图和封面生成功能。

## 📖 详细文档

### 1. notion-publisher - 核心发布工具

[完整文档](skills/notion-publisher/SKILL.md)

**功能：**
- 支持 Notion Page ID 和本地 Markdown 文件作为输入
- 自动处理图片下载和上传
- 应用 WeChat 优化的 CSS 样式
- 支持自定义摘要

**命令：**
```bash
# 从本地文件发布
node skills/notion-publisher/bin/publish.js ./draft.md cover.png --digest "摘要"

# 从 Notion ID 发布
node skills/notion-publisher/bin/publish.js <PAGE_ID> cover.png --digest "摘要"
```

**目录结构：**
```
skills/notion-publisher/
├── bin/
│   ├── publish.js      # 主发布脚本
│   ├── fetch.js        # Notion 内容拉取
│   ├── search.js       # Notion 搜索
│   ├── debug_blocks.js # 调试工具
│   └── debug_html.js   # 调试工具
├── package.json
└── SKILL.md
```

### 2. baoyu-article-illustrator - 智能文章配图

[完整文档](skills/baoyu-article-illustrator/SKILL.md)

**功能：**
- 分析文章结构，自动识别需要插图的位置
- 支持 20+ 种插画风格
- 自动生成插图提示词
- 插图自动插入到文章合适位置

**使用方法：**
```bash
# 自动选择风格
/baoyu-article-illustrator path/to/article.md

# 指定风格
/baoyu-article-illustrator path/to/article.md --style warm
/baoyu-article-illustrator path/to/article.md --style elegant
/baoyu-article-illustrator path/to/article.md --style playful
```

**支持的风格：**
- `notion` - 极简手绘线条风（默认）
- `elegant` - 精致专业风
- `warm` - 温暖亲切风
- `minimal` - 禅意极简风
- `playful` - 趣味创作风
- `nature` - 自然生态风
- `sketch` - 手绘笔记风
- `watercolor` - 水彩艺术风
- ... 还有更多风格

**输出目录：**
```
illustrations/{topic-slug}/
├── source-article.md  # 源文章
├── outline.md         # 插图方案
├── prompts/           # 提示词目录
│   ├── illustration-concept-a.md
│   ├── illustration-concept-b.md
│   └── ...
├── illustration-concept-a.png
├── illustration-concept-b.png
└── ...
```

### 3. baoyu-cover-image - 封面图生成

[完整文档](skills/baoyu-cover-image/SKILL.md)

**功能：**
- 5 维度定制系统（Type、Palette、Rendering、Text、Mood）
- 9 种配色方案
- 6 种渲染风格
- 默认 2.35:1（微信公众号标准）
- 支持 16:9 宽屏和 1:1 方形

**使用方法：**
```bash
# 自动选择所有维度
/baoyu-cover-image path/to/article.md

# 快速模式（跳过确认）
/baoyu-cover-image article.md --quick

# 指定维度
/baoyu-cover-image article.md --type conceptual --palette warm --rendering flat-vector
/baoyu-cover-image article.md --text title-subtitle --mood bold

# 无标题，纯视觉
/baoyu-cover-image article.md --no-title
```

**类型（Type）：**
- `hero` - 大视觉冲击，标题叠加
- `conceptual` - 概念可视化
- `typography` - 文字聚焦布局
- `metaphor` - 视觉隐喻
- `scene` - 氛围场景
- `minimal` - 极简构图

**配色方案（Palette）：**
- `warm` - 温暖友好
- `elegant` - 精致优雅
- `cool` - 技术专业
- `dark` - 电影感
- `earth` - 自然有机
- `vivid` - 充满活力
- `pastel` - 温柔梦幻
- `mono` - 简洁专注
- `retro` - 复古怀旧

**渲染风格（Rendering）：**
- `flat-vector` - 现代扁平矢量
- `hand-drawn` - 手绘有机插画
- `painterly` - 柔和水彩/绘画
- `digital` - 精致现代数字
- `pixel` - 复古 8-bit 像素
- `chalk` - 黑板粉笔画

## 🔄 常见工作流

### 工作流 1：从 Notion 到公众号（完整配图）

```bash
# 1. 拉取 Notion 内容
node skills/notion-publisher/bin/fetch.js <NOTION_PAGE_ID> > notion-publish-workspace/draft.md

# 2. 智能配图（自动分析生成插图）
/baoyu-article-illustrator notion-publish-workspace/draft.md --style elegant

# 3. 生成封面
/baoyu-cover-image notion-publish-workspace/draft.md --type conceptual --palette elegant

# 4. 发布到公众号（使用绝对路径）
node skills/notion-publisher/bin/publish.js \
  notion-publish-workspace/draft.md \
  /Users/roy/clawd/cover-image/{topic}/cover.png \
  --digest "文章摘要"
```

### 工作流 2：从本地文章到公众号

```bash
# 假设你已经有一个 draft.md 文件

# 1. 智能配图
/baoyu-article-illustrator draft.md --style warm

# 2. 生成封面
/baoyu-cover-image draft.md --type metaphor --palette earth

# 3. 发布
node skills/notion-publisher/bin/publish.js \
  draft.md \
  cover.png \
  --digest "摘要"
```

### 工作流 3：仅生成配图和封面（手动发布）

```bash
# 为现有文章生成配图
/baoyu-article-illustrator article.md --style playful

# 生成封面
/baoyu-cover-image article.md --quick

# 手动将生成的图片复制到公众号编辑器使用
```

## 📂 目录结构

```
Notion2wechatMP/
├── README.md                            # 本文件
├── skills/                              # Skills 目录
│   ├── notion-publisher/                # 核心发布工具
│   │   ├── bin/                         # 可执行脚本
│   │   ├── package.json
│   │   └── SKILL.md                     # 详细文档
│   ├── baoyu-article-illustrator/       # 智能文章配图
│   │   ├── prompts/                     # 提示词
│   │   ├── references/                  # 参考文档
│   │   └── SKILL.md                     # 详细文档
│   └── baoyu-cover-image/               # 封面图生成
│       ├── references/                  # 参考文档和配置
│       └── SKILL.md                     # 详细文档
├── notion-publish-workspace/            # 发布工作区（需手动创建）
│   └── draft.md                         # 草稿文章
├── illustrations/                       # 插图输出目录（自动创建）
└── cover-image/                         # 封面输出目录（自动创建）
```

## ⚙️ 配置说明

### notion-publisher 配置

配置文件位置：`~/.config/notion-publisher/config.json`

```json
{
  "notion_key": "ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "wechat_appid": "wxXXXXXXXXXXXXXX",
  "wechat_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "author": "你的名字"
}
```

### baoyu-cover-image 配置（可选）

配置文件位置：`.baoyu-skills/baoyu-cover-image/EXTEND.md` 或 `~/.baoyu-skills/baoyu-cover-image/EXTEND.md`

示例配置：
```yaml
# 默认维度
default_type: conceptual
default_palette: elegant
default_rendering: flat-vector

# 文本和情绪
default_text: title-only
default_mood: balanced

# 宽高比
default_aspect: 2.35:1

# 输出目录
default_output_dir: independent  # same-dir | imgs-subdir | independent

# 快速模式（跳过确认）
quick_mode: false

# 语言
language: auto  # auto | en | zh | ja

# 水印（可选）
watermark:
  enabled: true
  content: "@你的公众号名称"
  position: bottom-right
  opacity: 0.5
```

## 🎨 风格推荐

根据不同内容类型推荐合适风格：

| 内容类型 | 插图风格 | 封面风格 |
|---------|---------|---------|
| 知识分享/教程 | `notion` / `sketch-notes` | `conceptual` + `elegant` |
| 商业/战略分析 | `elegant` / `editorial` | `hero` + `cool` |
| 个人成长/情感 | `warm` / `watercolor` | `metaphor` + `warm` |
| 产品介绍/SaaS | `notion` / `flat-doodle` | `hero` + `flat-vector` |
| 生活/旅行/美食 | `watercolor` / `nature` | `scene` + `pastel` |
| 技术/开发者 | `blueprint` / `pixel-art` | `conceptual` + `cool` |
| 历史/传记 | `vintage` / `sketch` | `typography` + `retro` |

## 🔧 故障排查

### 问题：Notion API 调用失败

**解决方案：**
- 检查 `notion_key` 是否正确
- 确认 Notion 集成已添加到对应页面（页面 → ... → Connections → 你的集成）
- 检查网络连接

### 问题：微信 API 调用失败

**解决方案：**
- 检查 `wechat_appid` 和 `wechat_secret` 是否正确
- 确认 IP 地址已加入白名单（微信公众平台 → 开发 → 基本配置）
- 检查公众号类型（必须是已认证服务号才能发布）

### 问题：图片生成失败

**解决方案：**
- 确保已安装并配置图片生成依赖（Gemini/其他 AI 绘图服务）
- 检查 API 密钥是否有效
- 尝试更换风格或简化提示词

### 问题：图片上传失败

**解决方案：**
- 检查图片大小（微信限制：图片不超过 5MB）
- 确认图片格式（支持 jpg, png, gif）
- 检查网络连接

## 📝 注意事项

1. **图片路径**：发布时建议使用绝对路径（如 `/Users/roy/clawd/cover-image/{topic}/cover.png`）
2. **封面比例**：微信公众号封面必须是 2.35:1（如 2350×1000）
3. **图片数量**：一篇文章建议至少包含 3-5 张插图
4. **摘要限制**：摘要不超过 120 字符
5. **API 限制**：注意 Notion 和微信 API 的调用频率限制

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Notion API 文档](https://developers.notion.com/)
- [微信公众平台开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [Clawdbot 文档](https://docs.clawd.bot)

## 💡 使用技巧

1. **批量处理**：可以编写脚本批量处理多篇文章
2. **模板化**：为不同类型文章创建风格模板
3. **版本管理**：在 Notion 中使用版本管理功能
4. **预览测试**：使用微信草稿箱功能预览后再正式发布

---

有了这套工具，你可以轻松实现从 Notion 内容创作到微信公众号发布的全流程自动化！🚀
