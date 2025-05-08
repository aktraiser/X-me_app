"use client"

import * as React from "react"
import Link from 'next/link'
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import { HelpCircle, X } from 'lucide-react'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "end", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md bg-light-secondary dark:bg-dark-secondary p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

{/* Footer avec lien vers les préférences de consentement Termly */}
const InfoBubble = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="group rounded-full p-2 bg-light-secondary dark:bg-dark-secondary shadow-lg hover:bg-gray-700 dark:hover:bg-dark-100 transition-colors outline-none">
            {isOpen ? (
              <X className="h-5 w-5 text-black/70 dark:text-white/70 group-hover:text-white" />
            ) : (
              <HelpCircle className="h-5 w-5 text-black/70 dark:text-white/70 group-hover:text-white" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/conditions-utilisation"
              className="text-sm text-black/90 dark:text-white/90 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link 
              href="/politique-confidentialite"
              className="text-sm text-black/90 dark:text-white/90 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Politique de confidentialité
            </Link>
            <Link 
              href="/a-propos"
              className="text-sm text-black/90 dark:text-white/90 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              À propos de nous
            </Link>
            <a 
              href="#" 
              className="termly-display-preferences text-sm text-black/90 dark:text-white/90 hover:underline"
            >
              Préférences de consentement
            </a>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default InfoBubble; 