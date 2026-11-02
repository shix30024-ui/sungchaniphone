DROP POLICY IF EXISTS phone_kkt_records_read ON public.phone_kkt_records;
CREATE POLICY phone_kkt_records_read
  ON public.phone_kkt_records
  FOR SELECT
  TO anon, authenticated
  USING (record_type IN ('contact', 'message') AND payload IS NOT NULL);