CREATE TABLE "ai_demo_quota" (
	"ip" varchar(64) PRIMARY KEY NOT NULL,
	"messagesUsed" integer DEFAULT 0 NOT NULL,
	"uploadsUsed" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
