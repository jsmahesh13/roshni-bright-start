-- Lock down SECURITY DEFINER helper functions to the roles that actually need them.
REVOKE ALL ON FUNCTION public.lookup_school(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_staff_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_staff_class() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_school(text, text, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_staff_class() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_school(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_school(text) TO service_role;
