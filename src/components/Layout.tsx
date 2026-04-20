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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Footer } from './Footer';
import {
  TRANSPORT_MENU_ITEMS,
  isTransportModulePage,
  DEFAULT_TRANSPORT_PAGE,
} from '../constants/transportMenu';
import { BrandingLogoMark } from './BrandingLogoMark';

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
    children: TRANSPORT_MENU_ITEMS.map(entry => entry.id),
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
        setExpandedItems(prev => [...prev, 'transports']);
        if (onNavigate) onNavigate(DEFAULT_TRANSPORT_PAGE);
      } else {
        setExpandedItems(prev => prev.filter(id => id !== 'transports'));
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
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSubMenuExpand = (id: string) => {
    setExpandedSubMenus(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
      <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col shadow-xl">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="p-6 border-b border-[#2d4a6f] text-left hover:bg-[#2d4a6f]/40 transition"
        >
          <div className="flex items-center gap-3">
            <BrandingLogoMark />
            <h1 className="text-xl font-bold leading-tight">GEOSOM TRANSIT</h1>
          </div>
        </button>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.id);
            const isActive =
              currentPage === item.id ||
              (item.id === 'transports' && isTransportModulePage(currentPage));

            return (
              <div key={item.id}>
                <button
                  className={`w-full flex items-center justify-between px-6 py-3 text-left transition ${
                    isActive
                      ? 'bg-[#2d4a6f] border-l-4 border-[#e67e22]'
                      : 'hover:bg-[#2d4a6f]/50'
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
                      className={`transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                {item.children && isExpanded && (
                  <div className="bg-[#152a44]/30">
                    {item.children.map((child) => (
                      <button
                        key={child}
                        onClick={() => onNavigate && onNavigate(child)}
                        className={`w-full flex items-center gap-3 px-12 py-2 text-left text-sm transition ${
                          currentPage === child
                            ? 'bg-[#2d4a6f]/50 text-[#e67e22]'
                            : 'hover:bg-[#2d4a6f]/30'
                        }`}
                      >
                        <ChevronRight size={14} />
                        {t(`menu.${child}`)}
                      </button>
                    ))}
                  </div>
                )}
                {item.subMenus && isExpanded && (
                  <div className="bg-[#152a44]/30">
                    {item.subMenus.map((subMenu) => {
                      const isSubMenuExpanded = expandedSubMenus.includes(subMenu.id);
                      return (
                        <div key={subMenu.id}>
                          <button
                            onClick={() => toggleSubMenuExpand(subMenu.id)}
                            className="w-full flex items-center justify-between px-12 py-2 text-left text-sm hover:bg-[#2d4a6f]/30 transition"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight size={14} />
                              {subMenu.label}
                            </div>
                            {subMenu.children && (
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${
                                  isSubMenuExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            )}
                          </button>
                          {subMenu.children && isSubMenuExpanded && (
                            <div className="bg-[#0d1b2a]/30">
                              {subMenu.children.map((child) => (
                                <button
                                  key={child}
                                  onClick={() => onNavigate && onNavigate(child)}
                                  className={`w-full flex items-center gap-3 pl-16 pr-4 py-2 text-left text-xs transition ${
                                    currentPage === child
                                      ? 'bg-[#2d4a6f]/50 text-[#e67e22]'
                                      : 'hover:bg-[#2d4a6f]/30'
                                  }`}
                                >
                                  <ChevronRight size={12} />
                                  {t(`menu.${child}`)}
                                </button>
                              ))}
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

        <div className="p-4 border-t border-[#2d4a6f]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#e67e22] rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.nom || t('profile.superAdmin')}</div>
              <div className="text-xs text-gray-300 truncate">{user?.email || '—'}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2 bg-[#e67e22] hover:bg-[#d35400] rounded-lg transition text-sm"
          >
            <LogOut size={16} />
            <span>{t('profile.logout')}</span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="w-full p-4 border-t border-[#2d4a6f] flex items-center gap-2 text-xs hover:bg-[#2d4a6f]/30 transition"
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
            <div className="absolute bottom-full left-0 w-full bg-[#1e3a5f] border border-[#2d4a6f] shadow-lg">
              <button
                onClick={() => { setLanguage('en'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#2d4a6f] transition ${
                  language === 'en' ? 'bg-[#2d4a6f]' : ''
                }`}
              >
                <img src="https://flagcdn.com/w40/us.png" alt="English" className="w-5 h-3 object-cover rounded" />
                <span>{t('profile.english')}</span>
              </button>
              <button
                onClick={() => { setLanguage('fr'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#2d4a6f] transition ${
                  language === 'fr' ? 'bg-[#2d4a6f]' : ''
                }`}
              >
                <img src="https://flagcdn.com/w40/fr.png" alt="Français" className="w-5 h-3 object-cover rounded" />
                <span>{t('profile.french')}</span>
              </button>
              <button
                onClick={() => { setLanguage('ar'); setShowLanguageMenu(false); }}
                className={`w-full px-4 py-2 flex items-center gap-2 text-xs hover:bg-[#2d4a6f] transition ${
                  language === 'ar' ? 'bg-[#2d4a6f]' : ''
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

          {isTransportModulePage(currentPage) && (
            <nav
              className="border-b border-gray-200 bg-gray-50/80"
              aria-label={t('menu.transports')}
            >
              <div className="flex gap-1 overflow-x-auto px-4 py-2">
                {TRANSPORT_MENU_ITEMS.map(entry => {
                  const HIcon = entry.icon;
                  const active = currentPage === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onNavigate && onNavigate(entry.id)}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                        active
                          ? 'bg-[#1e3a5f] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white hover:text-[#1e3a5f]'
                      }`}
                    >
                      <HIcon size={18} className="shrink-0" aria-hidden />
                      {t(`menu.${entry.id}`)}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        <div className="p-8 flex-1">
          {children}
        </div>

        <Footer />
      </main>
    </div>
  );
}
