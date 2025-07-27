import { CubeIcon } from '@heroicons/react/24/outline';

export default function ProductsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Products
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your inventory with intelligent batch and SKU tracking
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Products Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Advanced product management features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
