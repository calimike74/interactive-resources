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
        <div className={`relative flex w-full touch-none select-none items-center py-2 ${className}`} {...props}>
            <input aria-label="Slider"
                type="range"
                min={min}
                max={max}
                step={step}
                value={currentValue}
                onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    onValueChange?.(Array.isArray(value) ? [newValue] : newValue);
                }}
                className="ir-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${percentage}%, #cbd5e1 ${percentage}%, #cbd5e1 100%)`,
                }}
            />
            <style jsx>{`
                .ir-slider {
                    outline: none;
                }
                .ir-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 9999px;
                    background: #ffffff;
                    border: 3px solid #2563eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
                    cursor: pointer;
                    transition: transform 120ms ease, box-shadow 120ms ease;
                }
                .ir-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.12);
                }
                .ir-slider:focus-visible::-webkit-slider-thumb {
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35);
                }
                .ir-slider::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    border-radius: 9999px;
                    background: #ffffff;
                    border: 3px solid #2563eb;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
                    cursor: pointer;
                    transition: transform 120ms ease, box-shadow 120ms ease;
                }
                .ir-slider::-moz-range-thumb:hover {
                    transform: scale(1.12);
                }
                .ir-slider:focus-visible::-moz-range-thumb {
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35);
                }
            `}</style>
        </div>
    );
}
