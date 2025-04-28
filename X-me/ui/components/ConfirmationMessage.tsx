'use client'

import { useState, useEffect } from 'react'
import { Transition } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { XMarkIcon } from '@heroicons/react/20/solid'

interface ConfirmationMessageProps {
  message: string;
  description?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideTime?: number;
  show: boolean;
  setShow: (show: boolean) => void;
}

export default function ConfirmationMessage({
  message,
  description,
  onDismiss,
  autoHide = true,
  autoHideTime = 3000,
  show,
  setShow
}: ConfirmationMessageProps) {

  useEffect(() => {
    if (show && autoHide) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onDismiss) onDismiss();
      }, autoHideTime);
      return () => clearTimeout(timer);
    }
  }, [show, autoHide, autoHideTime, onDismiss, setShow]);

  return (
    <>
      {/* Global notification live region, render this permanently at the end of the document */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
          <Transition show={show}>
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-dark-secondary shadow-lg ring-1 ring-black/5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
                    {description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{description}</p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShow(false);
                        if (onDismiss) onDismiss();
                      }}
                      className="inline-flex rounded-md bg-white dark:bg-dark-secondary text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-dark-secondary"
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  )
} 