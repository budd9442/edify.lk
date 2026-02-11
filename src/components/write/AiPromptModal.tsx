import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, ChevronRight, Wand2 } from 'lucide-react';

interface AiPromptModalProps {
    onConfirm: (prompt: string, tone: string) => void;
    onClose: () => void;
    isLoading: boolean;
}

const AiPromptModal: React.FC<AiPromptModalProps> = ({ onConfirm, onClose, isLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [tone, setTone] = useState('professional');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(prompt, tone);
    };

    const tones = [
        { id: 'professional', label: 'Professional' },
        { id: 'casual', label: 'Casual' },
        { id: 'engaging', label: 'Engaging' },
        { id: 'academic', label: 'Academic' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-lg bg-dark-900 border border-dark-800 rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-900/30 rounded-lg">
                                <Sparkles className="w-5 h-5 text-primary-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">Organize with AI</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-dark-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                What should the AI focus on?
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Improve readability, fix grammar, and add appropriate headers..."
                                className="w-full h-32 bg-dark-950 border border-dark-700 rounded-lg p-4 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Tone</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {tones.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTone(t.id)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${tone === t.id
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                                : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-primary-900/20 hover:from-primary-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        <span>Generate Magic</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-dark-950/50 p-4 border-t border-dark-800">
                    <p className="text-xs text-center text-gray-500">
                        AI can make mistakes. Review the changes before saving.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AiPromptModal;
