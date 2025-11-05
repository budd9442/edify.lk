import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css';
import { storageService } from '../../services/storageService';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const hasSetInitialValueRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill; we'll handle highlighting ourselves to avoid Quill's Syntax dependency
      quillRef.current = new Quill(editorRef.current, {
          theme: 'bubble',
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
  }, [onChange, placeholder]);

  useEffect(() => {
    // Keep external value in sync when changed programmatically
    if (quillRef.current) {
      const currentHtml = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
      if (value !== currentHtml) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
      }
    }
  }, [value]);

  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className="bg-transparent">
      <div ref={editorRef} className="min-h-[240px]" />
    </div>
  );
};

export default QuillEditor;

