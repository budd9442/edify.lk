import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  placeholder = 'Select an option',
  onChange,
  className = '',
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find(item => item.value === value);
  const filteredItems = searchable 
    ? items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : items;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredItems[focusedIndex]) {
          handleSelect(filteredItems[focusedIndex].value);
        }
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 bg-dark-800 text-white rounded-lg border border-dark-700
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-dark-600 cursor-pointer'}
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}
        `}
      >
        <div className="flex items-center space-x-2">
          {selectedItem?.icon}
          <span className={selectedItem ? 'text-white' : 'text-gray-400'}>
            {selectedItem?.label || placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-dark-700">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-dark-900 text-white rounded border border-dark-600 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>
            )}
            
            <div className="max-h-48 overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <motion.button
                    key={item.value}
                    type="button"
                    onClick={() => !item.disabled && handleSelect(item.value)}
                    className={`
                      w-full flex items-center space-x-2 px-4 py-3 text-left transition-colors
                      ${item.disabled 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-gray-300 hover:text-white hover:bg-dark-700 cursor-pointer'
                      }
                      ${focusedIndex === index ? 'bg-dark-700 text-white' : ''}
                      ${value === item.value ? 'bg-primary-900/30 text-primary-300' : ''}
                    `}
                    whileHover={!item.disabled ? { backgroundColor: 'rgba(55, 65, 81, 1)' } : {}}
                    disabled={item.disabled}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </motion.button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No options found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;