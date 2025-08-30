"use client";

import React, { useState, useEffect } from 'react';
import { Card, Button, Statistic, Row, Col, Table, Tag, Space, message } from 'antd';
import { ReloadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';

interface ServiceStatus {
  service: string;
  status: string;
  version: string;
  config: {
    enabled: boolean;
    maxTokens: number;
    temperature: number;
    typingSpeed: number;
    debug: boolean;
  };
  statistics: {
    totalRequests: number;
    conversationCount: number;
    topicDistribution: Record<string, number>;
    averageConfidence: number;
    lastActivity: string | null;
  };
  uptime: number;
  timestamp: string;
}

interface TestResult {
  message: string;
  performance: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    successRate: string;
    topicAccuracy: string;
    averageConfidence: string;
    averageProcessingTime: number;
    totalTestTime: number;
  };
  results: Array<{
    query: string;
    expectedTopic: string;
    actualTopic: string;
    topicMatch: boolean;
    confidence: number;
    responseLength: number;
    processingTime: number;
    success: boolean;
  }>;
}

export default function LLMAdminPanel() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      message.error('获取服务状态失败');
      console.error('Status fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setTestLoading(true);
    try {
      const response = await fetch('/api/chat/test');
      const data = await response.json();
      setTestResults(data);
      message.success('测试完成');
    } catch (error) {
      message.error('运行测试失败');
      console.error('Test error:', error);
    } finally {
      setTestLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', { method: 'DELETE' });
      if (response.ok) {
        message.success('对话历史已清除');
        fetchStatus(); // 刷新状态
      } else {
        message.error('清除历史失败');
      }
    } catch (error) {
      message.error('清除历史失败');
      console.error('Clear history error:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const topicColumns = [
    {
      title: '话题',
      dataIndex: 'topic',
      key: 'topic',
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  const testColumns = [
    {
      title: '查询',
      dataIndex: 'query',
      key: 'query',
      width: 200,
    },
    {
      title: '预期话题',
      dataIndex: 'expectedTopic',
      key: 'expectedTopic',
      render: (topic: string) => <Tag color="blue">{topic}</Tag>,
    },
    {
      title: '实际话题',
      dataIndex: 'actualTopic',
      key: 'actualTopic',
      render: (topic: string) => <Tag color="green">{topic}</Tag>,
    },
    {
      title: '话题匹配',
      dataIndex: 'topicMatch',
      key: 'topicMatch',
      render: (match: boolean) => (
        <Tag color={match ? 'success' : 'error'}>
          {match ? '✓' : '✗'}
        </Tag>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => `${(confidence * 100).toFixed(1)}%`,
    },
    {
      title: '处理时间',
      dataIndex: 'processingTime',
      key: 'processingTime',
      render: (time: number) => `${time}ms`,
    },
  ];

  const topicData = status?.statistics.topicDistribution 
    ? Object.entries(status.statistics.topicDistribution).map(([topic, count]) => ({
        key: topic,
        topic,
        count,
      }))
    : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">LLM 服务管理面板</h1>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchStatus} 
            loading={loading}
          >
            刷新状态
          </Button>
          <Button 
            icon={<PlayCircleOutlined />} 
            onClick={runTests} 
            loading={testLoading}
            type="primary"
          >
            运行测试
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            onClick={clearHistory} 
            danger
          >
            清除历史
          </Button>
        </Space>
      </div>

      {/* 服务状态 */}
      <Card title="服务状态" loading={loading}>
        {status && (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="服务状态" 
                  value={status.status} 
                  valueStyle={{ color: status.status === 'online' ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title="版本" value={status.version} />
              </Col>
              <Col span={6}>
                <Statistic title="运行时间" value={`${Math.floor(status.uptime / 3600)}h`} />
              </Col>
              <Col span={6}>
                <Statistic title="总请求数" value={status.statistics.totalRequests} />
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic title="对话数量" value={status.statistics.conversationCount} />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="平均置信度" 
                  value={status.statistics.averageConfidence} 
                  precision={2}
                  suffix="%" 
                />
              </Col>
              <Col span={6}>
                <Statistic title="最大令牌数" value={status.config.maxTokens} />
              </Col>
              <Col span={6}>
                <Statistic title="温度" value={status.config.temperature} precision={1} />
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* 话题分布 */}
      {status && topicData.length > 0 && (
        <Card title="话题分布">
          <Table 
            dataSource={topicData} 
            columns={topicColumns} 
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* 测试结果 */}
      {testResults && (
        <Card title="测试结果">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Statistic title="总测试数" value={testResults.performance.totalTests} />
            </Col>
            <Col span={4}>
              <Statistic title="成功率" value={testResults.performance.successRate} />
            </Col>
            <Col span={4}>
              <Statistic title="话题准确率" value={testResults.performance.topicAccuracy} />
            </Col>
            <Col span={4}>
              <Statistic title="平均置信度" value={testResults.performance.averageConfidence} />
            </Col>
            <Col span={4}>
              <Statistic title="平均处理时间" value={`${testResults.performance.averageProcessingTime}ms`} />
            </Col>
            <Col span={4}>
              <Statistic title="总测试时间" value={`${testResults.performance.totalTestTime}ms`} />
            </Col>
          </Row>
          
          <Table 
            dataSource={testResults.results} 
            columns={testColumns} 
            pagination={{ pageSize: 10 }}
            size="small"
            rowKey="query"
          />
        </Card>
      )}
    </div>
  );
}