
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
            Image,
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
            // For now, only update if completely different logic or initial load.
            // Actually, with collaboration or external updates, we might need this.
            // But for a single user, `value` update usually comes from `onUpdate`, so this loop is dangerous.
            // We should trust `editor` state as truth while active.
            // Only update if the value is drastically different (e.g. loaded draft).
            if (editor.getText() === '' && value) {
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
