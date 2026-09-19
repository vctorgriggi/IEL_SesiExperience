-- Chat com IA: conversas, mensagens e créditos.
-- Também reconcilia as colunas de `abacate_billing` que antes viviam num
-- arquivo SQL não registrado no journal (ADD COLUMN idempotente com IF NOT
-- EXISTS para ser seguro em bancos que já aplicaram aquele arquivo).
CREATE TYPE "public"."ai_credit_purchase_status" AS ENUM('pending', 'paid', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."ai_credit_reason" AS ENUM('use', 'purchase', 'grant');--> statement-breakpoint
CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "ai_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"organizationId" uuid,
	"title" varchar(120) NOT NULL,
	"model" varchar(64) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_credit_balance" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"freeRemaining" integer DEFAULT 0 NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" "ai_credit_reason" NOT NULL,
	"refId" varchar(255),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_credit_purchase" (
	"billingId" varchar(255) PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"credits" integer NOT NULL,
	"amountCents" integer NOT NULL,
	"status" "ai_credit_purchase_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "abacate_billing" ALTER COLUMN "plan_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "abacate_billing" ADD COLUMN IF NOT EXISTS "product_id" varchar(32);--> statement-breakpoint
ALTER TABLE "abacate_billing" ADD COLUMN IF NOT EXISTS "price_id" text;--> statement-breakpoint
ALTER TABLE "abacate_billing" ADD COLUMN IF NOT EXISTS "billing_interval" varchar(16);--> statement-breakpoint
ALTER TABLE "abacate_billing" ADD COLUMN IF NOT EXISTS "price_type" varchar(16);--> statement-breakpoint
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_conversationId_ai_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."ai_conversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_credit_balance" ADD CONSTRAINT "ai_credit_balance_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_credit_ledger" ADD CONSTRAINT "ai_credit_ledger_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_credit_purchase" ADD CONSTRAINT "ai_credit_purchase_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "IX_ai_conversation_userId" ON "ai_conversation" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_conversation_userId_updatedAt" ON "ai_conversation" USING btree ("userId" uuid_ops,"updatedAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_message_conversationId" ON "ai_message" USING btree ("conversationId" uuid_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_message_conversationId_createdAt" ON "ai_message" USING btree ("conversationId" uuid_ops,"createdAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_credit_ledger_userId" ON "ai_credit_ledger" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_credit_ledger_refId" ON "ai_credit_ledger" USING btree ("refId" text_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_credit_purchase_userId" ON "ai_credit_purchase" USING btree ("userId" uuid_ops);