-- GEOSOM TRANSIT — schéma modules transport / logistique
-- À exécuter dans Supabase SQL Editor (PostgreSQL 15+)
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Référentiels
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transit_vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  bank_account TEXT,
  type TEXT DEFAULT 'supplier',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'service',
  price NUMERIC(18,2),
  tax_rate NUMERIC(8,4),
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_currencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  symbol TEXT,
  active BOOLEAN DEFAULT TRUE
);

INSERT INTO transit_currencies (code, name, symbol) VALUES
  ('DJF', 'Franc djiboutien', 'FDJ'),
  ('USD', 'US Dollar', 'USD'),
  ('EUR', 'Euro', '€')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Chauffeurs & véhicules (Flotte)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transit_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model TEXT,
  license_plate TEXT NOT NULL,
  driver_id UUID REFERENCES transit_drivers(id) ON DELETE SET NULL,
  mobility_card TEXT,
  fleet_manager TEXT,
  location TEXT,
  immatriculation_date DATE,
  chassis_number TEXT,
  odometer NUMERIC(14,2),
  status TEXT DEFAULT 'available',
  future_driver_id UUID REFERENCES transit_drivers(id) ON DELETE SET NULL,
  driver_assignment_date DATE,
  tax_info JSONB,
  model_info JSONB,
  note_tab TEXT,
  account_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_vehicle_odometer (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES transit_vehicles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  kilometers NUMERIC(14,2) NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS transit_vehicle_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES transit_vehicles(id) ON DELETE CASCADE,
  service_type TEXT,
  service_date DATE,
  cost NUMERIC(18,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Dossier logistique principal (point de départ métier)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logistics_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL CHECK (file_type IN ('import', 'export', 'atd', 'local')),
  shipping_line TEXT,
  customer_type TEXT CHECK (customer_type IN ('individual', 'company')),
  consignee_shipment TEXT,
  contact_name TEXT,
  title TEXT,
  company_name TEXT,
  email TEXT,
  address TEXT,
  job_position TEXT,
  phone TEXT,
  mobile TEXT,
  website TEXT,
  language TEXT,
  agent TEXT,
  sales_team TEXT,
  priority TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'operation_started', 'cancelled', 'completed')),
  remarks TEXT,
  internal_notes TEXT,
  extra_info TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_file_goods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logistics_file_id UUID NOT NULL REFERENCES logistics_files(id) ON DELETE CASCADE,
  bl_number TEXT,
  goods_type TEXT,
  total_weight NUMERIC(18,4),
  goods_description TEXT,
  number_of_packages INTEGER,
  number_of_40ft INTEGER DEFAULT 0,
  number_of_20ft INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logistics_file_containers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logistics_file_id UUID NOT NULL REFERENCES logistics_files(id) ON DELETE CASCADE,
  container_size TEXT,
  number_of_units INTEGER DEFAULT 1,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Transport (lié obligatoirement à un dossier)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transportation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logistics_file_id UUID NOT NULL REFERENCES logistics_files(id) ON DELETE RESTRICT,
  job_number TEXT NOT NULL,
  customer_label TEXT,
  container_number TEXT,
  truck_number TEXT,
  goods_type TEXT,
  transferred_date DATE,
  state TEXT DEFAULT 'draft',
  vehicle_id UUID REFERENCES transit_vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES transit_drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_transport_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logistics_file_id UUID NOT NULL REFERENCES logistics_files(id) ON DELETE RESTRICT,
  job_number TEXT NOT NULL,
  customer_label TEXT,
  vehicle_id UUID REFERENCES transit_vehicles(id) ON DELETE SET NULL,
  goods_type TEXT DEFAULT 'bulk',
  state TEXT DEFAULT 'draft',
  transferred_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logistics_file_id UUID REFERENCES logistics_files(id) ON DELETE SET NULL,
  goods_type TEXT,
  job_number TEXT NOT NULL,
  vehicle_id UUID REFERENCES transit_vehicles(id) ON DELETE SET NULL,
  vehicle_owner TEXT,
  contacts_employees TEXT,
  approver TEXT,
  rfq1 TEXT,
  rfq2 TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  pickup_location TEXT,
  drop_location TEXT,
  kilometers NUMERIC(14,2),
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS car_reservation_containers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_reservation_id UUID NOT NULL REFERENCES car_reservations(id) ON DELETE CASCADE,
  container_number TEXT,
  job_number TEXT
);

-- ---------------------------------------------------------------------------
-- Dépenses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT UNIQUE,
  vendor_id UUID REFERENCES transit_vendors(id) ON DELETE SET NULL,
  job_number TEXT,
  logistics_file_id UUID REFERENCES logistics_files(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES transit_vehicles(id) ON DELETE SET NULL,
  fleet_type TEXT,
  bill_reference TEXT,
  partner_ref TEXT,
  payment_reference TEXT,
  recipient_bank TEXT,
  bill_date DATE,
  accounting_date DATE,
  due_date DATE,
  journal_id UUID,
  currency_id UUID REFERENCES transit_currencies(id) ON DELETE SET NULL,
  amount_untaxed NUMERIC(18,2) DEFAULT 0,
  tax_amount NUMERIC(18,2) DEFAULT 0,
  total_amount NUMERIC(18,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'not_paid',
  status TEXT DEFAULT 'draft',
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_request_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_request_id UUID NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES transit_products(id) ON DELETE SET NULL,
  label TEXT,
  account_ref TEXT,
  quantity NUMERIC(18,4) DEFAULT 1,
  price NUMERIC(18,4) DEFAULT 0,
  tax_id TEXT,
  subtotal NUMERIC(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_request_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_request_id UUID NOT NULL REFERENCES expense_requests(id) ON DELETE CASCADE,
  action TEXT,
  note TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Achats & Ventes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference TEXT UNIQUE,
  vendor_id UUID REFERENCES transit_vendors(id) ON DELETE SET NULL,
  job_number TEXT,
  logistics_file_id UUID REFERENCES logistics_files(id) ON DELETE SET NULL,
  customer_label TEXT,
  currency TEXT DEFAULT 'DJF',
  order_deadline DATE,
  receipt_date DATE,
  status TEXT DEFAULT 'rfq',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_request_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES transit_products(id) ON DELETE SET NULL,
  description TEXT,
  quantity NUMERIC(18,4) DEFAULT 1,
  unit_price NUMERIC(18,4) DEFAULT 0,
  tax NUMERIC(18,4) DEFAULT 0,
  subtotal NUMERIC(18,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT UNIQUE,
  logistics_file_id UUID REFERENCES logistics_files(id) ON DELETE SET NULL,
  job_number TEXT,
  customer_name TEXT NOT NULL,
  salesperson TEXT,
  creation_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  pricelist TEXT,
  payment_terms TEXT,
  total_amount NUMERIC(18,2) DEFAULT 0,
  status TEXT DEFAULT 'quotation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES transit_products(id) ON DELETE SET NULL,
  description TEXT,
  quantity NUMERIC(18,4) DEFAULT 1,
  unit_price NUMERIC(18,4) DEFAULT 0,
  tax NUMERIC(18,4) DEFAULT 0,
  subtotal NUMERIC(18,2) DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- Comptabilité (simplifié)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT,
  invoice_number TEXT UNIQUE,
  invoice_date DATE,
  due_date DATE,
  currency TEXT DEFAULT 'DJF',
  total_amount NUMERIC(18,2),
  status TEXT DEFAULT 'draft',
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting_vendor_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES transit_vendors(id) ON DELETE SET NULL,
  bill_number TEXT,
  bill_date DATE,
  due_date DATE,
  currency TEXT DEFAULT 'DJF',
  total_amount NUMERIC(18,2),
  status TEXT DEFAULT 'draft',
  expense_request_id UUID REFERENCES expense_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_name TEXT,
  payment_date DATE,
  amount NUMERIC(18,2),
  payment_method TEXT,
  journal_id UUID,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_code TEXT,
  entry_date DATE,
  account_code TEXT,
  debit NUMERIC(18,2) DEFAULT 0,
  credit NUMERIC(18,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Historique statuts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT,
  note TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_status_history_entity ON entity_status_history(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Triggers updated_at (tables avec colonne updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_logistics_files_updated ON logistics_files;
CREATE TRIGGER trg_logistics_files_updated
  BEFORE UPDATE ON logistics_files
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_transit_vehicles_updated ON transit_vehicles;
CREATE TRIGGER trg_transit_vehicles_updated
  BEFORE UPDATE ON transit_vehicles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_transit_drivers_updated ON transit_drivers;
CREATE TRIGGER trg_transit_drivers_updated
  BEFORE UPDATE ON transit_drivers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_transit_vendors_updated ON transit_vendors;
CREATE TRIGGER trg_transit_vendors_updated
  BEFORE UPDATE ON transit_vendors
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_expense_requests_updated ON expense_requests;
CREATE TRIGGER trg_expense_requests_updated
  BEFORE UPDATE ON expense_requests
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_purchase_requests_updated ON purchase_requests;
CREATE TRIGGER trg_purchase_requests_updated
  BEFORE UPDATE ON purchase_requests
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_sales_orders_updated ON sales_orders;
CREATE TRIGGER trg_sales_orders_updated
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_transportation_records_updated ON transportation_records;
CREATE TRIGGER trg_transportation_records_updated
  BEFORE UPDATE ON transportation_records
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_bulk_transport_records_updated ON bulk_transport_records;
CREATE TRIGGER trg_bulk_transport_records_updated
  BEFORE UPDATE ON bulk_transport_records
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_car_reservations_updated ON car_reservations;
CREATE TRIGGER trg_car_reservations_updated
  BEFORE UPDATE ON car_reservations
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_logistics_file_goods_updated ON logistics_file_goods;
CREATE TRIGGER trg_logistics_file_goods_updated
  BEFORE UPDATE ON logistics_file_goods
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_logistics_file_containers_updated ON logistics_file_containers;
CREATE TRIGGER trg_logistics_file_containers_updated
  BEFORE UPDATE ON logistics_file_containers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : accès complet pour le rôle authenticated (affiner par rôle ensuite)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'logistics_files','logistics_file_goods','logistics_file_containers',
    'transportation_records','bulk_transport_records','car_reservations','car_reservation_containers',
    'transit_drivers','transit_vehicles','transit_vehicle_odometer','transit_vehicle_services',
    'transit_vendors','transit_products','transit_currencies',
    'expense_requests','expense_request_lines','expense_request_history',
    'purchase_requests','purchase_request_lines',
    'sales_orders','sales_order_lines',
    'accounting_invoices','accounting_vendor_bills','accounting_payments','accounting_journal_entries',
    'entity_status_history'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS allow_all_authenticated ON %I;', tbl);
    EXECUTE format(
      'CREATE POLICY allow_all_authenticated ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END $$;

COMMENT ON TABLE logistics_files IS 'Dossier principal — obligatoire avant transport / réservation';
COMMENT ON TABLE transportation_records IS 'Transport unitaire lié à un dossier';
COMMENT ON TABLE bulk_transport_records IS 'Transport vrac lié à un dossier';
COMMENT ON TABLE car_reservations IS 'Réservation véhicule';
