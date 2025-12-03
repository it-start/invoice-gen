
import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    
    // Check initially
    checkMobile();

    // Add listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};
