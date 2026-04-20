-- Colonnes optionnelles pour le formulaire / impression « PERFORMA INVOICE » (en-tête vendeur, date, tél. acheteur).
-- À exécuter dans Supabase SQL Editor si l’insert échoue avec erreur de colonne manquante.

ALTER TABLE performa ADD COLUMN IF NOT EXISTS vendor_address text;
ALTER TABLE performa ADD COLUMN IF NOT EXISTS vendor_tel text;
ALTER TABLE performa ADD COLUMN IF NOT EXISTS buyer_tel text;
ALTER TABLE performa ADD COLUMN IF NOT EXISTS invoice_date date;

ALTER TABLE performa_items ADD COLUMN IF NOT EXISTS origin text;
