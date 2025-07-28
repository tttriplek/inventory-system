import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DashboardWidget = ({ 
  title,
  link,
  dropdownOptions = [],
  initialOption,
  children,
  onOptionChange,
  onResize,
  onDragEnd,
  initialWidth = 300,
  initialHeight = 200,
  initialX = 0,
  initialY = 0
}) => {
  const [selectedOption, setSelectedOption] = useState(initialOption || (dropdownOptions[0]?.value ?? ''));
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const widgetRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleOptionChange = (e) => {
    const newValue = e.target.value;
    setSelectedOption(newValue);
    if (onOptionChange) {
      onOptionChange(newValue);
    }
  };

  const handleMouseDown = (e, action) => {
    if (action === 'resize') {
      setIsResizing(true);
    } else if (action === 'drag') {
      setIsDragging(true);
    }
    startPosRef.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      setDimensions(prev => ({
        width: Math.max(200, prev.width + deltaX),
        height: Math.max(150, prev.height + deltaY)
      }));
      
      startPosRef.current = { x: e.clientX, y: e.clientY };
      if (onResize) {
        onResize(dimensions);
      }
    } else if (isDragging) {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      startPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(position);
    }
    setIsResizing(false);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, isDragging]);

  return (
    <div
      ref={widgetRef}
      style={{
        backgroundColor: '#2d2d2d',
        borderRadius: '8px',
        boxShadow: isDragging || isResizing 
          ? '0 8px 16px rgba(0,0,0,0.4)' 
          : '0 2px 4px rgba(0,0,0,0.2)',
        padding: '16px',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        display: 'flex',
        flexDirection: 'column',
        transition: isResizing || isDragging ? 'none' : 'all 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: isDragging || isResizing ? 1000 : 1
      }}
      onMouseEnter={(e) => !isDragging && !isResizing && (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)')}
      onMouseLeave={(e) => !isDragging && !isResizing && (e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget || e.target.tagName === 'H3') {
          handleMouseDown(e, 'drag');
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {dropdownOptions.length > 0 && (
            <select 
              value={selectedOption} 
              onChange={handleOptionChange}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #404040',
                backgroundColor: '#404040',
                color: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {dropdownOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {link && (
            <Link 
              to={link}
              style={{
                textDecoration: 'none',
                color: '#66b2ff',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s ease'
              }}
            >
              View All →
            </Link>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', color: '#e0e0e0' }}>
        {children}
      </div>

      {/* Resize handle */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'se-resize',
          background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
          borderBottomRightRadius: '8px'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </div>
  );
};

export default DashboardWidget;
