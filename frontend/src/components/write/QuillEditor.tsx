import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

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
        theme: 'snow',
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
    <div className="bg-dark-800 border border-dark-700 rounded-lg">
      <div ref={editorRef} className="min-h-[240px]" />
    </div>
  );
};

export default QuillEditor;

