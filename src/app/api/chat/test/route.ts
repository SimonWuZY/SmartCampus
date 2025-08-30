import { NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { debugLog, isProduction } from '@/lib/env';

export async function GET() {
  const testQueries = [
    { query: "你好", expectedTopic: "general" },
    { query: "如何学习 React？", expectedTopic: "programming" },
    { query: "什么是人工智能？", expectedTopic: "ai" },
    { query: "帮我分析一下 Next.js 的优势", expectedTopic: "web" },
    { query: "Web 开发的最佳实践有哪些？", expectedTopic: "web" },
    { query: "JavaScript 和 TypeScript 的区别", expectedTopic: "programming" },
    { query: "机器学习算法有哪些？", expectedTopic: "ai" },
    { query: "如何优化网站性能？", expectedTopic: "web" }
  ];

  const testResults = [];
  const startTime = Date.now();
  
  debugLog('Starting comprehensive LLM service test', { 
    totalQueries: testQueries.length,
    environment: process.env.NODE_ENV 
  });

  for (const testCase of testQueries) {
    try {
      const result = await llmService.processQuery(testCase.query);
      
      testResults.push({
        query: testCase.query,
        expectedTopic: testCase.expectedTopic,
        actualTopic: result.topic,
        topicMatch: result.topic === testCase.expectedTopic,
        confidence: result.confidence,
        responseLength: result.reply.length,
        processingTime: result.processingTime,
        success: true
      });
      
      debugLog(`Test completed: "${testCase.query}"`, { 
        topic: result.topic,
        confidence: result.confidence,
        processingTime: result.processingTime
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      testResults.push({
        query: testCase.query,
        expectedTopic: testCase.expectedTopic,
        success: false,
        error: errorMessage
      });
      
      debugLog(`Test failed: "${testCase.query}"`, { error: errorMessage });
    }
  }

  const totalTime = Date.now() - startTime;
  const successfulTests = testResults.filter(r => r.success);
  const topicMatches = testResults.filter(r => r.success && r.topicMatch);
  
  const testSummary = {
    message: 'LLM Service Comprehensive Test Results',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: isProduction(),
      timestamp: new Date().toISOString()
    },
    performance: {
      totalTests: testQueries.length,
      successfulTests: successfulTests.length,
      failedTests: testQueries.length - successfulTests.length,
      successRate: `${((successfulTests.length / testQueries.length) * 100).toFixed(1)}%`,
      topicAccuracy: successfulTests.length > 0 ? `${((topicMatches.length / successfulTests.length) * 100).toFixed(1)}%` : '0%',
      averageConfidence: successfulTests.length > 0 ? (successfulTests.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulTests.length).toFixed(3) : 0,
      averageProcessingTime: successfulTests.length > 0 ? Math.round(successfulTests.reduce((sum, r) => sum + (r.processingTime || 0), 0) / successfulTests.length) : 0,
      totalTestTime: totalTime
    },
    results: testResults,
    timestamp: new Date().toISOString()
  };

  debugLog('Test summary completed', testSummary.performance);
  
  return NextResponse.json(testSummary);
}

// 单个查询测试
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    debugLog('Single query test started', { query: query.substring(0, 50) });

    const startTime = Date.now();
    const result = await llmService.processQuery(query);
    const totalTime = Date.now() - startTime;

    const testResult = {
      message: 'Single query test completed',
      query,
      result: {
        reply: result.reply,
        topic: result.topic,
        confidence: result.confidence,
        processingTime: result.processingTime
      },
      totalTime,
      timestamp: new Date().toISOString()
    };

    debugLog('Single query test completed', { 
      topic: result.topic,
      confidence: result.confidence,
      totalTime
    });

    return NextResponse.json(testResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    debugLog('Single query test failed', { error: errorMessage });
    
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}