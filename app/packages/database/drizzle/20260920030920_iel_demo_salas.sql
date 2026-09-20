CREATE TABLE "iel_demo_eventos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"sala_id" text NOT NULL,
	"acao" jsonb NOT NULL,
	"revisao" integer NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iel_demo_salas" (
	"id" text PRIMARY KEY NOT NULL,
	"schema_version" integer NOT NULL,
	"estado" jsonb NOT NULL,
	"revisao" integer DEFAULT 0 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iel_demo_eventos" ADD CONSTRAINT "iel_demo_eventos_sala_id_iel_demo_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."iel_demo_salas"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "IX_iel_demo_eventos_sala_id_revisao" ON "iel_demo_eventos" USING btree ("sala_id","revisao");