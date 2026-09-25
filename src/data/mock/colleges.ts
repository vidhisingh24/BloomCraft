export interface CollegeOption {
  id: string;
  name: string;
  campusArea: string;
  popularDeliveryPoint: string;
}

export const MOCK_COLLEGES: CollegeOption[] = [
  {
    id: 'msu-main',
    name: 'The Maharaja Sayajirao University of Baroda (MSU) - Main Campus',
    campusArea: 'Sayajigunj / Fatehgunj, Vadodara',
    popularDeliveryPoint: 'University Main Gate / Hansa Mehta Library',
  },
  {
    id: 'msu-techo',
    name: 'MSU - Faculty of Technology & Engineering (Kalabhavan)',
    campusArea: 'Dandia Bazar, Vadodara',
    popularDeliveryPoint: 'Kalabhavan Main Gate',
  },
  {
    id: 'msu-finearts',
    name: 'MSU - Faculty of Fine Arts',
    campusArea: 'Sayajigunj, Vadodara',
    popularDeliveryPoint: 'Fine Arts Pavilion / Canteen',
  },
  {
    id: 'msu-commerce',
    name: 'MSU - Faculty of Commerce / Arts (Fatehgunj)',
    campusArea: 'Fatehgunj, Vadodara',
    popularDeliveryPoint: 'Commerce Building Main Entrance',
  },
  {
    id: 'msu-science',
    name: 'MSU - Faculty of Science',
    campusArea: 'Sayajigunj, Vadodara',
    popularDeliveryPoint: 'C.C. Shroff Hall Gate',
  },
  {
    id: 'parul-uni',
    name: 'Parul University',
    campusArea: 'Limda, Waghodia Road, Vadodara',
    popularDeliveryPoint: 'Gate No. 1 / Food Court Plaza',
  },
  {
    id: 'navrachana',
    name: 'Navrachana University (NUV)',
    campusArea: 'Vasna-Bhayli Road, Vadodara',
    popularDeliveryPoint: 'NUV Front Plaza Gate',
  },
  {
    id: 'itm-sls',
    name: 'ITM (SLS) Baroda University',
    campusArea: 'Paldi, Jarod, Vadodara',
    popularDeliveryPoint: 'Main Academic Block Reception',
  },
  {
    id: 'gsfc-uni',
    name: 'GSFC University',
    campusArea: 'Fertilizernagar, Vadodara',
    popularDeliveryPoint: 'Bhavan 1 Gate / Vigyan Bhavan',
  },
  {
    id: 'svit-vasad',
    name: 'SVIT - Sardar Vallabhbhai Patel Institute of Tech',
    campusArea: 'Vasad, Vadodara',
    popularDeliveryPoint: 'SVIT Administrative Porch Gate',
  },
  {
    id: 'sigma-uni',
    name: 'Sigma University',
    campusArea: 'Bakrol, Ajwa Road, Vadodara',
    popularDeliveryPoint: 'Main Campus Gate',
  },
  {
    id: 'bits-edu',
    name: 'BITS Edu Campus (Babaria)',
    campusArea: 'Varnama, Vadodara',
    popularDeliveryPoint: 'Campus Main Entrance Gate',
  },
  {
    id: 'baroda-med',
    name: 'Baroda Medical College',
    campusArea: 'SSG Hospital Compound, Anandpura',
    popularDeliveryPoint: 'College Library Gate',
  },
];
