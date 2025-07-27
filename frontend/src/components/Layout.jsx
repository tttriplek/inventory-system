import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  ChartBarIcon, 
  ArchiveBoxIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Storage', href: '/storage', icon: ArchiveBoxIcon },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} currentPath={location.pathname} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <SidebarContent navigation={navigation} currentPath={location.pathname} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 bg-revolutionary px-4 py-4 lg:hidden shadow-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🚀</span>
            <h1 className="text-lg font-bold text-white">Revolutionary Inventory</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white hover:bg-opacity-20 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navigation, currentPath }) {
  return (
    <div className="flex flex-col bg-white border-r border-gray-200 shadow-lg">
      <div className="flex items-center px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-revolutionary rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-revolutionary">
              Revolutionary
            </h1>
            <p className="text-xs text-gray-600">Inventory System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-revolutionary text-white shadow-revolutionary transform scale-105' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 hover:scale-105'
                }
              `}
            >
              <item.icon className={`h-6 w-6 mr-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="font-semibold">{item.name}</span>
              {isActive && <span className="ml-auto text-white text-lg">✨</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="px-4 py-6 border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">System Status</p>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <p className="text-xs text-success-600 font-semibold">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
