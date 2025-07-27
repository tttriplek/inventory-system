import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    text: 'text-primary-900',
  },
  success: {
    bg: 'bg-success-50',
    icon: 'text-success-600',
    text: 'text-success-900',
  },
  warning: {
    bg: 'bg-warning-50',
    icon: 'text-warning-600',
    text: 'text-warning-900',
  },
  danger: {
    bg: 'bg-danger-50',
    icon: 'text-danger-600',
    text: 'text-danger-900',
  },
};

export default function StatsCard({
  name,
  value,
  icon: Icon,
  change,
  changeType,
  color = 'primary',
}) {
  const colors = colorClasses[color];
  
  return (
    <div className="card animate-slide-up">
      <div className="card-body">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} aria-hidden="true" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{name}</dt>
              <dd className={`text-2xl font-semibold ${colors.text}`}>{value}</dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center">
            <div className="flex items-center">
              {changeType === 'increase' ? (
                <ArrowUpIcon className="h-4 w-4 text-success-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-danger-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  changeType === 'increase' ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {change}
              </span>
            </div>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
