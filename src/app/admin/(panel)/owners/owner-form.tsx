import Link from "next/link";
import { createOwnerAction, updateOwnerAction } from "./actions";

type OwnerStatus = "pending" | "approved" | "rejected" | "suspended";

type ProfileOption = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

type OwnerFormData = {
  id?: string | null;
  profile_id?: string | null;
  business_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status?: OwnerStatus | null;
};

type OwnerFormProps = {
  profiles: ProfileOption[];
  owner?: OwnerFormData;
};

const ownerStatuses: OwnerStatus[] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
];

function formatStatus(status: OwnerStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getProfileLabel(profile: ProfileOption) {
  const identifier = profile.email ?? profile.phone ?? profile.id.slice(0, 6);

  return `${profile.full_name} (${identifier})`;
}

export function OwnerForm({ profiles, owner }: OwnerFormProps) {
  const isEdit = Boolean(owner?.id);
  const action = isEdit ? updateOwnerAction : createOwnerAction;
  const hasProfiles = profiles.length > 0;

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
    >
      {isEdit ? (
        <input type="hidden" name="id" value={owner?.id ?? ""} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Profile
          <select
            name="profile_id"
            defaultValue={owner?.profile_id ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            required
            disabled={!hasProfiles}
          >
            <option value="" disabled>
              {hasProfiles ? "Select profile" : "No profiles available"}
            </option>

            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {getProfileLabel(profile)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            defaultValue={owner?.status ?? "pending"}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            required
          >
            {ownerStatuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Business Name
          <input
            name="business_name"
            defaultValue={owner?.business_name ?? ""}
            required
            minLength={2}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            placeholder="Enter business name"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Owner Name
          <input
            name="contact_person"
            defaultValue={owner?.contact_person ?? ""}
            required
            minLength={2}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            placeholder="Enter owner name"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            name="phone"
            type="tel"
            defaultValue={owner?.phone ?? ""}
            required
            minLength={10}
            maxLength={15}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            placeholder="10 to 15 digit phone number"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            defaultValue={owner?.email ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
            placeholder="owner@example.com"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Address
        <textarea
          name="address"
          defaultValue={owner?.address ?? ""}
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-slate-400"
          rows={3}
          placeholder="Enter address"
        />
      </label>

      {!hasProfiles ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No active owner profiles are available. Please create or activate an
          owner profile before creating an owner.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!hasProfiles}
          className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update Owner" : "Create Owner"}
        </button>

        <Link
          className="rounded-xl border px-4 py-2 text-center font-medium transition hover:bg-slate-50"
          href="/admin/owners"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}