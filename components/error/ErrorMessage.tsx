import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, XCircle, AlertTriangle, Info } from "lucide-react";

type ErrorType = "error" | "warning" | "info" | "destructive";

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: ErrorType;
  className?: string;
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  destructive: AlertCircle,
};

const variantMap = {
  error: "destructive",
  warning: "default",
  info: "default",
  destructive: "destructive",
} as const;

export function ErrorMessage({ title, message, type = "error", className }: ErrorMessageProps) {
  const Icon = iconMap[type];
  const variant = variantMap[type];

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
