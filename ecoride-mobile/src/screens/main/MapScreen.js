/**
 * MapScreen.js — MapLibre + OpenFreeMap (Corporate carpooling GPS tracking)
 *
 * Stack:
 *  MapLibre React Native v10     — native vector map renderer
 *  OpenFreeMap                   — free tile server, no API key, no limits
 *  OSRM public API               — free driving route engine
 *  Nominatim                     — free geocoding (place → lat/lng)
 *  expo-location                 — real GPS tracking
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  MapView,
  Camera,
  UserLocation,
  UserLocationRenderMode,
  ShapeSource,
  LineLayer,
  PointAnnotation,
  requestAndroidLocationPermissions,
} from '@maplibre/maplibre-react-native';
import { rideApi } from '../../api/rideApi';
import { resolveCoordinates } from '../../utils/proximityService';
import { colors } from '../../utils/theme';

// ── OpenFreeMap — 100% free, no API key ──────────────────────────────────────
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ── Helper: Haversine distance in KM ───────────────────────────────────────────
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Helper: Geodesic route arc interpolation fallback ─────────────────────────
function generateArcCoordinates(start, end, numPoints = 25) {
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start.lng + (end.lng - start.lng) * t;
    const lat = start.lat + (end.lat - start.lat) * t;
    const curveOffset = Math.sin(t * Math.PI) * 0.003;
    coords.push([lng + curveOffset, lat + curveOffset * 0.6]);
  }
  return coords;
}

// ── Multi-Tier Dynamic Geocoding Engine ───────────────────────────────────────
// Tier 1: Native Android Google Play Services Geocoder (fastest, offline-capable)
// Tier 2: Photon API (fuzzy OSM search with geographic bias)
// Tier 3: Nominatim (city-scoped search)
// Tier 4: Nominatim (viewbox-bounded search)
// Tier 5: Nominatim (broad nationwide search)
// Tier 6: Token simplification fallback
async function geocode(place, baseCoords = { lat: 23.0225, lng: 72.5714 }, baseCity = 'Ahmedabad') {
  const trimmed = (place || '').trim();
  if (!trimmed) throw new Error('Location cannot be empty');

  const hasCity = /(bangalore|bengaluru|delhi|mumbai|chennai|hyderabad|pune|kolkata|ahmedabad|noida|gurgaon|gandhinagar)/i.test(trimmed);

  // 1. Native device geocoder (Google Play Services on Android)
  try {
    const directResults = await Location.geocodeAsync(trimmed);
    if (directResults && directResults.length > 0) {
      return { lat: directResults[0].latitude, lng: directResults[0].longitude };
    }
  } catch {}

  // 1b. Native geocoder with city appended
  if (!hasCity && baseCity) {
    try {
      const cityResults = await Location.geocodeAsync(`${trimmed}, ${baseCity}`);
      if (cityResults && cityResults.length > 0) {
        return { lat: cityResults[0].latitude, lng: cityResults[0].longitude };
      }
    } catch {}
  }

  // 2. Photon API with coordinate proximity bias
  try {
    const photonQuery = !hasCity && baseCity ? `${trimmed} ${baseCity}` : trimmed;
    const pUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&lat=${baseCoords.lat}&lon=${baseCoords.lng}&limit=6`;
    const pRes = await fetch(pUrl, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const pData = await pRes.json();
    const features = pData?.features || [];
    if (features.length > 0) {
      const candidates = features
        .map((f) => {
          const [lng, lat] = f.geometry?.coordinates || [0, 0];
          const dist = distanceKm(baseCoords.lat, baseCoords.lng, lat, lng);
          const isIndia = !f.properties?.countrycode || f.properties.countrycode.toUpperCase() === 'IN';
          return { lat, lng, dist, isIndia };
        })
        .filter((c) => c.isIndia || c.dist < 800);

      if (candidates.length > 0) {
        candidates.sort((a, b) => a.dist - b.dist);
        return { lat: candidates[0].lat, lng: candidates[0].lng };
      }
    }
  } catch {}

  // 3. Nominatim with baseCity appended
  if (!hasCity && baseCity) {
    try {
      const localQuery = `${trimmed}, ${baseCity}`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(localQuery)}&format=json&limit=1&countrycodes=in`;
      const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
      const json = await res.json();
      if (json && json.length > 0) {
        return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
      }
    } catch {}
  }

  // 4. Nominatim with viewbox bias around baseCoords
  try {
    const d = 0.5;
    const viewbox = `${baseCoords.lng - d},${baseCoords.lat + d},${baseCoords.lng + d},${baseCoords.lat - d}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=in&viewbox=${viewbox}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const json = await res.json();
    if (json && json.length > 0) {
      return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    }
  } catch {}

  // 5. Nominatim broad nationwide search
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const json = await res.json();
    if (json && json.length > 0) {
      return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    }
  } catch {}

  // 6. Token simplification fallback (first 2 words)
  const words = trimmed.split(/[\s,]+/).filter((w) => w.length > 2);
  if (words.length > 2) {
    const simplified = words.slice(0, 2).join(' ');
    try {
      const fallbackUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(simplified + ' ' + baseCity)}&lat=${baseCoords.lat}&lon=${baseCoords.lng}&limit=3`;
      const res = await fetch(fallbackUrl, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
      const data = await res.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        return { lat, lng };
      }
    } catch {}
  }

  throw new Error(`Location "${trimmed}" could not be found. Try entering a nearby landmark or city name.`);
}

// ── Dynamic Autocomplete Suggestions Engine ──────────────────────────────────
async function fetchDynamicSuggestions(query, baseCoords = { lat: 23.0225, lng: 72.5714 }, baseCity = 'Ahmedabad') {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  const hasCity = /(bangalore|bengaluru|delhi|mumbai|chennai|hyderabad|pune|kolkata|ahmedabad|noida|gurgaon|gandhinagar)/i.test(trimmed);

  // 1. Photon fast autocomplete with proximity bias
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=${baseCoords.lat}&lon=${baseCoords.lng}&limit=8`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const data = await res.json();
    const features = data?.features || [];

    if (features.length > 0) {
      const mapped = features
        .map((f, idx) => {
          const p = f.properties || {};
          const [lng, lat] = f.geometry?.coordinates || [0, 0];
          const dist = distanceKm(baseCoords.lat, baseCoords.lng, lat, lng);
          const isIndia = !p.countrycode || p.countrycode.toUpperCase() === 'IN';
          const subParts = [p.district, p.locality, p.suburb, p.city, p.state].filter(Boolean);
          const uniqueSub = [...new Set(subParts)].join(', ');

          return {
            id: `${lat.toFixed(5)}_${lng.toFixed(5)}_${idx}`,
            title: p.name || p.street || trimmed,
            subtitle: uniqueSub || p.country || '',
            coords: { lat, lng },
            dist,
            isIndia,
          };
        })
        .filter((item) => item.isIndia || item.dist < 800)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);

      if (mapped.length > 0) return mapped;
    }
  } catch {}

  // 2. Nominatim fallback
  try {
    const nomQuery = !hasCity && baseCity ? `${trimmed}, ${baseCity}` : trimmed;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nomQuery)}&format=json&limit=5&countrycodes=in`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const json = await res.json();
    if (json && json.length > 0) {
      return json.slice(0, 5).map((item, idx) => {
        const parts = (item.display_name || '').split(',');
        const title = parts[0] || trimmed;
        const subtitle = parts.slice(1, 4).join(',').trim();
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        return {
          id: `nom_${item.place_id || idx}`,
          title,
          subtitle,
          coords: { lat, lng },
          dist: distanceKm(baseCoords.lat, baseCoords.lng, lat, lng),
          isIndia: true,
        };
      });
    }
  } catch {}

  return [];
}

// ── Resilient Routing Engine (OSRM Primary + OpenStreetMap Mirror + Geodesic Fallback) ──
async function getRoute(from, to) {
  // 1. Primary OSRM public server
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
      const r = json.routes[0];
      return {
        geojson: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: r.geometry,
          }],
        },
        distance: (r.distance / 1000).toFixed(1),
        duration: Math.round(r.duration / 60),
      };
    }
  } catch {}

  // 2. Secondary OSRM mirror
  try {
    const mirrorUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const mRes = await fetch(mirrorUrl);
    const mJson = await mRes.json();
    if (mJson.code === 'Ok' && mJson.routes && mJson.routes.length > 0) {
      const r = mJson.routes[0];
      return {
        geojson: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: r.geometry,
          }],
        },
        distance: (r.distance / 1000).toFixed(1),
        duration: Math.round(r.duration / 60),
      };
    }
  } catch {}

  // 3. Fallback: Resilient geodesic interpolation
  const dist = distanceKm(from.lat, from.lng, to.lat, to.lng);
  const drivingDist = (dist * 1.25).toFixed(1);
  const estMinutes = Math.max(5, Math.round((drivingDist / 32) * 60));

  return {
    geojson: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: generateArcCoordinates(from, to),
        },
      }],
    },
    distance: drivingDist,
    duration: estMinutes,
  };
}

// ── Accurate Reverse Geocode with locality/suburb extraction ────────────────
async function resolveLocationDetails(latitude, longitude) {
  // 1. Try Nominatim reverse for accurate suburb/neighbourhood (e.g. Isanpur, Ahmedabad)
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const data = await res.json();
    const addr = data?.address || {};
    const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.county || '';
    const city = addr.city || addr.town || addr.state_district || addr.state || '';
    if (locality || city) {
      const area = locality || city;
      const full = locality && city && locality !== city ? `${locality}, ${city}` : locality || city;
      return { area, city: city || 'Ahmedabad', fullAddress: full };
    }
  } catch {}

  // 2. Fallback: expo-location reverse geocode with numeric filtering (ignores "21")
  try {
    const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (rev && rev.length > 0) {
      const a = rev[0];
      const isNum = a.name && /^\d+$/.test(a.name.trim());
      const validName = isNum ? null : a.name;
      const locality = a.street || a.subregion || a.district || validName || '';
      const city = a.city || a.subregion || a.region || '';
      const area = locality || city || 'Current Location';
      const full = locality && city && locality !== city ? `${locality}, ${city}` : locality || city;
      return { area, city: city || 'Ahmedabad', fullAddress: full };
    }
  } catch {}

  return { area: 'Current Location', city: 'Ahmedabad', fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapScreen({ route, navigation }) {
  const cameraRef = useRef(null);

  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeInfo,    setRouteInfo]    = useState(null);
  const [fromPin,      setFromPin]      = useState(null);   // { lat, lng }
  const [toPin,        setToPin]        = useState(null);

  const [loading,    setLoading]    = useState(false);
  const [locGranted, setLocGranted] = useState(false);
  const [liveLocationName, setLiveLocationName] = useState('CURRENT GPS');
  const [userCity,         setUserCity]         = useState('Ahmedabad');
  const [userCoords,       setUserCoords]       = useState(null); // { lat, lng }
  const [isFromCurrentLoc, setIsFromCurrentLoc] = useState(true);

  // Dynamic Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'from' | 'to' | null
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimerRef = useRef(null);

  // Available real ride pins
  const [rideMarkers, setRideMarkers] = useState([]);

  // Default center
  const [centerCoord, setCenterCoord] = useState([72.5714, 23.0225]); // [lng, lat] (Ahmedabad / user city)

  // ── Request location & reverse geocode live position ────────────────────────
  useEffect(() => {
    (async () => {
      let granted = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === 'granted';
        if (Platform.OS === 'android') {
          await requestAndroidLocationPermissions().catch(() => {});
        }
      } catch {
        granted = false;
      }
      setLocGranted(granted);

      if (granted) {
        try {
          // 1. Fast check: last known position (instantaneous)
          let loc = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
          if (!loc?.coords) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }

          if (loc?.coords) {
            const { latitude, longitude } = loc.coords;
            setUserCoords({ lat: latitude, lng: longitude });
            setCenterCoord([longitude, latitude]);
            setIsFromCurrentLoc(true);

            cameraRef.current?.setCamera({
              centerCoordinate: [longitude, latitude],
              zoomLevel: 14,
              animationDuration: 600,
            });

            const resolved = await resolveLocationDetails(latitude, longitude);
            setLiveLocationName(resolved.area);
            setUserCity(resolved.city);
            if (!from) {
              setFrom(resolved.fullAddress);
            }
          }
        } catch (err) {
          console.warn('Live map GPS reverse geocode error:', err);
        }
      }
    })();
  }, []);

  // ── Load Real Active Rides for Map Pins ──────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const allRides = await rideApi.all();
        if (!isMounted || !Array.isArray(allRides)) return;
        const markers = [];
        for (const r of allRides.slice(0, 15)) {
          let coords = r.pickupCoords;
          if ((!coords || !coords.lat) && r.pickupLocation) {
            coords = await resolveCoordinates(r.pickupLocation);
          }
          if (coords?.lat && coords?.lng) {
            markers.push({
              id: `ride-${r.id}`,
              title: `${r.pickupLocation} → ${r.destination}`,
              latitude: Number(coords.lat),
              longitude: Number(coords.lng),
              ride: r,
            });
          }
        }
        if (isMounted) setRideMarkers(markers);
      } catch (err) {
        console.warn('Could not load map ride markers:', err);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // ── Auto-route if navigated with parameters (from Search or RideDetails) ────
  useEffect(() => {
    if (route?.params?.pickup || route?.params?.destination) {
      const p = route.params.pickup;
      const d = route.params.destination;
      if (p) {
        setFrom(p);
        setIsFromCurrentLoc(false);
      }
      if (d) {
        setTo(d);
      }
      if (p && d) {
        const timer = setTimeout(() => {
          findRoute(d, null, null, p);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [route?.params]);

  // ── Autocomplete search handler ─────────────────────────────────────────────
  const handleSearchTextChange = (text, field) => {
    setActiveSearchField(field);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      const baseCoordsObj = userCoords || { lat: centerCoord[1], lng: centerCoord[0] };
      const results = await fetchDynamicSuggestions(text, baseCoordsObj, userCity);
      setSuggestions(results);
      setLoadingSuggestions(false);
    }, 280);
  };

  const handleSelectSuggestion = (item) => {
    Keyboard.dismiss();
    setSuggestions([]);

    if (activeSearchField === 'from') {
      setFrom(item.title);
      setFromPin(item.coords);
      setIsFromCurrentLoc(false);
      setActiveSearchField(null);

      // If destination already entered, auto-route!
      if (to.trim()) {
        findRoute(to, item.coords, null);
      } else {
        cameraRef.current?.setCamera({
          centerCoordinate: [item.coords.lng, item.coords.lat],
          zoomLevel: 14,
          animationDuration: 600,
        });
      }
    } else {
      setTo(item.title);
      setToPin(item.coords);
      setActiveSearchField(null);

      // Route to selected destination
      findRoute(item.title, null, item.coords);
    }
  };

  // ── Tap-on-Map to set Destination ───────────────────────────────────────────
  const handleMapPress = async (feature) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setActiveSearchField(null);

    const coords = feature?.geometry?.coordinates;
    if (!coords || coords.length < 2) return;
    const [lng, lat] = coords;

    const destCoord = { lat, lng };
    setToPin(destCoord);

    // Reverse geocode tapped position
    try {
      const resolved = await resolveLocationDetails(lat, lng);
      const destName = resolved.area || resolved.fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setTo(destName);

      const baseFrom = (from || liveLocationName || '').trim();
      if (baseFrom) {
        findRoute(destName, null, destCoord);
      }
    } catch {
      setTo(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // ── Find route (Dynamic resolving) ──────────────────────────────────────────
  async function findRoute(destOverride, fromCoordOverride, toCoordOverride, fromTextOverride) {
    const targetTo = (typeof destOverride === 'string' ? destOverride : to).trim();
    const targetFrom = (fromTextOverride || from || liveLocationName || '').trim();

    if (!targetFrom || !targetTo) {
      Alert.alert('Missing Location', 'Please enter both pickup and destination locations.');
      return;
    }
    Keyboard.dismiss();
    setSuggestions([]);
    setActiveSearchField(null);
    setLoading(true);
    setRouteGeoJSON(null);
    setRouteInfo(null);

    try {
      const baseCoordsObj = userCoords || { lat: centerCoord[1], lng: centerCoord[0] };

      // Resolve From Coordinate
      let fromCoord = fromCoordOverride;
      if (!fromCoord) {
        if (isFromCurrentLoc && userCoords && !fromTextOverride) {
          fromCoord = userCoords;
        } else {
          fromCoord = await geocode(targetFrom, baseCoordsObj, userCity);
        }
      }

      // Resolve To Coordinate
      let toCoord = toCoordOverride;
      if (!toCoord) {
        toCoord = await geocode(targetTo, baseCoordsObj, userCity);
      }

      const route = await getRoute(fromCoord, toCoord);

      setFromPin(fromCoord);
      setToPin(toCoord);
      setRouteGeoJSON(route.geojson);
      setRouteInfo({ distance: route.distance, duration: route.duration });

      // Fly to fit route bounds (ne: [maxLng, maxLat], sw: [minLng, minLat])
      const coords = route.geojson.features[0].geometry.coordinates;
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      cameraRef.current?.fitBounds(
        [Math.max(...lngs), Math.max(...lats)],
        [Math.min(...lngs), Math.min(...lats)],
        70, // padding px
        800 // animation ms
      );
    } catch (err) {
      Alert.alert('Route Search Error', err.message || 'Could not find a route between the specified locations.');
    } finally {
      setLoading(false);
    }
  }

  function clearRoute() {
    setRouteGeoJSON(null);
    setRouteInfo(null);
    setFromPin(null);
    setToPin(null);
    setTo('');
    setSuggestions([]);
    setActiveSearchField(null);
  }

  async function centreOnMe() {
    try {
      let loc = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
      if (!loc?.coords) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      if (loc?.coords) {
        const { latitude, longitude } = loc.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setCenterCoord([longitude, latitude]);
        setIsFromCurrentLoc(true);

        cameraRef.current?.setCamera({
          centerCoordinate: [longitude, latitude],
          zoomLevel: 15,
          animationDuration: 800,
          animationMode: 'flyTo',
        });

        const resolved = await resolveLocationDetails(latitude, longitude);
        setLiveLocationName(resolved.area);
        setUserCity(resolved.city);
        setFrom(resolved.fullAddress);
      } else {
        cameraRef.current?.setCamera({
          zoomLevel: 15,
          animationDuration: 800,
          animationMode: 'flyTo',
        });
      }
    } catch (err) {
      console.log('Could not reverse geocode user location', err);
    }
  }

  const getCorridorChips = () => {
    const c = (userCity || '').toLowerCase();
    if (c.includes('ahmedabad')) {
      return ['Gota', 'SG Highway', 'Prahlad Nagar', 'Bopal', 'Airport'];
    }
    if (c.includes('delhi') || c.includes('noida') || c.includes('gurgaon')) {
      return ['Cyber City', 'Connaught Place', 'Noida Sec 62', 'Airport'];
    }
    return ['Electronic City', 'Whitefield', 'Tech Park', 'Airport'];
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── MapLibre vector map — full screen ── */}
      <MapView
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled
        compassEnabled
        attributionPosition={{ bottom: 8, right: 8 }}
        onPress={handleMapPress}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={centerCoord}
          animationMode="flyTo"
          animationDuration={800}
          followUserLocation={false}
        />

        {/* Live user dot */}
        {locGranted && (
          <UserLocation
            visible
            renderMode={UserLocationRenderMode.Normal}
            showsUserHeadingIndicator
          />
        )}

        {/* Route polyline */}
        {routeGeoJSON && (
          <ShapeSource id="routeSource" shape={routeGeoJSON}>
            {/* Glowing halo */}
            <LineLayer
              id="routeHalo"
              style={{
                lineColor: '#734427',
                lineWidth: 10,
                lineOpacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main line */}
            <LineLayer
              id="routeLine"
              style={{
                lineColor: colors.brown,
                lineWidth: 5,
                lineOpacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {/* From pin */}
        {fromPin && (
          <PointAnnotation
            id="fromPin"
            coordinate={[fromPin.lng, fromPin.lat]}
            title="From"
          >
            <View style={[styles.pin, { backgroundColor: colors.brown }]}>
              <Ionicons name="location" size={14} color="#fff" />
            </View>
          </PointAnnotation>
        )}

        {/* To pin */}
        {toPin && (
          <PointAnnotation
            id="toPin"
            coordinate={[toPin.lng, toPin.lat]}
            title="To"
          >
            <View style={[styles.pin, { backgroundColor: colors.amber }]}>
              <Ionicons name="flag" size={14} color="#fff" />
            </View>
          </PointAnnotation>
        )}

        {/* Real active ride markers on map */}
        {rideMarkers.map(m => (
          <PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.longitude, m.latitude]}
            title={m.title}
            onSelected={() => {
              if (m.ride?.pickupLocation) setFrom(m.ride.pickupLocation);
              if (m.ride?.destination) setTo(m.ride.destination);
              if (m.ride?.pickupLocation && m.ride?.destination) {
                findRoute(m.ride.destination, null, null, m.ride.pickupLocation);
              }
            }}
          >
            <View style={[styles.ridePin, { backgroundColor: colors.green }]}>
              <Ionicons name="car" size={13} color="#fff" />
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {/* ── Top search panel ── */}
      <SafeAreaView style={styles.safeTop} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          {navigation?.canGoBack?.() ? (
            <TouchableOpacity
              style={styles.backFab}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
          <View style={{ flex: 1 }}>
            <View style={styles.searchCard}>
              {/* From */}
              <View style={styles.inputRow}>
                <View style={[styles.inputDot, { backgroundColor: colors.brown }]} />
                <TextInput
                  style={styles.input}
                  value={from}
                  onChangeText={(text) => {
                    setFrom(text);
                    setIsFromCurrentLoc(false);
                    handleSearchTextChange(text, 'from');
                  }}
                  onFocus={() => {
                    setActiveSearchField('from');
                    if (from.length >= 2) handleSearchTextChange(from, 'from');
                  }}
                  placeholder="Pickup — current GPS location"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  onSubmitEditing={() => findRoute()}
                />
                <TouchableOpacity
                  style={styles.currentLocPill}
                  onPress={centreOnMe}
                  activeOpacity={0.7}
                >
                  <Ionicons name="locate" size={12} color={colors.brown} />
                  <Text style={styles.currentLocPillText}>Current</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputDivider} />

              {/* To (always visible for easy navigation) */}
              <View style={styles.inputRow}>
                <View style={[styles.inputDot, { backgroundColor: colors.amber }]} />
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={(text) => {
                    setTo(text);
                    handleSearchTextChange(text, 'to');
                  }}
                  onFocus={() => {
                    setActiveSearchField('to');
                    if (to.length >= 2) handleSearchTextChange(to, 'to');
                  }}
                  placeholder="To — dynamic place, landmark, or address"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  onSubmitEditing={() => findRoute()}
                />
                {to.length > 0 && (
                  <TouchableOpacity onPress={clearRoute} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Destination Quick Chips (dynamic per user's city) */}
              <View style={styles.chipRow}>
                {getCorridorChips().map(chip => (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.quickChip, to === chip && styles.quickChipActive]}
                    onPress={() => {
                      setTo(chip);
                      findRoute(chip);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, to === chip && styles.quickChipTextActive]}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CTA button */}
              <TouchableOpacity
                style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
                onPress={() => findRoute()}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                }
                <Text style={styles.ctaText}>
                  {loading ? 'Finding route…' : 'Get Route & ETA'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Dynamic Autocomplete Suggestions Dropdown */}
            {activeSearchField && (suggestions.length > 0 || loadingSuggestions) && (
              <View style={styles.suggestionsCard}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsHeaderText}>
                    {activeSearchField === 'from' ? 'PICKUP SUGGESTIONS' : 'DESTINATION SUGGESTIONS'}
                  </Text>
                  {loadingSuggestions ? (
                    <ActivityIndicator size="small" color={colors.brown} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setSuggestions([]);
                        setActiveSearchField(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.suggestionsList}
                  nestedScrollEnabled
                >
                  {suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionIconWrap}>
                        <Ionicons
                          name={activeSearchField === 'from' ? 'location-outline' : 'flag-outline'}
                          size={15}
                          color={activeSearchField === 'from' ? colors.brown : colors.amber}
                        />
                      </View>
                      <View style={styles.suggestionTextWrap}>
                        <Text style={styles.suggestionTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                      {item.dist != null ? (
                        <Text style={styles.suggestionDist}>
                          {item.dist < 1 ? `${Math.round(item.dist * 1000)}m` : `${item.dist.toFixed(1)}km`}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* ── Tap-on-map hint pill ── */}
      {!routeInfo && !activeSearchField && (
        <View style={styles.mapTapHint} pointerEvents="none">
          <Ionicons name="finger-print-outline" size={14} color={colors.brown} />
          <Text style={styles.mapTapHintText}>Tap anywhere on map to set destination</Text>
        </View>
      )}

      {/* ── Live Trip Bottom Sheet HUD (Req 14) ── */}
      {routeInfo && (
        <View style={styles.liveTripHud}>
          <View style={styles.hudTopRow}>
            <View style={styles.hudBadgeWrap}>
              <View style={styles.hudPulseDot} />
              <Text style={styles.hudBadgeText}>IN TRANSIT</Text>
            </View>
            <View style={styles.hudMetrics}>
              <View style={styles.hudPill}>
                <Ionicons name="time" size={13} color={colors.brown} />
                <Text style={styles.hudMetricText}>{routeInfo.duration} min ETA</Text>
              </View>
              <View style={styles.hudPill}>
                <Ionicons name="navigate" size={13} color={colors.blue} />
                <Text style={styles.hudMetricText}>{routeInfo.distance} km</Text>
              </View>
            </View>
          </View>

          <View style={styles.hudRouteRow}>
            <Text style={styles.hudRouteFrom} numberOfLines={1}>{from}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.muted} />
            <Text style={styles.hudRouteTo} numberOfLines={1}>{to}</Text>
          </View>

          {/* Action CTAs (Req 14: Contact Driver, Share Trip, Emergency) */}
          <View style={styles.hudActions}>
            <TouchableOpacity
              style={styles.hudBtnGhost}
              onPress={() => navigation?.getParent?.()?.navigate('Chat', { tripId: 'trip-001' })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.text} />
              <Text style={styles.hudBtnGhostText}>Contact Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hudBtnEmergency}
              onPress={() => {
                Alert.alert(
                  'Emergency & Corporate Safety',
                  'EcoRide 24x7 Safety Response line: 1800-ECO-HELP.\nYour live GPS telemetry is shared with corporate security.',
                  [{ text: 'Dismiss', style: 'cancel' }]
                );
              }}
            >
              <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
              <Text style={styles.hudBtnEmergencyText}>SOS / Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hudBtnPrimary}
              onPress={() => navigation?.navigate('Trips')}
            >
              <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
              <Text style={styles.hudBtnPrimaryText}>Trip Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── FABs ── */}
      <View style={[styles.fabs, routeInfo && { bottom: 180 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.fab} onPress={centreOnMe} activeOpacity={0.85}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
        {routeInfo && (
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red }]} onPress={clearRoute} activeOpacity={0.85}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Live GPS badge with dynamic user location (Req) ── */}
      {locGranted && (
        <View style={styles.liveBadge} pointerEvents="none">
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE GPS · {liveLocationName.toUpperCase()}</Text>
        </View>
      )}

      {/* ── Legend ── */}
      {!routeInfo && (
        <View style={styles.legend} pointerEvents="none">
          {[
            { c: colors.brown, l: 'Pickup' },
            { c: colors.amber, l: 'Drop' },
            { c: colors.blue,  l: 'Your ride' },
            { c: '#06B6D4',    l: 'You' },
          ].map(({ c, l }) => (
            <View key={l} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c }]} />
              <Text style={styles.legendLabel}>{l}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const SB_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E2E8F0' },

  // pins
  pin: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 5,
  },
  ridePin: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 4,
  },

  // search panel
  safeTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: SB_H + 10, paddingHorizontal: 14,
  },
  backFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    gap: 6,
    elevation: 10,
    shadowColor: '#0F172A', shadowOpacity: 0.12, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1, borderColor: colors.line,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  input: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 0 },
  inputDivider: { height: 1, backgroundColor: colors.line, marginLeft: 20 },
  currentLocPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brownLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentLocPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brownText,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 4,
  },
  quickChip: {
    backgroundColor: colors.panelSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickChipActive: {
    backgroundColor: colors.brownLight,
    borderColor: colors.brown,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.brownText,
    fontWeight: '700',
  },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.brown, borderRadius: 10, paddingVertical: 12, marginTop: 2,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  // Live Trip HUD (Req 14)
  liveTripHud: {
    position: 'absolute', bottom: 20, left: 14, right: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: colors.line,
    padding: 16, gap: 10,
    elevation: 12, shadowColor: '#0F172A', shadowOpacity: 0.15,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  hudTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  hudBadgeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brownLight, borderColor: colors.brownBorder,
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  hudPulseDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brown,
  },
  hudBadgeText: {
    fontSize: 10, fontWeight: '800', color: colors.brownText, letterSpacing: 0.5,
  },
  hudMetrics: {
    flexDirection: 'row', gap: 8,
  },
  hudPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.panelSoft, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  hudMetricText: {
    fontSize: 12, fontWeight: '700', color: colors.text,
  },
  hudRouteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.panelSoft, padding: 8, borderRadius: 8,
  },
  hudRouteFrom: {
    flex: 1, fontSize: 12, fontWeight: '600', color: colors.text,
  },
  hudRouteTo: {
    flex: 1, fontSize: 12, fontWeight: '600', color: colors.text,
  },
  hudActions: {
    flexDirection: 'row', gap: 8, marginTop: 4,
  },
  hudBtnGhost: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF',
  },
  hudBtnGhostText: {
    fontSize: 12, fontWeight: '700', color: colors.text,
  },
  hudBtnEmergency: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8,
    borderWidth: 1, borderColor: colors.redBorder, backgroundColor: colors.redLight,
  },
  hudBtnEmergencyText: {
    fontSize: 12, fontWeight: '700', color: colors.redText,
  },
  hudBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8,
    backgroundColor: colors.brown,
  },
  hudBtnPrimaryText: {
    fontSize: 12, fontWeight: '700', color: '#FFFFFF',
  },

  // FABs
  fabs: {
    position: 'absolute', bottom: 90, right: 16,
    gap: 10, alignItems: 'center',
  },
  fab: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.brown,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  // Live badge
  liveBadge: {
    position: 'absolute', top: SB_H + 10, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: colors.line,
    elevation: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.brown },
  liveText: { color: colors.brown, fontSize: 10, fontWeight: '900' },

  // Legend
  legend: {
    position: 'absolute', bottom: 30, left: 14,
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.line,
    elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },

  // Autocomplete Suggestions Dropdown
  suggestionsCard: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    elevation: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: 230,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  suggestionsHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 0.5,
  },
  suggestionsList: {
    maxHeight: 180,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  suggestionTextWrap: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  suggestionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  suggestionDist: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
    marginLeft: 6,
  },

  // Map Tap Hint Tooltip
  mapTapHint: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  mapTapHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
});

