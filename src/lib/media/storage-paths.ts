export const STAYINN_MEDIA_BUCKET = "stayinn-media";

function shortId(id?: string | null) {
  if (!id) return "temp";
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return clean.slice(0, 6) || "temp";
}

export function slugifyStorageSegment(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return cleaned || "item";
}

function stamp() {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function entityFolder(value: { id?: string | null; slug?: string | null; name?: string | null }) {
  const base = slugifyStorageSegment(value.slug || value.name || "item");
  return `${base}-${shortId(value.id)}`;
}

export function getPropertyMediaBasePath(property: { id?: string | null; slug?: string | null; name?: string | null }) {
  return `properties/${entityFolder(property)}`;
}

export function getPropertyCoverPath(property: { id?: string | null; slug?: string | null; name?: string | null }) {
  return `${getPropertyMediaBasePath(property)}/cover/cover-${stamp()}.webp`;
}

export function getPropertyGalleryPath(property: { id?: string | null; slug?: string | null; name?: string | null }, index: number) {
  return `${getPropertyMediaBasePath(property)}/gallery/gallery-${stamp()}-${index + 1}.webp`;
}

export function getRoomMediaBasePath(
  property: { id?: string | null; slug?: string | null; name?: string | null },
  room: { id?: string | null; slug?: string | null; name?: string | null },
) {
  return `${getPropertyMediaBasePath(property)}/rooms/${entityFolder(room)}`;
}

export function getRoomCoverPath(
  property: { id?: string | null; slug?: string | null; name?: string | null },
  room: { id?: string | null; slug?: string | null; name?: string | null },
) {
  return `${getRoomMediaBasePath(property, room)}/cover/cover-${stamp()}.webp`;
}

export function getRoomGalleryPath(
  property: { id?: string | null; slug?: string | null; name?: string | null },
  room: { id?: string | null; slug?: string | null; name?: string | null },
  index: number,
) {
  return `${getRoomMediaBasePath(property, room)}/gallery/gallery-${stamp()}-${index + 1}.webp`;
}
