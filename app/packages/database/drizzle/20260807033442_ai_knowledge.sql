CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."ai_knowledge_document_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "ai_knowledge_chunk" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"chunkIndex" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_knowledge_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"mimeType" varchar(64) NOT NULL,
	"status" "ai_knowledge_document_status" DEFAULT 'processing' NOT NULL,
	"error" text,
	"chunkCount" integer DEFAULT 0 NOT NULL,
	"uploadedBy" uuid,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_knowledge_chunk" ADD CONSTRAINT "ai_knowledge_chunk_documentId_ai_knowledge_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."ai_knowledge_document"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ai_knowledge_document" ADD CONSTRAINT "ai_knowledge_document_uploadedBy_user_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "IX_ai_knowledge_chunk_documentId" ON "ai_knowledge_chunk" USING btree ("documentId" uuid_ops);--> statement-breakpoint
CREATE INDEX "IX_ai_knowledge_chunk_embedding" ON "ai_knowledge_chunk" USING hnsw ("embedding" vector_cosine_ops);