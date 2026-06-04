import { useLanguage } from '../../../contexts/LanguageContext';
import { LogisticsFilesModule } from './LogisticsFilesModule';
import { TransportationModule } from './TransportationModule';
import { BulkTransportModule } from './BulkTransportModule';
import { CarReservationsModule } from './CarReservationsModule';
import { FleetModule } from './FleetModule';
import { ExpenseRequestsTransitModule } from './ExpenseRequestsTransitModule';
import { PurchaseTransitModule } from './PurchaseTransitModule';
import { SalesTransitModule } from './SalesTransitModule';
import { OtherProfitTransitModule } from './OtherProfitTransitModule';
import { AccountingTransitModule } from './AccountingTransitModule';
import { ReportingTransitModule } from './ReportingTransitModule';
import { ConfigTransitModule } from './ConfigTransitModule';

export function TransportModuleRouter({ moduleKey }: { moduleKey: string }) {
  const { t } = useLanguage();
  switch (moduleKey) {
    case 'logistics-files-operations':
      return <LogisticsFilesModule />;
    case 'transportation-management':
      return <TransportationModule />;
    case 'bulk-transportation-management':
      return <BulkTransportModule />;
    case 'car-reservations':
      return <CarReservationsModule />;
    case 'fleet-management':
      return <FleetModule />;
    case 'transport-expense-requests':
      return <ExpenseRequestsTransitModule />;
    case 'purchase-management':
      return <PurchaseTransitModule />;
    case 'sales-management':
      return <SalesTransitModule />;
    case 'other-profit':
      return <OtherProfitTransitModule />;
    case 'accounting-system':
      return <AccountingTransitModule />;
    case 'transport-reporting-analytics':
      return <ReportingTransitModule />;
    case 'transport-configuration-admin':
      return <ConfigTransitModule />;
    default:
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t('common.unknownModule')} : {moduleKey}
        </div>
      );
  }
}


