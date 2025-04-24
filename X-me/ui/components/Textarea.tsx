import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSave: (value: string) => void;
  isSaving?: boolean;
  placeholder?: string;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  value,
  onChange,
  onSave,
  isSaving = false,
  placeholder = "Écrivez vos instructions système ici...",
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onChange(e);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(localValue);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onClick={() => setIsEditing(true)}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[120px] p-3 bg-white dark:bg-dark-primary rounded-lg text-sm resize-y text-black dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          isEditing ? "ring-2 ring-blue-500" : "",
          className
        )}
      />
      {isSaving && (
        <div className="absolute right-3 bottom-3 text-xs text-blue-500">
          Enregistrement...
        </div>
      )}
    </div>
  );
}; 