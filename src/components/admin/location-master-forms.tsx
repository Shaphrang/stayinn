"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type StateOption = {
  id: string;
  name: string;
  is_active?: boolean;
};

type DistrictOption = {
  id: string;
  state_id: string;
  name: string;
  is_active?: boolean;
  state_name?: string | null;
};

type StateFormData = {
  id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type DistrictFormData = {
  id?: string | null;
  state_id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type LocationFormData = {
  id?: string | null;
  state_id?: string | null;
  district_id?: string | null;
  name?: string | null;
  slug?: string | null;
  is_active?: boolean | null;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function StateForm({
  data,
  action,
}: {
  data?: StateFormData;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const isEdit = Boolean(data?.id);

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      {isEdit ? <input type="hidden" name="id" value={data?.id ?? ""} /> : null}

      <label className="block text-sm font-medium text-slate-700">
        State Name
        <input
          name="name"
          defaultValue={data?.name ?? ""}
          required
          minLength={2}
          placeholder="Example: Meghalaya"
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={data?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300"
        />
        Active
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          {isEdit ? "Update State" : "Create State"}
        </button>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function DistrictForm({
  data,
  states,
  action,
}: {
  data?: DistrictFormData;
  states: StateOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const isEdit = Boolean(data?.id);
  const hasStates = states.length > 0;

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      {isEdit ? <input type="hidden" name="id" value={data?.id ?? ""} /> : null}

      <label className="block text-sm font-medium text-slate-700">
        State
        <select
          name="state_id"
          defaultValue={data?.state_id ?? ""}
          required
          disabled={!hasStates}
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        >
          <option value="" disabled>
            {hasStates ? "Select state" : "No states available"}
          </option>

          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        District Name
        <input
          name="name"
          defaultValue={data?.name ?? ""}
          required
          minLength={2}
          placeholder="Example: East Khasi Hills"
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={data?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300"
        />
        Active
      </label>

      {!hasStates ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Please create an active state first.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!hasStates}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update District" : "Create District"}
        </button>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function LocationForm({
  data,
  states,
  districts,
  action,
}: {
  data?: LocationFormData;
  states: StateOption[];
  districts: DistrictOption[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const isEdit = Boolean(data?.id);

  const [name, setName] = useState(data?.name ?? "");
  const [slug, setSlug] = useState(data?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(data?.slug));
  const [stateId, setStateId] = useState(data?.state_id ?? "");
  const [districtId, setDistrictId] = useState(data?.district_id ?? "");

  const filteredDistricts = useMemo(() => {
    if (!stateId) return districts;

    return districts.filter((district) => district.state_id === stateId);
  }, [districts, stateId]);

  const hasStates = states.length > 0;
  const hasDistricts = filteredDistricts.length > 0;

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      {isEdit ? <input type="hidden" name="id" value={data?.id ?? ""} /> : null}

      <label className="block text-sm font-medium text-slate-700">
        State
        <select
          name="state_id"
          value={stateId}
          onChange={(event) => {
            setStateId(event.target.value);
            setDistrictId("");
          }}
          required
          disabled={!hasStates}
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        >
          <option value="" disabled>
            {hasStates ? "Select state" : "No states available"}
          </option>

          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        District
        <select
          name="district_id"
          value={districtId}
          onChange={(event) => setDistrictId(event.target.value)}
          required
          disabled={!hasDistricts}
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        >
          <option value="" disabled>
            {hasDistricts ? "Select district" : "No districts available"}
          </option>

          {filteredDistricts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Location Name
        <input
          name="name"
          value={name}
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);

            if (!slugTouched) {
              setSlug(slugify(nextName));
            }
          }}
          required
          minLength={2}
          placeholder="Example: Laitumkhrah"
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Slug
        <input
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          required
          minLength={2}
          placeholder="laitumkhrah"
          className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={data?.is_active ?? true}
          className="h-4 w-4 rounded border-slate-300"
        />
        Active
      </label>

      {!hasStates || !hasDistricts ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Please create an active state and district first.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={!hasStates || !hasDistricts}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update Location" : "Create Location"}
        </button>

        <Link
          href="/admin/locations"
          className="rounded-xl border px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}