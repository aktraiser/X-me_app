'use client'

import { useState, Fragment } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  open: boolean;
  onClose: (confirmed: boolean) => void;
  isProcessing?: boolean;
  dangerConfirm?: boolean;
}

export default function ConfirmationDialog({
  title,
  description,
  confirmButtonText,
  cancelButtonText = "Annuler",
  open,
  onClose,
  isProcessing = false,
  dangerConfirm = true
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={() => onClose(false)} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/75 dark:bg-black/90 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-dark-secondary px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${dangerConfirm ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'} sm:mx-0 sm:size-10`}>
                <ExclamationTriangleIcon aria-hidden="true" className={`size-6 ${dangerConfirm ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`} />
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                  {title}
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {description}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={() => onClose(true)}
                disabled={isProcessing}
                className={`inline-flex w-full justify-center rounded-md ${dangerConfirm ? 'bg-red-600 hover:bg-red-500 dark:bg-red-700 dark:hover:bg-red-600' : 'bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-600'} px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto`}
              >
                {isProcessing ? 'Traitement...' : confirmButtonText}
              </button>
              <button
                type="button"
                data-autofocus
                onClick={() => onClose(false)}
                disabled={isProcessing}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-dark-100 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-dark-primary sm:mt-0 sm:w-auto"
              >
                {cancelButtonText}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
} 