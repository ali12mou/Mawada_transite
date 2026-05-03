import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateCoords = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160; // w-40 = 10rem = 160px
      
      // Ensure menu doesn't go off screen horizontally
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: left + window.scrollX,
      });
    }
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updateCoords();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updateCoords]);

  const menuContent = (
    <div 
      ref={menuRef}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        width: '160px',
      }}
      className="z-[9999] origin-top-right rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-in fade-in zoom-in duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {actions.map((action, index) => (
          <button
            key={index}
            type="button"
            disabled={action.disabled}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              setIsOpen(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
              action.disabled 
                ? 'opacity-50 cursor-not-allowed grayscale' 
                : 'hover:bg-slate-50'
            } ${
              action.variant === 'danger' ? 'text-red-600' : 'text-slate-700'
            }`}
          >
            <span className={action.variant === 'danger' ? 'text-red-500' : 'text-slate-500'}>
              {action.icon}
            </span>
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3C66] text-white shadow-sm hover:bg-[#154b8a] transition-all focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && createPortal(menuContent, document.body)}
    </>
  );
};


