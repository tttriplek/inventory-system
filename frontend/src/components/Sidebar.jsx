// src/components/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFacility } from '../contexts/FacilityContext';
import FacilitySwitcher from './FacilitySwitcher';

function Sidebar() {
  const { hasFeature, currentFacility, changeFacility } = useFacility();
  const location = useLocation();

  const menuItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      requiredFeatures: []
    },
    {
      to: "/products",
      label: "Products",
      icon: "📦",
      requiredFeatures: [] // Always show Products
    },
    {
      to: "/storage",
      label: "Storage",
      icon: "🏭",
      requiredFeatures: ['sections']
    },
    {
      to: "/section-manager",
      label: "Sections",
      icon: "🗂️",
      requiredFeatures: ['sections']
    },
    {
      to: "/rule-manager",
      label: "Rules",
      icon: "📋",
      requiredFeatures: [] // Always show Rules
    },
    {
      to: "/analytics",
      label: "Analytics",
      icon: "📈",
      requiredFeatures: ['analytics']
    },
    {
      to: "/activity",
      label: "Activity Log",
      icon: "📝",
      requiredFeatures: [] // Always show Activity Log
    },
    {
      to: "/low-stock",
      label: "Low Stock",
      icon: "⚠️",
      requiredFeatures: ['inventory']
    },
    {
      to: "/expiring",
      label: "Expiring Products",
      icon: "📅",
      requiredFeatures: ['expiry']
    },
    {
      to: "/temperature-monitor",
      label: "Temperature Monitor",
      icon: "🌡️",
      requiredFeatures: ['temperature']
    },
    {
      to: "/purchase-orders",
      label: "Purchase Orders",
      icon: "🛍️",
      requiredFeatures: []
    }
  ];

  console.log('All menu items:', menuItems.map(item => ({ label: item.label, to: item.to, features: item.requiredFeatures })));

  // Check if a menu item should be shown based on required features
  const shouldShowMenuItem = (requiredFeatures) => {
    // If no features are required, always show the menu item
    if (!requiredFeatures.length) return true;
    // Show if ALL of the required features are enabled (changed from some to every)
    return requiredFeatures.every(feature => hasFeature(feature));
  };

  return (
    <div className="flex flex-col bg-white border-r border-gray-200 shadow-lg h-full">
      {/* Header */}
      <div className="flex items-center px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">🚀</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-blue-600">
              Revolutionary
            </h1>
            <p className="text-xs text-gray-600">Inventory System</p>
          </div>
        </div>
      </div>

      {/* Facility Switcher */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <FacilitySwitcher 
          currentFacilityId={currentFacility?._id}
          onFacilityChange={changeFacility}
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          console.log('Processing menu item:', item.label, 'Should show:', shouldShowMenuItem(item.requiredFeatures));
          if (!shouldShowMenuItem(item.requiredFeatures)) return null;

          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 hover:scale-105'
                }
              `}
            >
              <span className={`text-lg mr-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span className="font-semibold">{item.label}</span>
              {isActive && <span className="ml-auto text-white text-lg">✨</span>}
            </Link>
          );
        })}
      </nav>
      
      {/* System Status Footer */}
      <div className="px-4 py-6 border-t border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">System Status</p>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <p className="text-xs text-green-600 font-semibold">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
