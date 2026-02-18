import * as React from "react";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

interface FormSelectProps {
  label?: string;
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  options: Option[];
  helperText?: string;
  error?: string | string[];
  required?: boolean;
  containerClassName?: string;
  disabled?: boolean;
}

export function FormSelect({
  label,
  name,
  value,
  onValueChange,
  defaultValue,
  placeholder,
  options,
  helperText,
  error,
  required,
  containerClassName,
  disabled,
}: FormSelectProps) {
  const fieldId = name;
  const errorText = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label
          htmlFor={fieldId}
          className={cn(errorText && "text-destructive")}
        >
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select
        name={name}
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={fieldId}
          className={cn(
            errorText && "border-destructive focus:ring-destructive",
            "w-full",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && !errorText && (
        <p id={`${fieldId}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
      {errorText && <p className="text-sm text-destructive">{errorText}</p>}
    </div>
  );
}
