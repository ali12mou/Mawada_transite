import React from 'react';

export const FormLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => (
  <label className={`block text-sm font-semibold text-slate-700 mb-1.5 ${className}`} {...props} />
);

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-colors placeholder:text-slate-400 min-h-[40px] ${className}`}
    {...props}
  />
);

export const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select
    className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-colors min-h-[40px] ${className}`}
    {...props}
  />
);

export const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-colors placeholder:text-slate-400 ${className}`}
    {...props}
  />
);

export const ModalFormSection: React.FC<{ title?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-4 ${className}`}>
    {title && <div className="text-sm font-semibold text-slate-800 mb-3">{title}</div>}
    {children}
  </div>
);

export const ModalFormFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100 ${className}`}>
    {children}
  </div>
);

// Buttons for form footer and general usage
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`bg-[#3b82f6] text-white px-5 py-2.5 rounded-md font-medium text-sm hover:bg-[#2563eb] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 ${className}`}
    {...props}
  />
);

export const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', type = 'button', ...props }) => (
  <button
    type={type}
    className={`bg-white text-slate-700 px-5 py-2.5 rounded-md font-medium text-sm border border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:opacity-50 ${className}`}
    {...props}
  />
);
