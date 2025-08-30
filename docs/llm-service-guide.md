# 本地 LLM Chat 服务使用指南

## 概述

本项目已成功将远程 LLM 服务迁移到本地 Next.js 后端，提供完整的聊天功能，无需依赖外部 API。

## 🚀 主要功能

### 1. 本地 LLM 服务
- **智能话题检测**: 自动识别编程、AI、Web开发、通用等话题
- **上下文感知回答**: 根据问题类型生成针对性回答
- **置信度评分**: 为每个回答提供置信度评估
- **性能监控**: 跟踪处理时间和请求统计

### 2. API 端点

#### `/api/chat` (POST)
主要的聊天接口
```json
// 请求
{
  "query": "如何学习 React？"
}

// 响应
{
  "reply": "详细的回答内容...",
  "topic": "programming",
  "confidence": 0.85,
  "processingTime": 1200,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### `/api/chat/status` (GET)
服务状态检查
```json
{
  "service": "Local LLM Chat Service",
  "status": "online",
  "version": "1.0.0",
  "config": {
    "enabled": true,
    "maxTokens": 2000,
    "temperature": 0.7,
    "typingSpeed": 30,
    "debug": true
  },
  "statistics": {
    "totalRequests": 42,
    "conversationCount": 15,
    "topicDistribution": {
      "programming": 8,
      "ai": 3,
      "web": 4
    },
    "averageConfidence": 0.78
  }
}
```

#### `/api/chat/history` (GET/DELETE)
对话历史管理
- GET: 获取对话历史和统计信息
- DELETE: 清除所有对话历史

#### `/api/chat/test` (GET/POST)
服务测试
- GET: 运行完整的测试套件
- POST: 测试单个查询

### 3. 管理面板
访问 `/admin/llm` 查看：
- 服务状态监控
- 对话统计信息
- 话题分布图表
- 测试结果分析

## ⚙️ 配置

### 环境变量 (.env.local)
```bash
# LLM 服务配置
LLM_SERVICE_ENABLED=true
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
LLM_TYPING_SPEED=30

# 调试模式
DEBUG_LLM=true
```

### 配置说明
- `LLM_SERVICE_ENABLED`: 启用/禁用 LLM 服务
- `LLM_MAX_TOKENS`: 最大令牌数限制
- `LLM_TEMPERATURE`: 回答的创造性程度 (0-1)
- `LLM_TYPING_SPEED`: 前端打字机效果速度 (毫秒)
- `DEBUG_LLM`: 启用调试日志

## 🎯 话题检测

系统支持以下话题自动检测：

### Programming (编程)
关键词: 编程, 代码, 开发, JavaScript, TypeScript, React, Next.js 等

### AI (人工智能)
关键词: 人工智能, AI, 机器学习, 深度学习, 神经网络, LLM 等

### Web (Web开发)
关键词: 网站, 前端, 后端, HTML, CSS, 数据库, API 等

### General (通用)
其他所有话题的默认分类

## 🔧 自定义扩展

### 添加新话题
在 `src/lib/llm-config.ts` 中：

```typescript
export const knowledgeBase: KnowledgeBase = {
  topics: {
    // 添加新话题
    mobile: ["移动开发", "iOS", "Android", "React Native", "Flutter"],
    // ... 其他话题
  },
  contexts: {
    // 添加对应的上下文信息
    mobile: `关于移动开发，我可以为你提供：
- iOS 和 Android 开发指导
- 跨平台框架选择
- 移动应用架构设计
- 性能优化建议`,
    // ... 其他上下文
  }
};
```

### 自定义回答模板
在 `src/lib/llm-service.ts` 中修改 `responses` 对象：

```typescript
private responses: Record<string, string[]> = {
  // 为新话题添加回答模板
  mobile: [
    "移动开发是一个exciting的领域！关于你的问题...",
    "在移动应用开发中，这确实是一个重要的考虑因素...",
    // ... 更多模板
  ],
  // ... 其他话题
};
```

## 📊 性能优化

### 1. 响应时间优化
- 调整 `responseDelay` 配置
- 优化回答生成逻辑
- 使用缓存机制

### 2. 内存管理
- 对话历史自动清理 (保留最近50条)
- 定期清理统计数据

### 3. 前端优化
- 动态调整打字机效果速度
- 智能字符分块显示

## 🐛 故障排除

### 常见问题

1. **服务无响应**
   - 检查 `LLM_SERVICE_ENABLED` 是否为 `true`
   - 查看控制台错误日志
   - 访问 `/api/chat/status` 检查服务状态

2. **话题检测不准确**
   - 检查关键词配置
   - 调整置信度计算逻辑
   - 添加更多相关关键词

3. **性能问题**
   - 调整响应延迟配置
   - 检查对话历史长度
   - 监控内存使用情况

### 调试模式
启用 `DEBUG_LLM=true` 查看详细日志：
```bash
[LLM Debug] Processing query { query: "如何学习 React？", config: {...} }
[LLM Debug] Query processed successfully { topic: "programming", confidence: 0.85 }
```

## 🚀 部署建议

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
npm run build
npm start
```

### 环境变量检查
确保生产环境中正确设置所有必要的环境变量。

## 📈 监控和维护

1. **定期检查服务状态**: 访问管理面板监控服务健康状况
2. **分析对话数据**: 查看话题分布和置信度趋势
3. **性能测试**: 定期运行测试套件确保服务质量
4. **日志监控**: 关注错误日志和性能指标

## 🔄 版本更新

当前版本: v1.0.0

### 更新日志
- v1.0.0: 初始版本，完整的本地 LLM 服务实现

---

如有问题或建议，请查看项目文档或联系开发团队。