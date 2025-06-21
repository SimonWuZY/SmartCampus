import {
    HeartOutlined,
    ReadOutlined,
    RocketOutlined,
    SmileOutlined,
} from '@ant-design/icons';
import { Prompts } from '@ant-design/x';
import type { PromptsProps } from '@ant-design/x';
import { Card, Space } from 'antd';
import React from 'react';

const renderTitle = (icon: React.ReactElement, title: string) => (
    <Space align="start">
        {icon}
        <span>{title}</span>
    </Space>
);

const items: PromptsProps['items'] = [
    {
        key: '21',
        label: renderTitle(<ReadOutlined style={{ color: '#1890FF' }} />, '使用指南'),
        children: [
            {
                key: '1-1',
                icon: <HeartOutlined />,
                label: `如何开始`,
            },
            {
                key: '1-2',
                icon: <SmileOutlined />,
                label: `自定义助手：
                        请你为我定制高等数学\n
                        期末复习路线`,
            },
        ],
    },
    {
        key: '2',
        label: renderTitle(<RocketOutlined style={{ color: '#722ED1' }} />, '常用对话'),
        children: [
            {
                key: '2-1',
                icon: <RocketOutlined />,
                label: '为我解释一下软件开发流程',
            },
            {
                key: '2-2',
                icon: <RocketOutlined />,
                label: '如何使用 React 开发一个简单的应用',
            },
        ],
    },
];

const CenteredProps: React.FC<{ onPromptClick: (content: string) => void }> = ({ onPromptClick }) => {
    return (
        <div className="text-center mb-4 flex justify-center gap-4">
            {items.map((item) => (
                <Card key={item.key} style={{ borderRadius: 0, border: 0, width: '45%' }}>
                    <Prompts
                        title={item.label}
                        items={item.children}
                        wrap
                        styles={{
                            item: {
                                flex: 'none',
                                width: '100%',
                                backgroundImage: `linear-gradient(137deg, #e5f4ff 0%, #efe7ff 100%)`,
                                border: 0,
                            },
                            subItem: {
                                background: 'rgba(255,255,255,0.45)',
                                border: '1px solid #FFF',
                            },
                        }}
                        onItemClick={(info) => {
                            onPromptClick(info.data.label as string);
                        }}
                    />
                </Card>
            ))}
        </div>
    );
};

export default CenteredProps;