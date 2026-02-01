
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."recovery_status" AS ENUM (
    'new',
    'contacted',
    'recovered',
    'discarded'
);


ALTER TYPE "public"."recovery_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_technician_assignment"("p_token" "text", "p_technician_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_token_record RECORD;
  v_ticket_record RECORD;
  v_result JSONB;
BEGIN
  -- Get token with row lock to prevent race conditions
  SELECT * INTO v_token_record
  FROM public.technician_assignment_tokens
  WHERE token = p_token
  FOR UPDATE;
  
  -- Check if token exists
  IF v_token_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Token non valido o scaduto'
    );
  END IF;
  
  -- Check if token expired
  IF v_token_record.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'token_expired',
      'message', 'Il link è scaduto. Contatta l''amministrazione.'
    );
  END IF;
  
  -- Check if token already used (ANTI-COLLISION)
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Intervento già assegnato a un altro tecnico.'
    );
  END IF;
  
  -- Get the ticket
  SELECT * INTO v_ticket_record
  FROM public.tickets
  WHERE id = v_token_record.ticket_id;
  
  -- Double check ticket isn't already assigned
  IF v_ticket_record.assigned_technician_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Intervento già assegnato a un altro tecnico.'
    );
  END IF;
  
  -- Mark token as used
  UPDATE public.technician_assignment_tokens
  SET used_at = NOW(),
      used_by = p_technician_id
  WHERE id = v_token_record.id;
  
  -- Assign ticket to technician
  UPDATE public.tickets
  SET assigned_technician_id = p_technician_id,
      assigned_at = NOW(),
      status = 'assigned'
  WHERE id = v_token_record.ticket_id;
  
  -- Return success with full ticket details (only for assigned technician)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Intervento assegnato con successo!',
    'ticket', jsonb_build_object(
      'id', v_ticket_record.id,
      'category', v_ticket_record.category,
      'priority', v_ticket_record.priority,
      'description', v_ticket_record.description,
      'address', v_ticket_record.address,
      'city', v_ticket_record.city,
      'photo_url', v_ticket_record.photo_url,
      'price_range_min', v_ticket_record.price_range_min,
      'price_range_max', v_ticket_record.price_range_max
    ),
    'client', (
      SELECT jsonb_build_object(
        'full_name', p.full_name,
        'phone', p.phone,
        'email', p.email
      )
      FROM public.profiles p
      WHERE p.id = v_ticket_record.user_id
    )
  );
END;
$$;


ALTER FUNCTION "public"."accept_technician_assignment"("p_token" "text", "p_technician_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_loyalty_points"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se il ticket passa a 'resolved' da uno stato diverso
  IF OLD.status IS DISTINCT FROM 'resolved' AND NEW.status = 'resolved' THEN
    UPDATE profiles
    SET loyalty_points = COALESCE(loyalty_points, 0) + 10 -- +10 punti per ticket chiuso
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_loyalty_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_assignment_token"("p_ticket_id" "uuid", "p_expires_hours" integer DEFAULT 24) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert token
  INSERT INTO public.technician_assignment_tokens (ticket_id, token, expires_at)
  VALUES (p_ticket_id, v_token, NOW() + (p_expires_hours || ' hours')::INTERVAL);
  
  RETURN v_token;
END;
$$;


ALTER FUNCTION "public"."generate_assignment_token"("p_ticket_id" "uuid", "p_expires_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::TEXT
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_technician"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'technician')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_or_technician"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."customer_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "brand" "text",
    "model" "text",
    "install_date" "date",
    "last_maintenance_date" "date",
    "next_maintenance_date" "date",
    "meta_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "city" "text",
    "type" "text",
    "rating" integer DEFAULT 0,
    "address" "text",
    "phone" "text",
    "email" "text",
    "status_mail_sent" boolean DEFAULT false,
    "status_called" boolean DEFAULT false,
    "status_visited" boolean DEFAULT false,
    "status_confirmed" boolean DEFAULT false,
    "notes" "text",
    "coordinates" "point",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads_recovery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_session_id" "text" NOT NULL,
    "detected_intent" "text",
    "extracted_contact" "jsonb" DEFAULT '{}'::"jsonb",
    "lead_score" integer,
    "status" "public"."recovery_status" DEFAULT 'new'::"public"."recovery_status",
    "abandoned_at" timestamp with time zone NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "leads_recovery_lead_score_check" CHECK ((("lead_score" >= 1) AND ("lead_score" <= 10)))
);


ALTER TABLE "public"."leads_recovery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid",
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "image_url" "text",
    "meta_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "chat_session_id" "text",
    CONSTRAINT "messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."messages"."chat_session_id" IS 'ID della chat (es. Telegram Chat ID o Cookie ID). Collega i messaggi prima e dopo la creazione del ticket.';



CREATE TABLE IF NOT EXISTS "public"."n8n_chat_histories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "message" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."n8n_chat_histories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "category" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "description" "text" NOT NULL,
    "address" "text",
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "city" "text",
    "price_range_min" numeric,
    "price_range_max" numeric,
    "photo_url" "text",
    "assigned_technician_id" "uuid",
    "assigned_at" timestamp with time zone,
    "contact_phone" numeric,
    "chat_session_id" "text",
    "customer_name" "text",
    "completed_at" timestamp with time zone,
    "ai_paused" boolean DEFAULT false,
    "asset_id" "uuid",
    CONSTRAINT "tickets_category_check" CHECK (("category" = ANY (ARRAY['plumbing'::"text", 'electric'::"text", 'locksmith'::"text", 'climate'::"text", 'handyman'::"text", 'generic'::"text"]))),
    CONSTRAINT "tickets_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'waived'::"text"]))),
    CONSTRAINT "tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'emergency'::"text"]))),
    CONSTRAINT "tickets_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'pending'::"text", 'pending_verification'::"text", 'confirmed'::"text", 'assigned'::"text", 'in_progress'::"text", 'resolved'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."orphan_sessions_view" WITH ("security_invoker"='true') AS
 SELECT DISTINCT "m"."chat_session_id",
    "max"("m"."created_at") AS "last_message_at"
   FROM (("public"."messages" "m"
     LEFT JOIN "public"."tickets" "t" ON (("m"."chat_session_id" = "t"."chat_session_id")))
     LEFT JOIN "public"."leads_recovery" "lr" ON (("m"."chat_session_id" = "lr"."chat_session_id")))
  WHERE (("m"."created_at" < ("now"() - '02:00:00'::interval)) AND ("t"."id" IS NULL) AND ("lr"."id" IS NULL) AND ("m"."chat_session_id" IS NOT NULL))
  GROUP BY "m"."chat_session_id";


ALTER VIEW "public"."orphan_sessions_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_type" "text" DEFAULT 'private'::"text",
    "business_name" "text",
    "vat_number" "text",
    "loyalty_level" "text" DEFAULT 'bronze'::"text",
    "loyalty_points" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "is_active" boolean DEFAULT true,
    "pin" numeric,
    "first_name" "text",
    "last_name" "text",
    "primary_role" "text",
    "coverage_area" "text",
    CONSTRAINT "profiles_loyalty_level_check" CHECK (("loyalty_level" = ANY (ARRAY['bronze'::"text", 'silver'::"text", 'gold'::"text", 'platinum'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'technician'::"text"]))),
    CONSTRAINT "profiles_user_type_check" CHECK (("user_type" = ANY (ARRAY['private'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technician_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "specializations" "text"[] NOT NULL,
    "zones" "text"[] NOT NULL,
    "partita_iva" "text",
    "experience" "text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "technician_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'contacted'::"text"])))
);


ALTER TABLE "public"."technician_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."technician_applications" IS 'Applications from technicians who want to join the NikiTuttoFare network';



COMMENT ON COLUMN "public"."technician_applications"."status" IS 'pending = new, contacted = in review, approved = accepted, rejected = declined';



CREATE TABLE IF NOT EXISTS "public"."technician_assignment_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."technician_assignment_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technician_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "token_id" "uuid",
    "notification_type" "text" DEFAULT 'telegram'::"text" NOT NULL,
    "telegram_message_id" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'sent'::"text" NOT NULL,
    "technician_id" "text",
    "message_content" "text",
    "meta_data" "jsonb",
    CONSTRAINT "technician_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['telegram'::"text", 'sms'::"text", 'email'::"text", 'push'::"text"]))),
    CONSTRAINT "technician_notifications_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'delivered'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."technician_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_assets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."customer_assets"
    ADD CONSTRAINT "customer_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads_recovery"
    ADD CONSTRAINT "leads_recovery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."n8n_chat_histories"
    ADD CONSTRAINT "n8n_chat_histories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technician_applications"
    ADD CONSTRAINT "technician_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technician_assignment_tokens"
    ADD CONSTRAINT "technician_assignment_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technician_assignment_tokens"
    ADD CONSTRAINT "technician_assignment_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."technician_notifications"
    ADD CONSTRAINT "technician_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assignment_tokens_expires_at" ON "public"."technician_assignment_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_assignment_tokens_ticket_id" ON "public"."technician_assignment_tokens" USING "btree" ("ticket_id");



CREATE INDEX "idx_assignment_tokens_token" ON "public"."technician_assignment_tokens" USING "btree" ("token");



CREATE INDEX "idx_leads_recovery_session" ON "public"."leads_recovery" USING "btree" ("chat_session_id");



CREATE INDEX "idx_leads_recovery_status" ON "public"."leads_recovery" USING "btree" ("status");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_session_id" ON "public"."messages" USING "btree" ("chat_session_id");



CREATE INDEX "idx_messages_ticket_id" ON "public"."messages" USING "btree" ("ticket_id");



CREATE INDEX "idx_n8n_chat_histories_session_id" ON "public"."n8n_chat_histories" USING "btree" ("session_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_role_admin" ON "public"."profiles" USING "btree" ("role") WHERE ("role" = 'admin'::"text");



CREATE INDEX "idx_tech_notifications_ticket_id" ON "public"."technician_notifications" USING "btree" ("ticket_id");



CREATE INDEX "idx_technician_applications_created_at" ON "public"."technician_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_technician_applications_status" ON "public"."technician_applications" USING "btree" ("status");



CREATE INDEX "idx_tickets_category" ON "public"."tickets" USING "btree" ("category");



CREATE INDEX "idx_tickets_city" ON "public"."tickets" USING "btree" ("city");



CREATE INDEX "idx_tickets_created_at" ON "public"."tickets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tickets_created_at_desc" ON "public"."tickets" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tickets_priority" ON "public"."tickets" USING "btree" ("priority");



CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");



CREATE INDEX "idx_tickets_unassigned" ON "public"."tickets" USING "btree" ("created_at" DESC) WHERE (("assigned_technician_id" IS NULL) AND ("status" = 'new'::"text"));



CREATE INDEX "idx_tickets_user_id" ON "public"."tickets" USING "btree" ("user_id");



CREATE INDEX "leads_city_idx" ON "public"."leads" USING "btree" ("city");



CREATE INDEX "leads_status_confirmed_idx" ON "public"."leads" USING "btree" ("status_confirmed");



CREATE OR REPLACE TRIGGER "on_ticket_resolved" AFTER UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."add_loyalty_points"();



ALTER TABLE ONLY "public"."customer_assets"
    ADD CONSTRAINT "customer_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technician_applications"
    ADD CONSTRAINT "technician_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."technician_assignment_tokens"
    ADD CONSTRAINT "technician_assignment_tokens_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technician_assignment_tokens"
    ADD CONSTRAINT "technician_assignment_tokens_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."technician_notifications"
    ADD CONSTRAINT "technician_notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technician_notifications"
    ADD CONSTRAINT "technician_notifications_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "public"."technician_assignment_tokens"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."user_assets"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_assigned_technician_id_fkey" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin access only" ON "public"."leads" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything on leads_recovery" ON "public"."leads_recovery" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can read technician applications" ON "public"."technician_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update technician applications" ON "public"."technician_applications" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow SELECT for admins" ON "public"."n8n_chat_histories" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Gli admin possono vedere n8n histories" ON "public"."n8n_chat_histories" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Gli admin possono vedere tutti gli asset" ON "public"."user_assets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Gli utenti possono aggiornare i propri asset" ON "public"."user_assets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Gli utenti possono cancellare i propri asset" ON "public"."user_assets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Gli utenti possono inserire i propri asset" ON "public"."user_assets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Gli utenti possono vedere i propri asset" ON "public"."user_assets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Service role can insert technician applications" ON "public"."technician_applications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert own assets" ON "public"."customer_assets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own assets" ON "public"."customer_assets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "assets_delete_own" ON "public"."user_assets" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "assets_insert_own" ON "public"."user_assets" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "assets_select_own" ON "public"."user_assets" FOR SELECT USING (("user_id" = "auth"."uid"()));


ALTER TABLE "public"."customer_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."leads_recovery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."n8n_chat_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."technician_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."technician_assignment_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."technician_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_assets" ENABLE ROW LEVEL SECURITY;
