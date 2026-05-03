import type { HomeData } from "./types";
import { BottomNav } from "./BottomNav";
import { CategoryChips } from "./CategoryChips";
import { CategoryGrid } from "./CategoryGrid";
import { HeroSearchCard } from "./HeroSearchCard";
import { HeroSection } from "./HeroSection";
import { HomeEmptyState } from "./HomeEmptyState";
import { HomeHeader } from "./HomeHeader";
import { PromoBannerCarousel } from "./PromoBannerCarousel";
import { StaySection } from "./StaySection";

export function MobileHomePage({ data }: { data: HomeData | null }) {
  const featured = data?.featuredStays ?? [];
  const weekend = data?.weekendGetaways?.length ? data.weekendGetaways : featured;
  const nearby = data?.nearbyStays ?? [];

  return (
    <main className="min-h-screen bg-[#fffaf3] pb-28">
      <div className="mx-auto min-h-screen w-full max-w-[520px] bg-[#fffaf3] shadow-[0_0_40px_rgba(15,159,154,0.08)]">
        <HomeHeader />
        {data ? (
          <>
            <HeroSection data={data} />
            <HeroSearchCard />
            <CategoryChips data={data} />
            <CategoryGrid data={data} />
            <PromoBannerCarousel data={data} />
            <StaySection title="Featured stays" items={featured} viewAllHref="/stays?featured=true" />
            <StaySection title="Weekend getaways" items={weekend} viewAllHref="/stays?section=weekend" compact />
            <StaySection title="Nearby stays" items={nearby} viewAllHref="/stays?nearby=true" compact />
          </>
        ) : (
          <HomeEmptyState />
        )}
      </div>
      <BottomNav />
    </main>
  );
}
