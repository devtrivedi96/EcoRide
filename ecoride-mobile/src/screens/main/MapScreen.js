/**
 * MapScreen.js — MapLibre + OpenFreeMap (Ola/Rapido-style)
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
import { MOCK_MAP_MARKERS } from '../../mock/mockData';
import { colors } from '../../utils/theme';

// ── OpenFreeMap — 100% free, no API key ──────────────────────────────────────
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ── Free routing & geocoding ──────────────────────────────────────────────────
async function geocode(place) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&countrycodes=in`;
  const res  = await fetch(url, { headers: { 'User-Agent': 'EcoRide/1.0' } });
  const json = await res.json();
  if (!json.length) throw new Error(`"${place}" not found. Try adding city name.`);
  return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
}

async function getRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res  = await fetch(url);
  const json = await res.json();
  if (json.code !== 'Ok') throw new Error('No route found.');
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const cameraRef = useRef(null);

  const [from, setFrom] = useState('Koramangala, Bangalore');
  const [to,   setTo]   = useState('');

  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeInfo,    setRouteInfo]    = useState(null);
  const [fromPin,      setFromPin]      = useState(null);   // { lat, lng }
  const [toPin,        setToPin]        = useState(null);

  const [loading,    setLoading]    = useState(false);
  const [locGranted, setLocGranted] = useState(false);

  // Bangalore centre default
  const [centerCoord] = useState([77.5946, 12.9716]); // [lng, lat]

  // ── Request location ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidLocationPermissions();
        setLocGranted(granted);
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocGranted(status === 'granted');
      }
    })();
  }, []);

  // ── Find route ──────────────────────────────────────────────────────────────
  async function findRoute() {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Enter both locations');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setRouteGeoJSON(null);
    setRouteInfo(null);
    try {
      const [fromCoord, toCoord] = await Promise.all([geocode(from), geocode(to)]);
      const route = await getRoute(fromCoord, toCoord);

      setFromPin(fromCoord);
      setToPin(toCoord);
      setRouteGeoJSON(route.geojson);
      setRouteInfo({ distance: route.distance, duration: route.duration });

      // Fly to fit route bounds
      const coords = route.geojson.features[0].geometry.coordinates;
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      cameraRef.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
        60,   // padding px
        800,  // animation ms
      );
    } catch (err) {
      Alert.alert('Route error', err.message);
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
  }

  async function centreOnMe() {
    // UserLocation component handles this — fly camera to user
    cameraRef.current?.setCamera({
      zoomLevel: 16,
      animationDuration: 800,
      animationMode: 'flyTo',
    });

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (loc?.coords) {
        const address = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address?.length > 0) {
          const a = address[0];
          const parts = [a.name, a.street, a.city || a.subregion].filter(Boolean);
          const uniqueParts = [...new Set(parts)];
          setFrom(uniqueParts.join(', '));
        }
      }
    } catch (err) {
      console.log('Could not reverse geocode user location', err);
    }
  }

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
                lineColor: '#065f46',
                lineWidth: 10,
                lineOpacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main line */}
            <LineLayer
              id="routeLine"
              style={{
                lineColor: colors.green,
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
            <View style={[styles.pin, { backgroundColor: colors.green }]}>
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

        {/* Mock ride markers */}
        {MOCK_MAP_MARKERS.map(m => (
          <PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.longitude, m.latitude]}
            title={m.title}
          >
            <View style={[styles.ridePin, {
              backgroundColor:
                m.type === 'destination' ? colors.amber :
                m.type === 'myRide'      ? colors.blue  : colors.green,
            }]} />
          </PointAnnotation>
        ))}
      </MapView>

      {/* ── Top search panel ── */}
      <SafeAreaView style={styles.safeTop} pointerEvents="box-none">
        <View style={styles.searchCard}>
          {/* From */}
          <View style={styles.inputRow}>
            <View style={[styles.inputDot, { backgroundColor: colors.green }]} />
            <TextInput
              style={styles.input}
              value={from}
              onChangeText={setFrom}
              placeholder="From — pickup location"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />
          </View>

          {/* To (shown when user wants to enter destination) */}
          {(to !== '' || routeInfo) ? (
            <>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <View style={[styles.inputDot, { backgroundColor: colors.amber }]} />
                <TextInput
                  style={styles.input}
                  value={to}
                  onChangeText={setTo}
                  placeholder="To — destination"
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  onSubmitEditing={findRoute}
                  autoFocus={!to}
                />
                {to.length > 0 && (
                  <TouchableOpacity onPress={clearRoute} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : null}

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={to === '' ? () => setTo(' ') : findRoute}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color={colors.ink} />
              : <Ionicons name={to === '' ? 'navigate-outline' : 'search'} size={16} color={colors.ink} />
            }
            <Text style={styles.ctaText}>
              {loading ? 'Finding route…' : to === '' ? 'Enter destination' : 'Get Route'}
            </Text>
          </TouchableOpacity>

          {/* Route info */}
          {routeInfo && (
            <View style={styles.routeRow}>
              <View style={styles.routePill}>
                <Ionicons name="navigate" size={12} color={colors.green} />
                <Text style={styles.routeText}>{routeInfo.distance} km</Text>
              </View>
              <View style={styles.routePill}>
                <Ionicons name="time-outline" size={12} color={colors.amber} />
                <Text style={styles.routeText}>{routeInfo.duration} min</Text>
              </View>
              <Text style={styles.routeAttrib}>OpenFreeMap · OSRM</Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── FABs ── */}
      <View style={styles.fabs} pointerEvents="box-none">
        <TouchableOpacity style={styles.fab} onPress={centreOnMe} activeOpacity={0.85}>
          <Ionicons name="locate" size={22} color="#fff" />
        </TouchableOpacity>
        {routeInfo && (
          <TouchableOpacity style={[styles.fab, { backgroundColor: colors.red }]} onPress={clearRoute} activeOpacity={0.85}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Live GPS badge ── */}
      {locGranted && (
        <View style={styles.liveBadge} pointerEvents="none">
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE GPS</Text>
        </View>
      )}

      {/* ── Legend ── */}
      <View style={styles.legend} pointerEvents="none">
        {[
          { c: colors.green, l: 'Pickup' },
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
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const SB_H = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1628' },

  // pins
  pin: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 5,
  },
  ridePin: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#fff',
    elevation: 4,
  },

  // search panel
  safeTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: SB_H + 10, paddingHorizontal: 14,
  },
  searchCard: {
    backgroundColor: 'rgba(17,24,39,0.97)',
    borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 14,
    gap: 6,
    elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1, borderColor: colors.line,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', paddingVertical: 0 },
  inputDivider: { height: 1, backgroundColor: colors.line, marginLeft: 20 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.green, borderRadius: 10, paddingVertical: 12, marginTop: 2,
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { color: colors.ink, fontWeight: '900', fontSize: 15 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.panelSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  routeText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  routeAttrib: { color: colors.muted, fontSize: 10, marginLeft: 'auto' },

  // FABs
  fabs: {
    position: 'absolute', bottom: 100, right: 16,
    gap: 12, alignItems: 'center',
  },
  fab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  // Live badge
  liveBadge: {
    position: 'absolute', top: SB_H + 10, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(17,24,39,0.9)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: colors.line,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  liveText: { color: colors.green, fontSize: 10, fontWeight: '900' },

  // Legend
  legend: {
    position: 'absolute', bottom: 30, left: 14,
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    backgroundColor: 'rgba(17,24,39,0.88)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.muted, fontSize: 11 },
});
