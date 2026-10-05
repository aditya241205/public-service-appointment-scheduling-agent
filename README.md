# CivicEase — Public Service Appointment Scheduling Agent

A browser-based college project prototype for finding and booking public service appointments.

## Run the prototype

Open `index.html` in a modern browser. No installation is needed. Bookings are saved in that browser with `localStorage`; clearing browser storage removes them. Confirmation is shown on screen, but the prototype does not send email or connect to a real government service.

## Included in this first version

- Six searchable public-service categories, each with a description and sample document checklist.
- Sample appointment dates and times, with a full slot shown as unavailable.
- Appointment creation, rescheduling, cancellation, and booking references.
- A conversational FAQ assistant that answers from the sample service information.
- Responsive layout for phone and desktop screens.

All service names, requirements, availability, opening hours, and office details are fictional sample data. Replace them with approved information before presenting the app as a real service.

## Practical student-project stack

Keep the current HTML, CSS, and JavaScript for the clickable UI. For a team that wants a more structured frontend, move it to React with Vite. Add Supabase for hosted PostgreSQL, authentication, and optional server functions. Put any AI provider key behind a server function; never put a private key in browser JavaScript. For a no-cost class demo, the current rule-based assistant is enough to demonstrate question answering without a key or network dependency.

## Suggested database structure

```sql
create table services (
  id text primary key,
  name text not null,
  description text not null,
  requirements jsonb not null default '[]',
  duration_minutes integer not null default 20,
  active boolean not null default true
);

create table appointment_slots (
  id uuid primary key default gen_random_uuid(),
  service_id text not null references services(id),
  starts_at timestamptz not null,
  capacity integer not null default 1 check (capacity > 0),
  booked_count integer not null default 0 check (booked_count >= 0),
  unique (service_id, starts_at),
  check (booked_count <= capacity)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  service_id text not null references services(id),
  slot_id uuid not null references appointment_slots(id),
  citizen_name text not null,
  citizen_email text not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);
```

In a real backend, reserve a slot in one database transaction so two users cannot take its last opening at once. Rescheduling should release the old slot and reserve the new one atomically. Add row-level access rules before storing personal details, and collect only the details the appointment actually needs.

## Build in small steps

1. **UI and interaction — done in this prototype.** Review the service list and replace the sample content with your chosen city or department.
2. **Persistent database.** Create the three tables above, seed services and future slots, then switch the browser's local storage calls to server requests.
3. **Reliable booking.** Add server-side slot reservation, cancellation, and rescheduling; test capacity and prevent duplicate bookings.
4. **Confirmation.** For a project demo, keep the on-screen reference. If your course permits external services, add email confirmation through a server-side function.
5. **AI assistant.** Start with a small FAQ grounded only in approved service descriptions and requirements. Add a server-side model call later, pass only the relevant service text, and tell the assistant to say when it does not know. Do not let the assistant create or change bookings; use the explicit booking form for that.

## Suggested presentation demo

Search for “documents,” open Document services, show its checklist, book a time, then open My appointments and reschedule or cancel it. Ask the assistant “What should I bring?” to show the FAQ flow.
