CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(140) NOT NULL,
	"purchase_unit" varchar(24) NOT NULL,
	"purchase_qty" numeric(12, 3) NOT NULL,
	"purchase_price_minor" integer NOT NULL,
	"tax_included" boolean DEFAULT false NOT NULL,
	"tax_rate" numeric(5, 2) NOT NULL,
	"stock_unit" varchar(24) NOT NULL,
	"conv_p_to_s" numeric(12, 6) NOT NULL,
	"yield_rate" numeric(5, 2) NOT NULL,
	"supplier_id" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_purchase_qty_positive" CHECK ("purchase_qty" > 0),
	CONSTRAINT "ingredients_conv_positive" CHECK ("conv_p_to_s" > 0),
	CONSTRAINT "ingredients_yield_rate_range" CHECK ("yield_rate" > 0 AND "yield_rate" <= 100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"batch_output_qty" numeric(12, 3) NOT NULL,
	"batch_output_unit" varchar(24) NOT NULL,
	"serving_size_qty" numeric(12, 3) NOT NULL,
	"serving_size_unit" varchar(24) NOT NULL,
	"plating_yield_rate" numeric(5, 2),
	"selling_price_minor" integer,
	"selling_price_tax_included" boolean,
	"selling_tax_rate" numeric(5, 2),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_batch_output_qty_positive" CHECK ("batch_output_qty" > 0),
	CONSTRAINT "recipes_serving_size_qty_positive" CHECK ("serving_size_qty" > 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipe_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"qty" numeric(12, 3) NOT NULL,
	"unit" varchar(24) NOT NULL,
	"waste_rate" numeric(6, 4) NOT NULL,
	CONSTRAINT "recipe_items_qty_positive" CHECK ("qty" > 0),
	CONSTRAINT "recipe_items_waste_rate_range" CHECK ("waste_rate" >= 0 AND "waste_rate" < 1)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_plan_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_plan_id" integer NOT NULL,
	"recipe_id" integer NOT NULL,
	"servings" integer NOT NULL,
	CONSTRAINT "sales_plan_items_servings_positive" CHECK ("servings" > 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipes" ADD CONSTRAINT "recipes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_plans" ADD CONSTRAINT "sales_plans_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_plan_items" ADD CONSTRAINT "sales_plan_items_sales_plan_id_sales_plans_id_fk" FOREIGN KEY ("sales_plan_id") REFERENCES "public"."sales_plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sales_plan_items" ADD CONSTRAINT "sales_plan_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
