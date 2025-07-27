import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function formatDate(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function AlertsList({ items, type, emptyMessage }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 mb-2">
          {type === 'expiring' ? (
            <ClockIcon className="mx-auto h-8 w-8" />
          ) : (
            <ExclamationTriangleIcon className="mx-auto h-8 w-8" />
          )}
        </div>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {items.slice(0, 5).map((item, index) => (
        <div key={item._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {type === 'expiring' ? (
                  <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-danger-500 rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>SKU: {item.sku}</span>
                  <span>•</span>
                  <span>Qty: {item.quantity}</span>
                  {type === 'expiring' && item.expiry?.date && (
                    <>
                      <span>•</span>
                      <span>
                        {getDaysUntilExpiry(item.expiry.date)} days left
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {type === 'expiring' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                {item.expiry?.date ? formatDate(item.expiry.date) : 'No date'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                Low Stock
              </span>
            )}
          </div>
        </div>
      ))}
      {items.length > 5 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            And {items.length - 5} more items...
          </p>
        </div>
      )}
    </div>
  );
}
