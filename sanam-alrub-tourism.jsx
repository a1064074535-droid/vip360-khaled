import React, { useState, useEffect } from 'react';

// ===== LANGUAGE TRANSLATIONS =====
const translations = {
  ar: {
    siteName: "سنام الربع",
    slogan: "لرحلات الرمال - الربع الخالي",
    home: "الرئيسية",
    flights: "حجز الطيران",
    tours: "الرحلات",
    events: "الفعاليات",
    about: "عن المملكة",
    contact: "تواصل معنا",
    bookNow: "احجز الآن",
    searchFlights: "ابحث عن رحلات",
    from: "من",
    to: "إلى",
    departure: "تاريخ المغادرة",
    return: "تاريخ العودة",
    passengers: "عدد المسافرين",
    search: "بحث",
    popularTours: "الرحلات الأكثر شعبية",
    emptyQuarter: "رحلات الربع الخالي",
    emptyQuarterDesc: "اكتشف أكبر صحراء رملية متصلة في العالم",
    desert: "صحراء",
    adventure: "مغامرة",
    culture: "ثقافة",
    heritage: "تراث",
    priceFrom: "السعر يبدأ من",
    sar: "ر.س",
    perPerson: "للشخص",
    upcomingEvents: "الفعاليات القادمة",
    paymentMethods: "طرق الدفع",
    allRightsReserved: "جميع الحقوق محفوظة",
    ownerName: "خالد الدوسري",
    ministryPartner: "شريك وزارة السياحة",
    selectLanguage: "اختر اللغة",
    currency: "العملة",
    adminPanel: "لوحة التحكم",
    editPrices: "تعديل الأسعار",
    save: "حفظ",
    cancel: "إلغاء",
    welcomeMsg: "مرحباً بكم في بوابة السياحة السعودية",
    discoverKSA: "اكتشف جمال المملكة العربية السعودية",
    heroDesc: "من الرمال الذهبية للربع الخالي إلى جبال عسير الخضراء، استكشف كنوز المملكة مع دوسري للسياحة",
    riyadh: "الرياض",
    jeddah: "جدة",
    dammam: "الدمام",
    alula: "العلا",
    neom: "نيوم",
    abha: "أبها",
    tabuk: "تبوك",
    medina: "المدينة المنورة",
    duration: "المدة",
    days: "أيام",
    nights: "ليالي",
    includes: "يشمل",
    accommodation: "الإقامة",
    meals: "الوجبات",
    transport: "المواصلات",
    guide: "مرشد سياحي",
    viewDetails: "عرض التفاصيل",
    bookTour: "احجز الرحلة",
    eventDate: "تاريخ الفعالية",
    eventLocation: "موقع الفعالية",
    ticketPrice: "سعر التذكرة",
    buyTicket: "شراء تذكرة",
    newsletter: "النشرة البريدية",
    subscribeDesc: "اشترك للحصول على أحدث العروض والأخبار",
    email: "البريد الإلكتروني",
    subscribe: "اشتراك",
    followUs: "تابعنا",
    quickLinks: "روابط سريعة",
    support: "الدعم",
    faq: "الأسئلة الشائعة",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    contactInfo: "معلومات التواصل",
    phone: "الهاتف",
    address: "العنوان",
    riyadhAddress: "الرياض، المملكة العربية السعودية",
  },
  en: {
    siteName: "Sanam Al-Rub'",
    slogan: "Empty Quarter Desert Tours",
    home: "Home",
    flights: "Book Flights",
    tours: "Tours",
    events: "Events",
    about: "About KSA",
    contact: "Contact Us",
    bookNow: "Book Now",
    searchFlights: "Search Flights",
    from: "From",
    to: "To",
    departure: "Departure Date",
    return: "Return Date",
    passengers: "Passengers",
    search: "Search",
    popularTours: "Most Popular Tours",
    emptyQuarter: "Empty Quarter Tours",
    emptyQuarterDesc: "Discover the largest continuous sand desert in the world",
    desert: "Desert",
    adventure: "Adventure",
    culture: "Culture",
    heritage: "Heritage",
    priceFrom: "Price starts from",
    sar: "SAR",
    perPerson: "per person",
    upcomingEvents: "Upcoming Events",
    paymentMethods: "Payment Methods",
    allRightsReserved: "All Rights Reserved",
    ownerName: "Khalid Al-Dosari",
    ministryPartner: "Ministry of Tourism Partner",
    selectLanguage: "Select Language",
    currency: "Currency",
    adminPanel: "Admin Panel",
    editPrices: "Edit Prices",
    save: "Save",
    cancel: "Cancel",
    welcomeMsg: "Welcome to Saudi Tourism Gateway",
    discoverKSA: "Discover the Beauty of Saudi Arabia",
    heroDesc: "From the golden sands of the Empty Quarter to the green mountains of Asir, explore the treasures of the Kingdom with Dosari Tourism",
    riyadh: "Riyadh",
    jeddah: "Jeddah",
    dammam: "Dammam",
    alula: "AlUla",
    neom: "NEOM",
    abha: "Abha",
    tabuk: "Tabuk",
    medina: "Medina",
    duration: "Duration",
    days: "days",
    nights: "nights",
    includes: "Includes",
    accommodation: "Accommodation",
    meals: "Meals",
    transport: "Transport",
    guide: "Tour Guide",
    viewDetails: "View Details",
    bookTour: "Book Tour",
    eventDate: "Event Date",
    eventLocation: "Event Location",
    ticketPrice: "Ticket Price",
    buyTicket: "Buy Ticket",
    newsletter: "Newsletter",
    subscribeDesc: "Subscribe for latest offers and news",
    email: "Email",
    subscribe: "Subscribe",
    followUs: "Follow Us",
    quickLinks: "Quick Links",
    support: "Support",
    faq: "FAQ",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    contactInfo: "Contact Info",
    phone: "Phone",
    address: "Address",
    riyadhAddress: "Riyadh, Kingdom of Saudi Arabia",
  },
  fr: {
    siteName: "Sanam Al-Rub'",
    slogan: "Circuits du Désert du Quart Vide",
    home: "Accueil",
    flights: "Réserver Vols",
    tours: "Circuits",
    events: "Événements",
    about: "À propos",
    contact: "Contact",
    bookNow: "Réserver",
    searchFlights: "Rechercher Vols",
    from: "De",
    to: "À",
    departure: "Date de Départ",
    return: "Date de Retour",
    passengers: "Passagers",
    search: "Rechercher",
    popularTours: "Circuits Populaires",
    emptyQuarter: "Circuits Quart Vide",
    emptyQuarterDesc: "Découvrez le plus grand désert de sable continu au monde",
    priceFrom: "Prix à partir de",
    sar: "SAR",
    perPerson: "par personne",
    allRightsReserved: "Tous Droits Réservés",
    ownerName: "Khalid Al-Dosari",
  },
  de: {
    siteName: "Sanam Al-Rub'",
    slogan: "Wüstentouren im Leeren Viertel",
    home: "Startseite",
    flights: "Flüge Buchen",
    tours: "Touren",
    events: "Veranstaltungen",
    bookNow: "Jetzt Buchen",
    priceFrom: "Preis ab",
    sar: "SAR",
    perPerson: "pro Person",
    allRightsReserved: "Alle Rechte Vorbehalten",
  },
  es: {
    siteName: "Sanam Al-Rub'",
    slogan: "Tours del Desierto del Cuarto Vacío",
    home: "Inicio",
    flights: "Reservar Vuelos",
    tours: "Tours",
    events: "Eventos",
    bookNow: "Reservar Ahora",
    priceFrom: "Precio desde",
    sar: "SAR",
    perPerson: "por persona",
    allRightsReserved: "Todos los Derechos Reservados",
  },
  zh: {
    siteName: "سنام الربع",
    slogan: "鲁卜哈利沙漠之旅",
    home: "首页",
    flights: "预订机票",
    tours: "旅游",
    events: "活动",
    bookNow: "立即预订",
    priceFrom: "价格从",
    sar: "沙特里亚尔",
    perPerson: "每人",
    allRightsReserved: "版权所有",
  },
  ja: {
    siteName: "サナム・アル・ルブ",
    slogan: "ルブアルハリ砂漠ツアー",
    home: "ホーム",
    flights: "フライト予約",
    tours: "ツアー",
    events: "イベント",
    bookNow: "今すぐ予約",
    priceFrom: "価格から",
    sar: "SAR",
    perPerson: "一人あたり",
    allRightsReserved: "全著作権所有",
  },
  ko: {
    siteName: "사남 알 루브",
    slogan: "룹알할리 사막 투어",
    home: "홈",
    flights: "항공권 예약",
    tours: "투어",
    events: "이벤트",
    bookNow: "지금 예약",
    priceFrom: "가격",
    sar: "SAR",
    perPerson: "1인당",
    allRightsReserved: "모든 권리 보유",
  },
  ru: {
    siteName: "Санам Аль-Руб",
    slogan: "Туры по пустыне Руб-эль-Хали",
    home: "Главная",
    flights: "Бронирование",
    tours: "Туры",
    events: "Мероприятия",
    bookNow: "Забронировать",
    priceFrom: "Цена от",
    sar: "SAR",
    perPerson: "за человека",
    allRightsReserved: "Все права защищены",
  },
  hi: {
    siteName: "सनम अल-रुब",
    slogan: "रब अल खली रेगिस्तान टूर",
    home: "होम",
    flights: "उड़ान बुकिंग",
    tours: "टूर",
    events: "इवेंट्स",
    bookNow: "अभी बुक करें",
    priceFrom: "मूल्य से",
    sar: "SAR",
    perPerson: "प्रति व्यक्ति",
    allRightsReserved: "सर्वाधिकार सुरक्षित",
  },
  pt: {
    siteName: "Sanam Al-Rub'",
    slogan: "Tours do Deserto do Quarto Vazio",
    home: "Início",
    flights: "Reservar Voos",
    tours: "Passeios",
    events: "Eventos",
    bookNow: "Reserve Agora",
    priceFrom: "Preço a partir de",
    sar: "SAR",
    perPerson: "por pessoa",
    allRightsReserved: "Todos os Direitos Reservados",
  },
  tr: {
    siteName: "Sanam Al-Rub'",
    slogan: "Rub el-Hali Çöl Turları",
    home: "Ana Sayfa",
    flights: "Uçuş Rezervasyonu",
    tours: "Turlar",
    events: "Etkinlikler",
    bookNow: "Şimdi Rezerve Et",
    priceFrom: "Fiyat",
    sar: "SAR",
    perPerson: "kişi başı",
    allRightsReserved: "Tüm Hakları Saklıdır",
  },
  id: {
    siteName: "Sanam Al-Rub'",
    slogan: "Tur Gurun Rub al-Khali",
    home: "Beranda",
    flights: "Pesan Penerbangan",
    tours: "Tur",
    events: "Acara",
    bookNow: "Pesan Sekarang",
    priceFrom: "Harga mulai",
    sar: "SAR",
    perPerson: "per orang",
    allRightsReserved: "Hak Cipta Dilindungi",
  },
  ms: {
    siteName: "Sanam Al-Rub'",
    slogan: "Lawatan Gurun Rub al-Khali",
    home: "Laman Utama",
    flights: "Tempah Penerbangan",
    tours: "Lawatan",
    events: "Acara",
    bookNow: "Tempah Sekarang",
    priceFrom: "Harga bermula",
    sar: "SAR",
    perPerson: "seorang",
    allRightsReserved: "Hak Cipta Terpelihara",
  },
  th: {
    siteName: "ซานัม อัล-รูบ",
    slogan: "ทัวร์ทะเลทรายรูบอัลคาลี",
    home: "หน้าแรก",
    flights: "จองเที่ยวบิน",
    tours: "ทัวร์",
    events: "กิจกรรม",
    bookNow: "จองเลย",
    priceFrom: "ราคาเริ่มต้น",
    sar: "SAR",
    perPerson: "ต่อคน",
    allRightsReserved: "สงวนลิขสิทธิ์",
  },
  vi: {
    siteName: "Sanam Al-Rub'",
    slogan: "Tour Sa Mạc Rub al-Khali",
    home: "Trang Chủ",
    flights: "Đặt Vé Máy Bay",
    tours: "Tour",
    events: "Sự Kiện",
    bookNow: "Đặt Ngay",
    priceFrom: "Giá từ",
    sar: "SAR",
    perPerson: "mỗi người",
    allRightsReserved: "Đã Đăng Ký Bản Quyền",
  },
  nl: {
    siteName: "Sanam Al-Rub'",
    slogan: "Woestijntours Rub al-Khali",
    home: "Home",
    flights: "Vluchten Boeken",
    tours: "Tours",
    events: "Evenementen",
    bookNow: "Nu Boeken",
    priceFrom: "Prijs vanaf",
    sar: "SAR",
    perPerson: "per persoon",
    allRightsReserved: "Alle Rechten Voorbehouden",
  },
  it: {
    siteName: "Sanam Al-Rub'",
    slogan: "Tour del Deserto Rub al-Khali",
    home: "Home",
    flights: "Prenota Voli",
    tours: "Tour",
    events: "Eventi",
    bookNow: "Prenota Ora",
    priceFrom: "Prezzo da",
    sar: "SAR",
    perPerson: "a persona",
    allRightsReserved: "Tutti i Diritti Riservati",
  },
  pl: {
    siteName: "Sanam Al-Rub'",
    slogan: "Wycieczki po Pustyni Rub al-Khali",
    home: "Strona Główna",
    flights: "Rezerwacja Lotów",
    tours: "Wycieczki",
    events: "Wydarzenia",
    bookNow: "Zarezerwuj Teraz",
    priceFrom: "Cena od",
    sar: "SAR",
    perPerson: "za osobę",
    allRightsReserved: "Wszelkie Prawa Zastrzeżone",
  },
  uk: {
    siteName: "Санам Аль-Руб",
    slogan: "Тури пустелею Руб-ель-Халі",
    home: "Головна",
    flights: "Бронювання",
    tours: "Тури",
    events: "Події",
    bookNow: "Забронювати",
    priceFrom: "Ціна від",
    sar: "SAR",
    perPerson: "за особу",
    allRightsReserved: "Усі права захищені",
  },
  ur: {
    siteName: "سنام الربع",
    slogan: "ربع الخالی صحرا ٹورز",
    home: "ہوم",
    flights: "فلائٹ بکنگ",
    tours: "ٹورز",
    events: "تقریبات",
    bookNow: "ابھی بک کریں",
    priceFrom: "قیمت شروع",
    sar: "SAR",
    perPerson: "فی شخص",
    allRightsReserved: "جملہ حقوق محفوظ ہیں",
  },
  fa: {
    siteName: "سنام الربع",
    slogan: "تورهای صحرای ربع الخالی",
    home: "خانه",
    flights: "رزرو پرواز",
    tours: "تورها",
    events: "رویدادها",
    bookNow: "رزرو کنید",
    priceFrom: "قیمت از",
    sar: "SAR",
    perPerson: "هر نفر",
    allRightsReserved: "کلیه حقوق محفوظ است",
  },
  sw: {
    siteName: "Sanam Al-Rub'",
    slogan: "Ziara za Jangwa la Rub al-Khali",
    home: "Nyumbani",
    flights: "Buku Ndege",
    tours: "Ziara",
    events: "Matukio",
    bookNow: "Buku Sasa",
    priceFrom: "Bei kuanzia",
    sar: "SAR",
    perPerson: "kwa mtu",
    allRightsReserved: "Haki Zote Zimehifadhiwa",
  },
  he: {
    siteName: "סנאם אל-רוב",
    slogan: "סיורי מדבר הרובע הריק",
    home: "בית",
    flights: "הזמנת טיסות",
    tours: "סיורים",
    events: "אירועים",
    bookNow: "הזמן עכשיו",
    priceFrom: "מחיר מ",
    sar: "SAR",
    perPerson: "לאדם",
    allRightsReserved: "כל הזכויות שמורות",
  },
  el: {
    siteName: "Σανάμ Αλ-Ρουμπ",
    slogan: "Εκδρομές στην Έρημο Rub al-Khali",
    home: "Αρχική",
    flights: "Κράτηση Πτήσεων",
    tours: "Εκδρομές",
    events: "Εκδηλώσεις",
    bookNow: "Κράτηση Τώρα",
    priceFrom: "Τιμή από",
    sar: "SAR",
    perPerson: "ανά άτομο",
    allRightsReserved: "Με Επιφύλαξη Παντός Δικαιώματος",
  },
  bn: {
    siteName: "সানাম আল-রুব",
    slogan: "রুব আল খালি মরুভূমি ট্যুর",
    home: "হোম",
    flights: "ফ্লাইট বুকিং",
    tours: "ট্যুর",
    events: "ইভেন্ট",
    bookNow: "এখনই বুক করুন",
    priceFrom: "মূল্য থেকে",
    sar: "SAR",
    perPerson: "প্রতি ব্যক্তি",
    allRightsReserved: "সর্বস্বত্ব সংরক্ষিত",
  },
};

// ===== CURRENCIES =====
const currencies = {
  SAR: { symbol: 'ر.س', rate: 1, name: 'Saudi Riyal' },
  USD: { symbol: '$', rate: 0.27, name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.25, name: 'Euro' },
  GBP: { symbol: '£', rate: 0.21, name: 'British Pound' },
  AED: { symbol: 'د.إ', rate: 0.98, name: 'UAE Dirham' },
  KWD: { symbol: 'د.ك', rate: 0.082, name: 'Kuwaiti Dinar' },
  QAR: { symbol: 'ر.ق', rate: 0.97, name: 'Qatari Riyal' },
  BHD: { symbol: 'د.ب', rate: 0.10, name: 'Bahraini Dinar' },
  OMR: { symbol: 'ر.ع', rate: 0.10, name: 'Omani Rial' },
  EGP: { symbol: 'ج.م', rate: 8.34, name: 'Egyptian Pound' },
  INR: { symbol: '₹', rate: 22.5, name: 'Indian Rupee' },
  PKR: { symbol: '₨', rate: 75.0, name: 'Pakistani Rupee' },
  CNY: { symbol: '¥', rate: 1.93, name: 'Chinese Yuan' },
  JPY: { symbol: '¥', rate: 40.3, name: 'Japanese Yen' },
  KRW: { symbol: '₩', rate: 355, name: 'Korean Won' },
  RUB: { symbol: '₽', rate: 24.5, name: 'Russian Ruble' },
  TRY: { symbol: '₺', rate: 7.82, name: 'Turkish Lira' },
  MYR: { symbol: 'RM', rate: 1.19, name: 'Malaysian Ringgit' },
  IDR: { symbol: 'Rp', rate: 4234, name: 'Indonesian Rupiah' },
  THB: { symbol: '฿', rate: 9.52, name: 'Thai Baht' },
  PHP: { symbol: '₱', rate: 15.1, name: 'Philippine Peso' },
  VND: { symbol: '₫', rate: 6624, name: 'Vietnamese Dong' },
  BRL: { symbol: 'R$', rate: 1.32, name: 'Brazilian Real' },
  MXN: { symbol: '$', rate: 4.59, name: 'Mexican Peso' },
  CAD: { symbol: 'C$', rate: 0.36, name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', rate: 0.41, name: 'Australian Dollar' },
  NZD: { symbol: 'NZ$', rate: 0.44, name: 'New Zealand Dollar' },
  CHF: { symbol: 'CHF', rate: 0.23, name: 'Swiss Franc' },
  SEK: { symbol: 'kr', rate: 2.78, name: 'Swedish Krona' },
  NOK: { symbol: 'kr', rate: 2.86, name: 'Norwegian Krone' },
  DKK: { symbol: 'kr', rate: 1.86, name: 'Danish Krone' },
  PLN: { symbol: 'zł', rate: 1.07, name: 'Polish Zloty' },
  ZAR: { symbol: 'R', rate: 4.93, name: 'South African Rand' },
  NGN: { symbol: '₦', rate: 207, name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', rate: 34.5, name: 'Kenyan Shilling' },
  ILS: { symbol: '₪', rate: 0.99, name: 'Israeli Shekel' },
  SGD: { symbol: 'S$', rate: 0.36, name: 'Singapore Dollar' },
  HKD: { symbol: 'HK$', rate: 2.09, name: 'Hong Kong Dollar' },
  TWD: { symbol: 'NT$', rate: 8.5, name: 'Taiwan Dollar' },
};

const languageNames = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  hi: 'हिندي',
  pt: 'Português',
  tr: 'Türkçe',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  nl: 'Nederlands',
  it: 'Italiano',
  pl: 'Polski',
  uk: 'Українська',
  ur: 'اردو',
  fa: 'فارسی',
  sw: 'Kiswahili',
  he: 'עبري',
  el: 'Ελληνικά',
  bn: 'বাংলা',
};

// ===== LOGO COMPONENT =====
const Logo = ({ className = "w-20 h-20" }) => {
  return (
    <div className={`relative ${className} group cursor-pointer transition-transform hover:scale-105 active:scale-95`}>
      <img 
        src="/logo.png" 
        alt="Sanam Al-Rub Logo" 
        className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
        onError={(e) => {
          if (!e.target.dataset.triedGithub) {
            e.target.dataset.triedGithub = 'true';
            e.target.src = "https://raw.githubusercontent.com/a1064074535/khaled1593/main/logo.png";
          } else {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }
        }}
      />
      <div style={{ display: 'none' }} className="w-full h-full">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="goldRing-fallback" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8a6d3b" />
              <stop offset="20%" stopColor="#fcf6ba" />
              <stop offset="40%" stopColor="#d4af37" />
              <stop offset="60%" stopColor="#fcf6ba" />
              <stop offset="80%" stopColor="#aa771c" />
              <stop offset="100%" stopColor="#8a6d3b" />
            </linearGradient>
            <clipPath id="innerCircle-fallback">
              <circle cx="100" cy="100" r="82" />
            </clipPath>
          </defs>
          <circle cx="100" cy="100" r="95" fill="url(#goldRing-fallback)" stroke="#5d4037" strokeWidth="1" />
          <g clipPath="url(#innerCircle-fallback)">
            <rect x="0" y="0" width="200" height="200" fill="#1a0f00" />
            <text x="100" y="110" textAnchor="middle" fill="#fcf6ba" style={{ fontSize: '24px', fontWeight: 'bold' }}>سنام الربع</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// ===== MAIN APP COMPONENT =====
export default function SaudiTourismApp() {
  const [lang, setLang] = useState('ar');
  const [currency, setCurrency] = useState('SAR');
  const [activeSection, setActiveSection] = useState('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);

  // Editable prices (admin can change these)
  const [prices, setPrices] = useState({
    flight_riyadh_jeddah: 450,
    flight_riyadh_dammam: 350,
    flight_riyadh_alula: 650,
    flight_jeddah_abha: 400,
    flight_riyadh_neom: 750,
    tour_empty_quarter_3d: 2500,
    tour_empty_quarter_5d: 4200,
    tour_empty_quarter_7d: 6500,
    tour_alula_heritage: 3200,
    tour_red_sea: 3800,
    tour_asir_mountains: 2800,
    event_riyadh_season: 150,
    event_jeddah_season: 180,
    event_alula_festival: 250,
    event_desert_concert: 350,
  });

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;
  const isRTL = ['ar', 'ur', 'fa', 'he'].includes(lang);

  const convertPrice = (sarPrice) => {
    const converted = sarPrice * currencies[currency].rate;
    return `${currencies[currency].symbol} ${converted.toFixed(currency === 'JPY' || currency === 'KRW' || currency === 'VND' || currency === 'IDR' ? 0 : 2)}`;
  };

  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Tours data
  const tours = [
    {
      id: 'empty_quarter_3d',
      nameKey: 'emptyQuarter',
      duration: '3',
      price: prices.tour_empty_quarter_3d,
      image: 'https://images.unsplash.com/photo-1682686581580-d99b0a8c2cb2?w=800',
      category: 'desert',
    },
    {
      id: 'empty_quarter_5d',
      nameKey: 'emptyQuarter',
      duration: '5',
      price: prices.tour_empty_quarter_5d,
      image: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=800',
      category: 'adventure',
    },
    {
      id: 'empty_quarter_7d',
      nameKey: 'emptyQuarter',
      duration: '7',
      price: prices.tour_empty_quarter_7d,
      image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800',
      category: 'adventure',
    },
    {
      id: 'alula_heritage',
      name: 'AlUla Heritage Tour',
      nameAr: 'جولة تراث العلا',
      duration: '4',
      price: prices.tour_alula_heritage,
      image: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800',
      category: 'heritage',
    },
    {
      id: 'red_sea',
      name: 'Red Sea Discovery',
      nameAr: 'استكشاف البحر الأحمر',
      duration: '4',
      price: prices.tour_red_sea,
      image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800',
      category: 'culture',
    },
    {
      id: 'asir_mountains',
      name: 'Asir Mountains Adventure',
      nameAr: 'مغامرة جبال عسير',
      duration: '3',
      price: prices.tour_asir_mountains,
      image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800',
      category: 'adventure',
    },
  ];

  // Events data
  const events = [
    {
      id: 'riyadh_season',
      name: 'Riyadh Season 2026',
      nameAr: 'موسم الرياض 2026',
      date: '2026-10-15',
      location: 'Riyadh',
      locationAr: 'الرياض',
      price: prices.event_riyadh_season,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    },
    {
      id: 'jeddah_season',
      name: 'Jeddah Season',
      nameAr: 'موسم جدة',
      date: '2026-06-20',
      location: 'Jeddah',
      locationAr: 'جدة',
      price: prices.event_jeddah_season,
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    },
    {
      id: 'alula_festival',
      name: 'AlUla Arts Festival',
      nameAr: 'مهرجان العلا للفنون',
      date: '2026-02-01',
      location: 'AlUla',
      locationAr: 'العلا',
      price: prices.event_alula_festival,
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
    },
    {
      id: 'desert_concert',
      name: 'Desert Night Concert',
      nameAr: 'حفل ليلة الصحراء',
      date: '2026-03-15',
      location: 'Empty Quarter',
      locationAr: 'الربع الخالي',
      price: prices.event_desert_concert,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    },
  ];

  // Flights data
  const flights = [
    { id: 1, from: 'riyadh', to: 'jeddah', price: prices.flight_riyadh_jeddah, duration: '1h 30m' },
    { id: 2, from: 'riyadh', to: 'dammam', price: prices.flight_riyadh_dammam, duration: '1h 10m' },
    { id: 3, from: 'riyadh', to: 'alula', price: prices.flight_riyadh_alula, duration: '1h 45m' },
    { id: 4, from: 'jeddah', to: 'abha', price: prices.flight_jeddah_abha, duration: '1h 20m' },
    { id: 5, from: 'riyadh', to: 'neom', price: prices.flight_riyadh_neom, duration: '2h 00m' },
  ];

  // Payment Modal Component
  const PaymentModal = ({ item, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-amber-200 ${isRTL ? 'rtl' : 'ltr'}`}
        style={{ fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : "'Playfair Display', serif" }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-amber-900 mb-2">
            {lang === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method'}
          </h3>
          <p className="text-amber-700 text-lg font-semibold">
            {lang === 'ar' ? 'المبلغ: ' : 'Amount: '}{convertPrice(item?.price || 0)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Mada */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-green-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">mada</div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'مدى' : 'Mada'}</p>
          </button>

          {/* Visa */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-bold text-sm italic">VISA</div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'فيزا' : 'Visa'}</p>
          </button>

          {/* Mastercard */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-orange-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="flex">
                <div className="w-8 h-8 bg-red-500 rounded-full -mr-3"></div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full opacity-90"></div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'ماستركارد' : 'Mastercard'}</p>
          </button>

          {/* Apple Pay */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="bg-black text-white px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Pay
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'أبل باي' : 'Apple Pay'}</p>
          </button>

          {/* Google Pay */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-blue-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg font-medium text-xs flex items-center gap-1">
                <span className="text-blue-500">G</span>
                <span className="text-red-500">o</span>
                <span className="text-yellow-500">o</span>
                <span className="text-blue-500">g</span>
                <span className="text-green-500">l</span>
                <span className="text-red-500">e</span>
                <span className="text-gray-700 ml-1">Pay</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'قوقل باي' : 'Google Pay'}</p>
          </button>

          {/* PayPal */}
          <button className="group p-4 bg-white rounded-2xl border-2 border-transparent hover:border-blue-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
            <div className="h-12 flex items-center justify-center">
              <div className="text-blue-800 font-bold text-sm">
                Pay<span className="text-blue-500">Pal</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{lang === 'ar' ? 'باي بال' : 'PayPal'}</p>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-bold hover:from-gray-300 hover:to-gray-400 transition-all"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );

  // Admin Panel Component
  const AdminPanel = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-amber-500/30 my-8 ${isRTL ? 'rtl' : 'ltr'}`}
        style={{ fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : "'Playfair Display', serif" }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-amber-400">{t('adminPanel')}</h2>
          <button onClick={() => setShowAdmin(false)} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>

        <div className="space-y-8">
          {/* Flight Prices */}
          <div>
            <h3 className="text-xl font-bold text-amber-300 mb-4">{lang === 'ar' ? 'أسعار الطيران' : 'Flight Prices'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(prices).filter(([key]) => key.startsWith('flight_')).map(([key, value]) => (
                <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                  <label className="block text-sm text-gray-300 mb-2">{key.replace('flight_', '').replace(/_/g, ' → ')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setPrices({ ...prices, [key]: Number(e.target.value) })}
                      className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-amber-400 font-bold">SAR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tour Prices */}
          <div>
            <h3 className="text-xl font-bold text-amber-300 mb-4">{lang === 'ar' ? 'أسعار الرحلات' : 'Tour Prices'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(prices).filter(([key]) => key.startsWith('tour_')).map(([key, value]) => (
                <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                  <label className="block text-sm text-gray-300 mb-2">{key.replace('tour_', '').replace(/_/g, ' ')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setPrices({ ...prices, [key]: Number(e.target.value) })}
                      className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-amber-400 font-bold">SAR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Event Prices */}
          <div>
            <h3 className="text-xl font-bold text-amber-300 mb-4">{lang === 'ar' ? 'أسعار الفعاليات' : 'Event Prices'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(prices).filter(([key]) => key.startsWith('event_')).map(([key, value]) => (
                <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                  <label className="block text-sm text-gray-300 mb-2">{key.replace('event_', '').replace(/_/g, ' ')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setPrices({ ...prices, [key]: Number(e.target.value) })}
                      className="flex-1 bg-slate-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <span className="text-amber-400 font-bold">SAR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setShowAdmin(false)}
            className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-yellow-950 ${isRTL ? 'rtl' : 'ltr'}`}
      style={{ fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : "'Playfair Display', serif" }}
    >
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Logo className="w-20 h-20" />
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
                  {t('siteName')}
                </h1>
                <p className="text-xs text-amber-200/70">{t('slogan')}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {['home', 'flights', 'tours', 'events', 'about', 'contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveSection(item)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSection === item
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                      : 'text-amber-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t(item)}
                </button>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowLangMenu(!showLangMenu); setShowCurrencyMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-amber-200 hover:bg-white/20 transition-all border border-amber-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-sm">{languageNames[lang]}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/30 py-2 w-56 max-h-80 overflow-y-auto z-50">
                    {Object.entries(languageNames).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => { setLang(code); setShowLangMenu(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-amber-500/20 transition-colors ${
                          lang === code ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowCurrencyMenu(!showCurrencyMenu); setShowLangMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-amber-200 hover:bg-white/20 transition-all border border-amber-500/30"
                >
                  <span className="text-lg">{currencies[currency].symbol}</span>
                  <span className="text-sm">{currency}</span>
                </button>
                {showCurrencyMenu && (
                  <div className="absolute top-full mt-2 right-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/30 py-2 w-64 max-h-80 overflow-y-auto z-50">
                    {Object.entries(currencies).map(([code, data]) => (
                      <button
                        key={code}
                        onClick={() => { setCurrency(code); setShowCurrencyMenu(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-amber-500/20 transition-colors flex items-center justify-between ${
                          currency === code ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300'
                        }`}
                      >
                        <span>{data.name}</span>
                        <span className="text-amber-400 font-bold">{data.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Button */}
              <button
                onClick={() => setShowAdmin(true)}
                className="p-2 bg-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/30 transition-all"
                title={t('adminPanel')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transform scale-110"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1682686581580-d99b0a8c2cb2?w=1920)',
              animation: 'slowZoom 30s ease-in-out infinite alternate',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/80 via-orange-950/60 to-amber-950/90" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Hero Content */}
        <div className={`relative z-10 text-center px-4 max-w-5xl mx-auto ${animateHero ? 'animate-fadeIn' : 'opacity-0'}`}>
          {/* Saudi Emblem */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <Logo className="w-64 h-64" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-full text-white text-sm font-bold whitespace-nowrap shadow-lg">
                {t('ministryPartner')}
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 mb-6 leading-tight">
            {t('discoverKSA')}
          </h1>
          
          <p className="text-xl md:text-2xl text-amber-100/90 mb-4 max-w-3xl mx-auto leading-relaxed">
            {t('heroDesc')}
          </p>

          <p className="text-lg text-amber-300 mb-12">
            <span className="font-bold">{t('ownerName')}</span> • {t('siteName')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setActiveSection('tours')}
              className="group px-10 py-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-amber-950 rounded-2xl font-bold text-lg shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transform hover:-translate-y-1 transition-all"
            >
              <span className="flex items-center justify-center gap-3">
                {t('bookNow')}
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M19 12H5M12 19l7-7-7-7" : "M5 12h14M12 5l7 7-7 7"} />
                </svg>
              </span>
            </button>
            <button 
              onClick={() => setActiveSection('flights')}
              className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-amber-400/50 hover:bg-white/20 transform hover:-translate-y-1 transition-all"
            >
              {t('searchFlights')}
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Flight Booking Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">
              {t('searchFlights')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full" />
          </div>

          {/* Search Form */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-amber-300 text-sm font-medium">{t('from')}</label>
                <select className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none border border-slate-600">
                  <option value="riyadh">{t('riyadh')}</option>
                  <option value="jeddah">{t('jeddah')}</option>
                  <option value="dammam">{t('dammam')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-amber-300 text-sm font-medium">{t('to')}</label>
                <select className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none border border-slate-600">
                  <option value="alula">{t('alula')}</option>
                  <option value="neom">{t('neom')}</option>
                  <option value="abha">{t('abha')}</option>
                  <option value="tabuk">{t('tabuk')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-amber-300 text-sm font-medium">{t('departure')}</label>
                <input type="date" className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none border border-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-amber-300 text-sm font-medium">{t('return')}</label>
                <input type="date" className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none border border-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-amber-300 text-sm font-medium">{t('passengers')}</label>
                <select className="w-full bg-slate-700/50 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none border border-slate-600">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5+</option>
                </select>
              </div>
            </div>
            <button className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/30">
              {t('search')}
            </button>
          </div>

          {/* Available Flights */}
          <div className="mt-12 grid gap-4">
            {flights.map((flight) => (
              <div key={flight.id} className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-2xl font-bold text-white">
                        {t(flight.from)} <span className="text-amber-400 mx-2">→</span> {t(flight.to)}
                      </p>
                      <p className="text-gray-400">{flight.duration}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-400">{convertPrice(flight.price)}</p>
                    <p className="text-gray-400 text-sm">{t('perPerson')}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedItem({ ...flight, price: flight.price }); setShowPayment(true); }}
                    className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    {t('bookNow')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-amber-950/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-6 py-2 bg-amber-500/20 rounded-full text-amber-400 text-sm font-bold mb-4 border border-amber-500/30">
              {t('emptyQuarter')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 mb-4">
              {t('popularTours')}
            </h2>
            <p className="text-xl text-amber-100/70 max-w-2xl mx-auto">{t('emptyQuarterDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour, index) => (
              <div 
                key={tour.id}
                className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-3xl overflow-hidden border border-amber-500/20 hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700"
                    style={{ backgroundImage: `url(${tour.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 px-4 py-2 bg-amber-500/90 rounded-full text-amber-950 text-sm font-bold">
                    {tour.duration} {t('days')}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {lang === 'ar' ? (tour.nameAr || t(tour.nameKey)) : (tour.name || t(tour.nameKey))}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{t('emptyQuarterDesc')}</p>
                  
                  {/* Includes */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['accommodation', 'meals', 'transport', 'guide'].map((item) => (
                      <span key={item} className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-amber-300">
                        ✓ {t(item)}
                      </span>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div>
                      <p className="text-gray-400 text-sm">{t('priceFrom')}</p>
                      <p className="text-2xl font-bold text-amber-400">{convertPrice(tour.price)}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(tour); setShowPayment(true); }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                    >
                      {t('bookTour')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">
              {t('upcomingEvents')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => (
              <div key={event.id} className="group relative overflow-hidden rounded-3xl border border-amber-500/20 hover:border-amber-500/50 transition-all">
                <div 
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
                  style={{ backgroundImage: `url(${event.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                
                <div className="relative p-8 min-h-80 flex flex-col justify-end">
                  <div className="mb-4">
                    <span className="inline-block px-4 py-2 bg-amber-500 text-amber-950 rounded-full text-sm font-bold">
                      {new Date(event.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {lang === 'ar' ? event.nameAr : event.name}
                  </h3>
                  <p className="text-amber-200 mb-4">
                    📍 {lang === 'ar' ? event.locationAr : event.location}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{t('ticketPrice')}</p>
                      <p className="text-2xl font-bold text-amber-400">{convertPrice(event.price)}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItem(event); setShowPayment(true); }}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                    >
                      {t('buyTicket')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empty Quarter Gallery */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-orange-950/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 mb-4">
              {lang === 'ar' ? 'معرض صور الربع الخالي' : 'Empty Quarter Gallery'}
            </h2>
            <p className="text-xl text-amber-100/70">{t('emptyQuarterDesc')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1682686581580-d99b0a8c2cb2?w=600',
              'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600',
              'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600',
              'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=600',
              'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=600',
              'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600',
              'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=600',
              'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600',
            ].map((img, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                  index === 0 || index === 5 ? 'row-span-2' : ''
                }`}
              >
                <img
                  src={img}
                  alt={`Empty Quarter ${index + 1}`}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  style={{ minHeight: index === 0 || index === 5 ? '400px' : '200px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 pt-20 pb-8 px-4 border-t border-amber-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Logo className="w-20 h-20" />
                <div>
                  <h3 className="text-xl font-bold text-amber-400">{t('siteName')}</h3>
                  <p className="text-sm text-gray-400">{t('ownerName')}</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">{t('heroDesc')}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-amber-400 mb-6">{t('quickLinks')}</h4>
              <ul className="space-y-3">
                {['home', 'flights', 'tours', 'events', 'about', 'contact'].map((item) => (
                  <li key={item}>
                    <button onClick={() => setActiveSection(item)} className="text-gray-400 hover:text-amber-400 transition-colors">
                      {t(item)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-bold text-amber-400 mb-6">{t('contactInfo')}</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.767-.872-2.036-.969-.269-.099-.465-.148-.662.15-.197.297-.767.969-.94 1.169-.173.199-.347.225-.648.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.675-2.083-.175-.3-.019-.461.131-.61.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.101-.2.05-.375-.025-.525-.075-.15-.662-1.597-.907-2.187-.239-.575-.482-.497-.662-.506-.17-.009-.364-.01-.559-.01-.196 0-.514.074-.783.374-.27.299-1.031 1.007-1.031 2.455 0 1.448 1.054 2.846 1.202 3.046.148.199 2.074 3.167 5.023 4.442.702.303 1.25.484 1.677.619.704.223 1.345.192 1.852.115.565-.086 1.767-.722 2.016-1.417.25-.696.25-1.293.175-1.417-.075-.124-.275-.199-.576-.349z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.55 4.119 1.516 5.86L.078 23.633l5.962-1.565C7.683 23.23 9.757 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.933c-1.923 0-3.804-.518-5.441-1.498l-.391-.232-3.535.927.943-3.444-.255-.406c-1.077-1.717-1.646-3.708-1.646-5.78C1.675 5.405 7.204 0 12 0c5.336 0 9.68 4.344 9.68 9.68 0 5.335-4.344 9.68-9.68 9.68z" />
                  </svg>
                  <a href="https://wa.me/966545888559" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors" dir="ltr">
                    +966 54 588 8559
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span dir="ltr">+966 54 588 8559</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>info@sanamalrub.sa</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t('riyadhAddress')}</span>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="text-lg font-bold text-amber-400 mb-6">{t('paymentMethods')}</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-green-500 font-bold text-sm">mada</span>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm italic">VISA</span>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <div className="flex">
                    <div className="w-4 h-4 bg-red-500 rounded-full -mr-1.5"></div>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full opacity-90"></div>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-white text-xs"> Pay</span>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-white text-xs">G Pay</span>
                </div>
                <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-center">
                  <span className="text-blue-500 text-xs font-bold">PayPal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm">
                © 2026 {t('siteName')} - {t('ownerName')}. {t('allRightsReserved')}
              </p>
              <div className="flex items-center gap-4">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/2560px-Flag_of_Saudi_Arabia.svg.png" 
                  alt="Saudi Arabia" 
                  className="h-6 rounded shadow"
                />
                <span className="text-amber-400 font-bold">{t('ministryPartner')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/966545888559"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 animate-bounce"
        style={{ animationDuration: '3s' }}
        title="Chat with us on WhatsApp"
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.767-.872-2.036-.969-.269-.099-.465-.148-.662.15-.197.297-.767.969-.94 1.169-.173.199-.347.225-.648.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.675-2.083-.175-.3-.019-.461.131-.61.135-.134.301-.35.451-.525.15-.175.2-.299.301-.499.101-.2.05-.375-.025-.525-.075-.15-.662-1.597-.907-2.187-.239-.575-.482-.497-.662-.506-.17-.009-.364-.01-.559-.01-.196 0-.514.074-.783.374-.27.299-1.031 1.007-1.031 2.455 0 1.448 1.054 2.846 1.202 3.046.148.199 2.074 3.167 5.023 4.442.702.303 1.25.484 1.677.619.704.223 1.345.192 1.852.115.565-.086 1.767-.722 2.016-1.417.25-.696.25-1.293.175-1.417-.075-.124-.275-.199-.576-.349z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.55 4.119 1.516 5.86L.078 23.633l5.962-1.565C7.683 23.23 9.757 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.933c-1.923 0-3.804-.518-5.441-1.498l-.391-.232-3.535.927.943-3.444-.255-.406c-1.077-1.717-1.646-3.708-1.646-5.78C1.675 5.405 7.204 0 12 0c5.336 0 9.68 4.344 9.68 9.68 0 5.335-4.344 9.68-9.68 9.68z" />
        </svg>
      </a>

      {/* Modals */}
      {showPayment && selectedItem && <PaymentModal item={selectedItem} onClose={() => setShowPayment(false)} />}
      {showAdmin && <AdminPanel />}

      {/* Animations */}
      <style>{`
        @keyframes slowZoom {
          0% { transform: scale(1.1); }
          100% { transform: scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .rtl {
          direction: rtl;
        }
        .ltr {
          direction: ltr;
        }
      `}</style>
    </div>
  );
}
