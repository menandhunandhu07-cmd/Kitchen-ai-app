import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className="input-wrapper">
      {icon && (
        <div className="input-icon">
          {icon}
        </div>
      )}
      <input 
        className={`input-field ${icon ? 'input-with-icon' : ''} ${className}`}
        {...props} 
      />
    </div>
  );
}
