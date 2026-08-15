
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.my_class_id(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_see_class(uuid) FROM anon, authenticated, public;
