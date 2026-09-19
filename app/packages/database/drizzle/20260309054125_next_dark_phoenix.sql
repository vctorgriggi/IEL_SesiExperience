CREATE TABLE IF NOT EXISTS "support_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_message" ADD CONSTRAINT "support_message_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_support_message_userId" ON "support_message" USING btree ("userId" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_support_message_createdAt" ON "support_message" USING btree ("createdAt" DESC NULLS LAST);