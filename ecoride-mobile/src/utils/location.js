import * as Location from 'expo-location';

export async function getCurrentUserAddress() {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const res = await Location.requestForegroundPermissionsAsync();
      status = res.status;
    }
    if (status !== 'granted') {
      return null;
    }

    // 1. Try fast last-known position first (instant)
    let pos = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
    
    // 2. If no cached position, fetch fresh GPS fix
    if (!pos?.coords) {
      pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }

    if (pos?.coords) {
      const { latitude, longitude } = pos.coords;

      // Try Nominatim reverse geocode first for rich neighborhood/suburb accuracy
      try {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const osmRes = await fetch(osmUrl, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
        const osmData = await osmRes.json();
        const addr = osmData.address || {};
        const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.county || '';
        const city = addr.city || addr.town || addr.state_district || addr.state || '';
        if (locality || city) {
          const area = locality || city || 'Current Location';
          const formatted = locality && city && locality !== city ? `${locality}, ${city}` : (locality || city);
          return {
            address: formatted,
            area,
            city: city || 'Ahmedabad',
            coords: { latitude, longitude },
          };
        }
      } catch {}

      // Fallback: expo-location reverse geocoding with numeric filter
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const isNumeric = item.name && /^\d+$/.test(item.name.trim());
        const validName = isNumeric ? null : item.name;
        const locality = item.street || item.subregion || item.district || validName || '';
        const city = item.city || item.subregion || item.region || '';
        const area = locality || city || 'My Location';
        const address = locality && city && locality !== city ? `${locality}, ${city}` : (locality || city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        return {
          address,
          area,
          city: city || 'Ahmedabad',
          coords: { latitude, longitude },
        };
      }

      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        area: 'Current Location',
        city: 'Ahmedabad',
        coords: { latitude, longitude },
      };
    }
  } catch (err) {
    console.warn('Location detection failed:', err);
  }

  return null;
}
