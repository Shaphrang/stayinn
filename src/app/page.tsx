import { getPublicHomeData } from "@/lib/public/home";
import { MobileHomePage } from "@/components/public/home/MobileHomePage";

export default async function Home() {
  const data = await getPublicHomeData().catch(() => null);
  return <MobileHomePage data={data} />;
}
