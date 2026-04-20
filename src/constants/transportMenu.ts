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

export interface TransportMenuEntry {
  id: string;
  icon: LucideIcon;
}

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

const TRANSPORT_PAGE_IDS = new Set(TRANSPORT_MENU_ITEMS.map(i => i.id));

export function isTransportModulePage(page: string): boolean {
  return TRANSPORT_PAGE_IDS.has(page);
}

export function getTransportMenuIcon(id: string): LucideIcon | undefined {
  return TRANSPORT_MENU_ITEMS.find(i => i.id === id)?.icon;
}

/** Page ouverte au premier clic sur « Transports » (sous-menu déplié) ou par défaut depuis le routeur. */
export const DEFAULT_TRANSPORT_PAGE = TRANSPORT_MENU_ITEMS[0].id;
