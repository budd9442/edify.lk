
import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Code, List, Heading2, Quote, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { storageService } from '../../services/storageService';

interface FloatingFormattingToolbarProps {
    editor: Editor | null;
}

const FloatingFormattingToolbar: React.FC<FloatingFormattingToolbarProps> = ({ editor }) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!editor) return;

        const updatePosition = () => {
            const { selection } = editor.state;
            // Get selection coordinates
            const { view } = editor;
            const { ranges } = selection;
            const from = Math.min(...ranges.map(range => range.$from.pos));
            const to = Math.max(...ranges.map(range => range.$to.pos));

            const startCoords = view.coordsAtPos(from);
            const endCoords = view.coordsAtPos(to);

            // Calculate center of selection
            const centerLeft = (startCoords.left + endCoords.right) / 2;

            // Boundary checks & modification
            const menuWidth = menuRef.current?.offsetWidth || 280;
            const menuHeight = menuRef.current?.offsetHeight || 44;

            // Clamp left position to keep menu fully on screen
            // Left edge = left - width/2. Right edge = left + width/2.
            const minLeft = menuWidth / 2 + 8; // 8px padding
            const maxLeft = window.innerWidth - menuWidth / 2 - 8;
            const left = Math.max(minLeft, Math.min(maxLeft, centerLeft));

            // Calculate top position
            // Default: Above selection
            let top = startCoords.top - menuHeight - 10;

            // If top is off-screen (or covered by header approx 60px), show below
            if (top < 60) {
                top = endCoords.bottom + 10;
            }

            setPosition({ top, left });

            // Automatically show if text is selected
            if (!selection.empty) {
                setIsVisible(true);
            }
        };

        const handleEditorClick = () => {
            const { selection } = editor.state;
            if (selection.empty) {
                setIsVisible(prev => !prev);
            }
        };

        editor.on('selectionUpdate', updatePosition);
        editor.on('blur', () => {
            // Optional: Hide on blur, but delay to allow button clicks
            // setIsVisible(false);
        });

        // Add click listener to toggler visibility on cursor tap
        editor.view.dom.addEventListener('click', handleEditorClick);

        // Update position on scroll/resize
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        // Initial positioning
        updatePosition();

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('blur', () => { });
            editor.view.dom.removeEventListener('click', handleEditorClick);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [editor]);

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setUploading(true);
        // Save current selection to restore later if needed? 
        // Actually uploading is async, selection might change. 
        // We should insert at current cursor or replacing selection.

        try {
            // Use 'content' or 'covers' - let's default to covers for now as it works
            const result = await storageService.uploadImage(file, 'covers');

            if (result?.url) {
                editor.chain().focus().setImage({ src: result.url }).run();
            }
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setPosition(null); // Hide menu after action
        }
    };

    if (!editor || !position || !isVisible) return null;

    const buttons = [
        {
            icon: Bold,
            action: () => editor.chain().focus().toggleBold().run(),
            isActive: editor.isActive('bold'),
            label: 'Bold'
        },
        {
            icon: Italic,
            action: () => editor.chain().focus().toggleItalic().run(),
            isActive: editor.isActive('italic'),
            label: 'Italic'
        },
        {
            icon: Heading2,
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            isActive: editor.isActive('heading', { level: 2 }),
            label: 'H2'
        },
        {
            icon: List,
            action: () => editor.chain().focus().toggleBulletList().run(),
            isActive: editor.isActive('bulletList'),
            label: 'List'
        },
        {
            icon: Code,
            action: () => editor.chain().focus().toggleCodeBlock().run(),
            isActive: editor.isActive('codeBlock'),
            label: 'Code'
        },
        {
            icon: uploading ? Loader2 : ImageIcon,
            action: () => fileInputRef.current?.click(),
            isActive: false,
            label: 'Image',
            disabled: uploading
        }
    ];

    return createPortal(
        <div
            ref={menuRef}
            style={{
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, 0)', // Always align top-center relative to calculated top/left
                position: 'fixed',
                zIndex: 50
            }}
            className="flex items-center gap-1 p-1.5 bg-dark-900 border border-dark-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
        >
            {buttons.map((btn, idx) => (
                <button
                    key={idx}
                    onClick={(e) => {
                        e.preventDefault();
                        btn.action();
                    }}
                    // Re-focus editor if needed? toggleX usually keeps focus if chained.
                    className={`p-2 rounded-md transition-colors ${btn.isActive
                        ? 'text-primary-400 bg-primary-900/20'
                        : 'text-gray-400 hover:text-white hover:bg-dark-800'
                        } ${btn.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={btn.label}
                    disabled={btn.disabled}
                >
                    <btn.icon className={`w-4 h-4 ${btn.label === 'Image' && uploading ? 'animate-spin' : ''}`} />
                </button>
            ))}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
        </div>,
        document.body
    );
};

export default FloatingFormattingToolbar;
