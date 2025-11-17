'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom',
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe down to close (for bottom drawer)
  const touchHandlersRef = useRef<{
    handleTouchMove: ((e: TouchEvent) => void) | null;
    handleTouchEnd: (() => void) | null;
  }>({ handleTouchMove: null, handleTouchEnd: null });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (position !== 'bottom') return;
    
    const touch = e.touches[0];
    const startY = touch.clientY;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const diff = currentTouch.clientY - startY;

      // Swipe down more than 100px to close
      if (diff > 100) {
        onClose();
        // Cleanup
        if (touchHandlersRef.current.handleTouchMove) {
          document.removeEventListener('touchmove', touchHandlersRef.current.handleTouchMove);
        }
        if (touchHandlersRef.current.handleTouchEnd) {
          document.removeEventListener('touchend', touchHandlersRef.current.handleTouchEnd);
        }
        touchHandlersRef.current.handleTouchMove = null;
        touchHandlersRef.current.handleTouchEnd = null;
      }
    };

    const handleTouchEnd = () => {
      if (touchHandlersRef.current.handleTouchMove) {
        document.removeEventListener('touchmove', touchHandlersRef.current.handleTouchMove);
      }
      if (touchHandlersRef.current.handleTouchEnd) {
        document.removeEventListener('touchend', touchHandlersRef.current.handleTouchEnd);
      }
      touchHandlersRef.current.handleTouchMove = null;
      touchHandlersRef.current.handleTouchEnd = null;
    };

    touchHandlersRef.current.handleTouchMove = handleTouchMove;
    touchHandlersRef.current.handleTouchEnd = handleTouchEnd;

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd, { once: true });
  }, [onClose, position]);

  // Cleanup on unmount or when drawer closes
  useEffect(() => {
    return () => {
      if (touchHandlersRef.current.handleTouchMove) {
        document.removeEventListener('touchmove', touchHandlersRef.current.handleTouchMove);
      }
      if (touchHandlersRef.current.handleTouchEnd) {
        document.removeEventListener('touchend', touchHandlersRef.current.handleTouchEnd);
      }
    };
  }, [isOpen]);

  const positionClasses = {
    left: 'left-0 top-0 bottom-0 w-80 max-w-[85vw]',
    right: 'right-0 top-0 bottom-0 w-80 max-w-[85vw]',
    bottom: 'left-0 right-0 bottom-0 max-h-[85vh] rounded-t-3xl',
  };

  const translateClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed ${positionClasses[position]} z-50 md:hidden transition-transform duration-300 ease-out ${translateClasses[position]}`}
        onTouchStart={handleTouchStart}
      >
        {/* Drawer content */}
        <div className="h-full backdrop-blur-2xl bg-[var(--bg-secondary)] border-[var(--border-color)] flex flex-col overflow-hidden"
             style={{ borderWidth: position === 'bottom' ? '1px 0 0 0' : '0 1px 0 0' }}>

          {/* Handle bar for bottom drawer */}
          {position === 'bottom' && (
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-[var(--border-color)] opacity-50" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-glass)] rounded-xl transition-all duration-300 hover:scale-110"
            >
              <X size={24} className="text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
