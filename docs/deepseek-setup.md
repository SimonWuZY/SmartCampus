# DeepSeek API 配置指南

## 🚀 为什么选择 DeepSeek？

DeepSeek 是一个优秀的 AI 提供商，具有以下优势：

- **💰 超高性价比**: 比 OpenAI 便宜 10-20 倍
- **🚀 优秀性能**: 接近 GPT-3.5 的质量
- **🔧 兼容性好**: 使用 OpenAI 兼容的 API
- **🌏 国内友好**: 访问速度快，支持中文

## 🔑 获取 DeepSeek API Key

### 步骤 1: 注册账户
1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 点击右上角"登录/注册"
3. 使用邮箱或手机号注册账户

### 步骤 2: 获取 API Key
1. 登录后访问 [API Keys 页面](https://platform.deepseek.com/api_keys)
2. 点击"创建 API Key"
3. 输入 Key 名称（如：my-chat-app）
4. 复制生成的 API Key

### 步骤 3: 配置项目
在你的 `.env.local` 文件中添加：

```bash
# DeepSeek 配置
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
DEEPSEEK_MODEL=deepseek-chat

# 其他配置
LLM_SERVICE_ENABLED=true
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
DEBUG_LLM=true
```

## 🎯 模型选择

DeepSeek 提供多个模型：

### deepseek-chat (推荐)
- **用途**: 通用对话
- **特点**: 平衡性能和成本
- **价格**: 极低

### deepseek-coder
- **用途**: 代码生成和编程
- **特点**: 专门优化代码任务
- **适合**: 编程相关问题

### 配置示例
```bash
# 通用聊天（推荐）
DEEPSEEK_MODEL=deepseek-chat

# 编程专用
DEEPSEEK_MODEL=deepseek-coder
```

## 💰 价格对比

| 提供商 | 模型 | 输入价格 | 输出价格 | 相对成本 |
|--------|------|----------|----------|----------|
| **DeepSeek** | deepseek-chat | $0.14/1M tokens | $0.28/1M tokens | **1x** |
| OpenAI | gpt-3.5-turbo | $1.50/1M tokens | $2.00/1M tokens | **10x** |
| OpenAI | gpt-4 | $30.00/1M tokens | $60.00/1M tokens | **200x** |

### 月度成本估算（1000次对话）
- **DeepSeek**: ~$0.10-0.20
- **OpenAI GPT-3.5**: ~$1-2
- **OpenAI GPT-4**: ~$20-40

## 🔧 完整配置示例

### .env.local 文件
```bash
# 基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# LLM 服务配置
LLM_SERVICE_ENABLED=true
LLM_PROVIDER=deepseek
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
LLM_TYPING_SPEED=30

# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-actual-deepseek-key-here
DEEPSEEK_MODEL=deepseek-chat

# 调试模式
NODE_ENV=development
DEBUG_LLM=true

# 其他服务配置（保持不变）
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CONVEX_DEPLOY_KEY=your_convex_key
# ... 其他配置
```

## 🧪 测试配置

### 1. 检查配置
访问：`http://localhost:3000/api/chat/check-api`

应该看到：
```json
{
  "checks": {
    "provider": "deepseek",
    "currentProvider": {
      "name": "deepseek",
      "hasKey": true,
      "model": "deepseek-chat"
    }
  },
  "initialization": {
    "success": true
  }
}
```

### 2. 查看服务状态
访问：`http://localhost:3000/api/chat/status`

### 3. 运行测试
访问：`http://localhost:3000/api/chat/test`

### 4. 测试聊天
直接使用你的聊天页面，现在应该使用 DeepSeek AI！

## 🔍 故障排除

### 常见问题

#### 1. "DeepSeek API error: 401"
- 检查 API Key 是否正确
- 确认 API Key 没有过期
- 验证账户是否有余额

#### 2. "AI provider initialization failed"
- 检查 `LLM_PROVIDER=deepseek`
- 确认 `DEEPSEEK_API_KEY` 已设置
- 重启开发服务器

#### 3. 响应速度慢
- DeepSeek 服务器可能在海外，稍有延迟是正常的
- 可以调整 `LLM_MAX_TOKENS` 减少响应长度

### 调试步骤

1. **启用调试模式**：
   ```bash
   DEBUG_LLM=true
   ```

2. **查看控制台日志**：
   ```bash
   [LLM Debug] DeepSeek API request { model: "deepseek-chat", messageCount: 2 }
   [LLM Debug] DeepSeek API response { usage: {...}, finishReason: "stop" }
   ```

3. **检查网络连接**：
   确保可以访问 `https://api.deepseek.com`

## 🎯 优化建议

### 1. 性能优化
```bash
# 较快的响应
LLM_MAX_TOKENS=1000
LLM_TEMPERATURE=0.5

# 更详细的回答
LLM_MAX_TOKENS=3000
LLM_TEMPERATURE=0.7
```

### 2. 成本控制
```bash
# 控制最大令牌数
LLM_MAX_TOKENS=1500

# 监控使用量
DEBUG_LLM=true
```

### 3. 质量提升
- 使用 `deepseek-chat` 进行通用对话
- 编程问题可以切换到 `deepseek-coder`
- 适当调整 temperature 参数

## 🔄 切换到其他提供商

如果需要切换回 OpenAI 或其他提供商：

```bash
# 切换到 OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_key

# 切换到 Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
```

## 📞 获取帮助

- **DeepSeek 官方文档**: [https://platform.deepseek.com/docs](https://platform.deepseek.com/docs)
- **API 参考**: [https://platform.deepseek.com/api-docs](https://platform.deepseek.com/api-docs)
- **社区支持**: DeepSeek 官方群组

---

配置完成后，你将拥有一个高性价比的 AI 聊天服务！🎉