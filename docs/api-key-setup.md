# AI API Key 配置指南

## 🔑 获取 API Key 的步骤

### 1. OpenAI API Key (推荐)

#### 获取步骤：
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制生成的 API key

#### 配置：
```bash
# 在 .env.local 中添加
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
LLM_PROVIDER=openai
```

#### 费用说明：
- GPT-3.5-turbo: ~$0.002/1K tokens
- GPT-4: ~$0.03/1K tokens
- 新用户通常有免费额度

### 2. Anthropic (Claude) API Key

#### 获取步骤：
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册或登录账户
3. 进入 API Keys 页面
4. 创建新的 API key
5. 复制生成的 key

#### 配置：
```bash
# 在 .env.local 中添加
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307
LLM_PROVIDER=anthropic
```

#### 费用说明：
- Claude 3 Haiku: ~$0.25/1M tokens
- Claude 3 Sonnet: ~$3/1M tokens

## 🚀 快速开始

### 1. 选择提供商并配置 API Key

推荐从 OpenAI 开始，因为：
- 设置简单
- 文档完善
- 性价比高
- 响应速度快

### 2. 更新环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
# 基础配置
LLM_SERVICE_ENABLED=true
LLM_PROVIDER=openai

# OpenAI 配置
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# 可选：高级配置
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
DEBUG_LLM=true
```

### 3. 重启开发服务器

```bash
npm run dev
```

### 4. 测试服务

访问以下端点测试：
- 聊天页面：正常使用聊天功能
- 状态检查：`http://localhost:3000/api/chat/status`
- 运行测试：`http://localhost:3000/api/chat/test`

## 🔧 配置选项详解

### 模型选择

#### OpenAI 模型：
```bash
# 经济型（推荐开发）
OPENAI_MODEL=gpt-3.5-turbo

# 高性能型
OPENAI_MODEL=gpt-4
OPENAI_MODEL=gpt-4-turbo
```

#### Anthropic 模型：
```bash
# 快速经济型
ANTHROPIC_MODEL=claude-3-haiku-20240307

# 平衡型
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# 高性能型
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### 参数调优

```bash
# 最大令牌数（控制回答长度）
LLM_MAX_TOKENS=2000

# 温度（控制创造性，0-1）
LLM_TEMPERATURE=0.7  # 平衡
LLM_TEMPERATURE=0.3  # 更保守
LLM_TEMPERATURE=0.9  # 更创造性

# 打字机效果速度（毫秒）
LLM_TYPING_SPEED=30
```

## 🛡️ 安全最佳实践

### 1. API Key 保护
- ✅ 使用 `.env.local` 存储 API key
- ✅ 确保 `.env.local` 在 `.gitignore` 中
- ❌ 不要在代码中硬编码 API key
- ❌ 不要提交 API key 到版本控制

### 2. 使用限制
```bash
# 设置合理的令牌限制
LLM_MAX_TOKENS=2000  # 避免过长回答

# 启用调试模式监控使用
DEBUG_LLM=true
```

### 3. 生产环境
- 在 Vercel 等平台的环境变量中配置 API key
- 定期轮换 API key
- 监控 API 使用量和费用

## 🔍 故障排除

### 常见问题

#### 1. "AI provider initialization failed"
- 检查 API key 是否正确设置
- 确认选择的提供商与 API key 匹配
- 查看控制台错误日志

#### 2. "API key is required"
- 确保环境变量名称正确
- 重启开发服务器
- 检查 `.env.local` 文件格式

#### 3. API 调用失败
- 检查网络连接
- 验证 API key 有效性
- 查看 API 配额是否用完

### 调试步骤

1. **检查配置**：
   ```bash
   # 访问状态页面
   http://localhost:3000/api/chat/status
   ```

2. **查看日志**：
   ```bash
   # 启用调试模式
   DEBUG_LLM=true
   ```

3. **测试 API**：
   ```bash
   # 运行测试套件
   http://localhost:3000/api/chat/test
   ```

## 💰 成本估算

### OpenAI GPT-3.5-turbo
- 输入：$0.0015 / 1K tokens
- 输出：$0.002 / 1K tokens
- 平均对话：~500 tokens = $0.001

### Anthropic Claude 3 Haiku
- 输入：$0.25 / 1M tokens
- 输出：$1.25 / 1M tokens
- 平均对话：~500 tokens = $0.0008

### 月度估算（1000次对话）
- OpenAI: ~$1-2
- Anthropic: ~$0.8-1.5

## 📞 获取帮助

如果遇到问题：
1. 查看本文档的故障排除部分
2. 检查 API 提供商的官方文档
3. 查看项目的 GitHub Issues
4. 联系开发团队

---

配置完成后，你的 LLM 服务将使用真实的 AI 模型提供智能回答！🎉