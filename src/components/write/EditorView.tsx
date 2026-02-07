import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Eye, Save, Send, Loader2, ArrowLeft } from 'lucide-react';
import { Draft } from '../../types/payload';
import ImageUpload from './ImageUpload';
import QuillEditor from './QuillEditor';
import QuizAuthoring from './QuizAuthoring';
import { useApp } from '../../contexts/AppContext';

interface EditorViewProps {
    currentDraft: Draft;
    onChange: (updates: Partial<Draft>) => void;
    onSave: () => void;
    onSubmit: () => void;
    onPreview: () => void;
    onBack: () => void;
    onOrganize: () => void;
    organizingWithAI: boolean;
    saving: boolean;
    autoSavedAt: string | null;
    saveError: string | null;
    tagsInput: string;
    setTagsInput: (value: string) => void;
}

const EditorView: React.FC<EditorViewProps> = ({
    currentDraft,
    onChange,
    onSave,
    onSubmit,
    onPreview,
    onBack,
    onOrganize,
    organizingWithAI,
    saving,
    autoSavedAt,
    saveError,
    tagsInput,
    setTagsInput,
}) => {
    const { state: appState, dispatch: appDispatch } = useApp();
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        appDispatch({ type: 'SET_HEADER_MODE', payload: 'custom' });
        return () => {
            appDispatch({ type: 'SET_HEADER_MODE', payload: 'default' });
        };
    }, [appDispatch]);

    useEffect(() => {
        if (appState.headerMode === 'custom') {
            // Small timeout to ensure DOM is ready if needed, or just standard effect
            const el = document.getElementById('header-custom-content');
            setPortalTarget(el);
        }
    }, [appState.headerMode]);

    const headerContent = (
        <div className="flex items-center gap-3 w-full animate-in fade-in duration-300">
            <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-dark-800"
                title="Back to Dashboard"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <input
                type="text"
                value={currentDraft.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Untitled Article"
                className="bg-transparent text-lg font-bold text-white placeholder-dark-600 outline-none w-full min-w-[200px]"
                autoFocus={!currentDraft.title}
            />
        </div>
    );

    return (
        <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            {portalTarget && createPortal(headerContent, portalTarget)}

            {portalTarget && createPortal(headerContent, portalTarget)}

            {/* Editor Actions Toolbar - Sticky on Mobile */}
            <div className="sticky top-16 z-20 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800 py-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent sm:border-none sm:py-0 sm:mb-8">
                <div className="flex items-center justify-between gap-4">
                    {/* Save Status Indicator (Mobile: Icon only, Desktop: Text) */}
                    <div className="flex items-center text-xs text-gray-400 min-w-0 truncate">
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="hidden sm:inline">Saving...</span>
                            </span>
                        ) : autoSavedAt ? (
                            <span>Saved {new Date(autoSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : null}
                        {saveError && <span className="text-red-400 ml-2 truncate">{saveError}</span>}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pl-2">
                        <button
                            onClick={onPreview}
                            className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                            title="Preview"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Preview</span>
                        </button>

                        <button
                            onClick={onOrganize}
                            disabled={organizingWithAI || !currentDraft?.contentHtml}
                            className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Organize with AI"
                        >
                            {organizingWithAI ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            )}
                            <span className="hidden sm:inline">Organize</span>
                        </button>

                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-2 px-3 py-2 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
                            title="Save Draft"
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden sm:inline">Save</span>
                        </button>

                        <button
                            onClick={onSubmit}
                            disabled={currentDraft.status === 'submitted' || !currentDraft.title || currentDraft.title.trim().length === 0}
                            className="flex-shrink-0 flex items-center justify-center sm:justify-start gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
                        >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">{currentDraft.status === 'submitted' ? 'Submitted' : 'Submit'}</span>
                            <span className="inline sm:hidden">Submit</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Form */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-6 lg:p-8">
                {/* Title removed, moved to header */}

                {/* Cover Image */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cover Image
                    </label>
                    <ImageUpload
                        currentImage={currentDraft.coverImage}
                        onImageChange={(url) => onChange({ coverImage: url })}
                        onImageRemove={() => onChange({ coverImage: undefined })}
                        placeholder="Upload cover image for your article"
                        className="mb-4"
                    />
                </div>

                {/* Tags */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        onBlur={() => {
                            const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
                            onChange({ tags });
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
                                onChange({ tags });
                                e.currentTarget.blur();
                            }
                        }}
                        placeholder="Tags (comma separated)..."
                        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                </div>

                {/* Content Editor (Quill stores HTML) */}
                <div className="space-y-4">
                    <QuillEditor
                        value={currentDraft.contentHtml || ''}
                        onChange={(html) => {
                            onChange({ contentHtml: html });
                        }}
                        placeholder="Start writing your article..."
                        readOnly={currentDraft.status === 'submitted'}
                    />
                    {/* Quiz authoring below the rich text editor */}
                    <QuizAuthoring
                        articleHtml={currentDraft.contentHtml || ''}
                        maxQuestions={10}
                        initialQuestions={(currentDraft as any).quizQuestions || []}
                        onChange={(qs) => {
                            // Use a type assertion or ensure Draft has quizQuestions.
                            // Assuming Draft might not have quizQuestions explicitly defined in the imported type if it was an extended type in the original file
                            onChange({ quizQuestions: qs } as any);
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default EditorView;
