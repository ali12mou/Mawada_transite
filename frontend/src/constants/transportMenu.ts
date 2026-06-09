import type { LucideIcon } from 'lucide-react';
import {
  FolderOpen,
  Truck,
  Boxes,
  Car,
  Bus,
  Receipt,
  ShoppingCart,
  Store,
  Landmark,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react';

export const TRANSPORT_MANAGEMENT_MENU_ID = 'transports-management';
export const TRANSPORTS_MENU_ID = 'transports';

export interface TransportMenuEntry {
  id: string;
  icon: LucideIcon;
}

/** Sous-menus du menu « Transports » (référentiel). */
export const TRANSPORT_SIDEBAR_CHILDREN = [
  'carriers',
  'associations',
  'carrier-mode',
  'routes',
  'shipping-lines',
] as const;

export type TransportSidebarPage = (typeof TRANSPORT_SIDEBAR_CHILDREN)[number];

/** Sous-menus du menu « Gestion de transports » (modules transit). */
export const TRANSPORT_MENU_ITEMS: TransportMenuEntry[] = [
  { id: 'logistics-files-operations', icon: FolderOpen },
  { id: 'transportation-management', icon: Truck },
  { id: 'bulk-transportation-management', icon: Boxes },
  { id: 'car-reservations', icon: Car },
  { id: 'fleet-management', icon: Bus },
  { id: 'transport-expense-requests', icon: Receipt },
  { id: 'purchase-management', icon: ShoppingCart },
  { id: 'sales-management', icon: Store },
  { id: 'accounting-system', icon: Landmark },
  { id: 'transport-reporting-analytics', icon: PieChart },
  { id: 'transport-configuration-admin', icon: SlidersHorizontal },
];

const TRANSPORT_MODULE_PAGE_IDS = new Set(TRANSPORT_MENU_ITEMS.map((i) => i.id));
const TRANSPORT_SIDEBAR_PAGE_IDS = new Set<string>(TRANSPORT_SIDEBAR_CHILDREN);

export function isTransportModulePage(page: string): boolean {
  return TRANSPORT_MODULE_PAGE_IDS.has(page);
}

export function isTransportSidebarPage(page: string): boolean {
  return TRANSPORT_SIDEBAR_PAGE_IDS.has(page);
}

export function getTransportMenuIcon(id: string): LucideIcon | undefined {
  return TRANSPORT_MENU_ITEMS.find((i) => i.id === id)?.icon;
}

/** Premier sous-menu ouvert au clic sur « Gestion de transports ». */
export const DEFAULT_TRANSPORT_MANAGEMENT_PAGE = TRANSPORT_MENU_ITEMS[0].id;

/** Premier sous-menu ouvert au clic sur « Transports ». */
export const DEFAULT_TRANSPORTS_PAGE: TransportSidebarPage = TRANSPORT_SIDEBAR_CHILDREN[0];
