# 推送 Notion2wechatMP 到 GitHub

项目已经准备好了！以下是推送步骤：

## 方案 1：使用 Personal Access Token（推荐）⭐

### 1. 生成 Personal Access Token

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置：
   - **Note**: `Notion2wechatMP publishing`
   - **Expiration**: 选择有效期（建议 90 days）
   - **Scopes**: 勾选 `repo`（全选）
4. 点击 "Generate token"
5. **重要**：复制生成的 token（只显示一次！）

### 2. 推送代码

```bash
cd /Users/roy/clawd/Notion2wechatMP-tmp
git push https://ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/royrenwb/Notion2wechatMP.git main
```

替换 `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 为你的 token。

---

## 方案 2：配置 SSH（适合长期使用）

### 1. 生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# 按回车使用默认路径（~/.ssh/id_ed25519）
# 可以不设置密码，直接按回车
```

### 2. 添加到 SSH agent

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 3. 复制公钥到 GitHub

```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

然后：
1. 访问：https://github.com/settings/ssh/new
2. 粘贴公钥（点击 "Add SSH key"）
3. 输入密码确认

### 4. 更新远程地址并推送

```bash
cd /Users/roy/clawd/Notion2wechatMP-tmp
git remote set-url origin git@github.com:royrenwb/Notion2wechatMP.git
git push -u origin main
```

---

## 方案 3：使用 Git Credential Helper（存储 HTTPS 密码）

```bash
cd /Users/roy/clawd/Notion2wechatMP-tmp
git push -u origin main
```

系统会弹出认证窗口，输入：
- **Username**: 你的 GitHub 用户名
- **Password**: 创建的 Personal Access Token（不是 GitHub 密码）

---

## 推送成功后

访问你的仓库：https://github.com/royrenwb/Notion2wechatMP

## 如果遇到问题

### 错误：`Auth failed`
- 确保 token 有正确的权限（至少需要 `repo` 权限）
- 检查 token 没有过期

### 错误：`Repository not found`
- 确保仓库 URL 正确
- 检查你已经创建了仓库（或权限足够）

### SSH 相关问题
```bash
# 测试 SSH 连接
ssh -T git@github.com

# 看到 "Hi username! You've successfully authenticated" 表示成功
```
