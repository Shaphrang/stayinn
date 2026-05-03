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
    <main className="min-h-screen bg-[#f7f2e8] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[460px] overflow-hidden bg-[radial-gradient(circle_at_8%_0%,rgba(20,184,166,0.18),transparent_26%),radial-gradient(circle_at_92%_16%,rgba(255,111,82,0.14),transparent_24%),linear-gradient(180deg,#fff9ed_0%,#f8f2e7_48%,#f4f7f1_100%)] pb-[calc(92px+env(safe-area-inset-bottom))]">
        <HomeHeader />

        {data ? (
          <div className="space-y-5">
            <section className="px-4 pt-3">
              <HeroSection data={data} />
            </section>

            <section className="px-4">
              <HeroSearchCard />
            </section>

            <CategoryChips data={data} />
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