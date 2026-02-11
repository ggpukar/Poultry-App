import React, { useState, useEffect, useRef } from 'react';
import NepaliDate from 'nepali-date-converter';
import { getNepaliMonthName } from '../utils/nepali';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Props {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}

const NepaliDatePicker: React.FC<Props> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new NepaliDate());
  const pickerRef = useRef<HTMLDivElement>(null);

  // Initialize from value if present
  useEffect(() => {
    try {
      if (value) setCurrentViewDate(new NepaliDate(value));
    } catch(e) {}
  }, [isOpen, value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeMonth = (delta: number) => {
    const year = currentViewDate.getYear();
    const month = currentViewDate.getMonth();
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    const nextDate = new NepaliDate(newYear, newMonth, 1);
    setCurrentViewDate(nextDate);
  };

  const selectDate = (day: number) => {
    const year = currentViewDate.getYear();
    const month = currentViewDate.getMonth();
    const selected = new NepaliDate(year, month, day);
    onChange(selected.format('YYYY-MM-DD'));
    setIsOpen(false);
  };

  // Generate calendar grid
  const year = currentViewDate.getYear();
  const month = currentViewDate.getMonth();
  
  // Get start day of month (0-6)
  const startDay = new NepaliDate(year, month, 1).getDay();
  
  // Trick to find days in month: go to next month day 1, subtract 1 day
  // Or use library method if available. nepali-date-converter doesn't export getDaysInMonth easily in all versions.
  // We will assume standard BS month lengths approx or use a simple lookup if needed.
  // Ideally we create a temp date and loop.
  // Let's rely on internal calendar logic:
  const daysInMonth = (y: number, m: number) => {
      // Very basic approximation or using library feature if present.
      // Since we can't easily peek into library map, we check date overflow
      // This is a rough simulation:
      return 32; // Loop until invalid
  };

  const renderDays = () => {
      const days = [];
      // Empty slots
      for (let i = 0; i < startDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
      }
      
      // Days
      for (let d = 1; d <= 32; d++) {
          try {
              const checkDate = new NepaliDate(year, month, d);
              if (checkDate.getMonth() !== month) break; // Overflowed to next month
              
              const isSelected = value === checkDate.format('YYYY-MM-DD');
              const isToday = new NepaliDate().format('YYYY-MM-DD') === checkDate.format('YYYY-MM-DD');

              days.push(
                  <button
                      key={d}
                      onClick={() => selectDate(d)}
                      type="button"
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-sm
                          ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-100 text-gray-700'}
                          ${isToday && !isSelected ? 'border border-blue-600 text-blue-600 font-bold' : ''}
                      `}
                  >
                      {d}
                  </button>
              );
          } catch (e) {
              break; // Date invalid
          }
      }
      return days;
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
      >
        <Calendar size={18} className="text-gray-400 mr-2" />
        <span className={!value ? "text-gray-400" : "text-gray-900"}>{value || "YYYY-MM-DD"}</span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 left-0">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} type="button" className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-gray-800">
                {getNepaliMonthName(month)} {year}
            </span>
            <button onClick={() => changeMonth(1)} type="button" className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S','M','T','W','T','F','S'].map(d => (
                <span key={d} className="text-xs font-bold text-gray-400">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NepaliDatePicker;
