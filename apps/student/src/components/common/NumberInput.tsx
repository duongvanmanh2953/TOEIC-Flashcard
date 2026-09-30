import React, { useState, useEffect } from 'react';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  allowNegative = false,
  allowDecimal = false,
  suffix,
  className = '',
  placeholder = '0',
  ...props
}) => {
  const formatDisplay = (num: number): string => {
    if (num === undefined || num === null || isNaN(num)) return '';
    if (allowNegative && num === -1) return '-1';
    if (allowDecimal) {
      const parts = String(num).split('.');
      const intPart = Number(parts[0]).toLocaleString('en-US');
      return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    }
    return num.toLocaleString('en-US');
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatDisplay(value));

  useEffect(() => {
    // Only update display if numeric value actually differs
    const currentNum = allowDecimal
      ? parseFloat(displayValue.replace(/,/g, ''))
      : parseInt(displayValue.replace(/,/g, ''), 10);
    if (currentNum !== value && !displayValue.endsWith('.')) {
      setDisplayValue(formatDisplay(value));
    }
  }, [value, allowDecimal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Check for negative sign if allowed
    const isNeg = allowNegative && raw.trim().startsWith('-');

    if (allowDecimal) {
      // Normalize comma to dot for decimal if user types comma
      // Extract parts: digits and decimal point
      const normalized = raw.replace(/,/g, '.');
      const parts = normalized.split('.');
      const intDigits = parts[0].replace(/[^\d]/g, '');
      const decDigits = parts.length > 1 ? parts.slice(1).join('').replace(/[^\d]/g, '') : null;

      if (!intDigits && decDigits === null) {
        setDisplayValue(isNeg ? '-' : '');
        onChange(0);
        return;
      }

      const formattedInt = intDigits ? parseInt(intDigits, 10).toLocaleString('en-US') : '0';
      let newDisplay = isNeg ? `-${formattedInt}` : formattedInt;

      if (decDigits !== null) {
        newDisplay += `.${decDigits}`;
      } else if (raw.endsWith('.') || raw.endsWith(',')) {
        newDisplay += '.';
      }

      setDisplayValue(newDisplay);
      const parsedFloat = parseFloat((isNeg ? '-' : '') + (intDigits || '0') + (decDigits !== null ? `.${decDigits}` : ''));
      onChange(isNaN(parsedFloat) ? 0 : parsedFloat);
      return;
    }

    // Integer only mode
    const cleanDigits = raw.replace(/[^\d]/g, '');
    if (cleanDigits === '') {
      setDisplayValue(isNeg ? '-' : '');
      onChange(0);
      return;
    }

    const parsed = parseInt(cleanDigits, 10);
    const finalNum = isNeg ? -parsed : parsed;
    const formatted = parsed.toLocaleString('en-US');
    setDisplayValue(isNeg ? `-${formatted}` : formatted);
    onChange(finalNum);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} ${suffix ? 'pr-8' : ''}`}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none font-bold select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
