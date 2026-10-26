/*
  # Pin the lookup path on the timestamp helper

  The helper that stamps the last-updated time ran without a fixed schema
  lookup path, so a function reference inside it could in principle be
  resolved from an unexpected schema.

  1. Security
     - Pin `search_path` on `set_updated_at()` to a fixed, safe value.

  2. Notes
     1. Behaviour is unchanged; only name resolution is now deterministic.
*/

ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
