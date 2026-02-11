import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';
import { storageService } from '../../services/storageService';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  theme?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder,
  readOnly = false,
  className = '',
  theme = 'bubble'
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const hasSetInitialValueRef = useRef(false);

  const lastEmittedValueRef = useRef(value);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill; we'll handle highlighting ourselves to avoid Quill's Syntax dependency
      quillRef.current = new Quill(editorRef.current, {
        theme: theme,
        placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            [{ align: [] }],
            ['clean'],
          ],
          // Do not enable Quill's Syntax module; we'll apply hljs manually
        },
      });

      // Custom image handler
      const toolbar = quillRef.current.getModule('toolbar') as any;
      toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;

          try {
            const result = await storageService.uploadImage(file, 'content');
            const range = quillRef.current?.getSelection();
            quillRef.current?.insertEmbed(range?.index || 0, 'image', result.url);
          } catch (error) {
            console.error('Image upload failed:', error);
            alert(error instanceof Error ? error.message : 'Image upload failed');
          }
        };
      });

      const applyHighlighting = () => {
        const hljs: any = (window as any).hljs;
        if (!hljs) return;
        const root = editorRef.current?.querySelector('.ql-editor');
        if (!root) return;
        // Wrap pre.ql-syntax contents in <code> for consistent highlighting
        root.querySelectorAll('pre.ql-syntax').forEach((pre) => {
          const hasCode = pre.querySelector('code');
          if (!hasCode) {
            const codeEl = document.createElement('code');
            codeEl.textContent = (pre as HTMLElement).textContent || '';
            pre.textContent = '';
            pre.appendChild(codeEl);
            hljs.highlightElement(codeEl);
          } else {
            hljs.highlightElement(hasCode as HTMLElement);
          }
        });
      };

      quillRef.current.on('text-change', () => {
        const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        lastEmittedValueRef.current = html;
        onChange(html);
        applyHighlighting();
      });

      // Set initial value once on mount
      if (!hasSetInitialValueRef.current) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        hasSetInitialValueRef.current = true;
      }
      // Apply readonly state on init
      quillRef.current.enable(!readOnly);
      // Initial highlight pass
      applyHighlighting();
    }
  }, [onChange, placeholder, theme]);

  useEffect(() => {
    // Keep external value in sync when changed programmatically
    if (quillRef.current) {
      if (value === lastEmittedValueRef.current) return;

      const currentHtml = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
      if (value !== currentHtml) {
        // Store current selection to restore it if possible, though dangerousPasteHTML usually kills it
        // For now, simpler check prevents the loop
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        lastEmittedValueRef.current = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className={`bg-transparent editor-wrapper ${className}`}>
      <style>{`
        .ql-editor {
            font-size: 1.125rem; /* text-lg for better readability */
            line-height: 1.75;
            padding: 0; /* Remove default padding as container handles it */
            min-height: 300px;
        }
        .ql-container.ql-bubble {
            font-family: inherit;
        }
        .ql-tooltip {
            z-index: 50 !important; /* Ensure toolbar is above sticky headers */
        }
        @media (max-width: 640px) {
            .ql-editor {
                font-size: 16px; /* Prevent iOS zoom */
                padding-bottom: 200px; /* Extra space for mobile keyboard */
            }
        }
      `}</style>
      <div ref={editorRef} className="min-h-[300px]" />
    </div>
  );
};

export default QuillEditor;

