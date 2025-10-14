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

      quillRef.current.on('text-change', () => {
        const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
        onChange(html);
      });

      // Set initial value once on mount
      if (!hasSetInitialValueRef.current) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        hasSetInitialValueRef.current = true;
      }
      // Apply readonly state on init
      quillRef.current.enable(!readOnly);
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

