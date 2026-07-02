import { UnifiedNavbar } from "@/components/unified-navbar";
import { HomeFooter } from "./HomeFooter";
import { ProductContent } from "./ProductContent";

export function ProductPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UnifiedNavbar />
      <ProductContent />
      <HomeFooter />
    </div>
  );
}
