// utils/dayjs.ts
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import 'dayjs/locale/en';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extend with plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

// Default to Arabic
dayjs.locale('ar');

// Export the configured dayjs instance
export default dayjs;

// Export a function to update locale globally
export function setDayjsLocale(locale: 'ar' | 'en') {
  dayjs.locale(locale);
}