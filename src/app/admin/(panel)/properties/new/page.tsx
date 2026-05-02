import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/guards";
import { getTable } from "@/lib/admin-data";
import { PropertyForm } from "@/components/admin/property-form";
import { createProperty, uploadPropertyCoverImage, uploadPropertyGalleryImage } from "../actions";

export default async function Page() {
  await requirePlatformAdmin();
  const owners = await getTable("owner_profiles", "id,business_name", "&status=eq.approved&order=business_name.asc");
  const states = await getTable("states", "id,name", "&order=name.asc");
  const districts = await getTable("districts", "id,name,state_id", "&order=name.asc");
  const locations = await getTable("locations", "id,name,district_id", "&order=name.asc");
  const settings = await getTable("platform_settings", "setting_key,setting_value", "&setting_key=eq.property_amenities_master&limit=1");
  const amenitiesMaster = (settings?.[0]  as { setting_value?: string[] })?.setting_value ?? [];
  async function action(fd: FormData){"use server"; const r=await createProperty(fd); if(r.ok) redirect('/admin/properties'); }
  return <div><h1 className="text-2xl font-semibold mb-4">Create Property</h1><PropertyForm owners={owners} states={states} districts={districts} locations={locations} amenitiesMaster={amenitiesMaster} action={action} uploadCover={uploadPropertyCoverImage} uploadGallery={uploadPropertyGalleryImage} /></div>;
}
