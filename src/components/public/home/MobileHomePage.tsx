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
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[460px] overflow-hidden bg-[#fbfcfb] pb-[calc(92px+env(safe-area-inset-bottom))]">
        <HomeHeader />

        {data ? (
          <div className="space-y-5">
            <section className="space-y-3 px-4 pt-3">
              <HeroSection data={data} />
              <HeroSearchCard />
            </section>

            {/*<CategoryChips data={data} />*/}
            <CategoryGrid data={data} />
            <PromoBannerCarousel data={data} />

            <StaySection
              title="Featured stays"
              subtitle="Handpicked places, loved by guests"
              items={featured}
              viewAllHref="/stays?featured=true"
              layout="featured"
            />

            <StaySection
              title="Weekend picks"
              subtitle="Quick escapes for your weekend"
              items={weekend}
              viewAllHref="/stays?section=weekend"
              layout="weekend"
            />

            <StaySection
              title="Nearby stays"
              subtitle="Stays close to you"
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