import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Loader2, ArrowLeft } from 'lucide-react';
import { Draft } from '../../types/payload';

interface PreviewViewProps {
    currentDraft: Draft;
    onEdit: () => void;
    onBack: () => void;
    onOrganize: () => void;
    organizingWithAI: boolean;
}

const PreviewView: React.FC<PreviewViewProps> = ({
    currentDraft,
    onEdit,
    onBack,
    onOrganize,
    organizingWithAI,
}) => {
    return (
        <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {/* Preview Header */}
            <div className="flex flex-col gap-6 mb-8">
                {/* Navigation and Title */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={currentDraft.status === 'published' ? onBack : onEdit}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg hover:bg-dark-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">{currentDraft.status === 'published' ? 'Dashboard' : 'Editor'}</span>
                    </button>
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${currentDraft.status === 'published'
                        ? 'text-green-400 bg-green-900/20'
                        : currentDraft.status === 'submitted'
                            ? 'text-yellow-400 bg-yellow-900/20'
                            : 'text-gray-400 bg-dark-800'
                        }`}>
                        {currentDraft.status === 'published' ? 'PUBLISHED' : currentDraft.status === 'submitted' ? 'PENDING' : 'DRAFT'}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                            {currentDraft.title || 'Untitled Article'}
                        </h1>
                        <p className="text-gray-400 text-sm">Preview Mode</p>
                    </div>

                    {/* Actions */}
                    {currentDraft.status !== 'published' && (
                        <div className="flex flex-row sm:flex-col lg:flex-row gap-3 w-full sm:w-auto">
                            <button
                                onClick={onOrganize}
                                disabled={organizingWithAI || !currentDraft?.contentHtml}
                                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl hover:bg-purple-600/20 transition-all disabled:opacity-50"
                            >
                                {organizingWithAI ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )}
                                <span>Organize</span>
                            </button>
                            <button
                                onClick={onEdit}
                                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20"
                            >
                                <PenTool className="w-4 h-4" />
                                <span>Edit</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Content */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl font-bold text-white mb-6">
                    {currentDraft.title || 'Untitled Article'}
                </h1>

                {currentDraft.tags && currentDraft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {currentDraft.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-primary-900/30 text-primary-300 rounded-full text-sm whitespace-nowrap overflow-hidden"
                                title={tag}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentDraft.contentHtml || '' }} />
            </div>
        </motion.div>
    );
};

export default PreviewView;
