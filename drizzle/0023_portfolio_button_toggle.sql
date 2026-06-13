-- Add portfolio button visibility toggle
ALTER TABLE "users" ADD COLUMN "show_portfolio_button" boolean DEFAULT true NOT NULL;
