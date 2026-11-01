-- Store KKT records individually instead of replacing one large JSON array.
-- Existing phone_shared_content remains untouched as a backwards-compatible archive.
CREATE TABLE IF NOT EXISTS public.phone_kkt_records (
  record_type text NOT NULL CHECK (record_type IN ('contact', 'message')),
  record_id text NOT NULL,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_type, record_id)
);

ALTER TABLE public.phone_kkt_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.phone_kkt_records TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.phone_kkt_records TO authenticated;
GRANT ALL ON public.phone_kkt_records TO service_role;

CREATE POLICY phone_kkt_records_read
  ON public.phone_kkt_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY phone_kkt_records_owner_insert
  ON public.phone_kkt_records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_phone_owner());

CREATE POLICY phone_kkt_records_owner_update
  ON public.phone_kkt_records
  FOR UPDATE
  TO authenticated
  USING (public.is_phone_owner())
  WITH CHECK (public.is_phone_owner());

CREATE POLICY phone_kkt_records_owner_delete
  ON public.phone_kkt_records
  FOR DELETE
  TO authenticated
  USING (public.is_phone_owner());

CREATE INDEX IF NOT EXISTS phone_kkt_records_updated_at_idx
  ON public.phone_kkt_records (updated_at DESC);
