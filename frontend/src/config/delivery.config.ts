export interface DeliveryMethodConfig {
  id: 'vadodara_local' | 'college' | 'parcel';
  name: string;
  tagline: string;
  badge: string;
  baseChargePaise: number; // in paise
  freeAbovePaise?: number; // in paise
  estimatedDays: string;
}

export const DELIVERY_METHODS: Record<'vadodara_local' | 'college' | 'parcel', DeliveryMethodConfig> = {
  vadodara_local: {
    id: 'vadodara_local',
    name: 'Vadodara Local Handover',
    tagline: 'Meet the maker at a convenient Vadodara spot',
    badge: '📍 Free Pickup',
    baseChargePaise: 0,
    estimatedDays: '1–2 days (flexible slot)',
  },
  college: {
    id: 'college',
    name: 'College Campus Delivery',
    tagline: 'Hand-delivered to your campus gate or department',
    badge: '🏫 Campus Special',
    baseChargePaise: 0,
    estimatedDays: '1–3 days',
  },
  parcel: {
    id: 'parcel',
    name: 'All-India Parcel Courier',
    tagline: 'Standard tracked shipping with sturdy protective packaging',
    badge: '📦 Pan India',
    baseChargePaise: 6000, // ₹60
    freeAbovePaise: 99900, // Free above ₹999
    estimatedDays: 'Dispatch in 2-3 days + 3–7 days transit',
  },
};

export const VADODARA_AREAS: string[] = [
  'Alkapuri',
  'Fatehgunj',
  'Sayajigunj',
  'Manjalpur',
  'Gotri',
  'Karelibaug',
  'Akota',
  'Gorwa',
  'Old Padra Road',
  'Vasna-Bhayli Road',
  'Sama-Savli Road',
  'Waghodia Road',
  'Harni Road',
  'Subhanpura',
  'Nizampura',
  'Makarpura',
  'Ellora Park',
  'Chhani',
];

export const VADODARA_TIME_SLOTS: string[] = [
  'Morning (9:00 AM – 12:00 PM)',
  'Afternoon (1:00 PM – 4:30 PM)',
  'Evening (5:00 PM – 8:30 PM)',
];

export const VADODARA_COLLEGES: string[] = [
  'The Maharaja Sayajirao University of Baroda (MSU) - Main Campus',
  'MSU - Faculty of Technology & Engineering (Kalabhavan)',
  'MSU - Faculty of Fine Arts',
  'MSU - Faculty of Commerce / Arts (Fatehgunj)',
  'MSU - Faculty of Science',
  'Parul University (Limda Campus)',
  'Navrachana University (Bhayli)',
  'ITM (SLS) Baroda University (Paldi)',
  'GSFC University (Fertilizernagar)',
  'SVIT - Sardar Vallabhbhai Patel Institute of Technology (Vasad)',
  'Sigma University (Bakrol)',
  'Babaria Institute of Technology / BITS Edu Campus (Varnama)',
  'Baroda Medical College (Sayaji Hospital)',
  'Other / Not Listed',
];

export const INDIAN_STATES: string[] = [
  'Gujarat',
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Rajasthan',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'West Bengal',
  'Telangana',
  'Kerala',
  'Andhra Pradesh',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Goa',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Chandigarh',
];
