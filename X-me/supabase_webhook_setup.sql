-- Créer une fonction de déclenchement pour les opérations sur la table 'chats'
CREATE OR REPLACE FUNCTION notify_chat_changes()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'VOTRE_URL_WEBHOOK/api/webhooks/supabase'; -- Remplacer par votre URL
  payload json;
BEGIN
  -- Préparer le payload en fonction du type d'opération
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'event', TG_OP,
      'record', row_to_json(NEW),
      'schema', TG_TABLE_SCHEMA
    );
  ELSIF (TG_OP = 'DELETE') THEN
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'event', TG_OP,
      'old_record', row_to_json(OLD),
      'schema', TG_TABLE_SCHEMA
    );
  END IF;
  
  -- Appeler le webhook avec le payload
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}',
    body := payload
  );
  
  -- Retourner le résultat approprié
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer l'extension http si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS http;

-- Créer un déclencheur pour les insertions et mises à jour sur la table 'chats'
DROP TRIGGER IF EXISTS on_chat_changes ON chats;
CREATE TRIGGER on_chat_changes
AFTER INSERT OR UPDATE OR DELETE ON chats
FOR EACH ROW
EXECUTE FUNCTION notify_chat_changes();

-- Note: Si vous avez une architecture multi-tenant ou des RLS (Row Level Security)
-- assurez-vous que cette fonction a les droits suffisants pour accéder aux données 