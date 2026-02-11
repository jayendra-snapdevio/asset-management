import * as React from "react";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, required, containerClassName, id, name, className, ...props }, ref) => {
    const fieldId = id || name;
    const errorText = Array.isArray(error) ? error[0] : error;

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label htmlFor={fieldId} className={cn(errorText && "text-destructive")}>
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <Textarea
          id={fieldId}
          name={name}
          ref={ref}
          className={cn(
            errorText && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-describedby={errorText ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined}
          aria-invalid={!!errorText}
          required={required}
          {...props}
        />
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

FormTextarea.displayName = "FormTextarea";
