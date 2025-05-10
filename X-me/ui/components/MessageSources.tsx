/* eslint-disable @next/next/no-img-element */
import { Document } from '@langchain/core/documents';
import { File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const MessageSources = ({ 
  sources,
  openModal,
  onClose
}: { 
  sources: Document[];
  openModal: () => void;
  onClose: () => void;
}) => {
  const [hoveredSource, setHoveredSource] = useState<Document | null>(null);
  const [isModalButtonActive, setIsModalButtonActive] = useState(false);
  const [showFullScreenModal, setShowFullScreenModal] = useState(false);

  const getSourceUrl = (source: Document) => {
    if (source.metadata.isFile) {
      const page = source.metadata.page || 1;
      return {
        viewerUrl: source.metadata.url,
        pdfUrl: `/api/uploads/${source.metadata.fileId}/content?page=${page}`
      };
    }
    return {
      viewerUrl: source.metadata.url,
      pdfUrl: source.metadata.url
    };
  };

  const getFaviconUrl = (source: Document) => {
    if (source.metadata.isFile) {
      return null;
    }
    if (!source.metadata.url) {
      return null;
    }
    try {
      const url = new URL(source.metadata.url);
      return `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}`;
    } catch {
      return null;
    }
  };

  // Récupère la description du site si disponible, sinon utilise le contenu de la page
  const getSourceDescription = (source: Document) => {
    return source.metadata.description || source.pageContent;
  };

  const filteredSources = sources.filter(source => source.metadata.type !== 'expert');

  const handleOpenModal = () => {
    setIsModalButtonActive(true);
    setShowFullScreenModal(true);
    openModal();
  };

  const handleCloseModal = () => {
    setShowFullScreenModal(false);
    setIsModalButtonActive(false);
    onClose();
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 relative">
        {filteredSources.slice(0, 3).map((source, i) => {
          const urls = getSourceUrl(source);
          const isFile = source.metadata.isFile;
          const faviconUrl = getFaviconUrl(source);
          
          const CardContent = () => (
            <>
              <p className="text-black dark:text-white text-xs line-clamp-2">
                {source.metadata.title}
              </p>
              <div className="flex flex-row items-center justify-between mt-auto">
                <div className="flex flex-row items-center space-x-1">
                  {isFile ? (
                    <div className="bg-gray-700 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                      <File size={12} className="text-black dark:text-white" />
                    </div>
                  ) : faviconUrl ? (
                    <img
                      src={faviconUrl}
                      width={16}
                      height={16}
                      alt="favicon"
                      className="rounded-lg h-4 w-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="bg-gray-700 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                      <File size={12} className="text-white/70" />
                    </div>
                  )}
                  <p className="text-xs text-black/50 dark:text-white/50 truncate max-w-[120px] flex-shrink">
                    {isFile 
                      ? `Page ${source.metadata.page || 1}`
                      : source.metadata.url
                        ? new URL(source.metadata.url).hostname.replace(/^www\./, '')
                        : 'Source'}
                  </p>
                </div>
              </div>
            </>
          );

          return (
            <div key={i} className="relative">
              <a
                href={urls.viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-gray-800 transition duration-200 rounded-lg p-3 flex flex-col justify-between h-20 font-medium cursor-pointer"
                onMouseEnter={() => setHoveredSource(source)}
                onMouseLeave={() => setHoveredSource(null)}
              >
                <CardContent />
              </a>
              {hoveredSource === source && (
                <div className="absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mt-2 top-full left-1/2 transform -translate-x-1/2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    {isFile ? (
                      <div className="bg-gray-800 flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0">
                        <File size={16} className="text-white" />
                      </div>
                    ) : faviconUrl ? (
                      <img
                        src={faviconUrl}
                        width={16}
                        height={16}
                        alt="favicon"
                        className="rounded-lg h-4 w-4 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="bg-gray-700 flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0">
                        <File size={16} className="text-black dark:text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {source.metadata.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getSourceDescription(source)}
                      </p>
                      <div className="flex items-center mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isFile 
                            ? `Document PDF - Page ${source.metadata.page || 1}`
                            : source.metadata.url
                              ? new URL(source.metadata.url).hostname.replace(/^www\./, '')
                              : 'Source'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredSources.length > 3 && (
          <button
            onClick={handleOpenModal}
            onBlur={() => setIsModalButtonActive(false)}
            className={cn(
              "bg-light-100 hover:bg-light-200 dark:bg-dark-100 dark:hover:bg-gray-800 transition duration-200 rounded-lg p-3 flex flex-col justify-between h-20 font-medium w-full",
              isModalButtonActive && "ring-2 ring-[#767171] bg-light-200 dark:bg-gray-800"
            )}
          >
            <div className="flex flex-row items-center space-x-1">
              {filteredSources.slice(3, 6).map((source, i) => {
                return source.metadata.isFile ? (
                  <div key={i} className="bg-dark-200 hover:bg-dark-100 transition duration-200 flex items-center justify-center w-6 h-6 rounded-full">
                    <File size={12} className="text-white/70" />
                  </div>
                ) : (
                  <img
                    key={i}
                    src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                    width={16}
                    height={16}
                    alt="favicon"
                    className="rounded-lg h-4 w-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                );
              })}
            </div>
            <div className="flex flex-row items-center justify-between mt-auto">
              <p className="text-xs text-black/50 dark:text-white/50">
                Voir les {filteredSources.length - 3} sources
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Full screen modal for mobile */}
      {showFullScreenModal && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50">
          <div className="fixed inset-0 bg-dark-primary p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-medium text-white">{filteredSources.length} sources</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-dark-secondary rounded-lg transition-colors"
              >
                <X className="text-white" size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {filteredSources.map((source, index) => {
                const urls = getSourceUrl(source);
                const isFile = source.metadata.isFile;
                const faviconUrl = getFaviconUrl(source);
                
                return (
                  <a
                    key={index}
                    href={urls.viewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-dark-secondary p-4 rounded-xl"
                  >
                    <div className="flex items-start space-x-3">
                      {isFile ? (
                        <div className="bg-gray-800 flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0">
                          <File size={16} className="text-white" />
                        </div>
                      ) : faviconUrl ? (
                        <img
                          src={faviconUrl}
                          width={16}
                          height={16}
                          alt="favicon"
                          className="rounded-lg h-4 w-4 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="bg-gray-700 flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0">
                          <File size={16} className="text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {source.metadata.title}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">
                          {getSourceDescription(source)}
                        </p>
                        <div className="flex items-center mt-2">
                          <p className="text-xs text-gray-400">
                            {isFile 
                              ? `Document PDF - Page ${source.metadata.page || 1}`
                              : source.metadata.url
                                ? new URL(source.metadata.url).hostname.replace(/^www\./, '')
                                : 'Source'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageSources;