import { ReactNode, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Import,
  Warehouse,
  Truck,
  DollarSign,
  Users,
  UserPlus,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Bell,
  ChevronRight,
  Languages,
  FileText,
  Building2,
  MapPin,
  ClipboardList,
  Folder,
  Shield,
  Box,
  Tag,
  Bookmark,
  CreditCard,
  Wallet,
  Ship,
  Briefcase,
  Calculator,
  BadgePercent,
  CalendarClock,
  UserCheck,
  Landmark,
  PieChart,
  ShieldCheck,
  UserCog,
  CheckSquare,
  Scale,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Footer } from '../modules/Shared/Footer';
import {
  TRANSPORT_MENU_ITEMS,
  isTransportModulePage,
  DEFAULT_TRANSPORT_PAGE,
} from '../constants/transportMenu';
import { BrandingLogoMark } from '../modules/Shared/BrandingLogoMark';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate?: (page: string) => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  children?: string[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: string[];
  subMenus?: SubMenuItem[];
}

const getMenuItems = (t: (key: string) => string): MenuItem[] => [
  { id: 'dashboard', label: t('menu.dashboard'), icon: LayoutDashboard },
  { id: 'services', label: t('menu.services'), icon: Package, children: ['commercial-chamber', 'local-company', 'transfer-document-9', 'chamber-invoice', 'performa', 'customer-file', 'certificate-origin'] },
  { id: 'imports', label: t('menu.imports'), icon: Import, children: ['suppliers', 'orders', 'order-verification', 'order-reception', 'delivered-orders', 'document-9', 'document-4', 'clearance', 'invoice-report'] },
  { id: 'warehouses', label: t('menu.warehouses'), icon: Warehouse, children: ['products', 'inventories', 'warehouse'] },
  {
    id: 'transports',
    label: t('menu.transports'),
    icon: Truck,
    children: TRANSPORT_MENU_ITEMS?.map(entry => entry.id),
  },
  { id: 'expenses', label: t('menu.expenses'), icon: DollarSign, children: ['expense-categories', 'expense', 'expense-allocation', 'other-expenses', 'maritime-lines'] },
  {
    id: 'hr',
    label: t('menu.hr'),
    icon: Users,
    subMenus: [
      {
        id: 'personnel-file',
        label: t('menu.personnel-file'),
        children: ['employees', 'contract-types', 'employee-professions', 'employee-documents']
      },
      {
        id: 'payroll',
        label: t('menu.payroll'),
        children: ['generate-payroll', 'payroll-approval', 'tax-rates']
      },
      {
        id: 'leave-management',
        label: t('menu.leave-management'),
        children: ['leave-request', 'leave-types', 'leave-return-request']
      },
      {
        id: 'attendance-management',
        label: t('menu.attendance-management'),
        children: ['attendance']
      }
    ]
  },
  { id: 'registration', label: t('menu.registration'), icon: UserPlus, children: ['clients', 'bank', 'item-prices', 'goods-categories', 'companies'] },
  { id: 'reports', label: t('menu.reports'), icon: BarChart3, children: ['import-reports', 'hr-reports', 'financial-reports', 'services-reports'] },
  { id: 'settings', label: t('menu.settings'), icon: Settings, children: ['roles', 'users', 'configurations'] },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [expandedSubMenus, setExpandedSubMenus] = useState<string[]>([]);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const menuItems = getMenuItems(t);

  useEffect(() => {
    if (isTransportModulePage(currentPage)) {
      setExpandedItems(prev => (prev.includes('transports') ? prev : [...prev, 'transports']));
    }
  }, [currentPage]);

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.id === 'transports' && item.children) {
      if (!expandedItems.includes('transports')) {
        setExpandedItems(['transports']);
        if (onNavigate) onNavigate(DEFAULT_TRANSPORT_PAGE);
      } else {
        setExpandedItems([]);
      }
      return;
    }
    if (item.children || item.subMenus) {
      toggleExpand(item.id);
      return;
    }

    if (onNavigate) {
      onNavigate(item.id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => (prev.includes(id) ? [] : [id]));
  };

  const toggleSubMenuExpand = (id: string) => {
    setExpandedSubMenus(prev => (prev.includes(id) ? [] : [id]));
  };

  const getChildIcon = (id: string) => {
    const transportMatch = TRANSPORT_MENU_ITEMS.find((x) => x.id === id);
    if (transportMatch && transportMatch.icon) return transportMatch.icon;

    switch (id) {
      case 'commercial-chamber': return Building2;
      case 'local-company': return MapPin;
      case 'transfer-document-9':
      case 'document-9':
      case 'document-4': return FileText;
      case 'chamber-invoice':
      case 'invoice-report': return FileText;
      case 'performa': return ClipboardList;
      case 'customer-file': return Folder;
      case 'certificate-origin': return Shield;
      case 'suppliers': return Users;
      case 'orders': return Package;
      case 'order-verification': return CheckSquare;
      case 'order-reception': return Box;
      case 'delivered-orders': return Truck;
      case 'clearance': return Scale;
      case 'products': return Tag;
      case 'inventories': return ClipboardList;
      case 'warehouse': return Warehouse;
      case 'expense-categories': return Bookmark;
      case 'expense':
      case 'other-expenses': return CreditCard;
      case 'expense-allocation': return Wallet;
      case 'maritime-lines': return Ship;
      case 'employees': return Users;
      case 'contract-types': return FileText;
      case 'employee-professions': return Briefcase;
      case 'employee-documents': return Folder;
      case 'generate-payroll': return Calculator;
      case 'payroll-approval': return CheckSquare;
      case 'tax-rates': return BadgePercent;
      case 'leave-request':
      case 'leave-return-request': return CalendarClock;
      case 'leave-types': return Bookmark;
      case 'attendance': return UserCheck;
      case 'clients': return Users;
      case 'bank': return Landmark;
      case 'item-prices': return Tag;
      case 'goods-categories': return Package;
      case 'companies': return Building2;
      case 'import-reports':
      case 'hr-reports':
      case 'financial-reports':
      case 'services-reports': return PieChart;
      case 'roles': return ShieldCheck;
      case 'users': return UserCog;
      case 'configurations': return Settings;
      default: return ChevronRight;
    }
  };

  const getLanguageLabel = () => {
    switch (language) {
      case 'en': return 'English';
      case 'fr': return 'Français';
      case 'ar': return 'العربية';
    }
  };

  const getLanguageFlag = () => {
    switch (language) {
      case 'en': return 'https://flagcdn.com/w40/us.png';
      case 'fr': return 'https://flagcdn.com/w40/fr.png';
      case 'ar': return 'https://flagcdn.com/w40/dj.png';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-[#0F3C66] text-white flex flex-col shadow-xl">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-6 border-b border-[#154b8a] text-left hover:bg-[#154b8a]/40 transition"
        >
          <div className="flex items-center gap-3">
            <BrandingLogoMark />
            <h1 className="text-xl font-bold leading-tight">GEOSOM TRANSIT</h1>
          </div>
        </button>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems?.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.id);
            const isActive =
              currentPage === item.id ||
              (item.id === 'transports' && isTransportModulePage(currentPage));

            return (
              <div key={item.id}>
                <button
                  className={`w-full flex items-center justify-between px-6 py-3 text-left transition ${isActive
                    ? 'bg-[#154b8a] border-l-4 border-[#EE964C]'
                    : 'hover:bg-[#154b8a]/50'
                    }`}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {(item.children || item.subMenus) && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''
                        }`}
                    />
                  )}
                </button>
                {item.children && isExpanded && (
                  <div className="bg-[#152a44]/30">
                    {item.children?.map((child) => {
                      const ChildIcon = getChildIcon(child);
                      return (
                        <button
                          key={child}
                          onClick={() => onNavigate && onNavigate(child)}
                          className={`w-full flex items-center gap-3 px-12 py-2 text-left text-sm transition ${currentPage === child
                            ? 'bg-[#154b8a]/50 text-[#EE964C]'
                            : 'hover:bg-[#154b8a]/30'
                            }`}
                        >
                          <ChildIcon size={14} />
                          {t(`menu.${child}`)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {item.subMenus && isExpanded && (
                  <div className="bg-[#152a44]/30">
                    {item.subMenus?.map((subMenu) => {
                      const isSubMenuExpanded = expandedSubMenus.includes(subMenu.id);
                      return (
                        <div key={subMenu.id}>
                          <button
                            onClick={() => toggleSubMenuExpand(subMenu.id)}
                            className="w-full flex items-center justify-between px-12 py-2 text-left text-sm hover:bg-[#154b8a]/30 transition"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight size={14} />
                              {subMenu.label}
                            </div>
                            {subMenu.children && (
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${isSubMenuExpanded ? 'rotate-180' : ''
                                  }`}
                              />
                            )}
                          </button>
                          {subMenu.children && isSubMenuExpanded && (
                            <div className="bg-[#0d1b2a]/30">
                              {subMenu.children?.map((child) => {
                                const ChildIcon = getChildIcon(child);
                                return (
                                  <button
                                    key={child}
                                    onClick={() => onNavigate && onNavigate(child)}
                                    className={`w-full flex items-center gap-3 pl-16 pr-4 py-2 text-left text-xs transition ${currentPage === child
                                      ? 'bg-[#154b8a]/50 text-[#EE964C]'
                                      : 'hover:bg-[#154b8a]/30'
                                      }`}
                                  >
                                    <ChildIcon size={12} />
                                    {t(`menu.${child}`)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#154b8a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#EE964C] rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.nom || t('profile.superAdmin')}</div>
              <div className="text-xs text-gray-300 truncate">{user?.email || '—'}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2 bg-[#EE964C] hover:bg-[#d35400] rounded-lg transition text-sm"
          >
            <LogOut size={16} />
            <span>{t('profile.logout')}</span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="w-full p-4 border-t border-[#154b8a] flex items-center gap-2 text-xs hover:bg-[#154b8a]/30 transition"
          >
            <Languages size={16} />
            <img
              src={getLanguageFlag()}
              alt={getLanguageLabel()}
              className="w-5 h-3 object-cover rounded"
            />
            <span>{getLanguageLabel()}</span>
          </button>

          {showLanguageMenu && (
            <div className="absolute bottom-full left-0 w-full bg-[#0F3C66] border border-[#154b8a] shadow-lg">
              <button
                onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#154b8a] transition ${language === 'en' ? 'bg-[#154b8a]' : ''
                  }`}
              >
                <img src="https://flagcdn.com/w40/us.png" alt="English" className="w-5 h-3 object-cover rounded" />
                <span>{t('profile.english')}</span>
              </button>
              <button
                onClick={() => { setLanguage('fr'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#154b8a] transition ${language === 'fr' ? 'bg-[#154b8a]' : ''
                  }`}
              >
                <img src="https://flagcdn.com/w40/fr.png" alt="Français" className="w-5 h-3 object-cover rounded" />
                <span>{t('profile.french')}</span>
              </button>
              <button
                onClick={() => { setLanguage('ar'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#154b8a] transition ${language === 'ar' ? 'bg-[#154b8a]' : ''
                  }`}
              >
                <img src="https://flagcdn.com/w40/dj.png" alt="العربية" className="w-5 h-3 object-cover rounded" />
                <span>{t('profile.arabic')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <header className="border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-end gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition relative">
                <span className="sr-only">Notifications</span>
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="text-sm text-gray-500">
                {t('common.version')}
              </div>
            </div>
          </header>

          {/* Top navigation tabs have been removed to eliminate redundancy with the sidebar children. */}
        </div>

        <div className="p-8 flex-1">
          {children}
        </div>

        <Footer />
      </main>
    </div>
  );
}


