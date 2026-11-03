revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_org() from public, anon, authenticated;
revoke execute on function public.org_role(uuid) from public, anon;
revoke execute on function public.can_set_stage(uuid, smallint) from public, anon;
grant execute on function public.org_role(uuid) to authenticated;
grant execute on function public.can_set_stage(uuid, smallint) to authenticated;
