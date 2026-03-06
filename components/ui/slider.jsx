'use client';

export function Slider({
    className = '',
    min = 0,
    max = 100,
    step = 1,
    value = [50],
    onValueChange,
    ...props
}) {
    const currentValue = Array.isArray(value) ? value[0] : value;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
        <div className={`relative flex w-full touch-none select-none items-center ${className}`} {...props}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentValue}
                onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    onValueChange?.(Array.isArray(value) ? [newValue] : newValue);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                style={{
                    background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`,
                }}
            />
        </div>
    );
}
