import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient";

export function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <GradientBackground />
    </div>
  );
}
