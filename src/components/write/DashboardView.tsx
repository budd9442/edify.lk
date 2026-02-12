import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { PenTool, Upload, FileText, TrendingUp, Users, Eye, Send, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Draft } from '../../types/payload';
import { useApp } from '../../contexts/AppContext';

interface DashboardViewProps {
    drafts: Draft[];
    loading: boolean;
    userFollowersCount: number;
    onStartNew: () => void;
    onImport: () => void;
    onEditDraft: (draft: Draft) => void;
    onPreviewDraft: (draft: Draft) => void;
    onSubmitDraft: (draftId: string) => void;
    onDeleteDraft: (draftId: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    drafts,
    loading,
    userFollowersCount,
    onStartNew,
    onImport,
    onEditDraft,
    onPreviewDraft,
    onSubmitDraft,
    onDeleteDraft,
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
            const el = document.getElementById('header-custom-content');
            setPortalTarget(el);
        }
    }, [appState.headerMode]);

    const headerContent = (
        <div className="flex items-center gap-2 animate-in fade-in duration-300 text-white">
            <PenTool className="w-5 h-5 text-primary-500" />
            <span className="text-xl font-bold">Write & Create</span>
        </div>
    );

    return (
        <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full"
        >
            {portalTarget && createPortal(headerContent, portalTarget)}

            <div className="grid lg:grid-cols-3 gap-8 px-4 md:px-0 mt-4 md:mt-0">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8 w-full max-w-full">
                    {/* Write Options */}
                    <section>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <h2 className="text-2xl font-bold text-white mb-6">Start Writing</h2>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Import Document */}
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
                                    onClick={onImport}
                                >
                                    <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                                        <Upload className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Import Document</h3>
                                    <p className="text-gray-400 mb-4">
                                        Upload a .docx, .md, or .txt file and convert it to our structured format
                                    </p>
                                    <div className="flex items-center space-x-2 text-sm text-blue-400">
                                        <span>Supports Word, Markdown, Text</span>
                                    </div>
                                </motion.div>

                                {/* Start New */}
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
                                    onClick={onStartNew}
                                >
                                    <div className="w-12 h-12 bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                                        <PenTool className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Start New Article</h3>
                                    <p className="text-gray-400 mb-4">
                                        Create a new article from scratch with our rich text editor
                                    </p>

                                </motion.div>
                            </div>
                        </div>

                        {/* Mobile View - Action Buttons */}
                        <div className="md:hidden space-y-3 mb-8">
                            <button
                                onClick={onStartNew}
                                className="w-full flex items-center gap-4 p-4 bg-primary-600 rounded-xl text-white shadow-lg active:scale-[0.98] transition-all"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <PenTool className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg">Start Fresh</h3>
                                    <p className="text-primary-100 text-xs">Write a new article</p>
                                </div>
                            </button>

                            <button
                                onClick={onImport}
                                className="w-full flex items-center gap-4 p-4 bg-dark-800 border border-dark-700 rounded-xl text-white active:scale-[0.98] transition-all"
                            >
                                <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-200">Import File</h3>
                                    <p className="text-gray-500 text-xs">Word, Markdown, Text</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Drafts Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-white">Your Articles</h2>
                            <span className="text-xs md:text-sm text-gray-400 bg-dark-800 px-2 py-1 rounded-md">
                                {drafts.filter(d => d.status === 'draft').length} {drafts.filter(d => d.status === 'draft').length === 1 ? 'draft' : 'drafts'}
                            </span>
                        </div>

                        {loading ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-dark-900 border border-dark-800 rounded-lg p-6 animate-pulse">
                                        <div className="h-6 bg-dark-700 rounded mb-4"></div>
                                        <div className="h-4 bg-dark-700 rounded mb-2"></div>
                                        <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                                    </div>
                                ))}
                            </div>
                        ) : drafts.length > 0 ? (
                            <div className="space-y-3 md:space-y-2">
                                {drafts.map((draft) => {
                                    const textPreview = (draft.contentHtml || '')
                                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                                        .replace(/<[^>]+>/g, ' ')
                                        .replace(/&nbsp;/g, ' ')
                                        .replace(/\s+/g, ' ')
                                        .trim();
                                    const isEditableOrRejected = draft.status === 'draft' || draft.status === 'rejected';
                                    return (
                                        <React.Fragment key={draft.id}>
                                            {/* Desktop Card */}
                                            <div className="hidden md:flex flex-row items-center gap-4 p-4 bg-dark-900 hover:bg-dark-800 rounded-lg border border-dark-800 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4 mb-1">
                                                        <h3 className="text-lg text-white font-medium truncate">{draft.title || 'Untitled Draft'}</h3>
                                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 line-clamp-1 mt-1 mb-2">{textPreview || 'No content yet...'}</p>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2 py-0.5 text-xs rounded-full border ${draft.status === 'published'
                                                                ? 'text-green-400 bg-green-900/20 border-green-500/50'
                                                                : draft.status === 'submitted'
                                                                    ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50'
                                                                    : draft.status === 'rejected'
                                                                        ? 'text-red-400 bg-red-900/20 border-red-500/50'
                                                                        : 'text-gray-400 bg-gray-900/20 border-gray-500/50'
                                                                }`}>
                                                                {draft.status === 'published' ? 'Published' : draft.status === 'submitted' ? 'Under Review' : draft.status === 'rejected' ? 'Rejected' : 'Draft'}
                                                            </span>
                                                            {draft.tags.slice(0, 3).map((tag, i) => (
                                                                <span key={i} className="px-2 py-0.5 text-xs bg-dark-800 text-gray-300 rounded-full border border-dark-700">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {draft.status === 'rejected' && draft.rejectionReason && (
                                                            <span className="text-xs text-red-300/80 line-clamp-1" title={draft.rejectionReason}>{draft.rejectionReason}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {isEditableOrRejected && (
                                                        <button onClick={() => onEditDraft(draft)} className="p-2 text-primary-400 hover:bg-primary-900/20 rounded-lg text-sm font-medium">Edit</button>
                                                    )}
                                                    <button onClick={() => onPreviewDraft(draft)} className="p-2 text-gray-400 hover:bg-dark-700 rounded-lg text-sm font-medium">Preview</button>
                                                    {isEditableOrRejected && (
                                                        <button onClick={() => onSubmitDraft(draft.id)} className="p-2 text-green-400 hover:bg-green-900/20 rounded-lg text-sm font-medium">{draft.status === 'rejected' ? 'Resubmit' : 'Submit'}</button>
                                                    )}
                                                    <button onClick={() => onDeleteDraft(draft.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg text-sm font-medium">Delete</button>
                                                </div>
                                            </div>

                                            {/* Mobile Card - Simplified Layout */}
                                            <div className="md:hidden bg-dark-900 rounded-xl border border-dark-800 overflow-hidden shadow-sm">
                                                <div
                                                    className="p-4 border-b border-dark-800/50 active:bg-dark-800/50 transition-colors"
                                                    onClick={() => isEditableOrRejected ? onEditDraft(draft) : onPreviewDraft(draft)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${draft.status === 'published'
                                                            ? 'text-green-400 bg-green-900/20'
                                                            : draft.status === 'submitted'
                                                                ? 'text-yellow-400 bg-yellow-900/20'
                                                                : draft.status === 'rejected'
                                                                    ? 'text-red-400 bg-red-900/20'
                                                                    : 'text-gray-400 bg-dark-800'
                                                            }`}>
                                                            {draft.status === 'published' ? 'PUBLISHED' : draft.status === 'submitted' ? 'PENDING' : draft.status === 'rejected' ? 'REJECTED' : 'DRAFT'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(draft.updatedAt))} ago
                                                        </span>
                                                    </div>
                                                    <h3 className="text-white font-semibold text-lg leading-tight mb-1">{draft.title || 'Untitled Draft'}</h3>
                                                    <p className="text-sm text-gray-500 line-clamp-2">{textPreview || 'No content yet...'}</p>
                                                </div>

                                                {/* Mobile Action Bar */}
                                                <div className="grid grid-cols-4 divide-x divide-dark-800/50 bg-dark-800/30 border-t border-dark-800/50">
                                                    {isEditableOrRejected ? (
                                                        <button
                                                            onClick={() => onEditDraft(draft)}
                                                            className="py-3.5 flex flex-col gap-1 items-center justify-center text-primary-400 active:bg-primary-900/10 transition-colors"
                                                        >
                                                            <PenTool className="w-5 h-5" />
                                                            <span className="text-[10px] font-medium">Edit</span>
                                                        </button>
                                                    ) : (
                                                        <div className="py-3.5 flex flex-col gap-1 items-center justify-center text-dark-700 opacity-50 cursor-not-allowed">
                                                            <PenTool className="w-5 h-5" />
                                                            <span className="text-[10px] font-medium">Edit</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => onPreviewDraft(draft)}
                                                        className="py-3.5 flex flex-col gap-1 items-center justify-center text-gray-400 active:bg-dark-700/50 transition-colors"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                        <span className="text-[10px] font-medium">Preview</span>
                                                    </button>

                                                    {isEditableOrRejected ? (
                                                        <button
                                                            onClick={() => onSubmitDraft(draft.id)}
                                                            className="py-3.5 flex flex-col gap-1 items-center justify-center text-green-400 active:bg-green-900/10 transition-colors"
                                                        >
                                                            <Send className="w-5 h-5" />
                                                            <span className="text-[10px] font-medium">{draft.status === 'rejected' ? 'Resubmit' : 'Submit'}</span>
                                                        </button>
                                                    ) : (
                                                        <div className="py-3.5 flex flex-col gap-1 items-center justify-center text-dark-700 opacity-50 cursor-not-allowed">
                                                            <Send className="w-5 h-5" />
                                                            <span className="text-[10px] font-medium">Submit</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => onDeleteDraft(draft.id)}
                                                        className="py-3.5 flex flex-col gap-1 items-center justify-center text-red-400 active:bg-red-900/10 transition-colors"
                                                    >
                                                        <X className="w-5 h-5" />
                                                        <span className="text-[10px] font-medium">Delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-dark-900 border border-dark-800 rounded-lg">
                                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">No drafts yet</h3>
                                <p className="text-gray-400 mb-6">
                                    Start writing your first article to see it here
                                </p>
                                <button
                                    onClick={onStartNew}
                                    className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Create Your First Draft
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-dark-900 border border-dark-800 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">Drafts</span>
                                </div>
                                <span className="text-sm font-medium text-white">
                                    {drafts.filter(d => d.status === 'draft').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">Published</span>
                                </div>
                                <span className="text-sm font-medium text-white">
                                    {drafts.filter(d => d.status === 'published').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-400">Followers</span>
                                </div>
                                <span className="text-sm font-medium text-white">
                                    {userFollowersCount}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6">

                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardView;
