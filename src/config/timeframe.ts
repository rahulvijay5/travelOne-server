import { DateRange, Timeframe } from "@/types/index";
/**
 * Calculates the date range based on the provided timeframe.
 * @param timeframe - The selected timeframe.
 * @returns An object containing startDate and endDate.
 */
export const getDateRange = (timeframe: Timeframe): DateRange => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeframe) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(15, 0, 0, 0); // 3 PM today
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(8, 0, 0, 0); // 8 AM tomorrow
      break;

    case 'tomorrow':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(15, 0, 0, 0); // 3 PM tomorrow
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 2);
      endDate.setHours(8, 0, 0, 0); // 8 AM day after tomorrow
      break;

    case 'thisWeek':
      const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
      const monday = new Date(now);
      if (dayOfWeek === 0) {
        // If today is Sunday, set to last Monday
        monday.setDate(monday.getDate() - 6);
      } else {
        monday.setDate(monday.getDate() - (dayOfWeek - 1));
      }
      monday.setHours(0, 0, 0, 0);
      startDate = monday;
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'currentMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error('Invalid timeframe');
  }

  return { startDate, endDate };
};