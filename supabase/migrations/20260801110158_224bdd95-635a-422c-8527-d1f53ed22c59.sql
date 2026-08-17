CREATE POLICY "bilder_lesen" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'artikel-bilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "bilder_hochladen" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artikel-bilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "bilder_aendern" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'artikel-bilder' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "bilder_loeschen" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artikel-bilder' AND (storage.foldername(name))[1] = auth.uid()::text);