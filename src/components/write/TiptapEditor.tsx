
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ImageWithFallback } from '../../extensions/ImageWithFallback';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'; // Import the extension
import { common, createLowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';

// Register languages for syntax highlighting
const lowlight = createLowlight(common);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
    editorRef?: any; // To expose editor instance to parent for toolbar control
    setEditorInstance?: (editor: any) => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
    value,
    onChange,
    placeholder = 'Start writing...',
    readOnly = false,
    className = '',
    editorRef,
    setEditorInstance
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We use the lowlight extension
            }),
            ImageWithFallback.configure({
                resize: {
                    enabled: true,
                    directions: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
                    minWidth: 50,
                    minHeight: 50,
                    alwaysPreserveAspectRatio: false,
                },
                HTMLAttributes: {
                    class: 'rounded-lg',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary-400 underline cursor-pointer',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'bg-dark-800 rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto',
                }
            }),
            BubbleMenuExtension, // Add extension
        ],
        content: value,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: `prose prose-invert prose-lg max-w-none focus:outline-none min-h-[50vh] ${className}`,
            },
        },
    });

    // Expose editor instance
    useEffect(() => {
        if (editorRef) {
            editorRef.current = editor;
        }
        if (setEditorInstance && editor) {
            setEditorInstance(editor);
        }
    }, [editor, editorRef, setEditorInstance]);

    // Sync content if it changes externally (and not just by us typing)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Check if meaningful change to avoid cursor jump? 
            // Tiptap handles this better, but we should be careful.
            // For now, only update if content is actually different to avoid cursor jumps.
            if (value && value !== editor.getHTML()) {
                // If content is completely different (e.g. AI rewrite), update it.
                // We compare against getHTML() to avoid updating if our local state is already ahead/in-sync
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    return (
        <div className="tiptap-editor-wrapper">
            <style>{`
                .tiptap p.is-editor-empty:first-child::before {
                    color: #6b7280;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap img {
                    max-width: 100%;
                    border-radius: 0.5rem;
                }
                /* Selected image - clear selection outline */
                .tiptap-editor-wrapper .ProseMirror [data-resize-container].ProseMirror-selectednode {
                    outline: none;
                    box-shadow: 0 0 0 2px #AC834F;
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                /* Resize handles - visible when image container is selected */
                .tiptap-editor-wrapper .ProseMirror [data-resize-handle] {
                    width: 12px;
                    height: 12px;
                    background: #AC834F;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 2px;
                    z-index: 10;
                    opacity: 0.9;
                }
                .tiptap-editor-wrapper .ProseMirror [data-resize-handle="bottom-right"] { cursor: nwse-resize; }
                .tiptap-editor-wrapper .ProseMirror [data-resize-handle="bottom-left"] { cursor: nesw-resize; }
                .tiptap-editor-wrapper .ProseMirror [data-resize-handle="top-right"] { cursor: nesw-resize; }
                .tiptap-editor-wrapper .ProseMirror [data-resize-handle="top-left"] { cursor: nwse-resize; }
            `}</style>
            {/* {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                  <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-xl flex items-center p-1 gap-1">
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-2 rounded hover:bg-dark-700 ${editor.isActive('bold') ? 'text-primary-400' : 'text-gray-400'}`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-2 rounded hover:bg-dark-700 ${editor.isActive('italic') ? 'text-primary-400' : 'text-gray-400'}`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={`p-2 rounded hover:bg-dark-700 ${editor.isActive('codeBlock') ? 'text-primary-400' : 'text-gray-400'}`}
                    >
                      Code
                    </button>
                  </div>
                </BubbleMenu>
              )} */}
            <EditorContent editor={editor} />
        </div>
    );
};

export default TiptapEditor;
