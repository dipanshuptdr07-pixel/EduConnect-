export type Language = 'en' | 'hi';

type TranslationKey =
  | 'home'
  | 'homework'
  | 'attendance'
  | 'exams'
  | 'results'
  | 'fees'
  | 'leave'
  | 'events'
  | 'ptm'
  | 'notifications'
  | 'notices'
  | 'ai'
  | 'profile'
  | 'settings'
  | 'students'
  | 'teachers'
  | 'schoolManagement'
  | 'logout';

const translations: Record<
  Language,
  Record<TranslationKey, string>
> = {
  en: {
    home: 'Home',
    homework: 'Homework',
    attendance: 'Attendance',
    exams: 'Exams',
    results: 'Results',
    fees: 'Fees',
    leave: 'Leave',
    events: 'Events',
    ptm: 'PTM',
    notifications: 'Notifications',
    notices: 'Notices',
    ai: 'Study AI',
    profile: 'Profile',
    settings: 'Settings',
    students: 'Students',
    teachers: 'Teachers',
    schoolManagement: 'School Management',
    logout: 'Logout',
  },

  hi: {
    home: 'होम',
    homework: 'होमवर्क',
    attendance: 'उपस्थिति',
    exams: 'परीक्षाएँ',
    results: 'परिणाम',
    fees: 'फीस',
    leave: 'अवकाश',
    events: 'कार्यक्रम',
    ptm: 'PTM',
    notifications: 'सूचनाएँ',
    notices: 'नोटिस',
    ai: 'स्टडी AI',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    students: 'विद्यार्थी',
    teachers: 'शिक्षक',
    schoolManagement: 'स्कूल प्रबंधन',
    logout: 'लॉग आउट',
  },
};

export function t(
  lang: Language,
  key: TranslationKey | string,
): string {
  const dictionary = translations[lang];

  return (
    dictionary[key as TranslationKey] ??
    translations.en[key as TranslationKey] ??
    key
  );
}
