import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps & Omit<React.HTMLAttributes<HTMLButtonElement>, 'onChange'>>(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange && onChange(!checked)}
        className={className}
        {...props}
      />
    );
  }
);

Switch.displayName = "Switch";

export { Switch }; 