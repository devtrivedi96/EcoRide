import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  MapView,
  Camera,
  ShapeSource,
  LineLayer,
  PointAnnotation,
} from '@maplibre/maplibre-react-native';
import { colors } from '../utils/theme';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Haversine distance in KM
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

// Fallback curved arc coordinates
function generateArcCoordinates(start, end, numPoints = 20) {
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

// Lightweight geocode helper
async function geocodePlace(place, fallback = { lat: 23.0225, lng: 72.5714 }) {
  if (!place || typeof place !== 'string') return fallback;
  const trimmed = place.trim();
  if (!trimmed) return fallback;

  // 1. Native geocoder
  try {
    const res = await Location.geocodeAsync(trimmed);
    if (res && res.length > 0) {
      return { lat: res[0].latitude, lng: res[0].longitude };
    }
  } catch {}

  // 2. Photon API
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=3`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const data = await res.json();
    const f = data?.features?.[0];
    if (f?.geometry?.coordinates) {
      return { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    }
  } catch {}

  // 3. Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EcoRideApp/1.0' } });
    const json = await res.json();
    if (json && json.length > 0) {
      return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    }
  } catch {}

  return fallback;
}

// Lightweight route fetcher
async function fetchRouteGeoJSON(fromCoord, toCoord) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${toCoord.lng},${toCoord.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code === 'Ok' && json.routes?.length > 0) {
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

  // Resilient fallback
  const d = distanceKm(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng);
  const roadDist = (d * 1.25).toFixed(1);
  return {
    geojson: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: generateArcCoordinates(fromCoord, toCoord),
        },
      }],
    },
    distance: roadDist,
    duration: Math.max(5, Math.round((roadDist / 30) * 60)),
  };
}

export default function MiniRouteMap({
  pickup,
  destination,
  waypoints,
  height = 180,
  navigation,
  onPress,
  style,
}) {
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [fromCoord, setFromCoord] = useState(null);
  const [toCoord, setToCoord] = useState(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeStats, setRouteStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const [fromC, toC] = await Promise.all([
          geocodePlace(pickup, { lat: 23.0225, lng: 72.5714 }),
          geocodePlace(destination, { lat: 23.1122, lng: 72.5367 }),
        ]);

        if (!isMounted) return;
        setFromCoord(fromC);
        setToCoord(toC);

        const routeData = await fetchRouteGeoJSON(fromC, toC);
        if (!isMounted) return;

        setRouteGeoJSON(routeData.geojson);
        setRouteStats({ distance: routeData.distance, duration: routeData.duration });

        // Adjust camera to fit route
        const coords = routeData.geojson.features[0].geometry.coordinates;
        const lngs = coords.map((c) => c[0]);
        const lats = coords.map((c) => c[1]);
        cameraRef.current?.fitBounds(
          [Math.max(...lngs), Math.max(...lats)],
          [Math.min(...lngs), Math.min(...lats)],
          40,
          500
        );
      } catch (e) {
        console.warn('MiniRouteMap error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pickup, destination]);

  const handleOpenMap = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation?.navigate) {
      navigation.navigate('Map', {
        pickup: pickup || '',
        destination: destination || '',
      });
    }
  };

  const centerCoord = fromCoord
    ? [fromCoord.lng, fromCoord.lat]
    : [72.5714, 23.0225];

  return (
    <View style={[styles.container, { height }, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        zoomEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={centerCoord}
          zoomLevel={11}
          animationMode="none"
        />

        {routeGeoJSON && (
          <ShapeSource id="miniRouteSource" shape={routeGeoJSON}>
            <LineLayer
              id="miniRouteHalo"
              style={{
                lineColor: '#734427',
                lineWidth: 6,
                lineOpacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <LineLayer
              id="miniRouteLine"
              style={{
                lineColor: colors.brown,
                lineWidth: 3.5,
                lineOpacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {fromCoord && (
          <PointAnnotation
            id="miniFromPin"
            coordinate={[fromCoord.lng, fromCoord.lat]}
          >
            <View style={[styles.markerPin, { backgroundColor: colors.brown }]}>
              <Ionicons name="location" size={10} color="#FFFFFF" />
            </View>
          </PointAnnotation>
        )}

        {toCoord && (
          <PointAnnotation
            id="miniToPin"
            coordinate={[toCoord.lng, toCoord.lat]}
          >
            <View style={[styles.markerPin, { backgroundColor: colors.amber }]}>
              <Ionicons name="flag" size={10} color="#FFFFFF" />
            </View>
          </PointAnnotation>
        )}
      </MapView>

      {/* Top Floating Route Badge */}
      {routeStats && (
        <View style={styles.statsBadge}>
          <Ionicons name="car-outline" size={12} color={colors.brown} />
          <Text style={styles.statsText}>
            {routeStats.distance} km · {routeStats.duration} min drive
          </Text>
        </View>
      )}

      {/* Expand Button Overlay */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={handleOpenMap}
        activeOpacity={0.85}
      >
        <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
        <Text style={styles.expandButtonText}>Live Map</Text>
      </TouchableOpacity>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.brown} />
          <Text style={styles.loadingText}>Generating route map…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.line,
    position: 'relative',
  },
  markerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  statsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    elevation: 2,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  expandButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brown,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 3,
  },
  expandButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
});
