import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, Save, Send, Loader2, ArrowLeft, Sparkles, Image as ImageIcon, Tag, HelpCircle } from 'lucide-react';
import { Draft } from '../../types/payload';
import TiptapEditor from './TiptapEditor';
import EditorSettingsDrawer from './EditorSettingsDrawer';
import FloatingFormattingToolbar from './FloatingFormattingToolbar';

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
    tagsInput,
    setTagsInput,
}) => {
    const [activeSettingsSection, setActiveSettingsSection] = useState<'menu' | 'cover' | 'tags' | 'quiz' | null>(null);
    const editorRef = useRef<any>(null);
    const [editorInstance, setEditorInstance] = useState<any>(null);

    return (
        <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-dark-950"
        >
            {/* Unified Sticky Editor Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 py-3 bg-dark-950/80 border-b border-dark-800 sticky top-0 z-30 backdrop-blur-md">
                {/* Left: Navigation & Progress */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-800 flex-shrink-0"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-dark-800 hidden md:block" />
                    <div className="relative flex-1 md:min-w-[400px]">
                        <input
                            type="text"
                            value={currentDraft.title || ''}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="Unnamed Article"
                            className="bg-transparent text-lg md:text-xl font-bold text-white placeholder-dark-600 outline-none w-full"
                        />
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-medium whitespace-nowrap overflow-hidden">
                            {saving ? (
                                <span className="flex items-center gap-1 text-primary-400 animate-pulse">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    Saving changes...
                                </span>
                            ) : autoSavedAt ? (
                                <span>Draft saved {new Date(autoSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Right: Tools & Actions */}
                <div className="flex items-center justify-between w-full md:w-auto gap-2 overflow-x-auto no-scrollbar py-1">
                    {/* Settings Toggles */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveSettingsSection('cover')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${activeSettingsSection === 'cover' ? 'text-primary-400 bg-primary-900/10 border border-primary-500/20' : 'text-gray-400 hover:text-white hover:bg-dark-800 border border-transparent'}`}
                        >
                            <ImageIcon className="w-4 h-4" />
                            <span className="hidden lg:inline">Cover</span>
                        </button>
                        <button
                            onClick={() => setActiveSettingsSection('tags')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${activeSettingsSection === 'tags' ? 'text-green-400 bg-green-900/10 border border-green-500/20' : 'text-gray-400 hover:text-white hover:bg-dark-800 border border-transparent'}`}
                        >
                            <Tag className="w-4 h-4" />
                            <span className="hidden lg:inline">Tags</span>
                        </button>
                        <button
                            onClick={() => setActiveSettingsSection('quiz')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${activeSettingsSection === 'quiz' ? 'text-purple-400 bg-purple-900/10 border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-dark-800 border border-transparent'}`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="hidden lg:inline">Quiz</span>
                        </button>
                    </div>

                    <div className="h-6 w-px bg-dark-800 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onPreview}
                            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors hidden sm:flex"
                            title="Live Preview"
                        >
                            <Eye className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onOrganize}
                            disabled={organizingWithAI || !currentDraft?.contentHtml}
                            className={`p-2 rounded-lg transition-colors ${organizingWithAI ? 'text-purple-400 bg-purple-900/10' : 'text-gray-400 hover:text-purple-400 hover:bg-dark-800'}`}
                            title="AI Organize"
                        >
                            {organizingWithAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        </button>

                        <div className="w-px h-6 bg-dark-800 mx-1 flex-shrink-0" />

                        <button
                            onClick={onSave}
                            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                            title="Save Progress"
                        >
                            <Save className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onSubmit}
                            disabled={currentDraft.status === 'submitted' || !currentDraft.title}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-primary-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">{currentDraft.status === 'submitted' ? 'Sent' : 'Submit'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-12 md:py-24">
                    {/* Floating Formatting Toolbar */}
                    <FloatingFormattingToolbar editor={editorInstance} />

                    {/* Editor Canvas */}
                    <TiptapEditor
                        value={currentDraft.contentHtml || ''}
                        onChange={(html) => onChange({ contentHtml: html })}
                        placeholder="Once upon a time..."
                        readOnly={currentDraft.status === 'submitted'}
                        className="prose-invert prose-lg md:prose-xl min-h-[60vh] focus:outline-none"
                        editorRef={editorRef}
                        setEditorInstance={setEditorInstance}
                    />
                </div>
            </div>

            {/* Settings Overlay Drawer */}
            <EditorSettingsDrawer
                activeSection={activeSettingsSection}
                onClose={() => setActiveSettingsSection(null)}
                currentDraft={currentDraft}
                onChange={onChange}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
            />
        </motion.div>
    );
};

export default EditorView;
