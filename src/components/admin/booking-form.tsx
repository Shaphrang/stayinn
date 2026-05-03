"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

type PaymentStatus = "unpaid" | "paid" | "partial" | "refunded";

type PropertyOption = {
  id: string;
  name: string;
  owner_id: string;
  status: string;
  location_name: string | null;
  district_name: string | null;
  state_name: string | null;
};

type RoomOption = {
  id: string;
  property_id: string;
  name: string;
  room_type: string;
  max_guests: number;
  weekday_rate: number;
  weekend_rate: number;
  status: string;
};

type BookingFormData = {
  id?: string | null;
  guest_id?: string | null;
  property_id?: string | null;
  room_id?: string | null;
  guest_full_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  status?: string | null;
  payment_status?: string | null;
  total_amount?: number | null;
};

type BookingFormProps = {
  data?: BookingFormData;
  properties: PropertyOption[];
  rooms: RoomOption[];
  action: (formData: FormData) => void | Promise<void>;
};

const bookingStatuses: BookingStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
];

const paymentStatuses: PaymentStatus[] = [
  "unpaid",
  "paid",
  "partial",
  "refunded",
];

function formatStatus(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return labels[status];
}

function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "Unpaid",
    paid: "Paid",
    partial: "Partial",
    refunded: "Refunded",
  };

  return labels[status];
}

function formatRoomType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function propertyLabel(property: PropertyOption) {
  const location = [property.location_name, property.district_name]
    .filter(Boolean)
    .join(", ");

  return location ? `${property.name} (${location})` : property.name;
}

function roomLabel(room: RoomOption) {
  return `${room.name} · ${formatRoomType(room.room_type)} · max ${room.max_guests}`;
}

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff) || diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function BookingForm({
  data,
  properties,
  rooms,
  action,
}: BookingFormProps) {
  const isEdit = Boolean(data?.id);

  const [selectedProperty, setSelectedProperty] = useState(
    data?.property_id ?? "",
  );

  const [selectedRoom, setSelectedRoom] = useState(data?.room_id ?? "");
  const [checkIn, setCheckIn] = useState(data?.check_in_date ?? "");
  const [checkOut, setCheckOut] = useState(data?.check_out_date ?? "");
  const [manualAmount, setManualAmount] = useState(
    data?.total_amount ? String(data.total_amount) : "",
  );

  const filteredRooms = useMemo(() => {
    if (!selectedProperty) return rooms;

    return rooms.filter((room) => room.property_id === selectedProperty);
  }, [rooms, selectedProperty]);

  const room = filteredRooms.find((item) => item.id === selectedRoom);
  const nights = getNights(checkIn, checkOut);
  const estimatedAmount = room ? Number(room.weekday_rate ?? 0) * nights : 0;
  const hasProperties = properties.length > 0;
  const hasRooms = filteredRooms.length > 0;

  return (
    <form action={action} className="space-y-6">
      {isEdit ? (
        <>
          <input type="hidden" name="id" value={data?.id ?? ""} />
          <input type="hidden" name="guest_id" value={data?.guest_id ?? ""} />
        </>
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Guest Information
          </h2>
          <p className="text-sm text-slate-500">
            Enter guest contact details for this booking.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Guest Name
            <input
              name="guest_full_name"
              defaultValue={data?.guest_full_name ?? ""}
              required
              minLength={2}
              placeholder="Guest full name"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Phone
            <input
              name="guest_phone"
              type="tel"
              defaultValue={data?.guest_phone ?? ""}
              required
              minLength={10}
              maxLength={15}
              placeholder="10 to 15 digit phone"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              name="guest_email"
              type="email"
              defaultValue={data?.guest_email ?? ""}
              placeholder="guest@example.com"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Stay Information
          </h2>
          <p className="text-sm text-slate-500">
            Select property, room and booking dates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Property
            <select
              name="property_id"
              value={selectedProperty}
              onChange={(event) => {
                setSelectedProperty(event.target.value);
                setSelectedRoom("");
              }}
              required
              disabled={!hasProperties}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasProperties ? "Select property" : "No properties available"}
              </option>

              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {propertyLabel(property)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Room
            <select
              name="room_id"
              value={selectedRoom}
              onChange={(event) => setSelectedRoom(event.target.value)}
              required
              disabled={!hasRooms}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              <option value="" disabled>
                {hasRooms ? "Select room" : "No rooms available"}
              </option>

              {filteredRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {roomLabel(room)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Check-in Date
            <input
              name="check_in_date"
              type="date"
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Check-out Date
            <input
              name="check_out_date"
              type="date"
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>

        <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Nights: <span className="font-semibold">{nights}</span>
          </p>
          <p>
            Estimated amount:{" "}
            <span className="font-semibold">₹{estimatedAmount}</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Status and Payment
          </h2>
          <p className="text-sm text-slate-500">
            Set booking status, payment status and total amount.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Booking Status
            <select
              name="status"
              defaultValue={data?.status ?? "pending"}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Payment Status
            <select
              name="payment_status"
              defaultValue={data?.payment_status ?? "unpaid"}
              required
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatPaymentStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Total Amount
            <input
              name="total_amount"
              type="number"
              min={0}
              step="0.01"
              value={manualAmount}
              onChange={(event) => setManualAmount(event.target.value)}
              placeholder={String(estimatedAmount)}
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-cyan-600"
            />
          </label>
        </div>
      </section>

      {!hasProperties ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          No active properties are available. Please create or activate a
          property before adding bookings.
        </p>
      ) : null}

      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-slate-50/95 py-4 backdrop-blur sm:flex-row">
        <button
          type="submit"
          disabled={!hasProperties}
          className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isEdit ? "Update Booking" : "Create Booking"}
        </button>

        <Link
          href="/admin/bookings"
          className="rounded-xl border bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}