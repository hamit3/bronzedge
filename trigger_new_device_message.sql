-- Run this in Supabase SQL editor
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.edge_function_url') || '/evaluate-rules',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := row_to_json(NEW)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_device_message ON device_messages;
CREATE TRIGGER on_new_device_message
  AFTER INSERT ON device_messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();
