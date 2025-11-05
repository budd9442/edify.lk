// Ensure highlight.js is available globally for Quill's syntax module
// Using the common build which includes popular languages
import hljsCommon from 'highlight.js/lib/common';

(window as any).hljs = (hljsCommon as any).default || hljsCommon;



