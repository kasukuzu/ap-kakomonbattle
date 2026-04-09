type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
};

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  return <span className={`loading-spinner loading-spinner-${size}`} aria-hidden="true" />;
}
