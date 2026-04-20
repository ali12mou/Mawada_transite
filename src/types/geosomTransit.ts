/** Types alignés sur database/geosom_transit_schema.sql */

export type LogisticsFileType = 'import' | 'export' | 'atd' | 'local';
export type LogisticsFileStatus = 'open' | 'operation_started' | 'cancelled' | 'completed';
export type CustomerType = 'individual' | 'company';

export interface LogisticsFile {
  id: string;
  job_number: string;
  file_type: LogisticsFileType;
  shipping_line: string | null;
  customer_type: CustomerType | null;
  consignee_shipment: string | null;
  contact_name: string | null;
  title: string | null;
  company_name: string | null;
  email: string | null;
  address: string | null;
  job_position: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  language: string | null;
  agent: string | null;
  sales_team: string | null;
  priority: string | null;
  tags: string[] | null;
  status: LogisticsFileStatus;
  remarks: string | null;
  internal_notes: string | null;
  extra_info: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogisticsFileGoods {
  id: string;
  logistics_file_id: string;
  bl_number: string | null;
  goods_type: string | null;
  total_weight: number | null;
  goods_description: string | null;
  number_of_packages: number | null;
  number_of_40ft: number | null;
  number_of_20ft: number | null;
  updated_at: string;
}

export interface LogisticsFileContainer {
  id: string;
  logistics_file_id: string;
  container_size: string | null;
  number_of_units: number | null;
  description: string | null;
  sort_order: number | null;
  updated_at: string;
}

export interface TransportationRecord {
  id: string;
  logistics_file_id: string;
  job_number: string;
  customer_label: string | null;
  container_number: string | null;
  truck_number: string | null;
  goods_type: string | null;
  transferred_date: string | null;
  state: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulkTransportRecord {
  id: string;
  logistics_file_id: string;
  job_number: string;
  customer_label: string | null;
  vehicle_id: string | null;
  goods_type: string | null;
  state: string | null;
  transferred_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarReservation {
  id: string;
  logistics_file_id: string | null;
  goods_type: string | null;
  job_number: string;
  vehicle_id: string | null;
  vehicle_owner: string | null;
  contacts_employees: string | null;
  approver: string | null;
  rfq1: string | null;
  rfq2: string | null;
  start_time: string | null;
  end_time: string | null;
  pickup_location: string | null;
  drop_location: string | null;
  kilometers: number | null;
  description: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitVehicle {
  id: string;
  model: string | null;
  license_plate: string;
  driver_id: string | null;
  mobility_card: string | null;
  fleet_manager: string | null;
  location: string | null;
  immatriculation_date: string | null;
  chassis_number: string | null;
  odometer: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitDriver {
  id: string;
  name: string;
  phone: string | null;
  license_number: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRequest {
  id: string;
  number: string | null;
  vendor_id: string | null;
  job_number: string | null;
  logistics_file_id: string | null;
  vehicle_id: string | null;
  fleet_type: string | null;
  bill_reference: string | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  bill_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  reference: string | null;
  vendor_id: string | null;
  job_number: string | null;
  logistics_file_id: string | null;
  currency: string | null;
  status: string | null;
  order_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  id: string;
  number: string | null;
  logistics_file_id: string | null;
  job_number: string | null;
  customer_name: string;
  total_amount: number | null;
  status: string | null;
  creation_date: string | null;
  created_at: string;
  updated_at: string;
}
