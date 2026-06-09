import { ReactNode, useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Import,
  Warehouse,
  Truck,
  Route,
  DollarSign,
  Users,
  UserPlus,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Bell,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Footer } from '../modules/Shared/Footer';
import {
  TRANSPORT_MENU_ITEMS,
  TRANSPORT_SIDEBAR_CHILDREN,
  TRANSPORT_MANAGEMENT_MENU_ID,
  TRANSPORTS_MENU_ID,
  isTransportModulePage,
  isTransportSidebarPage,
  DEFAULT_TRANSPORT_MANAGEMENT_PAGE,
  DEFAULT_TRANSPORTS_PAGE,
} from '../constants/transportMenu';
import { BrandingLogoMark } from '../modules/Shared/BrandingLogoMark';
import { fetchAppConfig } from '../api/appConfigApi';
import { splitBrandLines } from '../lib/documentPrintImages';

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
  {
    id: 'services',
    label: t('menu.services'),
    icon: Briefcase,
    children: [
      'commercial-chamber',
      'chamber-transfer',
      'local-company',
      'transfer-document-9',
      'chamber-invoice',
      'performa',
      'certificate-origin',
      'other-profit',
    ],
  },
  { id: 'imports', label: t('menu.imports'), icon: Import, children: ['suppliers', 'orders', 'order-verification', 'order-reception', 'delivered-orders', 'document-9', 'document-4', 'clearance', 'invoice-report'] },
  { id: 'warehouses', label: t('menu.warehouses'), icon: Warehouse, children: ['products', 'inventories', 'warehouse'] },
  {
    id: TRANSPORT_MANAGEMENT_MENU_ID,
    label: t('menu.transports-management'),
    icon: Truck,
    children: TRANSPORT_MENU_ITEMS.map((entry) => entry.id),
  },
  {
    id: TRANSPORTS_MENU_ID,
    label: t('menu.transports'),
    icon: Route,
    children: [...TRANSPORT_SIDEBAR_CHILDREN],
  },
  { id: 'expenses', label: t('menu.expenses'), icon: DollarSign, children: ['expense-categories', 'expense', 'expense-allocation', 'other-expenses'] },
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuPanelRef = useRef<HTMLDivElement>(null);
  const userMenuPanelRef = useRef<HTMLDivElement>(null);
  const [languageMenuPos, setLanguageMenuPos] = useState({ top: 0, left: 0 });
  const [userMenuPos, setUserMenuPos] = useState({ top: 0, left: 0 });
  const [brandLines, setBrandLines] = useState({ line1: 'GEOSOM', line2: 'TRANSIT' });
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const menuItems = useMemo(() => getMenuItems(t), [t]);

  const closeHeaderMenus = useCallback(() => {
    setShowLanguageMenu(false);
    setShowUserMenu(false);
  }, []);

  const syncHeaderMenuPositions = useCallback(() => {
    if (userMenuRef.current && showUserMenu) {
      const rect = userMenuRef.current.getBoundingClientRect();
      setUserMenuPos({ top: rect.bottom + 8, left: rect.right - 256 });
    }
    if (languageMenuRef.current && showLanguageMenu) {
      const rect = languageMenuRef.current.getBoundingClientRect();
      setLanguageMenuPos({ top: rect.bottom + 8, left: rect.right - 176 });
    }
  }, [showLanguageMenu, showUserMenu]);

  useLayoutEffect(() => {
    syncHeaderMenuPositions();
  }, [syncHeaderMenuPositions]);

  useEffect(() => {
    if (!showLanguageMenu && !showUserMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (languageMenuRef.current?.contains(target)) return;
      if (userMenuRef.current?.contains(target)) return;
      if (languageMenuPanelRef.current?.contains(target)) return;
      if (userMenuPanelRef.current?.contains(target)) return;
      closeHeaderMenus();
    };

    const handleReposition = () => syncHeaderMenuPositions();

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showLanguageMenu, showUserMenu, closeHeaderMenus, syncHeaderMenuPositions]);

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        setBrandLines(splitBrandLines(cfg.company_name || 'GEOSOM TRANSIT'));
      })
      .catch(() => {
        /* valeurs par défaut */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const findMenuContext = useCallback(
    (pageId: string): { parentId?: string; subMenuId?: string } => {
      for (const item of menuItems) {
        if (item.children?.includes(pageId)) return { parentId: item.id };
        if (item.subMenus) {
          for (const sub of item.subMenus) {
            if (sub.children?.includes(pageId)) {
              return { parentId: item.id, subMenuId: sub.id };
            }
          }
        }
      }
      return {};
    },
    [menuItems]
  );

  useEffect(() => {
    if (isTransportModulePage(currentPage)) {
      setExpandedItems([TRANSPORT_MANAGEMENT_MENU_ID]);
      setExpandedSubMenus([]);
      return;
    }
    if (isTransportSidebarPage(currentPage)) {
      setExpandedItems([TRANSPORTS_MENU_ID]);
      setExpandedSubMenus([]);
      return;
    }
    const ctx = findMenuContext(currentPage);
    if (ctx.parentId) {
      setExpandedItems([ctx.parentId]);
      setExpandedSubMenus(ctx.subMenuId ? [ctx.subMenuId] : []);
    }
  }, [currentPage, findMenuContext]);

  const navigateToPage = useCallback(
    (pageId: string) => {
      if (!onNavigate) return;
      const ctx = findMenuContext(pageId);
      if (isTransportModulePage(pageId)) {
        setExpandedItems([TRANSPORT_MANAGEMENT_MENU_ID]);
        setExpandedSubMenus([]);
      } else if (isTransportSidebarPage(pageId)) {
        setExpandedItems([TRANSPORTS_MENU_ID]);
        setExpandedSubMenus([]);
      } else if (ctx.parentId) {
        setExpandedItems([ctx.parentId]);
        setExpandedSubMenus(ctx.subMenuId ? [ctx.subMenuId] : []);
      }
      onNavigate(pageId);
    },
    [findMenuContext, onNavigate]
  );

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.id === TRANSPORT_MANAGEMENT_MENU_ID && item.children) {
      if (!expandedItems.includes(TRANSPORT_MANAGEMENT_MENU_ID)) {
        setExpandedItems([TRANSPORT_MANAGEMENT_MENU_ID]);
        if (onNavigate) onNavigate(DEFAULT_TRANSPORT_MANAGEMENT_PAGE);
      } else {
        setExpandedItems([]);
      }
      return;
    }
    if (item.id === TRANSPORTS_MENU_ID && item.children) {
      if (!expandedItems.includes(TRANSPORTS_MENU_ID)) {
        setExpandedItems([TRANSPORTS_MENU_ID]);
        if (onNavigate) onNavigate(DEFAULT_TRANSPORTS_PAGE);
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
      <aside className="flex w-[260px] shrink-0 flex-col bg-[#0F3C66] text-white shadow-xl">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="border-b border-white/10 px-5 py-5 text-left transition hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <BrandingLogoMark className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white" />
            <div className="min-w-0 leading-tight">
              <div className="text-[13px] font-bold uppercase tracking-wide">{brandLines.line1}</div>
              {brandLines.line2 ? (
                <div className="text-[13px] font-bold uppercase tracking-wide">{brandLines.line2}</div>
              ) : null}
            </div>
          </div>
        </button>

        <nav className="scrollbar-hide flex-1 overflow-y-auto py-2">
          {menuItems?.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.id);
            const isActive =
              currentPage === item.id ||
              (item.children?.includes(currentPage) ?? false) ||
              (item.subMenus?.some(
                sm => sm.id === currentPage || (sm.children?.includes(currentPage) ?? false)
              ) ??
                false) ||
              (item.id === TRANSPORT_MANAGEMENT_MENU_ID && isTransportModulePage(currentPage)) ||
              (item.id === TRANSPORTS_MENU_ID && isTransportSidebarPage(currentPage));

            return (
              <div key={item.id}>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition ${
                    isActive ? 'text-white' : 'text-white/90 hover:bg-white/5'
                  }`}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.75} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {(item.children || item.subMenus) && (
                    <ChevronDown
                      size={16}
                      className={`shrink-0 opacity-80 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {item.children && isExpanded && (
                  <div className="pb-1">
                    {item.children?.map((child) => (
                      <button
                        key={child}
                        type="button"
                        onClick={() => navigateToPage(child)}
                        className={`block w-full py-2 pl-12 pr-5 text-left text-[13px] transition ${
                          currentPage === child
                            ? 'font-semibold text-[#EE964C]'
                            : 'text-white/85 hover:text-white'
                        }`}
                      >
                        {t(`menu.${child}`)}
                      </button>
                    ))}
                  </div>
                )}
                {item.subMenus && isExpanded && (
                  <div className="pb-1">
                    {item.subMenus?.map((subMenu) => {
                      const isSubMenuExpanded = expandedSubMenus.includes(subMenu.id);
                      const isSubActive =
                        currentPage === subMenu.id ||
                        (subMenu.children?.includes(currentPage) ?? false);
                      return (
                        <div key={subMenu.id}>
                          <button
                            type="button"
                            onClick={() => toggleSubMenuExpand(subMenu.id)}
                            className={`flex w-full items-center justify-between py-2 pl-10 pr-5 text-left text-[13px] transition ${
                              isSubActive ? 'text-[#EE964C]' : 'text-white/85 hover:text-white'
                            }`}
                          >
                            <span>{subMenu.label}</span>
                            {subMenu.children && (
                              <ChevronDown
                                size={14}
                                className={`shrink-0 opacity-80 transition-transform ${isSubMenuExpanded ? 'rotate-180' : ''}`}
                              />
                            )}
                          </button>
                          {subMenu.children && isSubMenuExpanded && (
                            <div>
                              {subMenu.children?.map((child) => (
                                <button
                                  key={child}
                                  type="button"
                                  onClick={() => navigateToPage(child)}
                                  className={`block w-full py-2 pl-14 pr-5 text-left text-xs transition ${
                                    currentPage === child
                                      ? 'font-semibold text-[#EE964C]'
                                      : 'text-white/80 hover:text-white'
                                  }`}
                                >
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

      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <header className="border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="relative rounded-lg p-2 transition hover:bg-gray-100"
              >
                <span className="sr-only">Notifications</span>
                <Bell size={20} className="text-gray-600" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="text-sm text-gray-500">{t('common.version')}</div>

              <div ref={languageMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowLanguageMenu((v) => !v);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <img
                    src={getLanguageFlag()}
                    alt={getLanguageLabel()}
                    className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                  />
                  <span>{getLanguageLabel()}</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>
              </div>

              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu((v) => !v);
                    setShowLanguageMenu(false);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F3C66] text-white transition hover:bg-[#154b8a]"
                  title={user?.nom || t('profile.superAdmin')}
                >
                  <User size={20} />
                </button>
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

      {showLanguageMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200]"
              aria-hidden
              onClick={closeHeaderMenus}
            />
            <div
              ref={languageMenuPanelRef}
              className="fixed z-[210] w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
              style={{
                top: languageMenuPos.top,
                left: Math.max(8, languageMenuPos.left),
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  closeHeaderMenus();
                }}
                className={`flex w-full items-center gap-2 bg-white px-4 py-2.5 text-sm transition hover:bg-gray-50 ${language === 'en' ? 'bg-gray-50 font-medium' : ''}`}
              >
                <img src="https://flagcdn.com/w40/us.png" alt="English" className="h-3.5 w-5 rounded-sm object-cover" />
                <span>{t('profile.english')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('fr');
                  closeHeaderMenus();
                }}
                className={`flex w-full items-center gap-2 bg-white px-4 py-2.5 text-sm transition hover:bg-gray-50 ${language === 'fr' ? 'bg-gray-50 font-medium' : ''}`}
              >
                <img src="https://flagcdn.com/w40/fr.png" alt="Français" className="h-3.5 w-5 rounded-sm object-cover" />
                <span>{t('profile.french')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('ar');
                  closeHeaderMenus();
                }}
                className={`flex w-full items-center gap-2 bg-white px-4 py-2.5 text-sm transition hover:bg-gray-50 ${language === 'ar' ? 'bg-gray-50 font-medium' : ''}`}
              >
                <img src="https://flagcdn.com/w40/dj.png" alt="العربية" className="h-3.5 w-5 rounded-sm object-cover" />
                <span>{t('profile.arabic')}</span>
              </button>
            </div>
          </>,
          document.body
        )}

      {showUserMenu &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200]"
              aria-hidden
              onClick={closeHeaderMenus}
            />
            <div
              ref={userMenuPanelRef}
              className="fixed z-[210] w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
              style={{
                top: userMenuPos.top,
                left: Math.max(8, userMenuPos.left),
              }}
            >
              <div className="border-b border-gray-200 bg-white px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.nom || t('profile.superAdmin')}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email || '—'}</p>
                {user?.role ? (
                  <p className="mt-1 inline-block rounded bg-[#0F3C66]/10 px-2 py-0.5 text-xs font-medium text-[#0F3C66]">
                    {user.role}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  closeHeaderMenus();
                  void signOut();
                }}
                className="flex w-full items-center gap-2 bg-white px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                {t('profile.logout')}
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}


