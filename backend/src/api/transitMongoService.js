import { getCollection } from './mongoService.js';
import { ObjectId } from 'mongodb';

export async function getCurrencySymbolSetting() {
  const col = getCollection('settings');
  const setting = await col.findOne({ key: 'currency_symbol' });
  return setting?.value || '$';
}

export async function listLogisticsFilesBrief() {
  const col = getCollection('logistics_files');
  return col.find({}, { projection: { file_number: 1, client_name: 1 } }).toArray();
}

export async function listLogisticsFiles(filters = {}) {
  const col = getCollection('logistics_files');
  const query = {};
  if (filters.status && filters.status !== 'All') query.status = filters.status;
  if (filters.search) {
    query.$or = [
      { file_number: { $regex: filters.search, $options: 'i' } },
      { client_name: { $regex: filters.search, $options: 'i' } }
    ];
  }
  return col.find(query).sort({ createdAt: -1 }).toArray();
}

export async function getLogisticsFile(id) {
  const col = getCollection('logistics_files');
  return col.findOne({ _id: new ObjectId(id) });
}

export async function upsertLogisticsFile(payload) {
  const col = getCollection('logistics_files');
  const { _id, ...data } = payload;
  if (_id) {
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: { ...data, updatedAt: new Date() } });
    return { _id, ...data };
  } else {
    data.createdAt = new Date();
    data.updatedAt = new Date();
    const res = await col.insertOne(data);
    return { _id: res.insertedId, ...data };
  }
}

export async function getGoodsByFileId(fileId) {
  const col = getCollection('logistics_goods');
  return col.find({ file_id: fileId }).toArray();
}

export async function upsertFileGoods(fileId, payload) {
  const col = getCollection('logistics_goods');
  const { _id, ...data } = payload;
  data.file_id = fileId;
  if (_id) {
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: { ...data, updatedAt: new Date() } });
    return { _id, ...data };
  } else {
    data.createdAt = new Date();
    const res = await col.insertOne(data);
    return { _id: res.insertedId, ...data };
  }
}

export async function getContainersByFileId(fileId) {
  const col = getCollection('logistics_containers');
  return col.find({ file_id: fileId }).toArray();
}

export async function replaceContainers(fileId, lines = []) {
  const col = getCollection('logistics_containers');
  await col.deleteMany({ file_id: fileId });
  if (lines.length > 0) {
    const docs = lines.map(l => ({ ...l, file_id: fileId, createdAt: new Date() }));
    await col.insertMany(docs);
  }
}

export async function logStatusChange(entityType, entityId, from, to, note) {
  const col = getCollection('status_history');
  await col.insertOne({
    entityType,
    entityId,
    from,
    to,
    note,
    createdAt: new Date()
  });
}

// Transportation
export async function listTransportationRecords() {
  return getCollection('transportation_records').find().toArray();
}

export async function createTransportationRecord(data) {
  const col = getCollection('transportation_records');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listBulkTransportRecords() {
  return getCollection('bulk_transport_records').find().toArray();
}

export async function createBulkTransportRecord(data) {
  const col = getCollection('bulk_transport_records');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

// Fleet & Reservations
export async function listCarReservations() {
  return getCollection('car_reservations').find().toArray();
}

export async function upsertCarReservation(payload) {
  const col = getCollection('car_reservations');
  const { _id, ...data } = payload;
  if (_id) {
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: data });
    return payload;
  }
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listVehicles() {
  return getCollection('vehicles').find().toArray();
}

export async function upsertVehicle(payload) {
  const col = getCollection('vehicles');
  const { _id, ...data } = payload;
  if (_id) {
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: data });
    return payload;
  }
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listDrivers() {
  return getCollection('drivers').find().toArray();
}

export async function upsertDriver(payload) {
  const col = getCollection('drivers');
  const { _id, ...data } = payload;
  if (_id) {
    await col.updateOne({ _id: new ObjectId(_id) }, { $set: data });
    return payload;
  }
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

// Requests & Orders
export async function listExpenseRequests() {
  return getCollection('expense_requests').find().toArray();
}

export async function createExpenseRequest(data) {
  const col = getCollection('expense_requests');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listPurchaseRequests() {
  return getCollection('purchase_requests').find().toArray();
}

export async function createPurchaseRequest(data) {
  const col = getCollection('purchase_requests');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listSalesOrders() {
  return getCollection('sales_orders').find().toArray();
}

export async function createSalesOrder(data) {
  const col = getCollection('sales_orders');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function listVendors() {
  return getCollection('vendors').find().toArray();
}

export async function listAccountingInvoices() {
  return getCollection('accounting_invoices').find().toArray();
}

export async function listAccountingVendorBills() {
  return getCollection('accounting_vendor_bills').find().toArray();
}

// Chamber Invoices (Legacy support for transit routes)
export async function listChamberInvoices() {
  return getCollection('chamber_invoices').find().toArray();
}

export async function getChamberInvoiceFull(id) {
  return getCollection('chamber_invoices').findOne({ _id: new ObjectId(id) });
}

export async function createChamberInvoice(data) {
  const col = getCollection('chamber_invoices');
  const res = await col.insertOne({ ...data, createdAt: new Date() });
  return { _id: res.insertedId, ...data };
}

export async function updateChamberInvoice(id, data) {
  const col = getCollection('chamber_invoices');
  await col.updateOne({ _id: new ObjectId(id) }, { $set: data });
  return { _id: id, ...data };
}

export async function deleteChamberInvoice(id) {
  await getCollection('chamber_invoices').deleteOne({ _id: new ObjectId(id) });
}
