import React, { useState } from 'react';

interface ChannelInputProps {
    onAddChannel: (channelInput: string) => void;
    isDisabled: boolean;
    isAdding: boolean;
}

export const ChannelInput: React.FC<ChannelInputProps> = ({ onAddChannel, isDisabled, isAdding }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onAddChannel(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-800/50 rounded-xl p-6 border border-indigo-500/20 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <h2 className="text-2xl font-bold text-white">Track New Channels</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4 md:ml-11">
                Add channels by pasting their URL, ID, or @handle. You can add multiple channels at once by placing each on a new line.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    rows={3}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isDisabled}
                    placeholder={`e.g., https://www.youtube.com/@Google\nUC_x5XG1OV2P6uZZ5FSM9Ttw\nMrBeast`}
                    className="w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 resize-y transition-colors"
                />
                <button
                    type="submit"
                    disabled={isDisabled || !inputValue.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                    aria-label="Add Channel(s) to Track"
                >
                    {isAdding ? (
                         <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                    ) : (
                        'Add Channel(s)'
                    )}
                </button>
            </form>
        </div>
    );
};
