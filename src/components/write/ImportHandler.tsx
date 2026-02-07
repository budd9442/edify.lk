import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { draftService } from '../../services/draftService';

interface ImportHandlerProps {
  onImportComplete: (contentHtml: string, title: string) => void;
  onClose: () => void;
}

const ImportHandler: React.FC<ImportHandlerProps> = ({ onImportComplete, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/markdown', // .md
      'text/plain' // .txt
    ];
    
    const allowedExtensions = ['.docx', '.doc', '.md', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a .docx, .doc, .md, or .txt file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setImporting(true);
    
    try {
      const result = await draftService.importFromDocument(file);
      onImportComplete(result.contentHtml, result.title);
    } catch (err) {
      setError('Failed to import document. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Import Document</h2>
          <p className="text-gray-400">
            Upload a document to convert it to our structured format
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary-500 bg-primary-900/20' 
              : 'border-dark-700 hover:border-primary-500/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {importing ? (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-white font-medium">Processing document...</p>
                <p className="text-gray-400 text-sm">This may take a few moments</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-white font-medium mb-2">
                  Drag and drop your document here
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  or click to browse files
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-6 p-4 bg-dark-800 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Supported Formats:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Microsoft Word (.docx, .doc)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Markdown (.md)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Plain Text (.txt)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Max size: 10MB</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.md,.txt"
          onChange={handleFileInput}
          className="hidden"
        />
      </motion.div>
    </motion.div>
  );
};

export default ImportHandler;