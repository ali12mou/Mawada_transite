import {
  TRANSPORT_MENU_ITEMS,
  TRANSPORT_SIDEBAR_CHILDREN,
  TRANSPORT_MANAGEMENT_MENU_ID,
  TRANSPORTS_MENU_ID,
} from './transportMenu';

export type MenuTreeNode = {
  id: string;
  children?: MenuTreeNode[];
};

/** Arborescence des menus / sous-menus (alignée sur Layout). */
export const MENU_TREE: MenuTreeNode[] = [
  { id: 'dashboard' },
  {
    id: 'services',
    children: [
      { id: 'commercial-chamber' },
      { id: 'chamber-transfer' },
      { id: 'local-company' },
      { id: 'transfer-document-9' },
      { id: 'chamber-invoice' },
      { id: 'performa' },
      { id: 'certificate-origin' },
      { id: 'other-profit' },
    ],
  },
  {
    id: 'imports',
    children: [
      { id: 'suppliers' },
      { id: 'orders' },
      { id: 'order-verification' },
      { id: 'order-reception' },
      { id: 'document-9' },
      { id: 'document-4' },
      { id: 'clearance' },
      { id: 'invoice-report' },
    ],
  },
  {
    id: 'warehouses',
    children: [{ id: 'products' }, { id: 'inventories' }, { id: 'warehouse' }],
  },
  {
    id: TRANSPORT_MANAGEMENT_MENU_ID,
    children: TRANSPORT_MENU_ITEMS.map((e) => ({ id: e.id })),
  },
  {
    id: TRANSPORTS_MENU_ID,
    children: TRANSPORT_SIDEBAR_CHILDREN.map((id) => ({ id })),
  },
  {
    id: 'expenses',
    children: [{ id: 'expense-categories' }, { id: 'expense' }],
  },
  {
    id: 'hr',
    children: [
      {
        id: 'personnel-file',
        children: [
          { id: 'employees' },
          { id: 'contract-types' },
          { id: 'employee-professions' },
          { id: 'employee-documents' },
        ],
      },
      {
        id: 'payroll',
        children: [
          { id: 'generate-payroll' },
          { id: 'payroll-approval' },
          { id: 'tax-rates' },
        ],
      },
      {
        id: 'leave-management',
        children: [
          { id: 'leave-request' },
          { id: 'leave-types' },
          { id: 'leave-return-request' },
        ],
      },
      {
        id: 'attendance-management',
        children: [{ id: 'attendance' }],
      },
    ],
  },
  {
    id: 'registration',
    children: [
      { id: 'clients' },
      { id: 'bank' },
      { id: 'item-prices' },
      { id: 'goods-categories' },
      { id: 'companies' },
    ],
  },
  {
    id: 'reports',
    children: [
      { id: 'import-reports' },
      { id: 'hr-reports' },
      { id: 'financial-reports' },
      { id: 'services-reports' },
    ],
  },
  {
    id: 'settings',
    children: [
      { id: 'roles' },
      { id: 'permissions' },
      { id: 'users' },
      { id: 'configurations' },
    ],
  },
];

export function flattenMenuIds(nodes: MenuTreeNode[] = MENU_TREE): string[] {
  const ids: string[] = [];
  const walk = (list: MenuTreeNode[]) => {
    for (const node of list) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

export function collectSubtreeIds(node: MenuTreeNode): string[] {
  const ids = [node.id];
  for (const child of node.children || []) {
    ids.push(...collectSubtreeIds(child));
  }
  return ids;
}
