import { TruckIcon } from '@heroicons/react/24/outline';

export default function DistributionPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Distribution
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            FIFO distribution system with intelligent inventory management
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">FIFO Distribution</h3>
          <p className="mt-1 text-sm text-gray-500">
            Revolutionary distribution management coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
