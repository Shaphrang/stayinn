"use client";

type Props = {
  label: string;
  previewUrl?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  helperText?: string;
};

export function ImageUploadField({ label, previewUrl, onChange, disabled, helperText }: Props) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
      {previewUrl ? <img src={previewUrl} alt={label} className="mt-3 h-40 w-full rounded-xl object-cover" /> : null}
    </div>
  );
}
