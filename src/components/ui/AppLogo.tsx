export const AppLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <img
        src="/cod-logo.png"
        alt="COD System"
        className={className}
      />
    </div>
  );
};