-- Fields exposed by Zoho Creator's dashboard "Income & Expense" quick-action form.
-- These are deliberately nullable: Zoho permits different field combinations for
-- client income, diesel amounts, vendor expenses and driver expenses.
ALTER TABLE public.income_expense_entries
  ADD COLUMN IF NOT EXISTS business_transporters text,
  ADD COLUMN IF NOT EXISTS sales_entry_id text,
  ADD COLUMN IF NOT EXISTS rent_entry_id text,
  ADD COLUMN IF NOT EXISTS day_fees_entry_id text,
  ADD COLUMN IF NOT EXISTS boulder_entry_id text,
  ADD COLUMN IF NOT EXISTS dc_number text,
  ADD COLUMN IF NOT EXISTS vendor text,
  ADD COLUMN IF NOT EXISTS client text,
  ADD COLUMN IF NOT EXISTS driver text,
  ADD COLUMN IF NOT EXISTS vehicle text;
