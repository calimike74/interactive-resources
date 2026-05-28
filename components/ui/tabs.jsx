'use client';

import { createContext, useContext, useState } from 'react';

const TabsContext = createContext({ value: '', onChange: () => {} });

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className = '', children, ...props }) {
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
    const onChange = onValueChange || setUncontrolledValue;

    return (
        <TabsContext.Provider value={{ value, onChange }}>
            <div className={className} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className = '', children, ...props }) {
    return (
        <div
            className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
            role="tablist"
            {...props}
        >
            {children}
        </div>
    );
}

export function TabsTrigger({ value, className = '', children, ...props }) {
    const { value: selectedValue, onChange } = useContext(TabsContext);
    const isActive = selectedValue === value;

    return (
        <button type="button"
            role="tab"
            aria-selected={isActive}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
            } ${className}`}
            onClick={() => onChange(value)}
            {...props}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, className = '', children, ...props }) {
    const { value: selectedValue } = useContext(TabsContext);
    if (selectedValue !== value) return null;

    return (
        <div role="tabpanel" className={`mt-2 ${className}`} {...props}>
            {children}
        </div>
    );
}
