import React from 'react';
import { File, Users } from 'lucide-react';
import { Document } from '@langchain/core/documents';

// Define SourceMetadata interface
interface SourceMetadata {
  url?: string;
  isFile?: boolean;
  type?: string;
  page?: number;
  title?: string;
  favicon?: string;
  expertId?: string;
  activité?: string;
  tarif?: string;
  expertises?: string;
  expertData?: any;
  image_url?: string;
  logo?: string;
  site_web?: string;
  reseau?: string;
  description?: string;
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
  
  // Extraction des données basiques
  const expertName = isExpert && sourceTitle ? sourceTitle.split('-')[0].trim() : sourceTitle;
  
  // Extraction des infos expert depuis metadata ou expertData
  const expertData = source?.metadata?.expertData || {};
  
  // Extraire les expertises
  const expertises = source?.metadata?.expertises || expertData?.expertises || '';
  
  // Extraction des infos activité et tarif
  // IMPORTANT: Notez l'utilisation du é accentué comme dans ExpertCard.tsx
  const activité = expertData?.activité || source?.metadata?.activité || "Expert";
  const tarif = source?.metadata?.tarif || expertData?.tarif || '';
  
  // Nom et photo
  const expertNom = expertData?.nom || '';
  const expertPrenom = expertData?.prenom || '';
  const expertFullName = expertPrenom && expertNom ? `${expertPrenom} ${expertNom}` : '';
  const expertImage = expertData?.image_url || source?.metadata?.image_url || null;
  
  // Données pour sources non-expert
  let faviconUrl: string | null = null;
  try {
    if (!isFile && sourceUrl && sourceUrl !== '#') {
      faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${encodeURIComponent(new URL(sourceUrl).origin)}`;
    } 
  } catch (error) {
    faviconUrl = null;
  }
  
  const hostname = isFile ? `Page ${pageNumber}` : (sourceUrl && sourceUrl !== '#') ? new URL(sourceUrl).hostname.replace(/^www\./, '') : 'Source';

  // Format page content
  const formatContent = (content: string): string => {
    if (!content) return '';
    let formatted = content.replace(/\s+/g, ' ').trim();
    formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    formatted = formatted.replace(/<[^>]+>/g, '');
    return formatted.length > 150 ? formatted.substring(0, 150) + '...' : formatted;
  };
  
  // Récupérer la description ou le contenu formaté, limitée à 3 phrases
  const getDescription = (): string => {
    // Choisir entre description ou contenu formaté
    let text = source.metadata.description || formatContent(source.pageContent);
    if (!text) return '';
    
    // Nettoyer le texte de tout contenu technique
    text = text
      // Supprimer les URL (http:// ou https://)
      .replace(/https?:\/\/\S+/g, '')
      // Supprimer les éléments techniques comme [Rechercher], format=, display:none, etc.
      .replace(/\[.*?\]/g, '')
      .replace(/\(\(.*?\)\)/g, '')
      .replace(/format=\S+/g, '')
      .replace(/display:\s*none;?/g, '')
      // Supprimer les chaînes hexadécimales
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '')
      // Supprimer les accolades et leur contenu
      .replace(/\{[^}]*\}/g, '')
      // Supprimer tous les crochets et parenthèses isolés
      .replace(/[\[\]\(\)]/g, ' ')
      // Remplacer les caractères d'échappement et techniques
      .replace(/\\n|\\r|\\t/g, ' ')
      // Supprimer les séquences de caractères techniques comme cdncom, cdn, png, jpg
      .replace(/\b\S*(?:cdn|png|jpg|format|search|content)\S*\b/g, '')
      // Nettoyer la ponctuation excessive
      .replace(/[.!?]{2,}/g, '.');

    // Fusionner les espaces multiples
    text = text.replace(/\s+/g, ' ').trim();
    
    // Diviser le texte en phrases
    const sentences = text.split(/(?<=[.!?])\s+|(?<=[.!?])$/);
    
    // Filtrer les phrases trop courtes ou sans valeur
    const significantSentences = sentences.filter(sentence => {
      // Ignorer les phrases trop courtes
      if (sentence.length < 20) return false;
      
      // Ignorer les phrases avec trop de chiffres ou caractères spéciaux
      const specialCharRatio = (sentence.match(/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9\s.,!?]/g) || []).length / sentence.length;
      if (specialCharRatio > 0.2) return false;
      
      return true;
    });
    
    // Prendre maximum 2 phrases significatives pour faire plus concis
    let result = significantSentences.slice(0, 2).join(' ');
    
    // Limiter la longueur finale à 120 caractères maximum
    if (result.length > 120) {
      result = result.substring(0, 117) + '...';
    } else if (significantSentences.length > 2 || sentences.length > significantSentences.length) {
      result += '...';
    }
    
    return result;
  };
  
  const excerpt = getDescription();

  return (
    <span className="group relative inline-flex align-middle mx-px"> 
      <button
        className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs bg-black/10 dark:bg-white/10 text-black dark:text-white cursor-pointer hover:bg-[#c59d3f]/20 hover:text-[#c59d3f] dark:hover:bg-[#c59d3f]/20 dark:hover:text-[#c59d3f] transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (isExpert && onExpertClick) {
            onExpertClick(source);
          } else if (sourceUrl !== '#') {
            window.open(sourceUrl, '_blank');
          }
        }}
      >
        {number}
      </button>
      
      {/* Popover unifié (plus simple, fonctionne sur mobile et desktop) */}
      <div className="absolute z-50 w-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 top-6 left-0 border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 md:bottom-full md:top-auto">
        {isExpert ? (
          /* Affichage simplifié pour les experts */
          <div className="flex flex-col space-y-2">
            {/* En-tête avec photo et nom */}
            <div className="flex items-center gap-3 mb-1">
              {expertImage ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 flex items-center justify-center">
                  <img 
                    src={expertImage} 
                    alt={expertFullName || 'Expert'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {expertFullName || expertName}
                </div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {activité}
                </div>
              </div>
            </div>
            
            {/* Expertises */}
            {expertises && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expertises</div>
                <div className="flex flex-wrap gap-1">
                  {expertises.split(',').slice(0, 3).map((exp: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded">
                      {exp.trim()}
                    </span>
                  ))}
                  {expertises.split(',').length > 3 && 
                    <span className="text-xs text-gray-500 dark:text-gray-400">+{expertises.split(',').length - 3}</span>
                  }
                </div>
              </div>
            )}
            
            {/* Tarif */}
            {tarif && (
              <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-semibold">{tarif}€</span> / jour
              </div>
            )}
          </div>
        ) : (
          /* Affichage standard pour les autres sources */
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {sourceTitle}
            </h3>
            {excerpt && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {excerpt}
              </p>
            )}
            <div className="flex items-center mt-1">
              {isFile ? (
                <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 w-4 h-4 rounded-full mr-2 flex items-center justify-center">
                  <File size={10} className="text-gray-600 dark:text-gray-300" />
                </div>
              ) : faviconUrl ? (
                <img
                  src={faviconUrl}
                  width={16}
                  height={16}
                  alt="favicon"
                  className="mr-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 w-4 h-4 rounded-full mr-2 flex items-center justify-center">
                  <File size={10} className="text-gray-600 dark:text-gray-300" />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {isFile ? `Document PDF - Page ${pageNumber}` : hostname}
              </p>
            </div>
          </div>
        )}
      </div>
    </span>
  );
};

export default SourcePopover; 