import React from 'react';
import { Bubble } from '@ant-design/x';
import { UserOutlined } from '@ant-design/icons';
import { type GetProp } from 'antd';

const roles: GetProp<typeof Bubble.List, 'roles'> = {
    ai: {
        placement: 'start',
        avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
    },
    local: {
        placement: 'end',
        avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChatMessages: React.FC<{ messages: any[] }> = ({ messages }) => {
    return (
        <Bubble.List
            roles={roles}
            className="flex-1 overflow-y-auto p-4"
            items={messages.map(({ id, message, status }) => ({
                key: id,
                role: status === 'local' ? 'local' : 'ai',
                content: message,
            }))}
        />
    );
};

export default ChatMessages;