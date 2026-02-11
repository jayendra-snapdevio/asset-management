import * as React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  suffix?: React.ReactNode;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, required, containerClassName, id, name, className, suffix, ...props }, ref) => {
    const fieldId = id || name;
    const errorText = Array.isArray(error) ? error[0] : error;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={fieldId} className={cn(errorText && "text-destructive")}>
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={fieldId}
            name={name}
            ref={ref}
            className={cn(
              errorText && "border-destructive focus-visible:ring-destructive",
              suffix && "pr-10",
              className
            )}
            aria-describedby={errorText ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
            aria-invalid={!!errorText}
            required={required}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {suffix}
            </div>
          )}
        </div>
        {helperText && !errorText && (
          <p id={`${fieldId}-helper`} className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        {errorText && (
          <p id={`${fieldId}-error`} className="text-sm text-destructive">
            {errorText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
