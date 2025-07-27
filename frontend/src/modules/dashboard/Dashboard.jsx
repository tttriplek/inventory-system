import { useQuery } from '@tanstack/react-query';
import { 
  CubeIcon, 
  ExclamationTriangleIcon, 
  ClockIcon,
  TruckIcon,
  ChartBarIcon,
  BuildingStorefrontIcon 
} from '@heroicons/react/24/outline';
import { productsApi } from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/ui/StatsCard';
import AlertsList from '../../components/ui/AlertsList';

export default function Dashboard() {
  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: productsApi.getAnalytics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-danger-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">
          {error.response?.data?.message || 'An error occurred while loading the dashboard'}
        </p>
      </div>
    );
  }

  const { summary, alerts } = analytics?.data || {};

  const stats = [
    {
      name: 'Total Products',
      value: summary?.totalProducts || 0,
      icon: CubeIcon,
      change: '+12%',
      changeType: 'increase',
      color: 'primary',
    },
    {
      name: 'Total Value',
      value: `$${(summary?.totalValue || 0).toFixed(2)}`,
      icon: ChartBarIcon,
      change: '+5.4%',
      changeType: 'increase',
      color: 'success',
    },
    {
      name: 'Expiring Soon',
      value: summary?.expiringCount || 0,
      icon: ClockIcon,
      change: '-2%',
      changeType: 'decrease',
      color: 'warning',
    },
    {
      name: 'Low Stock Items',
      value: summary?.lowStockCount || 0,
      icon: ExclamationTriangleIcon,
      change: '+3',
      changeType: 'increase',
      color: 'danger',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your Revolutionary Inventory Management System
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="flex items-center space-x-2">
            <BuildingStorefrontIcon className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Revolutionary Warehouse 1</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Products */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-warning-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Products Expiring Soon</h3>
              {alerts?.expiring?.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                  {alerts.expiring.length}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            <AlertsList 
              items={alerts?.expiring || []} 
              type="expiring"
              emptyMessage="No products expiring in the next 30 days"
            />
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
              {alerts?.lowStock?.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                  {alerts.lowStock.length}
                </span>
              )}
            </div>
          </div>
          <div className="card-body">
            <AlertsList 
              items={alerts?.lowStock || []} 
              type="lowStock"
              emptyMessage="All products are well stocked"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn-primary flex items-center justify-center">
              <CubeIcon className="w-4 h-4 mr-2" />
              Add Product
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <TruckIcon className="w-4 h-4 mr-2" />
              Distribute Items
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <ChartBarIcon className="w-4 h-4 mr-2" />
              View Analytics
            </button>
            <button className="btn-secondary flex items-center justify-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              Expiry Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
