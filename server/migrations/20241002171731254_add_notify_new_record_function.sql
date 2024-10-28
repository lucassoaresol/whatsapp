-- up
CREATE OR REPLACE FUNCTION notify_new_record()
RETURNS TRIGGER AS $$
DECLARE
    table_name text := TG_TABLE_NAME;
BEGIN
    PERFORM pg_notify('insert_notification', json_build_object('table', table_name, 'data', row_to_json(NEW))::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- down
DROP FUNCTION IF EXISTS notify_new_record();
