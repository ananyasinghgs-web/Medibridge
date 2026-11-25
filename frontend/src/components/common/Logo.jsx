import React from 'react';
import iconSvg from '../../assets/icon.svg';
import logoLightSvg from '../../assets/logo-light.svg';
import logoDarkSvg from '../../assets/logo-dark.svg';

export default function Logo({ variant = 'light', iconOnly = false, className = '', height = 38 }) {
  if (iconOnly) {
    return (
      <img 
        src={iconSvg} 
        alt="MediBridge Icon" 
        style={{ height: `${height}px`, width: 'auto' }}
        className={`inline-block ${className}`}
      />
    );
  }

  const src = variant === 'dark' ? logoDarkSvg : logoLightSvg;

  return (
    <img 
      src={src} 
      alt="MediBridge — Connecting Care. Simplifying Health." 
      style={{ height: `${height}px`, width: 'auto' }}
      className={`inline-block transition-opacity duration-200 ${className}`}
    />
  );
}

