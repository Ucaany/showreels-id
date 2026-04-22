CREATE TABLE IF NOT EXISTS "visitor_daily_stats" (
	"day" date NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"total_events" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "visitor_daily_stats_day_path_pk" PRIMARY KEY("day","path")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visitor_daily_stats_day_idx" ON "visitor_daily_stats" USING btree ("day");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."rollup_and_purge_visitor_events_wib"()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	current_wib_day date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
	target_wib_day date := current_wib_day - 1;
	target_start_utc timestamp := timezone(
		'UTC',
		target_wib_day::timestamp AT TIME ZONE 'Asia/Jakarta'
	);
	current_start_utc timestamp := timezone(
		'UTC',
		current_wib_day::timestamp AT TIME ZONE 'Asia/Jakarta'
	);
BEGIN
	INSERT INTO public.visitor_daily_stats (
		day,
		path,
		total_events,
		unique_visitors
	)
	SELECT
		target_wib_day,
		COALESCE(NULLIF(path, ''), '/'),
		count(*)::integer,
		count(DISTINCT visitor_id)::integer
	FROM public.visitor_events
	WHERE created_at >= target_start_utc
		AND created_at < current_start_utc
	GROUP BY COALESCE(NULLIF(path, ''), '/')
	ON CONFLICT (day, path) DO UPDATE
	SET
		total_events = EXCLUDED.total_events,
		unique_visitors = EXCLUDED.unique_visitors;

	DELETE FROM public.visitor_events
	WHERE created_at < current_start_utc;
END;
$$;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_cron;
--> statement-breakpoint
DO $$
BEGIN
	BEGIN
		PERFORM cron.unschedule('visitor-events-daily-rollup-purge');
	EXCEPTION
		WHEN OTHERS THEN
			NULL;
	END;

	PERFORM cron.schedule(
		'visitor-events-daily-rollup-purge',
		'0 17 * * *',
		'select public.rollup_and_purge_visitor_events_wib();'
	);
END;
$$;
