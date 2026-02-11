import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FormField } from "./form-field";

type PasswordToggleFieldProps = {
  name?: string;
  label?: string;
  errors?: string[] | undefined;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
};

export function PasswordToggleField({
  name = "password",
  label = "Password",
  errors = undefined,
  placeholder = "••••••••",
  required,
  defaultValue,
}: PasswordToggleFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      name={name}
      label={label}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      required={required}
      defaultValue={defaultValue}
      error={errors}
      suffix={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-primary focus:outline-none"
        >
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      }
    />
  );
}
