"use client";

type GalleryItem = { path: string; url: string };

type Props = {
  label: string;
  items: GalleryItem[];
  onAdd: (files: FileList | null) => void;
  onRemove: (path: string) => void;
  disabled?: boolean;
  helperText?: string;
};

export function GalleryUploadField({ label, items, onAdd, onRemove, disabled, helperText }: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          onChange={(event) => onAdd(event.target.files)}
          className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.path} className="relative">
            <img src={item.url} alt="Gallery" className="h-28 w-full rounded-xl object-cover" />
            <button type="button" onClick={() => onRemove(item.path)} className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
