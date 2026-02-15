import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  Clock, 
  Edit3, 
  Trash2, 
  Send, 
  Eye,
  MoreVertical,
  Calendar,
  Hash
} from 'lucide-react';
import { Draft } from '../../types/payload';

interface DraftCardProps {
  draft: Draft;
  onEdit: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
  onSubmit: (draftId: string) => void;
  onPreview: (draft: Draft) => void;
}

const DraftCard: React.FC<DraftCardProps> = ({ 
  draft, 
  onEdit, 
  onDelete, 
  onSubmit, 
  onPreview 
}) => {
  const getStatusColor = () => {
    switch (draft.status) {
      case 'published':
        return 'text-green-400 bg-green-900/20 border-green-500/50';
      case 'submitted':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
      case 'rejected':
        return 'text-red-400 bg-red-900/20 border-red-500/50';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/50';
    }
  };

  const getStatusText = () => {
    switch (draft.status) {
      case 'published':
        return 'Published';
      case 'submitted':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-dark-900 border border-dark-800 rounded-lg p-6 hover:border-primary-500/50 transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1 group-hover:text-primary-400 transition-colors">
              {draft.title || 'Untitled Draft'}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{draft.readingTime} min read</span>
              </div>
              <span>{draft.wordCount} words</span>
            </div>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
            title={draft.status === 'rejected' && draft.rejectionReason ? draft.rejectionReason : undefined}
          >
            {getStatusText()}
          </div>
          {draft.status === 'rejected' && draft.rejectionReason && (
            <span className="text-xs text-red-300/80 max-w-[200px] text-right line-clamp-2" title={draft.rejectionReason}>
              {draft.rejectionReason}
            </span>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {draft.coverImage && (
        <div className="mb-4">
          <img
            src={draft.coverImage}
            alt={draft.title}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Tags */}
      {draft.tags.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <Hash className="w-4 h-4 text-gray-500" />
          <div className="flex flex-wrap gap-2">
             {draft.tags.slice(0, 2).map((tag, index) => (
               <span
                 key={index}
                 className="px-2 py-1 bg-dark-800 text-gray-300 text-xs rounded-full whitespace-nowrap overflow-hidden"
                 title={tag}
               >
                 {tag}
               </span>
             ))}
             {draft.tags.length > 2 && (
               <span className="px-2 py-1 bg-dark-800 text-gray-400 text-xs rounded-full">
                 +{draft.tags.length - 2} more
               </span>
             )}
          </div>
        </div>
      )}

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm line-clamp-2">
          {(() => {
            const text = (draft.contentHtml || '')
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            return text || 'No content yet...';
          })()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(draft)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onPreview(draft)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {(draft.status === 'draft' || draft.status === 'rejected') && (
            <button
              onClick={() => onSubmit(draft.id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              <span>{draft.status === 'rejected' ? 'Resubmit' : 'Submit'}</span>
            </button>
          )}
          
          <button
            onClick={() => onDelete(draft.id)}
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DraftCard;