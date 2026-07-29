'use client';

export function Progress({ className = '', value = 0, max = 100, ...props }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div
            className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
            {...props}
        >
            <div
                className="h-full bg-blue-600 transition-[width] ease-house"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}
