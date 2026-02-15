
import React from 'react';
import { X, Image as ImageIcon, Tag, HelpCircle, ChevronRight, PieChart } from 'lucide-react';
import { Draft } from '../../types/payload';
import ImageUpload from './ImageUpload';
import QuizAuthoring from './QuizAuthoring';
import { useAuth } from '../../contexts/AuthContext';

interface EditorSettingsDrawerProps {
    activeSection: 'menu' | 'cover' | 'tags' | 'quiz' | null;
    onClose: () => void;
    currentDraft: Draft;
    onChange: (updates: Partial<Draft>) => void;
    tagsInput: string;
    setTagsInput: (value: string) => void;
}

const EditorSettingsDrawer: React.FC<EditorSettingsDrawerProps> = ({
    activeSection,
    onClose,
    currentDraft,
    onChange,
    tagsInput,
    setTagsInput
}) => {
    const { state: authState } = useAuth();
    const canUseCustomAuthor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

    // Only render if activeSection is present
    if (!activeSection) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end md:justify-end items-end md:items-start group">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div className={`
                relative w-full bg-dark-950 border-t md:border-t-0 md:border-l border-dark-800 
                rounded-t-2xl md:rounded-t-none md:rounded-l-2xl 
                shadow-2xl 
                flex flex-col
                max-h-[85vh] md:h-full md:max-h-full md:w-[480px]
                animate-in slide-in-from-bottom md:slide-in-from-right duration-300
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-800">
                    <h3 className="text-lg font-semibold text-white">
                        {activeSection === 'menu' && 'Article Settings'}
                        {activeSection === 'cover' && 'Cover Image'}
                        {activeSection === 'tags' && 'Tags'}
                        {activeSection === 'quiz' && 'Quiz Builder'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeSection === 'menu' && (
                        <div className="space-y-2">
                            <div className="text-center text-gray-500 text-sm py-8 space-y-2">
                                <p>Desktop: Use the toolbar to open specific settings.</p>
                                <p>Mobile: Select an option from the bottom bar.</p>
                            </div>
                        </div>
                    )}

                    {activeSection === 'cover' && (
                        <div className="space-y-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800">
                                <ImageUpload
                                    currentImage={currentDraft.coverImage}
                                    onImageChange={(url) => onChange({ coverImage: url })}
                                    onImageRemove={() => onChange({ coverImage: undefined })}
                                    placeholder="Upload cover image"
                                    className="w-full"
                                />
                            </div>

                            {/* Custom Author - allowed for editor/admin roles */}
                            {currentDraft && canUseCustomAuthor && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-300">
                                        External Author (Competition)
                                    </label>
                                    <input
                                        type="text"
                                        value={currentDraft.customAuthor || ''}
                                        onChange={(e) => onChange({ customAuthor: e.target.value })}
                                        placeholder="Original Author Name"
                                        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-500">
                                        This name will appear as the author instead of your profile.
                                    </p>
                                </div>
                            )}

                            <div className="flex items-start gap-3 p-4 bg-primary-900/10 rounded-lg border border-primary-500/10">
                                <ImageIcon className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-primary-300 mb-1">Why add a cover?</h4>
                                    <p className="text-xs text-primary-200/70 leading-relaxed">
                                        Articles with cover images get 2x more views. It appears on your article card and at the top of the page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tags' && (
                        <div className="space-y-6">
                            <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-800 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Add Tags
                                    </label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                                                    if (newTags.length) {
                                                        const current = currentDraft.tags || [];
                                                        onChange({ tags: [...new Set([...current, ...newTags])] });
                                                        setTagsInput('');
                                                    }
                                                }
                                            }}
                                            placeholder="Type tag and press Enter..."
                                            className="w-full bg-dark-950 border border-dark-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        Separate with commas or press Enter
                                    </p>
                                </div>

                                {/* Current Tags */}
                                {(currentDraft.tags || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {currentDraft.tags?.map((tag, i) => (
                                            <span key={i} className="group inline-flex items-center gap-1 px-3 py-1 bg-primary-900/20 text-primary-400 rounded-full text-sm border border-primary-500/20">
                                                <span>#{tag}</span>
                                                <button
                                                    onClick={() => {
                                                        const newTags = currentDraft.tags?.filter(t => t !== tag);
                                                        onChange({ tags: newTags });
                                                    }}
                                                    className="hover:text-white transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'quiz' && (
                        <div className="pb-8">
                            <div className="mb-6 flex items-start gap-3 p-4 bg-purple-900/10 rounded-lg border border-purple-500/10">
                                <PieChart className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-purple-300 mb-1">Interactive Quiz</h4>
                                    <p className="text-xs text-purple-200/70 leading-relaxed">
                                        Engage your readers by adding a quiz. Questions can be auto-generated from your content using AI.
                                    </p>
                                </div>
                            </div>

                            <QuizAuthoring
                                articleHtml={currentDraft.contentHtml || ''}
                                maxQuestions={10}
                                initialQuestions={(currentDraft as any).quizQuestions || []}
                                onChange={(qs) => onChange({ quizQuestions: qs } as any)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorSettingsDrawer;
