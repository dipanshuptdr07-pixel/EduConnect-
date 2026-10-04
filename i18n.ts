export type Language = 'en' | 'hi';
export const translations = {
  en: { home:'Home', academics:'Academics', notifications:'Notifications', ai:'Study AI', profile:'Profile', homework:'Homework', attendance:'Attendance', exams:'Exams', results:'Results', fees:'Fees', leave:'Leave', events:'Events', ptm:'PTM', teachers:'Teachers', students:'Students', settings:'Settings', logout:'Logout', search:'Search', welcome:'Welcome back', today:'Today', upcoming:'Upcoming', notices:'Notices', schoolManagement:'School Management' },
  hi: { home:'होम', academics:'अकादमिक', notifications:'सूचनाएँ', ai:'स्टडी AI', profile:'प्रोफ़ाइल', homework:'होमवर्क', attendance:'उपस्थिति', exams:'परीक्षाएँ', results:'परिणाम', fees:'फीस', leave:'अवकाश', events:'कार्यक्रम', ptm:'PTM', teachers:'शिक्षक', students:'विद्यार्थी', settings:'सेटिंग्स', logout:'लॉगआउट', search:'खोजें', welcome:'वापसी पर स्वागत है', today:'आज', upcoming:'आगामी', notices:'सूचनाएँ', schoolManagement:'स्कूल प्रबंधन' }
} as const;
export const t = (lang: Language, key: keyof typeof translations.en) => translations[lang][key];
