import * as Location from 'expo-location';

/**
 * ── Pre-indexed Coordinates for Rapid Proximity Calculation ──────────────────
 * Avoids constant network roundtrips for frequent corporate commute hubs.
 */
const KNOWN_COORDINATES = {
  // Bengaluru Hubs
  'koramangala': { lat: 12.9352, lng: 77.6245 },
  'koramangala 4th block': { lat: 12.9340, lng: 77.6280 },
  'electronic city': { lat: 12.8399, lng: 77.6770 },
  'electronic city phase 1': { lat: 12.8450, lng: 77.6630 },
  'electronic city phase 2': { lat: 12.8380, lng: 77.6850 },
  'hsr layout': { lat: 12.9121, lng: 77.6446 },
  'hsr layout sector 2': { lat: 12.9100, lng: 77.6480 },
  'indiranagar': { lat: 12.9784, lng: 77.6408 },
  'whitefield': { lat: 12.9698, lng: 77.7500 },
  'whitefield itpl': { lat: 12.9860, lng: 77.7380 },
  'itpl': { lat: 12.9860, lng: 77.7380 },
  'bellandur': { lat: 12.9250, lng: 77.6766 },
  'ecospace': { lat: 12.9260, lng: 77.6820 },
  'btm layout': { lat: 12.9166, lng: 77.6101 },
  'silk board': { lat: 12.9176, lng: 77.6238 },
  'marathahalli': { lat: 12.9591, lng: 77.6974 },
  'manyata tech park': { lat: 13.0487, lng: 77.6214 },
  'hebbal': { lat: 13.0358, lng: 77.5970 },
  'jayanagar': { lat: 12.9308, lng: 77.5838 },
  'mg road': { lat: 12.9756, lng: 77.6066 },
  'outer ring road': { lat: 12.9300, lng: 77.6850 },
  'sarjapur road': { lat: 12.9100, lng: 77.6800 },
  'bannerghatta road': { lat: 12.8900, lng: 77.5980 },

  // Ahmedabad & Gandhinagar Hubs (Gujarat IT/Corporate Corridors)
  'sg highway': { lat: 23.0469, lng: 72.5074 },
  'prahlad nagar': { lat: 23.0135, lng: 72.5085 },
  'gift city': { lat: 23.2156, lng: 72.6369 },
  'gift city sez': { lat: 23.2156, lng: 72.6369 },
  'gandhinagar': { lat: 23.2156, lng: 72.6369 },
  'infocity': { lat: 23.1880, lng: 72.6280 },
  'infocity gandhinagar': { lat: 23.1880, lng: 72.6280 },
  'tcs garima park': { lat: 23.1950, lng: 72.6310 },
  'navrangpura': { lat: 23.0373, lng: 72.5528 },
  'bopal': { lat: 23.0338, lng: 72.4634 },
  'vastrapur': { lat: 23.0350, lng: 72.5293 },
  'satellite': { lat: 23.0300, lng: 72.5170 },
  'bodakdev': { lat: 23.0380, lng: 72.5110 },
  'iskcon': { lat: 23.0280, lng: 72.5070 },
  'iskcon cross road': { lat: 23.0280, lng: 72.5070 },
  'sola': { lat: 23.0760, lng: 72.5250 },
  'science city': { lat: 23.0800, lng: 72.5030 },
  'gota': { lat: 23.1020, lng: 72.5400 },
  'vaishno devi circle': { lat: 23.1250, lng: 72.5480 },
  'kudasan': { lat: 23.1750, lng: 72.6320 },
  'sargasan': { lat: 23.1820, lng: 72.6050 },
  'c.g. road': { lat: 23.0330, lng: 72.5590 },
  'cg road': { lat: 23.0330, lng: 72.5590 },
  'maninagar': { lat: 22.9978, lng: 72.6033 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'rajkot': { lat: 22.3039, lng: 70.8022 },
};

// In-memory runtime cache for dynamically geocoded locations
const DYNAMIC_GEOCODE_CACHE = new Map();

/**
 * Calculates Haversine distance in kilometers between two latitude/longitude coordinates.
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null;

  const R = 6371; // Earth radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Resolves coordinates for a location string.
 * First checks preset landmarks, then in-memory cache, then native/Photon geocoding.
 */
export async function resolveCoordinates(place) {
  if (!place) return null;
  if (typeof place === 'object' && place.latitude && place.longitude) {
    return { lat: Number(place.latitude), lng: Number(place.longitude) };
  }
  if (typeof place === 'object' && place.lat && place.lng) {
    return { lat: Number(place.lat), lng: Number(place.lng) };
  }

  const clean = String(place).trim().toLowerCase();
  if (!clean) return null;

  // 1. Check known coordinates table
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }

  // 2. Check dynamic runtime cache
  if (DYNAMIC_GEOCODE_CACHE.has(clean)) {
    return DYNAMIC_GEOCODE_CACHE.get(clean);
  }

  // 3. Fallback to native expo-location geocoder
  try {
    const results = await Location.geocodeAsync(clean);
    if (results && results.length > 0) {
      const resolved = { lat: results[0].latitude, lng: results[0].longitude };
      DYNAMIC_GEOCODE_CACHE.set(clean, resolved);
      return resolved;
    }
  } catch {}

  // 4. Fallback to Photon API
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const data = await res.json();
    const feat = data?.features?.[0];
    if (feat?.geometry?.coordinates) {
      const resolved = { lat: feat.geometry.coordinates[1], lng: feat.geometry.coordinates[0] };
      DYNAMIC_GEOCODE_CACHE.set(clean, resolved);
      return resolved;
    }
  } catch {}

  // Default coordinate (Bengaluru tech corridor center)
  return { lat: 12.9352, lng: 77.6245 };
}

/**
 * Synchronous coordinate lookup from cached dictionary.
 */
export function getFastCoordinates(place) {
  if (!place) return null;
  if (typeof place === 'object') {
    if (place.latitude && place.longitude) return { lat: Number(place.latitude), lng: Number(place.longitude) };
    if (place.lat && place.lng) return { lat: Number(place.lat), lng: Number(place.lng) };
  }

  const clean = String(place).trim().toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  if (DYNAMIC_GEOCODE_CACHE.has(clean)) {
    return DYNAMIC_GEOCODE_CACHE.get(clean);
  }
  return null;
}

/**
 * Detects whether a coordinate or location text belongs to Gujarat region.
 */
export function isGujaratLocation(coords, address, city) {
  if (coords) {
    const lat = Number(coords.latitude ?? coords.lat);
    const lng = Number(coords.longitude ?? coords.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat >= 20.0 && lat <= 24.8 && lng >= 68.0 && lng <= 75.0) {
        return true;
      }
    }
  }

  const text = `${address || ''} ${city || ''}`.toLowerCase();
  return (
    text.includes('ahmedabad') ||
    text.includes('gandhinagar') ||
    text.includes('gujarat') ||
    text.includes('surat') ||
    text.includes('vadodara') ||
    text.includes('rajkot') ||
    text.includes('gift city') ||
    text.includes('sg highway')
  );
}

/**
 * Returns default corporate destination hub based on user's regional GPS location.
 */
export function getDefaultDestinationForLocation(locationInfo) {
  const coords = locationInfo?.coords;
  const address = locationInfo?.address;
  const city = locationInfo?.city;

  if (isGujaratLocation(coords, address, city)) {
    return 'GIFT City, Gandhinagar';
  }
  return 'Electronic City Phase 1';
}

/**
 * Strict Geofence Guard: Filters out rides in other states/cities (> 45 km)
 * and keeps only authentic, real carpool rides matching the user's geographic region.
 */
export function getLocalCandidateRides(allRides, userCoords, locationInfo) {
  if (!Array.isArray(allRides) || allRides.length === 0) {
    return [];
  }

  const userLat = Number(userCoords?.latitude ?? userCoords?.lat);
  const userLng = Number(userCoords?.longitude ?? userCoords?.lng);

  if (isNaN(userLat) || isNaN(userLng)) {
    return allRides;
  }

  // Strict Geofencing: Only keep real rides whose pickup is within 45 km of the user
  const localRides = allRides.filter((ride) => {
    if (!ride || !ride.id) return false;

    const pickupCoords =
      ride.pickupCoords ||
      (ride.pickupLatitude && ride.pickupLongitude
        ? { lat: ride.pickupLatitude, lng: ride.pickupLongitude }
        : getFastCoordinates(ride.pickupLocation));

    if (!pickupCoords) {
      // If coordinates cannot be determined, check if regional flags match
      const isUserGj = isGujaratLocation({ lat: userLat, lng: userLng }, locationInfo?.address, locationInfo?.city);
      const isRideGj = isGujaratLocation(null, ride.pickupLocation, ride.destination);
      return isUserGj === isRideGj;
    }

    const dist = distanceKm(userLat, userLng, pickupCoords.lat, pickupCoords.lng);
    // Discard any distant cross-state rides (e.g. Bangalore to Gujarat is 1500 km)
    return dist != null && dist <= 45;
  });

  return localRides;
}

/**
 * Calculates proximity metrics for a ride relative to a user's pickup point and destination.
 */
export function calculateRideDistance(ride, userCoords) {
  if (!ride || !userCoords) return null;
  const ridePickupCoords =
    ride.pickupCoords ||
    (ride.pickupLatitude && ride.pickupLongitude
      ? { lat: ride.pickupLatitude, lng: ride.pickupLongitude }
      : getFastCoordinates(ride.pickupLocation));

  if (!ridePickupCoords) return null;

  const userLat = userCoords.latitude ?? userCoords.lat;
  const userLng = userCoords.longitude ?? userCoords.lng;

  const d = distanceKm(userLat, userLng, ridePickupCoords.lat, ridePickupCoords.lng);
  return d;
}

/**
 * Evaluates route similarity between user's journey (source -> destination)
 * and an offered carpool ride (pickup -> destination).
 */
export function calculateCorridorMatch(ride, userSource, userDestination, userCoords = null) {
  let sourceCoords = userCoords
    ? { lat: Number(userCoords.latitude ?? userCoords.lat), lng: Number(userCoords.longitude ?? userCoords.lng) }
    : getFastCoordinates(userSource);

  if (!sourceCoords || isNaN(sourceCoords.lat) || isNaN(sourceCoords.lng)) {
    sourceCoords = getFastCoordinates(userSource) || { lat: 23.0225, lng: 72.5714 };
  }

  const destCoords = getFastCoordinates(userDestination) || { lat: 23.2156, lng: 72.6369 };

  const ridePickupCoords =
    ride.pickupCoords ||
    getFastCoordinates(ride.pickupLocation) || sourceCoords;

  const rideDropCoords =
    ride.dropCoords ||
    getFastCoordinates(ride.destination) || destCoords;

  const pickupDist = distanceKm(sourceCoords.lat, sourceCoords.lng, ridePickupCoords.lat, ridePickupCoords.lng) ?? 1.5;
  const dropoffDist = distanceKm(destCoords.lat, destCoords.lng, rideDropCoords.lat, rideDropCoords.lng) ?? 2.0;

  const totalDeviation = Number((pickupDist + dropoffDist).toFixed(1));

  // Compute realistic Match Score based on corridor deviations:
  let matchPercentage = 98;
  if (totalDeviation > 18) {
    matchPercentage = Math.max(65, 80 - Math.round(totalDeviation * 0.5));
  } else if (totalDeviation > 10) {
    matchPercentage = 88;
  } else if (totalDeviation > 5) {
    matchPercentage = 92;
  } else if (totalDeviation > 2) {
    matchPercentage = 95;
  }

  const proximityLabel =
    pickupDist < 1
      ? `${Math.round(pickupDist * 1000)}m away`
      : `${pickupDist.toFixed(1)} km away`;

  return {
    pickupDist,
    dropoffDist,
    totalDeviation,
    matchScore: `${matchPercentage}% Match`,
    proximityLabel,
    isClosePickup: pickupDist <= 3.0,
    isDirectCorridor: totalDeviation <= 6.0,
  };
}

/**
 * Filters and sorts rides by radius and proximity.
 * - `radiusKm`: number in km or 'ALL'
 * - `userCoords`: { lat, lng } or { latitude, longitude }
 */
export function filterAndSortRidesByRadius(rides, userCoords, radiusKm = 'ALL', locationInfo = null) {
  if (!Array.isArray(rides)) return [];

  // 1. Get geographically valid candidate rides for user's region
  const candidateRides = getLocalCandidateRides(rides, userCoords, locationInfo);

  const enriched = candidateRides.map((ride) => {
    const dist = calculateRideDistance(ride, userCoords);
    return {
      ...ride,
      distanceKm: dist,
      distanceLabel: dist != null ? (dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist} km away`) : null,
    };
  });

  // Filter by radius if specified
  const filtered = enriched.filter((ride) => {
    if (radiusKm === 'ALL' || !radiusKm) return true;
    if (ride.distanceKm == null) return true;
    return ride.distanceKm <= Number(radiusKm);
  });

  // Sort ascending: nearest pickup first
  filtered.sort((a, b) => {
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return filtered;
}

/**
 * Recommends rides strictly based on closest source-to-destination corridor match
 * using the user's real GPS position. Excludes cross-state or distant rides.
 */
export function getClosestRecommendedRides(
  rides,
  userCoordsOrSource,
  userDestination,
  locationInfo = null,
  maxCount = 2
) {
  let userCoords = null;
  let userSource = 'Current Location';

  if (userCoordsOrSource && typeof userCoordsOrSource === 'object') {
    userCoords = userCoordsOrSource;
  } else if (locationInfo?.coords) {
    userCoords = locationInfo.coords;
    userSource = userCoordsOrSource || locationInfo.address || locationInfo.area;
  } else {
    userSource = userCoordsOrSource || 'Current Location';
    userCoords = getFastCoordinates(userSource);
  }

  // 1. Strict Local Candidate Resolution (never recommends distant state rides)
  const localCandidates = getLocalCandidateRides(rides, userCoords, locationInfo);

  const evaluated = localCandidates.map((ride) => {
    const match = calculateCorridorMatch(ride, userSource, userDestination, userCoords);
    return {
      ...ride,
      matchScore: match.matchScore,
      corridorMatch: match,
      pickupDist: match.pickupDist,
      totalDeviation: match.totalDeviation,
      distanceKm: match.pickupDist,
      distanceLabel: match.proximityLabel,
    };
  });

  // Sort by lowest corridor deviation (closest source to destination)
  evaluated.sort((a, b) => a.totalDeviation - b.totalDeviation);

  return evaluated.slice(0, maxCount);
}
