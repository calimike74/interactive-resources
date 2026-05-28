'use client';

export function Alert({ className = '', variant = 'default', children, ...props }) {
    const variants = {
        default: 'bg-white border-gray-200 text-gray-900',
        destructive: 'bg-red-50 border-red-200 text-red-900',
    };

    return (
        <div
            role="alert"
            className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-500 ${variants[variant] || variants.default} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function AlertDescription({ className = '', children, ...props }) {
    return (
        <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
            {children}
        </div>
    );
}

function AlertTitle({ className = '', children, ...props }) {
    return (
        <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
            {children}
        </h5>
    );
}
