/* eslint-disable @next/next/no-img-element */
import { PlayCircle, PlayIcon, PlusIcon, VideoIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import Lightbox, { GenericSlide, VideoSlide } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Message } from './ChatWindow';

type Video = {
  url: string;
  img_src: string;
  title: string;
  iframe_src: string;
};

declare module 'yet-another-react-lightbox' {
  export interface VideoSlide extends GenericSlide {
    type: 'video-slide';
    src: string;
    iframe_src: string;
  }

  interface SlideTypes {
    'video-slide': VideoSlide;
  }
}

const Searchvideos = ({
  query,
  chatHistory,
}: {
  query: string;
  chatHistory: Message[];
}) => {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<VideoSlide[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Fonction pour vérifier si une URL YouTube est accessible
  const checkYouTubeUrl = async (url: string): Promise<boolean> => {
    try {
      // On ne peut pas vérifier directement l'existence d'une vidéo YouTube à cause des restrictions CORS
      // Alors on vérifie indirectement via la miniature
      const videoId = extractVideoId(url);
      if (!videoId) return false;
      
      // Vérifier si la miniature existe
      const imgUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      return await testImage(imgUrl);
    } catch (e) {
      console.error('Erreur lors de la vérification de l\'URL YouTube:', e);
      return false;
    }
  };

  // Fonction pour extraire l'ID vidéo d'une URL YouTube
  const extractVideoId = (url: string): string => {
    try {
      if (!url) return '';
      
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        try {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        } catch (e) {
          const match = url.match(/[?&]v=([^&#]*)/);
          videoId = match && match[1] ? match[1] : '';
        }
      } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([^?&#]*)/);
        videoId = match && match[1] ? match[1] : '';
      } else if (url.includes('youtube.com/embed/')) {
        const match = url.match(/youtube\.com\/embed\/([^?&#]*)/);
        videoId = match && match[1] ? match[1] : '';
      }
      
      // Nettoyage de l'ID
      return videoId.replace(/[^a-zA-Z0-9_-]/g, '');
    } catch (e) {
      console.error('Erreur lors de l\'extraction de l\'ID YouTube:', e);
      return '';
    }
  };

  // Fonction pour tester si une image est chargeable
  const testImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  return (
    <>
      {!loading && videos === null && !videoError && (
        <button
          onClick={async () => {
            setLoading(true);
            setVideoError(null);

            const chatModelProvider = localStorage.getItem('chatModelProvider');
            const chatModel = localStorage.getItem('chatModel');

            const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
            const customOpenAIKey = localStorage.getItem('openAIApiKey');

            console.log('Recherche de vidéos pour:', query);
            
            // Mapper l'historique au format attendu par l'API (/api/videos)
            const formattedChatHistory = chatHistory.map(msg => {
              if (msg.role === 'user' || msg.role === 'assistant') {
                return { role: msg.role, content: msg.content };
              }
              return msg;
            });

            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/videos`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    query: query,
                    chatHistory: formattedChatHistory,
                    chatModel: {
                      provider: chatModelProvider,
                      model: chatModel,
                      ...(chatModelProvider === 'custom_openai' && {
                        customOpenAIBaseURL: customOpenAIBaseURL,
                        customOpenAIKey: customOpenAIKey,
                      }),
                    },
                  }),
                },
              );
              
              if (!res.ok) {
                throw new Error(`Erreur API: ${res.status}`);
              }
              
              const data = await res.json();
              console.log('Réponse API videos:', data);

              let videos = data.videos ?? [];
              
              if (!videos || videos.length === 0) {
                setVideoError("Aucune vidéo trouvée pour cette recherche.");
                setLoading(false);
                return;
              }
              
              // Filtrer les vidéos pour ne garder que celles avec des propriétés valides
              let validVideos = videos.filter((video: Video) => {
                const isValid = video && 
                  typeof video.img_src === 'string' && 
                  typeof video.url === 'string' && 
                  typeof video.title === 'string' &&
                  typeof video.iframe_src === 'string';
                
                return isValid;
              });
              
              if (validVideos.length === 0) {
                setVideoError("Les vidéos reçues ne sont pas dans un format valide.");
                setLoading(false);
                return;
              }
              
              // Vérifier l'accessibilité des vidéos
              const verificationPromises = validVideos.map(async (video: Video) => {
                // Vérifier que l'URL YouTube est valide
                const isVideoValid = await checkYouTubeUrl(video.url);
                
                // Vérifier que l'image miniature est accessible
                const isImgAvailable = await testImage(video.img_src);
                
                if (!isVideoValid) {
                  console.warn(`Vidéo non accessible: ${video.title}`, video.url);
                  return null; // Cette vidéo sera filtrée
                }
                
                if (!isImgAvailable) {
                  console.warn(`Image non disponible pour ${video.title}`, video.img_src);
                  
                  // Extraire l'ID vidéo et normaliser les URLs
                  const videoId = extractVideoId(video.url);
                  if (videoId) {
                    // Utiliser la miniature YouTube officielle
                    video.img_src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  } else {
                    // Fallback sur une image générée avec le titre
                    const encodedTitle = encodeURIComponent(video.title.substring(0, 30));
                    video.img_src = `https://placehold.co/480x270/1f2937/ffffff?text=${encodedTitle}`;
                  }
                }
                
                // Normaliser les URLs pour s'assurer qu'elles sont correctes
                const videoId = extractVideoId(video.url);
                if (videoId) {
                  video.iframe_src = `https://www.youtube.com/embed/${videoId}`;
                }
                
                return video;
              });
              
              // Attendre toutes les vérifications
              const checkedVideos = (await Promise.all(verificationPromises)).filter(Boolean) as Video[];
              
              if (checkedVideos.length === 0) {
                setVideoError("Aucune vidéo accessible n'a été trouvée. Essayez une autre recherche.");
                setLoading(false);
                return;
              }
              
              console.log(`${checkedVideos.length} vidéos valides et accessibles trouvées`);
              setVideos(checkedVideos);
              
              // Créer les slides pour la lightbox
              setSlides(
                checkedVideos.map((video: Video) => {
                  return {
                    type: 'video-slide',
                    iframe_src: video.iframe_src,
                    src: video.img_src,
                  };
                }),
              );
            } catch (error) {
              console.error('Erreur lors de la récupération des vidéos:', error);
              setVideoError("Erreur lors de la recherche de vidéos. Veuillez réessayer.");
            } finally {
              setLoading(false);
            }
          }}
          className="border border-dashed border-gray-700 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-dark-100 active:scale-95 duration-200 transition px-4 py-2 flex flex-row items-center justify-between rounded-lg text-black dark:text-white text-sm w-full"
        >
          <div className="flex flex-row items-center space-x-2">
            <VideoIcon size={17} />
            <p>Voir des videos</p>
          </div>
          <PlusIcon className="text-black dark:text-white" size={17} />
        </button>
      )}
      
      {loading && (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
            />
          ))}
        </div>
      )}
      
      {videoError && (
        <div className="border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-900 p-3 rounded-lg text-sm text-red-700 dark:text-red-400">
          <p>{videoError}</p>
          <button 
            onClick={() => {
              setVideoError(null);
              setVideos(null);
            }}
            className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}
      
      {videos !== null && videos.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {/* Video principale */}
            <div
              onClick={() => {
                setOpen(true);
                setSlides([slides[0], ...slides.slice(1)]);
              }}
              className="relative transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer w-full"
            >
              <img
                src={videos[0].img_src}
                alt={videos[0].title}
                className="relative h-full w-full aspect-video object-cover rounded-lg"
                onError={(e) => {
                  console.error('Erreur de chargement d\'image:', videos[0].img_src);
                  // Utiliser une image par défaut adaptée aux vidéos
                  const encodedTitle = encodeURIComponent(videos[0].title.substring(0, 30));
                  e.currentTarget.src = `https://placehold.co/480x270/1f2937/ffffff?text=${encodedTitle}`;
                  e.currentTarget.onerror = null;
                }}
              />
              <div className="absolute bg-white/70 dark:bg-dark-100/70 text-black/70 dark:text-white/70 px-2 py-1 flex flex-row items-center space-x-1 bottom-1 right-1 rounded-md">
                <PlayCircle size={15} />
                <p className="text-xs">Regarder</p>
              </div>
            </div>

            {/* Grid des vidéos restantes */}
            <div className="grid grid-cols-2 gap-2">
              {videos.slice(1, 5).map((video: Video, i: number) => (
                <div
                  onClick={() => {
                    setOpen(true);
                    setSlides([
                      slides[i + 1],
                      slides[0],
                      ...slides.slice(1, i + 1),
                      ...slides.slice(i + 2),
                    ]);
                  }}
                  className="relative transition duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer"
                  key={i}
                >
                  <img
                    src={video.img_src}
                    alt={video.title}
                    className="relative h-full w-full aspect-video object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Erreur de chargement d\'image:', video.img_src);
                      // Utiliser une image par défaut adaptée aux vidéos
                      const encodedTitle = encodeURIComponent(video.title.substring(0, 30));
                      e.currentTarget.src = `https://placehold.co/480x270/1f2937/ffffff?text=${encodedTitle}`;
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="absolute bg-white/70 dark:bg-dark-100/70 text-black/70 dark:text-white/70 px-2 py-1 flex flex-row items-center space-x-1 bottom-1 right-1 rounded-md">
                    <PlayCircle size={15} />
                    <p className="text-xs">Regarder</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Liste des titres des vidéos */}
            <div className="mt-2 border border-blue-300 dark:border-blue-700 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
              <h3 className="text-sm font-bold mb-1 text-black dark:text-white">Vidéos trouvées :</h3>
              <ul className="list-disc pl-5">
                {videos.map((video, idx) => (
                  <li key={idx} className="text-xs mb-1 text-black/80 dark:text-white/80">
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {video.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Lightbox
            open={open}
            close={() => setOpen(false)}
            slides={slides}
            render={{
              slide: ({ slide }: { slide: any }) =>
                slide.type === 'video-slide' ? (
                  <div className="h-full w-full flex flex-row items-center justify-center">
                    <iframe
                      src={slide.iframe_src}
                      className="aspect-video max-h-[95vh] w-[95vw] rounded-2xl md:w-[80vw]"
                      allowFullScreen
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : null,
            }}
          />
        </>
      )}
    </>
  );
};

export default Searchvideos;
