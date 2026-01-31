# 🚀 一键推送指南

## 快速推送（需要 GitHub Token）

### 1. 获取 Token

1. 访问：https://github.com/settings/tokens/new
2. 勾选：**repo**（所有选项都勾选）
3. 过期时间：90 days
4. 点击 "Generate token"
5. **复制生成的 token**（只显示一次！）

Token 格式如：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. 推送代码

```bash
cd /Users/roy/clawd/Notion2wechatMP-tmp
./push.sh <你的_TOKEN>
```

示例：
```bash
./push.sh ghp_abc123xyz789
```

### 3. 完成！

推送成功后访问：https://github.com/royrenwb/Notion2wechatMP

---

## 其他推送方式

### 方式 1：手动执行 Git 命令

```bash
cd /Users/roy/clawd/Notion2wechatMP-tmp
git push -u origin main
```

系统会弹出认证窗口，输入：
- Username: 你的 GitHub 用户名
- Password: 你的 Personal Access Token

### 方式 2：配置 GitHub CLI

```bash
brew install gh                 # 安装
gh auth login                   # 登录
gh repo sync                    # 同步
```

---

## 项目说明

Notion2wechatMP 是一套完整的 Notion 到微信公众号自动化发布解决方案：

| 功能 | 说明 |
|------|------|
| **notion-publisher** | 核心发布工具，处理 Notion 内容拉取和公众号发布 |
| **baoyu-article-illustrator** | 智能文章配图，20+ 种插画风格 |
| **baoyu-cover-image** | 封面图生成，5D 定制系统（类型×配色×渲染×文本×情绪） |

## 获取帮助

- README.md: 完整使用文档
- PUSH_GUIDE.md: 详细推送指南
- skills/*/SKILL.md: 各组件详细文档
