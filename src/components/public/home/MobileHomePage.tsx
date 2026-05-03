//src\components\public\home\MobileHomePage.tsx
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
    <main className="min-h-screen bg-[#f6f7f5] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[460px] bg-[#f6f7f5] pb-[calc(92px+env(safe-area-inset-bottom))]">
        <HomeHeader />

        {data ? (
          <div className="space-y-5">
            <HeroSection data={data} />

            <div className="-mt-9 px-4">
              <HeroSearchCard />
            </div>

            <CategoryChips data={data} />
            <CategoryGrid data={data} />
            <PromoBannerCarousel data={data} />

            <StaySection
              title="Featured stays"
              subtitle="Handpicked places guests love"
              items={featured}
              viewAllHref="/stays?featured=true"
            />

            <StaySection
              title="Weekend picks"
              subtitle="Quick escapes around you"
              items={weekend}
              viewAllHref="/stays?section=weekend"
              compact
            />

            <StaySection
              title="Nearby stays"
              subtitle="Available around your location"
              items={nearby}
              viewAllHref="/stays?nearby=true"
              compact
            />
          </div>
        ) : (
          <HomeEmptyState />
        )}
      </div>

      <BottomNav />
    </main>
  );
}