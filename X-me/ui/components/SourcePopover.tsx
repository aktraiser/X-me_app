import React from 'react';
import { File } from 'lucide-react';
import { Document } from '@langchain/core/documents';

// Define SourceMetadata interface
interface SourceMetadata {
  url?: string;
  isFile?: boolean;
  type?: string;
  page?: number;
  title?: string;
  favicon?: string;
}

// Define the type for source documents
interface SourceDocument extends Document {
  metadata: SourceMetadata;
}

interface SourcePopoverProps {
  source: SourceDocument;
  number: number;
  onExpertClick?: (source: SourceDocument) => void;
}

const SourcePopover: React.FC<SourcePopoverProps> = ({ source, number, onExpertClick }) => {
  const sourceUrl = source?.metadata?.url || '#';
  const sourceTitle = source?.metadata?.title || 'Source';
  const isFile = source?.metadata?.isFile;
  const pageNumber = source?.metadata?.page || 1;
  const isExpert = source?.metadata?.type === 'expert';
  
  let faviconUrl: string | null = null;
  try {
    if (!isFile && sourceUrl && sourceUrl !== '#') {
      faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(new URL(sourceUrl).origin)}`;
    } 
  } catch (error) {
    faviconUrl = null;
  }
  
  const hostname = isFile ? `Page ${pageNumber}` : (sourceUrl && sourceUrl !== '#') ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'Source';

  // Format page content to remove excessive whitespace and links
  const formatContent = (content: string): string => {
    if (!content) return '';
    // Remove multiple spaces, tabs, and newlines
    let formatted = content.replace(/\s+/g, ' ').trim();
    // Remove common link patterns and HTML tags
    formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    formatted = formatted.replace(/<[^>]+>/g, '');
    // Limit length
    return formatted.length > 150 ? formatted.substring(0, 150) + '...' : formatted;
  };

  // Générer un extrait direct du contenu sans appel API
  const excerpt = formatContent(source.pageContent);

  return (
    <span className="group relative inline-flex align-middle mx-px"> 
      <button
        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs bg-black/10 dark:bg-white/10 text-black dark:text-white cursor-pointer hover:bg-[#c59d3f]/20 hover:text-[#c59d3f] dark:hover:bg-[#c59d3f]/20 dark:hover:text-[#c59d3f] transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Vérifier explicitement si c'est un expert et appeler le callback
          if (isExpert && onExpertClick) {
            console.log('🔍 Clic sur source expert détecté:', source.metadata);
            onExpertClick(source);
          } else if (sourceUrl !== '#') {
            // Pour les sources non-experts, ouvrir l'URL dans un nouvel onglet
            window.open(sourceUrl, '_blank');
          }
        }}
      >
        {number}
      </button>
      
      {/* Popover sur desktop */}
      <div className="hidden md:block absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 bottom-full left-1/2 transform -translate-x-1/2 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2">
            {sourceTitle}
          </h3>
          <p className="text-xs text-black dark:text-gray-400 line-clamp-3">
            {excerpt}
          </p>
          <div className="flex items-center mt-1">
            {isFile ? (
              <div className="flex-shrink-0 bg-gray-800 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-black dark:text-white" />
              </div>
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                width={16}
                height={16}
                alt="favicon"
                className="flex-shrink-0 rounded-sm h-4 w-4 object-cover mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex-shrink-0 bg-gray-700 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-white" />
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
              {isFile
                ? `Document PDF - Page ${pageNumber}`
                : hostname}
              {isExpert && <span className="ml-1 text-[#c59d3f]">(Expert)</span>}
            </p>
          </div>
        </div>
      </div>
      
      {/* Popover sur mobile */}
      <div className="md:hidden absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 top-6 left-1/2 transform -translate-x-1/2 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-200">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2">
            {sourceTitle}
          </h3>
          <p className="text-xs text-black dark:text-gray-400 line-clamp-3">
            {excerpt}
          </p>
          <div className="flex items-center mt-1">
            {isFile ? (
              <div className="flex-shrink-0 bg-gray-800 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-black dark:text-white" />
              </div>
            ) : faviconUrl ? (
              <img
                src={faviconUrl}
                width={16}
                height={16}
                alt="favicon"
                className="flex-shrink-0 rounded-sm h-4 w-4 object-cover mr-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex-shrink-0 bg-gray-700 flex items-center justify-center w-4 h-4 rounded-full mr-2">
                <File size={10} className="text-white" />
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
              {isFile
                ? `Document PDF - Page ${pageNumber}`
                : hostname}
              {isExpert && <span className="ml-1 text-[#c59d3f]">(Expert)</span>}
            </p>
          </div>
        </div>
      </div>
    </span>
  );
};

export default SourcePopover; 