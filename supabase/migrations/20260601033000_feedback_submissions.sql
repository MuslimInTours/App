create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('info', 'erreur', 'amelioration', 'contact')),
  title text not null,
  message text not null,
  contact text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;

drop policy if exists "Anyone can submit feedback" on public.feedback_submissions;
create policy "Anyone can submit feedback"
on public.feedback_submissions for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read feedback" on public.feedback_submissions;
create policy "Admins can read feedback"
on public.feedback_submissions for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update feedback" on public.feedback_submissions;
create policy "Admins can update feedback"
on public.feedback_submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
