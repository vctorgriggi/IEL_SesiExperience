CREATE TYPE "public"."action_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('system', 'member', 'api');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."invitationstatus" AS ENUM('pending', 'accepted', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('member', 'admin');--> statement-breakpoint
CREATE TYPE "public"."webhook_trigger" AS ENUM('eventRegistrationCreated');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"subject" varchar(128),
	"content" varchar(8000) NOT NULL,
	"link" varchar(2000),
	"seenAt" timestamp (3),
	"dismissed" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userImage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"data" "bytea",
	"contentType" varchar(255),
	"hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"emailVerified" timestamp (3),
	"password" varchar(60),
	"lastLogin" timestamp (3),
	"locale" varchar(8) DEFAULT 'en-US' NOT NULL,
	"completedOnboarding" boolean DEFAULT false NOT NULL,
	"enabledContactsNotifications" boolean DEFAULT false NOT NULL,
	"enabledInboxNotifications" boolean DEFAULT false NOT NULL,
	"enabledNewsletter" boolean DEFAULT false NOT NULL,
	"enabledProductUpdates" boolean DEFAULT false NOT NULL,
	"enabledWeeklySummary" boolean DEFAULT false NOT NULL,
	"image" varchar(2048),
	"name" varchar(64) NOT NULL,
	"phone" varchar(32),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"password" text,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authenticatorApp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"accountName" varchar(255) NOT NULL,
	"issuer" varchar(255) NOT NULL,
	"secret" varchar(255) NOT NULL,
	"recoveryCodes" varchar(1024) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "changeEmailRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"email" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	"valid" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resetPasswordRequest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"userId" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizationLogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"data" "bytea",
	"contentType" varchar(255),
	"hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(255),
	"email" varchar(255),
	"website" varchar(2000),
	"phone" varchar(32),
	"facebookPage" varchar(2000),
	"instagramProfile" varchar(2000),
	"linkedInProfile" varchar(2000),
	"tikTokProfile" varchar(2000),
	"xProfile" varchar(2000),
	"youTubeChannel" varchar(2000),
	"logo" varchar(2048),
	"slug" varchar(255) NOT NULL,
	"billingCustomerId" varchar(255),
	"billingEmail" varchar(255),
	"billingLine1" varchar(255),
	"billingLine2" varchar(255),
	"billingCountry" varchar(3),
	"billingPostalCode" varchar(16),
	"billingCity" varchar(255),
	"billingState" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "Role" DEFAULT 'member' NOT NULL,
	"status" "invitationstatus" DEFAULT 'pending' NOT NULL,
	"lastSentAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" "Role" DEFAULT 'member' NOT NULL,
	"isOwner" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_registration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_type_id" uuid,
	"user_id" uuid,
	"guest_name" text,
	"guest_email" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending',
	"external_payment_id" text,
	"registration_code" text,
	"checked_in_at" timestamp with time zone,
	"registration_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text DEFAULT gen_random_uuid()::text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" text,
	"image_url" text,
	"ticket_type" text DEFAULT 'free' NOT NULL,
	"ticket_price_cents" integer,
	"latitude" double precision,
	"longitude" double precision,
	"max_attendees" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"metadata" jsonb,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_ticket_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"quantity_available" integer,
	"sale_starts_at" timestamp with time zone,
	"sale_ends_at" timestamp with time zone,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"secret" varchar(1024),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"triggers" "webhook_trigger"[] NOT NULL,
	"url" varchar(2000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apiKey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"description" varchar(70) NOT NULL,
	"hashedKey" text NOT NULL,
	"expiresAt" timestamp (3),
	"lastUsedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptionItem" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriptionId" text NOT NULL,
	"quantity" integer NOT NULL,
	"productId" text NOT NULL,
	"variantId" text NOT NULL,
	"priceAmount" double precision,
	"interval" text NOT NULL,
	"intervalCount" integer NOT NULL,
	"type" text,
	"model" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" uuid NOT NULL,
	"status" varchar(64) NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"provider" varchar(32) NOT NULL,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"currency" varchar(3) NOT NULL,
	"periodStartsAt" timestamp (6) with time zone NOT NULL,
	"periodEndsAt" timestamp (6) with time zone NOT NULL,
	"trialStartsAt" timestamp (6) with time zone,
	"trialEndsAt" timestamp (6) with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "abacate_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"billing_id" text NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"plan_type" varchar(16) NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "abacate_billing_billing_id_unique" UNIQUE("billing_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "billing_webhook_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"service" varchar(32) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orderItem" (
	"id" text PRIMARY KEY NOT NULL,
	"orderId" text NOT NULL,
	"quantity" integer NOT NULL,
	"productId" text NOT NULL,
	"variantId" text NOT NULL,
	"priceAmount" double precision,
	"type" text,
	"model" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" uuid NOT NULL,
	"status" varchar(64) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"totalAmount" double precision NOT NULL,
	"currency" varchar(3) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userImage" ADD CONSTRAINT "userImage_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authenticatorApp" ADD CONSTRAINT "authenticatorApp_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "changeEmailRequest" ADD CONSTRAINT "changeEmailRequest_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizationLogo" ADD CONSTRAINT "organizationLogo_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "membership" ADD CONSTRAINT "membership_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_ticket_type_id_event_ticket_type_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."event_ticket_type"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_registration" ADD CONSTRAINT "event_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_ticket_type" ADD CONSTRAINT "event_ticket_type_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook" ADD CONSTRAINT "webhook_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "abacate_billing" ADD CONSTRAINT "abacate_billing_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_notification_userId" ON "notification" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_userImage_userId" ON "userImage" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_user_email_unique" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_user_name" ON "user" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_account_provider_providerAccountId_unique" ON "account" USING btree ("provider" text_ops,"providerAccountId" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_account_userId" ON "account" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_session_userId" ON "session" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_verificationToken_identifier_unique" ON "verificationToken" USING btree ("identifier" text_ops,"token" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_authenticatorApp_userId_unique" ON "authenticatorApp" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_changeEmailRequest_userId" ON "changeEmailRequest" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_resetPasswordRequest_email" ON "resetPasswordRequest" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_user_id_idx" ON "two_factor" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_organizationLogo_organizationId" ON "organizationLogo" USING btree ("organizationId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_organization_billingCustomerId" ON "organization" USING btree ("billingCustomerId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_organization_slug_unique" ON "organization" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_invitation_organizationId" ON "invitation" USING btree ("organizationId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_invitation_token" ON "invitation" USING btree ("token" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_membership_organizationId_userId_unique" ON "membership" USING btree ("organizationId" uuid_ops,"userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_membership_userId" ON "membership" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_membership_organizationId" ON "membership" USING btree ("organizationId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_registration_event_id" ON "event_registration" USING btree ("event_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_registration_user_id" ON "event_registration" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_registration_guest_email" ON "event_registration" USING btree ("guest_email" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_registration_registration_code" ON "event_registration" USING btree ("registration_code" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_organization_id" ON "event" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_event_organization_id_slug" ON "event" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_start_date" ON "event" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_event_ticket_type_event_id" ON "event_ticket_type" USING btree ("event_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_webhook_organization_id" ON "webhook" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_apiKey_hashedKey_unique" ON "apiKey" USING btree ("hashedKey" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_apiKey_organizationId" ON "apiKey" USING btree ("organizationId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_subscriptionItem_subscriptionId" ON "subscriptionItem" USING btree ("subscriptionId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_subscription_organizationId" ON "subscription" USING btree ("organizationId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_abacate_billing_organization_id" ON "abacate_billing" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_abacate_billing_billing_id" ON "abacate_billing" USING btree ("billing_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_billing_webhook_event_event_id_service" ON "billing_webhook_event" USING btree ("event_id","service");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_orderItem_orderId" ON "orderItem" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_order_organizationId" ON "order" USING btree ("organizationId" uuid_ops);