/**
 * Image extension with fallback for broken/missing images.
 * The default Tiptap Image hides the node until onload fires - when an image
 * fails to load (404, broken URL), it stays hidden so users can't select/remove it.
 * This extension adds onerror handling to show failed images so they can be edited.
 */
import Image from '@tiptap/extension-image';
import type { ResizableNodeViewDirection } from '@tiptap/core';
import { ResizableNodeView } from '@tiptap/core';

export const ImageWithFallback = Image.extend({
  addNodeView() {
    const options = this.options;
    if (!options.resize || !(options.resize as any).enabled || typeof document === 'undefined') {
      return null;
    }

    const resizeOptions = options.resize as {
      enabled: boolean;
      directions?: ResizableNodeViewDirection[];
      minWidth?: number;
      minHeight?: number;
      alwaysPreserveAspectRatio?: boolean;
    };
    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = resizeOptions;

    return ({ node, getPos, HTMLAttributes, editor }: any) => {
      const el = document.createElement('img');

      Object.entries(HTMLAttributes).forEach(([key, value]: [string, any]) => {
        if (value != null) {
          switch (key) {
            case 'width':
            case 'height':
              break;
            default:
              el.setAttribute(key, value);
              break;
          }
        }
      });

      el.src = HTMLAttributes.src;

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width: number, height: number) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width: number, height: number) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes(this.name, { width, height }).run();
        },
        onUpdate: (updatedNode: any) => {
          if (updatedNode.type !== node.type) return false;
          return true;
        },
        options: {
          directions,
          min: { width: minWidth, height: minHeight },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
        },
      });

      const dom = nodeView.dom as HTMLElement;

      // Hide until image loads (to get correct dimensions)
      dom.style.visibility = 'hidden';
      dom.style.pointerEvents = 'none';

      const showNode = () => {
        dom.style.visibility = '';
        dom.style.pointerEvents = '';
      };

      el.onload = showNode;
      // When image fails to load, still show so user can select and remove it
      el.onerror = showNode;

      // Empty or missing src - show immediately so user can remove
      if (!HTMLAttributes.src || String(HTMLAttributes.src).trim() === '') {
        showNode();
      }

      return nodeView;
    };
  },
});
