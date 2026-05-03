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
    <main className="min-h-screen bg-[#f7f8f4] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[460px] bg-[#f7f8f4] pb-[calc(92px+env(safe-area-inset-bottom))]">
        <HomeHeader />

        {data ? (
          <div className="space-y-5">
            <div className="px-4 pt-3">
              <HeroSection data={data} />
            </div>

            <div className="px-4">
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
              layout="featured"
            />

            <StaySection
              title="Weekend picks"
              subtitle="Swipe for quick escapes"
              items={weekend}
              viewAllHref="/stays?section=weekend"
              layout="weekend"
            />

            <StaySection
              title="Nearby stays"
              subtitle="Stylish stays close to you"
              items={nearby}
              viewAllHref="/stays?nearby=true"
              layout="nearby"
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