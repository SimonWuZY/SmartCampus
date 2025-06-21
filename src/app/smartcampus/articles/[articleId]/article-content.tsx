import React from 'react';
import styles from './Article.module.css';

interface ContentsProps {
    content: string;
}

const Content: React.FC<ContentsProps> = ({ content }) => {
    return (
        <div className="p-4">
            <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
};

export default Content;