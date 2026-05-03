import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../frontend/src');

const tableMap = {
  'ShippingLines.tsx': 'shipping_lines',
  'Routes.tsx': 'routes',
  'OrderReception.tsx': 'order_receptions',
  'Document4.tsx': 'document_4',
  'DeliveredOrders.tsx': 'delivered_orders',
  'Clearance.tsx': 'clearance',
  'CertificateOrigin.tsx': 'certificate_origin',
  'CarrierMode.tsx': 'carrier_modes',
  'OtherExpenses.tsx': 'other_expenses',
  'TaxRates.tsx': 'tax_rates',
  'Performa.tsx': 'performa',
  'InvoiceReport.tsx': 'invoice_reports',
  'ExpenseAllocation.tsx': 'expense_allocation',
  'LeaveTypes.tsx': 'leave_types',
  'LeaveReturnRequest.tsx': 'leave_return_requests',
  'Banks.tsx': 'banks',
  'LeaveRequest.tsx': 'leave_requests',
  'HRReports.tsx': 'hr_reports',
  'EmployeeProfessions.tsx': 'employee_professions',
  'EmployeeDocuments.tsx': 'employee_documents',
  'ContractTypes.tsx': 'contract_types',
  'Roles.tsx': 'roles',
  'Products.tsx': 'products',
  'ProductCategories.tsx': 'product_categories',
  'CustomerFile.tsx': 'customer_files',
  'Associations.tsx': 'owners',
  'Attendance.tsx': 'attendance',
  'PayrollApproval.tsx': 'payroll_approvals',
  'ServicesReports.tsx': 'services_reports',
  'ProductPrices.tsx': 'product_prices',
  'GeneratePayroll.tsx': 'payroll',
  'FinancialReports.tsx': 'financial_reports',
  'ChamberInvoice.tsx': 'chamber_invoices',
  'Inventories.tsx': 'inventories',
  'Carriers.tsx': 'carriers'
};

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(root, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const mainTable = tableMap[fileName] || '';

  let changed = false;

  // 1. Fix broken genericApi.list('')
  if (content.includes("genericApi.list('')") && mainTable) {
    content = content.replace(/genericApi\.list\(''\)/g, `genericApi.list('${mainTable}')`);
    changed = true;
  }

  // 2. Fix broken genericApi.update('', , )
  if (content.includes("genericApi.update('', , )") && mainTable) {
    content = content.replace(/genericApi\.update\('', , \)/g, (match) => {
        let idVar = 'editingId';
        if (content.includes('editingOwner')) idVar = 'editingOwner.id';
        if (content.includes('editingLine')) idVar = 'editingLine.id';
        if (content.includes('editingInventory')) idVar = 'editingInventory.id';
        if (content.includes('editingId')) idVar = 'editingId';
        
        let dataVar = 'formData';
        if (content.includes('cnssFormData'))  dataVar = 'cnssFormData';

        return `genericApi.update('${mainTable}', ${idVar}, ${dataVar})`;
    });
    changed = true;
  }

  // 3. Fix broken genericApi.create('', )
  if (content.includes("genericApi.create('', )") && mainTable) {
     content = content.replace(/genericApi\.create\('', \)/g, (match) => {
        let dataVar = 'formData';
        if (content.includes('cnssFormData'))  dataVar = 'cnssFormData';
        return `genericApi.create('${mainTable}', ${dataVar})`;
     });
     changed = true;
  }

  // 4. Fix broken genericApi.delete('', )
  if (content.includes("genericApi.delete('', )") && mainTable) {
     content = content.replace(/genericApi\.delete\('', \)/g, (match) => {
        // usually it's id or some local var
        return `genericApi.delete('${mainTable}', id)`;
     });
     changed = true;
  }

  // 5. Robust multi-line Supabase replacement
  if (content.includes('supabase.')) {
      // Replace complex from().select() blocks
      content = content.replace(/supabase\s*\.from\('([^']*)'\)\s*\.select\(`[\s\S]*?`\)(\s*\.order\([\s\S]*?\))?/g, "genericApi.list('$1')");
      content = content.replace(/supabase\s*\.from\('([^']*)'\)\s*\.select\('([^']*)'\)(\s*\.order\([\s\S]*?\))?/g, "genericApi.list('$1')");
      content = content.replace(/supabase\s*\.from\('([^']*)'\)\s*\.select\('\*'\)\s*\.single\(\)/g, "genericApi.list('$1').then(d => d[0])");
      
      // Clean up the genericApi.list().order() chains if they exist (since genericApi doesn't support .order at the moment)
      content = content.replace(/genericApi\.list\('(.*?)'\)\.order\(([\s\S]*?)\)/g, "genericApi.list('$1')");

      // Replace status-wrapped blocks
      content = content.replace(/if\s*\((.*Res)\.error\)\s*throw\s*\1\.error;/g, "");
      
      // Replace data access
      content = content.replace(/(.*Res)\.data/g, "$1");

      changed = true;
  }

  // 6. Final cleanup of any import { supabase }
  if (content.includes('import { supabase }')) {
      content = content.replace(/import\s*\{\s*supabase\s*\}\s*from\s*['"].*['"];?\s*/g, "");
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
});
