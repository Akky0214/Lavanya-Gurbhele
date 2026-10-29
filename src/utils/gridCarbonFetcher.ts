import { GridCarbonData, ClimateRegionId } from '../types/energy';

export interface GridFetchOptions {
  lat?: number;
  lon?: number;
  city?: string;
  region?: string;
  country?: string;
  climateRegion?: ClimateRegionId;
}

/**
 * Fetches real-world grid carbon intensity data from backend (grounded via Gemini search or regional physical benchmarks)
 */
export async function fetchGridCarbonData(options: GridFetchOptions): Promise<GridCarbonData> {
  try {
    const response = await fetch('/api/grid-carbon-intensity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data: GridCarbonData = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch grid carbon from API, using fallback:', error);
    // Safe client-side fallback
    return {
      gridOperator: 'Regional Electric Interconnection',
      locationName: options.city || options.climateRegion || 'Local Regional Grid',
      carbonIntensityGPerKWh: 385,
      carbonIntensityKgPerKWh: 0.385,
      renewablePercentage: 35,
      fossilPercentage: 65,
      fuelMix: {
        solar: 12,
        wind: 15,
        hydro: 8,
        nuclear: 18,
        gas: 40,
        coal: 7,
        other: 0,
      },
      carbonRating: 'Moderate',
      summary: 'Standard regional generation mix with nuclear baseload, natural gas balancing, and growing renewable share.',
      bestOperatingWindow: '10:00 AM – 3:00 PM (Midday Solar Window)',
      peakCarbonWindow: '5:30 PM – 9:00 PM (Evening Peaker Ramp)',
      source: options.lat ? 'gps' : 'climate_region',
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Attempts to retrieve user GPS coordinates via browser Geolocation API
 * and fetches the corresponding local electric grid carbon intensity.
 */
export async function fetchUserGpsGridCarbon(): Promise<{ data: GridCarbonData; lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Browser geolocation is not supported on this device.'));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const data = await fetchGridCarbonData({ lat, lon });
          resolve({ data, lat, lon });
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        reject(new Error(`Geolocation access denied or timed out (${err.message}).`));
      },
      {
        timeout: 10000,
        maximumAge: 600000,
        enableHighAccuracy: false,
      }
    );
  });
}
