-- Lets a signed-in team user join every org that invited their email address.
create or replace function public.accept_org_invites()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_email text := (select email from auth.users where id = auth.uid());
  v_count integer;
begin
  if v_email is null then return 0; end if;
  insert into public.org_members (org_id, user_id, staff_role)
    select i.org_id, auth.uid(), i.staff_role from public.org_invites i where lower(i.email) = lower(v_email)
    on conflict (org_id, user_id) do nothing;
  get diagnostics v_count = row_count;
  delete from public.org_invites where lower(email) = lower(v_email);
  return v_count;
end $$;
revoke execute on function public.accept_org_invites() from public, anon;
grant execute on function public.accept_org_invites() to authenticated;
