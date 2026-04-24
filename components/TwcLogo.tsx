export function TwcLogo({ className }: { className?: string }) {
  return (
    <img
      src="/twc-logo.svg"
      alt="The Weather Company"
      className={className ?? "h-5 inline-block opacity-70"}
    />
  );
}
