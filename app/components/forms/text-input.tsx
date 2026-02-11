import { FormField } from "./form-field";

type TextFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  errors?: string[] | undefined;
  defaultValue?: string;
  type?: string;
};

export function TextField({
  name,
  label,
  placeholder,
  required,
  errors,
  defaultValue,
  type = "text",
}: TextFieldProps) {
  return (
    <FormField
      name={name}
      label={label}
      placeholder={placeholder}
      required={required}
      error={errors}
      defaultValue={defaultValue}
      type={type}
    />
  );
}
