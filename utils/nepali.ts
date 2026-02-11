import NepaliDate from 'nepali-date-converter';

// Helper to format NepaliDate object to YYYY-MM-DD string
export const formatBS = (date: any): string => {
  return date.format('YYYY-MM-DD');
};

// Helper to get current BS date string
export const getCurrentBS = (): string => {
  return formatBS(new NepaliDate());
};

// Convert BS string to JS Date (approximate for sorting/charts if needed)
export const bsToJsDate = (bsDateStr: string): Date => {
  try {
    const nd = new NepaliDate(bsDateStr);
    return nd.toJsDate();
  } catch (e) {
    return new Date();
  }
};

// Add days to a BS date and return BS string
export const addDaysToBS = (bsDateStr: string, days: number): string => {
  try {
    const nd = new NepaliDate(bsDateStr);
    const jsDate = nd.toJsDate();
    jsDate.setDate(jsDate.getDate() + days);
    return new NepaliDate(jsDate).format('YYYY-MM-DD');
  } catch (e) {
    return "";
  }
};

// Get days difference
export const getDaysDiff = (startDateBS: string, endDateBS: string = getCurrentBS()): number => {
  try {
    const start = new NepaliDate(startDateBS).toJsDate();
    const end = new NepaliDate(endDateBS).toJsDate();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  } catch (e) {
    return 0;
  }
};

export const getNepaliMonthName = (index: number) => {
  const months = [
    "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
  ];
  return months[index];
};

export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds) + ' ' + ampm;
  return strTime;
};