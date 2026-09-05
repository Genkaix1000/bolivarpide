-- Fase 3 — El bucket de media de WhatsApp deja de ser público.
--
-- `whatsapp-media` se creó con `public = true` y una policy de SELECT abierta
-- (`bucket_id = 'whatsapp-media'`, sin condición de negocio). Ahí adentro va
-- todo lo que el cliente manda por WhatsApp: comprobantes de transferencia,
-- fotos de la fachada con la dirección, a veces documentos. Cualquiera con la
-- URL —que además se guardaba en `media_json.storage_url`— los podía abrir sin
-- estar autenticado ni pertenecer al negocio.
--
-- A partir de acá el panel firma URLs temporales al leer el chat, usando
-- `media_json.storage_path` (que el webhook ya venía guardando). El
-- service_role no pasa por RLS, así que la firma sigue funcionando.
UPDATE storage.buckets
SET public = false
WHERE id = 'whatsapp-media';

DROP POLICY IF EXISTS "whatsapp_media_public_read" ON storage.objects;

-- Las URLs públicas persistidas ya no resuelven: se limpian para que ningún
-- lector caiga en el fallback legacy y muestre una imagen rota. `storage_path`
-- queda intacto, que es de donde sale la URL firmada.
UPDATE public.whatsapp_messages
SET media_json = media_json - 'storage_url'
WHERE media_json ? 'storage_url';
