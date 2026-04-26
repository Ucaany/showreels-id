UPDATE "billing_subscriptions"
SET "plan_name" = 'creator'
WHERE "plan_name" = 'pro';

UPDATE "billing_subscriptions"
SET "next_plan_name" = 'creator'
WHERE "next_plan_name" = 'pro';

UPDATE "billing_transactions"
SET "plan_name" = 'creator'
WHERE "plan_name" = 'pro';
