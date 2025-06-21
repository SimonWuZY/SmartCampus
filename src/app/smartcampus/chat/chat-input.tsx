import React from 'react';
import { Sender } from '@ant-design/x';

const ChatInput: React.FC<{
    content: string;
    isCentered: boolean;
    agent: { isRequesting: () => boolean };
    onRequest: (content: string) => void;
    setContent: (content: string) => void;
}> = ({ content, isCentered, agent, onRequest, setContent }) => {
    return (
        <Sender
            loading={agent.isRequesting()}
            value={content}
            onChange={setContent}
            onSubmit={(nextContent) => {
                onRequest(nextContent);
                setContent('');
            }}
            className={`${isCentered
                ? 'mx-auto w-4/5'
                : 'fixed bottom-16 left-0 right-0 w-full px-4 bg-white shadow-md'
                }`}
        />
    );
};

export default ChatInput;