/**
 * Offline mapping of common Gujarat & metro PIN codes for fast checkout auto-fill
 */
export interface PincodeInfo {
  city: string;
  state: string;
  area?: string;
}

export const KNOWN_PINCODES: Record<string, PincodeInfo> = {
  // Vadodara Local Pincodes
  '390001': { city: 'Vadodara', state: 'Gujarat', area: 'Sayajigunj / Mandvi' },
  '390002': { city: 'Vadodara', state: 'Gujarat', area: 'Fatehgunj / Station' },
  '390004': { city: 'Vadodara', state: 'Gujarat', area: 'Karelibaug' },
  '390005': { city: 'Vadodara', state: 'Gujarat', area: 'Gorwa' },
  '390007': { city: 'Vadodara', state: 'Gujarat', area: 'Alkapuri / RC Dutt Rd' },
  '390010': { city: 'Vadodara', state: 'Gujarat', area: 'Makarpura' },
  '390011': { city: 'Vadodara', state: 'Gujarat', area: 'Manjalpur' },
  '390012': { city: 'Vadodara', state: 'Gujarat', area: 'Ellora Park / Subhanpura' },
  '390015': { city: 'Vadodara', state: 'Gujarat', area: 'Vasna Road' },
  '390018': { city: 'Vadodara', state: 'Gujarat', area: 'Kishanwadi / Harni' },
  '390019': { city: 'Vadodara', state: 'Gujarat', area: 'Waghodia Road' },
  '390020': { city: 'Vadodara', state: 'Gujarat', area: 'Akota' },
  '390021': { city: 'Vadodara', state: 'Gujarat', area: 'Gotri' },
  '390022': { city: 'Vadodara', state: 'Gujarat', area: 'Bhayli' },
  '390024': { city: 'Vadodara', state: 'Gujarat', area: 'Sama / Sama-Savli' },

  // Ahmedabad
  '380001': { city: 'Ahmedabad', state: 'Gujarat', area: 'Bhadra / Lal Darwaja' },
  '380006': { city: 'Ahmedabad', state: 'Gujarat', area: 'Ellisbridge / Paldi' },
  '380009': { city: 'Ahmedabad', state: 'Gujarat', area: 'Navrangpura' },
  '380015': { city: 'Ahmedabad', state: 'Gujarat', area: 'Satellite / Vastrapur' },
  '380054': { city: 'Ahmedabad', state: 'Gujarat', area: 'Bodakdev / SG Highway' },

  // Surat
  '395001': { city: 'Surat', state: 'Gujarat', area: 'Chowk Bazar' },
  '395007': { city: 'Surat', state: 'Gujarat', area: 'Vesu / Dumas Rd' },
  '395009': { city: 'Surat', state: 'Gujarat', area: 'Adajan / Pal' },

  // Rajkot
  '360001': { city: 'Rajkot', state: 'Gujarat', area: 'Dharmendrasinhji Rd' },
  '360005': { city: 'Rajkot', state: 'Gujarat', area: 'Kalawad Road / University' },

  // Mumbai
  '400001': { city: 'Mumbai', state: 'Maharashtra', area: 'Fort / Nariman Point' },
  '400050': { city: 'Mumbai', state: 'Maharashtra', area: 'Bandra West' },
  '400053': { city: 'Mumbai', state: 'Maharashtra', area: 'Andheri West' },

  // Pune
  '411001': { city: 'Pune', state: 'Maharashtra', area: 'Camp / Station' },
  '411004': { city: 'Pune', state: 'Maharashtra', area: 'Deccan Gymkhana' },

  // Delhi
  '110001': { city: 'New Delhi', state: 'Delhi', area: 'Connaught Place' },
  '110016': { city: 'New Delhi', state: 'Delhi', area: 'Hauz Khas' },

  // Bengaluru
  '560001': { city: 'Bengaluru', state: 'Karnataka', area: 'MG Road' },
  '560034': { city: 'Bengaluru', state: 'Karnataka', area: 'Koramangala' },
  '560038': { city: 'Bengaluru', state: 'Karnataka', area: 'Indiranagar' },
};

export function lookupPincode(pincode: string): PincodeInfo | null {
  const clean = pincode.replace(/\s+/g, '');
  return KNOWN_PINCODES[clean] || null;
}
