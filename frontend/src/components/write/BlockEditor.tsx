import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Image,
  Link,
  Type
} from 'lucide-react';
import { StrapiBlock, StrapiTextNode } from '../../mock-data/strapiBlocks';
import { StrapiBlockUtils } from '../../services/strapiBlockUtils';

interface BlockEditorProps {
  content: StrapiBlock[];
  onChange: (content: StrapiBlock[]) => void;
  placeholder?: string;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = "Start writing your article..." 
}) => {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const addBlock = useCallback((type: StrapiBlock['type'], index?: number) => {
    const newBlock: StrapiBlock = {
      type,
      children: [{ text: '' }],
      ...(type === 'heading' && { level: 2 }),
      ...(type === 'list' && { format: 'unordered' as const })
    };

    const insertIndex = index !== undefined ? index + 1 : content.length;
    const newContent = [...content];
    newContent.splice(insertIndex, 0, newBlock);
    onChange(newContent);
    setSelectedBlockIndex(insertIndex);
  }, [content, onChange]);

  const updateBlock = useCallback((index: number, updatedBlock: StrapiBlock) => {
    const newContent = [...content];
    newContent[index] = updatedBlock;
    onChange(newContent);
  }, [content, onChange]);

  const deleteBlock = useCallback((index: number) => {
    if (content.length > 1) {
      const newContent = content.filter((_, i) => i !== index);
      onChange(newContent);
      setSelectedBlockIndex(null);
    }
  }, [content, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('paragraph', index);
    } else if (e.key === 'Backspace' && content[index].children[0]?.text === '') {
      e.preventDefault();
      deleteBlock(index);
    }
  };

  const renderBlock = (block: StrapiBlock, index: number) => {
    const isSelected = selectedBlockIndex === index;
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative group ${isSelected ? 'ring-2 ring-primary-500 rounded-lg' : ''}`}
        onClick={() => setSelectedBlockIndex(index)}
      >
        {/* Block Toolbar */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-12 left-0 bg-dark-800 border border-dark-700 rounded-lg p-2 flex items-center space-x-1 z-10"
          >
            <button
              onClick={() => updateBlock(index, { ...block, type: 'paragraph' })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Paragraph"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateBlock(index, { ...block, type: 'heading', level: 1 })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateBlock(index, { ...block, type: 'heading', level: 2 })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateBlock(index, { ...block, type: 'quote' })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateBlock(index, { ...block, type: 'list', format: 'unordered' })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateBlock(index, { ...block, type: 'code' })}
              className="p-1 hover:bg-dark-700 rounded text-gray-400 hover:text-white"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Block Content */}
        <div className="p-2">
          {renderBlockContent(block, index)}
        </div>

        {/* Add Block Button */}
        {isSelected && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => addBlock('paragraph', index)}
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
          >
            +
          </motion.button>
        )}
      </motion.div>
    );
  };

  const renderBlockContent = (block: StrapiBlock, index: number) => {
    const textContent = block.children[0]?.text || '';

    const handleTextChange = (newText: string) => {
      const updatedBlock = {
        ...block,
        children: [{ text: newText }]
      };
      updateBlock(index, updatedBlock);
    };

    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag className={`font-bold text-white ${
            block.level === 1 ? 'text-3xl' : 
            block.level === 2 ? 'text-2xl' : 
            block.level === 3 ? 'text-xl' : 'text-lg'
          }`}>
            <input
              type="text"
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full bg-transparent border-none outline-none"
              placeholder="Heading..."
            />
          </HeadingTag>
        );

      case 'quote':
        return (
          <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-300">
            <input
              type="text"
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-full bg-transparent border-none outline-none"
              placeholder="Quote..."
            />
          </blockquote>
        );

      case 'code':
        return (
          <div className="bg-dark-800 rounded-lg p-4">
            <textarea
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-primary-300 font-mono text-sm resize-none"
              placeholder="Code..."
              rows={3}
            />
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            {block.children.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start space-x-2">
                <span className="text-gray-400 mt-1">
                  {block.format === 'ordered' ? `${itemIndex + 1}.` : '•'}
                </span>
                <input
                  type="text"
                  value={item.children?.[0]?.text || ''}
                  onChange={(e) => {
                    const newChildren = [...block.children];
                    newChildren[itemIndex] = {
                      type: 'list-item',
                      children: [{ text: e.target.value }]
                    };
                    updateBlock(index, { ...block, children: newChildren });
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-gray-300"
                  placeholder="List item..."
                />
              </div>
            ))}
          </div>
        );

      default:
        return (
          <textarea
            value={textContent}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-full bg-transparent border-none outline-none text-gray-300 resize-none"
            placeholder={index === 0 ? placeholder : "Continue writing..."}
            rows={Math.max(1, Math.ceil(textContent.length / 80))}
          />
        );
    }
  };

  // Initialize with empty paragraph if no content
  if (content.length === 0) {
    onChange([{ type: 'paragraph', children: [{ text: '' }] }]);
    return null;
  }

  return (
    <div className="space-y-4">
      {content.map((block, index) => renderBlock(block, index))}
      
      {/* Add first block button */}
      {content.length === 0 && (
        <button
          onClick={() => addBlock('paragraph')}
          className="w-full p-8 border-2 border-dashed border-dark-700 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
        >
          Click to start writing...
        </button>
      )}
    </div>
  );
};

export default BlockEditor;