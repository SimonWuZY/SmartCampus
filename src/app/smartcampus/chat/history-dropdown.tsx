import React, { useState } from 'react';

const HistoryDropdown: React.FC<{ historyItems: string[] }> = ({ historyItems }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-300 hover:bg-blue-400 text-gray-800 font-semibold mx-4 py-2 px-4 rounded inline-flex items-center justify-center"
            >
                <span className='text-black'>历史记录</span>
                <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {historyItems.map((item, index) => (
                        <div key={index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryDropdown;