import { Settings } from 'lucide-react';
import EmptyChatMessageInput from './EmptyChatEtudeMessageInput';
import SettingsDialog from './SettingsDialog';
import { useState } from 'react';
import { File } from './MarketResearchChatWindow';
import SectorStepper from './SectorStepper';

const EmptyChat = ({
  sendMessage,
  focusMode,
  setFocusMode,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  focusMode: string;
  setFocusMode: (mode: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSubsector, setSelectedSubsector] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const handleSectorSelect = (data: {
    sector: string;
    subsector?: string;
    region: string;
    city: string;
    budget: string;
  }) => {
    setSelectedSector(data.sector);
    setSelectedSubsector(data.subsector || null);
    setSelectedRegion(data.region);
    setSelectedCity(data.city);
    setSelectedBudget(data.budget);
    
    // Format structuré pour que l'agent puisse facilement parser l'information
    const message = JSON.stringify({
      type: "sector_research",
      sector: data.sector,
      subsector: data.subsector || null,
      region: data.region,
      city: data.city,
      budget: data.budget,
      query: `Fais une étude de marché pour ${data.sector}${data.subsector ? ` - ${data.subsector}` : ''} à ${data.city} (${data.region}) avec un budget de ${data.budget}.`,
      documentPath: `documentation/${data.sector.replace(/ /g, '_')}`
    });
      
    sendMessage(message);
  };

  return (
    <div className="relative">
      <SettingsDialog isOpen={isSettingsOpen} setIsOpen={setIsSettingsOpen} />
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <Settings
          className="cursor-pointer lg:hidden"
          onClick={() => setIsSettingsOpen(true)}
        />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-8">
        <h2 className="!text-black dark:!text-white text-3xl font-medium -mt-8">
          Ici c&apos;est vous le <strong>patron</strong>.
        </h2>
        <h3 className="!text-black/70 dark:!text-white/70 text-sm font-light -mt-8">
          Réalisez votre étude de marché en fonction d&apos;un secteur et d&apos;une ville
        </h3>
        
        {!selectedSector ? (
          <SectorStepper onSectorSelect={handleSectorSelect} />
        ) : (
          <EmptyChatMessageInput
            sendMessage={sendMessage}
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            optimizationMode={optimizationMode}
            setOptimizationMode={setOptimizationMode}
            fileIds={fileIds}
            setFileIds={setFileIds}
            files={files}
            setFiles={setFiles}
          />
        )}
      </div>
    </div>
  );
};

export default EmptyChat;
