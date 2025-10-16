import React from 'react';
import { StrapiBlock } from '../../types/payload';

interface BlockRendererProps {
  blocks: StrapiBlock[];
  className?: string;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, className = '' }) => {
  const renderBlock = (block: StrapiBlock, index: number) => {
    const textContent = block.children.map(child => 
      'text' in child ? child.text : ''
    ).join('');

    switch (block.type) {
      case 'heading':
        const HeadingTag = `h${block.level || 2}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-3xl font-bold text-white mb-6',
          2: 'text-2xl font-bold text-white mb-4 mt-8',
          3: 'text-xl font-bold text-white mb-3 mt-6',
          4: 'text-lg font-bold text-white mb-2 mt-4',
          5: 'text-base font-bold text-white mb-2 mt-4',
          6: 'text-sm font-bold text-white mb-2 mt-4'
        };
        
        return (
          <HeadingTag key={index} className={headingClasses[block.level as keyof typeof headingClasses] || headingClasses[2]}>
            {renderInlineContent(block.children)}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-gray-300 mb-4 leading-relaxed">
            {renderInlineContent(block.children)}
          </p>
        );

      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-primary-500 pl-6 py-2 my-6 italic text-gray-400 bg-dark-800/50 rounded-r-lg">
            {renderInlineContent(block.children)}
          </blockquote>
        );

      case 'code':
        return (
          <pre key={index} className="bg-dark-800 rounded-lg p-4 my-6 overflow-x-auto">
            <code className="text-primary-300 font-mono text-sm">
              {textContent}
            </code>
          </pre>
        );

      case 'list':
        const ListTag = block.format === 'ordered' ? 'ol' : 'ul';
        const listClasses = block.format === 'ordered' 
          ? 'list-decimal list-inside space-y-2 mb-4 text-gray-300'
          : 'list-disc list-inside space-y-2 mb-4 text-gray-300';
        
        return (
          <ListTag key={index} className={listClasses}>
            {block.children.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">
                {renderInlineContent(item.children)}
              </li>
            ))}
          </ListTag>
        );

      case 'image':
        return (
          <figure key={index} className="my-8">
            <img
              src={block.url}
              alt={block.alt || ''}
              className="w-full rounded-lg shadow-lg"
            />
            {block.caption && (
              <figcaption className="text-center text-gray-400 text-sm mt-2">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );

      default:
        return (
          <div key={index} className="text-gray-300 mb-4">
            {renderInlineContent(block.children)}
          </div>
        );
    }
  };

  const renderInlineContent = (children: any[]) => {
    return children.map((child, index) => {
      if ('text' in child) {
        let element = child.text;
        
        if (child.bold) {
          element = <strong key={index} className="font-semibold text-white">{element}</strong>;
        }
        if (child.italic) {
          element = <em key={index} className="italic">{element}</em>;
        }
        if (child.code) {
          element = <code key={index} className="bg-dark-800 text-primary-300 px-2 py-1 rounded text-sm font-mono">{element}</code>;
        }
        if (child.underline) {
          element = <u key={index}>{element}</u>;
        }
        if (child.strikethrough) {
          element = <s key={index}>{element}</s>;
        }
        
        return element;
      }
      return null;
    });
  };

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default BlockRenderer;