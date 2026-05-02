"use client";
import { useMemo, useState } from "react";

type Master = { id: string; name: string; state_id?: string; district_id?: string };

export function slugify(v: string) { return v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-"); }

type Option={id:string;name:string};
type PropertyData={id?:string;name?:string;slug?:string;owner_id?:string;property_type?:string;state_id?:string;district_id?:string;location_id?:string;contact_phone?:string;contact_email?:string;whatsapp_number?:string;check_in_time?:string;check_out_time?:string;pincode?:string;status?:string;short_description?:string;description?:string;address?:string;landmark?:string;admin_notes?:string;amenities?:string[];rules?:string[];gallery_images?:string[];cover_image?:string;is_featured?:boolean;is_verified?:boolean};
type Props={data?:PropertyData;owners:Option[];states:Option[];districts:Master[];locations:Master[];amenitiesMaster:string[];action:(fd:FormData)=>void;uploadCover:(fd:FormData)=>Promise<{ok:boolean;path?:string}>;uploadGallery:(fd:FormData)=>Promise<{ok:boolean;path?:string}>};
export function PropertyForm({ data, owners, states, districts, locations, amenitiesMaster, action, uploadCover, uploadGallery }: Props) {
  const [name, setName] = useState(data?.name ?? "");
  const [slug, setSlug] = useState(data?.slug ?? "");
  const [amenities, setAmenities] = useState<string[]>(data?.amenities ?? []);
  const [rules, setRules] = useState<string[]>(data?.rules ?? [""]);
  const [gallery, setGallery] = useState<string[]>(data?.gallery_images ?? []);
  const [cover, setCover] = useState(data?.cover_image ?? "");
  const [stateId, setStateId] = useState(data?.state_id ?? "");
  const [districtId, setDistrictId] = useState(data?.district_id ?? "");
  const filteredDistricts = useMemo(()=>districts.filter((d:Master)=>!stateId||d.state_id===stateId),[districts,stateId]);
  const filteredLocations = useMemo(()=>locations.filter((l:Master)=>!districtId||l.district_id===districtId),[locations,districtId]);

  async function onCoverFile(file: File) { const fd = new FormData(); fd.append("propertyId", data?.id ?? "temp"); fd.append("file", file); const res = await uploadCover(fd); if (res?.ok) setCover(res.path); }
  async function onGalleryFile(file: File) { const fd = new FormData(); fd.append("propertyId", data?.id ?? "temp"); fd.append("file", file); const res = await uploadGallery(fd); if (res?.ok) setGallery((g)=>[...g,res.path]); }

  return <form action={action} className="space-y-4 rounded-xl border bg-white p-4">
    {data?.id ? <input type="hidden" name="id" value={data.id} /> : null}
    <input type="hidden" name="cover_image" value={cover} />
    <input type="hidden" name="gallery_images" value={JSON.stringify(gallery)} />
    <input type="hidden" name="amenities" value={JSON.stringify(amenities)} />
    <input type="hidden" name="rules" value={JSON.stringify(rules.filter(Boolean))} />
    <div className="grid md:grid-cols-2 gap-3">
      <input required name="name" value={name} onChange={(e)=>{setName(e.target.value); if(!slug) setSlug(slugify(e.target.value));}} placeholder="Property name" className="rounded border px-3 py-2" />
      <input required name="slug" value={slug} onChange={(e)=>setSlug(e.target.value)} placeholder="slug" className="rounded border px-3 py-2" />
      <select required name="owner_id" defaultValue={data?.owner_id ?? ""} className="rounded border px-3 py-2"><option value="">Owner</option>{owners.map((o)=> <option key={o.id} value={o.id}>{o.name ?? (o as unknown as {business_name:string}).business_name}</option>)}</select>
      <select name="property_type" defaultValue={data?.property_type ?? "homestay"} className="rounded border px-3 py-2">{["homestay","resort","guest_house","hotel","cottage","villa","apartment","camping","other"].map(v=><option key={v}>{v}</option>)}</select>
      <select required name="state_id" value={stateId} onChange={(e)=>{setStateId(e.target.value); setDistrictId("");}} className="rounded border px-3 py-2"><option value="">State</option>{states.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select required name="district_id" value={districtId} onChange={(e)=>setDistrictId(e.target.value)} className="rounded border px-3 py-2"><option value="">District</option>{filteredDistricts.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select required name="location_id" defaultValue={data?.location_id ?? ""} className="rounded border px-3 py-2"><option value="">Location</option>{filteredLocations.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <input name="contact_phone" defaultValue={data?.contact_phone ?? ""} placeholder="Contact phone" className="rounded border px-3 py-2" />
      <input name="contact_email" defaultValue={data?.contact_email ?? ""} placeholder="Contact email" className="rounded border px-3 py-2" />
      <input name="whatsapp_number" defaultValue={data?.whatsapp_number ?? ""} placeholder="Whatsapp" className="rounded border px-3 py-2" />
      <input name="check_in_time" defaultValue={data?.check_in_time ?? ""} type="time" className="rounded border px-3 py-2" />
      <input name="check_out_time" defaultValue={data?.check_out_time ?? ""} type="time" className="rounded border px-3 py-2" />
      <input name="pincode" defaultValue={data?.pincode ?? ""} placeholder="Pincode" className="rounded border px-3 py-2" />
      <select name="status" defaultValue={data?.status ?? "draft"} className="rounded border px-3 py-2">{["draft","pending_review","active","inactive","rejected","suspended"].map(v=><option key={v}>{v}</option>)}</select>
    </div>
    <textarea name="short_description" defaultValue={data?.short_description ?? ""} placeholder="Short description" className="w-full rounded border px-3 py-2" />
    <textarea name="description" defaultValue={data?.description ?? ""} placeholder="Description" className="w-full rounded border px-3 py-2" />
    <input name="address" defaultValue={data?.address ?? ""} placeholder="Address" className="w-full rounded border px-3 py-2" />
    <input name="landmark" defaultValue={data?.landmark ?? ""} placeholder="Landmark" className="w-full rounded border px-3 py-2" />
    <textarea name="admin_notes" defaultValue={data?.admin_notes ?? ""} placeholder="Admin notes" className="w-full rounded border px-3 py-2" />
    <div><p className="font-medium mb-2">Amenities</p><div className="grid grid-cols-2 md:grid-cols-3 gap-2">{amenitiesMaster.map((a:string)=><label key={a} className="text-sm"><input type="checkbox" checked={amenities.includes(a)} onChange={()=>setAmenities((v)=>v.includes(a)?v.filter(x=>x!==a):[...v,a])}/> {a}</label>)}</div></div>
    <div><p className="font-medium mb-2">Rules</p>{rules.map((r,i)=><div key={i} className="flex gap-2 mb-2"><input value={r} onChange={(e)=>setRules(prev=>prev.map((x,ix)=>ix===i?e.target.value:x))} className="flex-1 rounded border px-3 py-2"/><button type="button" onClick={()=>setRules(prev=>prev.filter((_,ix)=>ix!==i))}>Remove</button></div>)}<button type="button" onClick={()=>setRules((r)=>[...r,""])}>Add rule</button></div>
    <div className="space-y-2"><p className="font-medium">Cover image</p>{cover && <img src={cover} className="h-24 w-32 object-cover rounded border" alt="cover"/>}<input type="file" accept="image/*" onChange={(e)=>e.target.files?.[0]&&onCoverFile(e.target.files[0])} /></div>
    <div className="space-y-2"><p className="font-medium">Gallery images</p><div className="flex flex-wrap gap-2">{gallery.map((g)=> <img key={g} src={g} className="h-20 w-20 rounded object-cover border" alt="gallery"/>)}</div><input type="file" accept="image/*" onChange={(e)=>e.target.files?.[0]&&onGalleryFile(e.target.files[0])} /></div>
    <label><input type="checkbox" name="is_featured" value="true" defaultChecked={Boolean(data?.is_featured)} /> Featured</label>
    <label className="ml-4"><input type="checkbox" name="is_verified" value="true" defaultChecked={Boolean(data?.is_verified)} /> Verified</label>
    <button className="rounded bg-indigo-700 text-white px-4 py-2">Save Property</button>
  </form>;
}
