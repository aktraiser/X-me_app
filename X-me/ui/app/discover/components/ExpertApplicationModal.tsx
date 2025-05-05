import { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import ExpertApplicationForm from './ExpertApplicationForm';
import { useNavVisibility } from '@/hooks/useNavVisibility';

interface ExpertApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpertApplicationModal({ isOpen, onClose }: ExpertApplicationModalProps) {
  const { setNavVisible } = useNavVisibility();
  
  // Masquer la navigation mobile lorsque la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      setNavVisible(false);
    } else {
      setNavVisible(true);
    }
  }, [isOpen, setNavVisible]);
  
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Fermer</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                
                <ExpertApplicationForm 
                  onSuccess={handleSuccess} 
                  onCancel={onClose} 
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 