import { Router } from 'express';
import * as transit from '../api/transitMongoService.js';
import * as chamberMongo from '../api/chamberInvoiceMongoService.js';

const router = Router();

function handleError(res, error) {
  console.error('[transit] Error:', error);
  const msg = error?.message || 'Erreur serveur';
  
  if (error?.statusCode === 404 || error?.name === 'NotFound') {
    return res.status(404).json({ message: msg });
  }
  return res.status(500).json({ message: msg });
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, transitData: true, database: 'mongodb' });
});

router.get('/config/currency-symbol', async (_req, res) => {
  try {
    const value = await transit.getCurrencySymbolSetting();
    res.json({ data: value });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/logistics-files/brief', async (_req, res) => {
  try {
    const data = await transit.listLogisticsFilesBrief();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/logistics-files', async (req, res) => {
  try {
    const data = await transit.listLogisticsFiles({
      status: req.query.status,
      search: req.query.search,
    });
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/logistics-files/:id', async (req, res) => {
  try {
    const data = await transit.getLogisticsFile(req.params.id);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/logistics-files', async (req, res) => {
  try {
    const data = await transit.upsertLogisticsFile(req.body || {});
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/logistics-files/:fileId/goods', async (req, res) => {
  try {
    const data = await transit.getGoodsByFileId(req.params.fileId);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/logistics-files/:fileId/goods', async (req, res) => {
  try {
    const data = await transit.upsertFileGoods(req.params.fileId, req.body || {});
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/logistics-files/:fileId/containers', async (req, res) => {
  try {
    const data = await transit.getContainersByFileId(req.params.fileId);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/logistics-files/:fileId/containers', async (req, res) => {
  try {
    await transit.replaceContainers(req.params.fileId, req.body?.lines || []);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/entity-status-history', async (req, res) => {
  try {
    const { entityType, entityId, from, to, note } = req.body || {};
    await transit.logStatusChange(entityType, entityId, from, to, note);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/transportation-records', async (_req, res) => {
  try {
    const data = await transit.listTransportationRecords();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/transportation-records', async (req, res) => {
  try {
    const data = await transit.createTransportationRecord(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/bulk-transport-records', async (_req, res) => {
  try {
    const data = await transit.listBulkTransportRecords();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/bulk-transport-records', async (req, res) => {
  try {
    const data = await transit.createBulkTransportRecord(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/car-reservations', async (_req, res) => {
  try {
    const data = await transit.listCarReservations();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/car-reservations', async (req, res) => {
  try {
    const data = await transit.upsertCarReservation(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/vehicles', async (_req, res) => {
  try {
    const data = await transit.listVehicles();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const data = await transit.upsertVehicle(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/drivers', async (_req, res) => {
  try {
    const data = await transit.listDrivers();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/drivers', async (req, res) => {
  try {
    const data = await transit.upsertDriver(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/expense-requests', async (_req, res) => {
  try {
    const data = await transit.listExpenseRequests();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/expense-requests', async (req, res) => {
  try {
    const data = await transit.createExpenseRequest(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/purchase-requests', async (_req, res) => {
  try {
    const data = await transit.listPurchaseRequests();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/purchase-requests', async (req, res) => {
  try {
    const data = await transit.createPurchaseRequest(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/sales-orders', async (_req, res) => {
  try {
    const data = await transit.listSalesOrders();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/sales-orders', async (req, res) => {
  try {
    const data = await transit.createSalesOrder(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/vendors', async (_req, res) => {
  try {
    const data = await transit.listVendors();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/accounting/invoices', async (_req, res) => {
  try {
    const data = await transit.listAccountingInvoices();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/accounting/vendor-bills', async (_req, res) => {
  try {
    const data = await transit.listAccountingVendorBills();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

/** Chamber Invoices - Exclusively MongoDB */
router.get('/chamber-invoices', async (_req, res) => {
  try {
    const data = await chamberMongo.listChamberInvoicesMongo();
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/chamber-invoices/:id', async (req, res) => {
  try {
    const data = await chamberMongo.getChamberInvoiceFullMongo(req.params.id);
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/chamber-invoices', async (req, res) => {
  try {
    const data = await chamberMongo.createChamberInvoiceMongo(req.body || {});
    res.status(201).json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/chamber-invoices/:id', async (req, res) => {
  try {
    const data = await chamberMongo.updateChamberInvoiceMongo(req.params.id, req.body || {});
    res.json({ data });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete('/chamber-invoices/:id', async (req, res) => {
  try {
    await chamberMongo.deleteChamberInvoiceMongo(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
