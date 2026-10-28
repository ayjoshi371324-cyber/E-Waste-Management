import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  Directions as DirectionsIcon,
  Email as EmailIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  GpsFixed as GpsFixedIcon,
  LocationCity as CityIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  OpenInNew as OpenInNewIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../api/client';
import { CenterSearchResult, DeviceCategory } from '../types';

// Fix for default Leaflet marker icons in React
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to dynamically re-center map view
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export const FindCentersPage: React.FC = () => {
  // Coordinates are strictly initialized to null - NO hardcoded default city/coords
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);

  // Filters
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [categoryId, setCategoryId] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);

  // Data
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [centers, setCenters] = useState<CenterSearchResult[]>([]);

  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(true);
  const [geocodingLoading, setGeocodingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Manual city / PIN input
  const [manualQuery, setManualQuery] = useState<string>('');

  // Interactive Card & Map Selection States
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [expandedCenterIds, setExpandedCenterIds] = useState<Set<string>>(new Set());

  // Generates external map URL using the center's actual coordinates with address fallback
  const getOpenMapUrl = (c: CenterSearchResult): string | null => {
    const hasValidCoords =
      typeof c.latitude === 'number' &&
      typeof c.longitude === 'number' &&
      !isNaN(c.latitude) &&
      !isNaN(c.longitude) &&
      (c.latitude !== 0 || c.longitude !== 0);

    if (hasValidCoords) {
      // Use center's real latitude and longitude
      return `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`;
    }

    if (c.address && c.address.trim()) {
      // Fallback gracefully to full address search
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address.trim())}`;
    }

    return null;
  };

  const toggleCenterExpanded = (centerId: string) => {
    setExpandedCenterIds((prev) => {
      const next = new Set(prev);
      if (next.has(centerId)) {
        next.delete(centerId);
      } else {
        next.add(centerId);
      }
      return next;
    });
  };

  const allExpanded = centers.length > 0 && centers.every((c) => expandedCenterIds.has(c.center_id));

  const handleToggleAllExpanded = () => {
    if (allExpanded) {
      setExpandedCenterIds(new Set());
    } else {
      setExpandedCenterIds(new Set(centers.map((c) => c.center_id)));
    }
  };

  const handleShowOnMap = (center: CenterSearchResult) => {
    setSelectedCenterId(center.center_id);
    setMapCenter([center.latitude, center.longitude]);
    setMapZoom(15);
    // On mobile / tablet, scroll smoothly to the map container
    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      const mapEl = document.getElementById('find-centers-map-container');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const fetchCentersForCoords = async (
    targetLat: number,
    targetLng: number,
    targetRadius: number = radiusKm,
    targetCat: string = categoryId,
    targetVerified: boolean = verifiedOnly
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchNearbyCenters(
        targetLat,
        targetLng,
        targetRadius,
        targetCat || undefined,
        targetVerified
      );
      setCenters(data);
      setMapCenter([targetLat, targetLng]);
      setMapZoom(targetRadius > 35 ? 11 : 12);
      setSelectedCenterId(null);
      // If exactly 1 center found, expand it for quick viewing; if many, keep compact
      if (data.length === 1) {
        setExpandedCenterIds(new Set([data[0].center_id]));
      } else {
        setExpandedCenterIds(new Set());
      }
    } catch (err: any) {
      console.error('Failed to search centers:', err);
      setError(
        err?.message ||
          'Unable to retrieve nearby recycling centers. Please check backend service connectivity.'
      );
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const detectUserLocation = useCallback(() => {
    setLocating(true);
    setLocationError(null);
    setError(null);

    if (!navigator.geolocation) {
      setLocating(false);
      setLocationError(
        'Geolocation is not supported by your browser. Please enter your City or 6-digit PIN code below.'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setLocationLabel('Your Current Location (GPS)');
        setIsUsingGps(true);
        setLocating(false);
        setLocationError(null);

        fetchCentersForCoords(userLat, userLng, radiusKm, categoryId, verifiedOnly);
      },
      (err) => {
        console.warn('Geolocation detection failed or permission denied:', err);
        setLocating(false);
        setIsUsingGps(false);
        if (err.code === 1) {
          setLocationError(
            'Location permission was denied. Please allow location access in your browser or enter your City or 6-digit PIN code below.'
          );
        } else if (err.code === 2) {
          setLocationError(
            'Location position is currently unavailable. Please verify device GPS/network settings or enter your City or PIN code below.'
          );
        } else if (err.code === 3) {
          setLocationError(
            'Location request timed out. Please try clicking "GPS" again or enter your City or PIN code below.'
          );
        } else {
          setLocationError(
            `Location error: ${err.message}. Please enter your City or PIN code below.`
          );
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, [radiusKm, categoryId, verifiedOnly]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    detectUserLocation();
  }, []);

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = manualQuery.trim();
    if (!query) return;

    setGeocodingLoading(true);
    setError(null);
    setLocationError(null);

    try {
      const res = await api.geocodeLocation(query);
      const newLat = Number(res.latitude.toFixed(6));
      const newLng = Number(res.longitude.toFixed(6));
      setLat(newLat);
      setLng(newLng);
      setLocationLabel(res.display_name);
      setIsUsingGps(false);
      await fetchCentersForCoords(newLat, newLng, radiusKm, categoryId, verifiedOnly);
    } catch (err: any) {
      console.error('Geocoding error:', err);
      setLocationError(
        err?.message ||
          `Could not locate "${query}". Please enter a valid Indian city name or 6-digit PIN code.`
      );
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleUpdateSearch = () => {
    if (lat !== null && lng !== null) {
      fetchCentersForCoords(lat, lng, radiusKm, categoryId, verifiedOnly);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}
        >
          Find Certified Recycling Centers
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
          Spatial search locates authorized e-waste facilities near your actual location using PostGIS geodesic distance calculations.
        </Typography>
      </Box>

      {/* Geolocation Feedback / Denial Alert */}
      {locationError && (
        <Alert
          severity="warning"
          onClose={() => setLocationError(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {locationError}
        </Alert>
      )}

      {/* Backend API Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            lat !== null && lng !== null ? (
              <Button
                color="inherit"
                size="small"
                onClick={handleUpdateSearch}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* Filter & Search Toolbar */}
      <Card sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Manual City / PIN search field */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              component="form"
              onSubmit={handleManualSearch}
              sx={{ display: 'flex', gap: 1 }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Enter City or 6-digit PIN..."
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CityIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                      </InputAdornment>
                    ),
                    endAdornment: manualQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setManualQuery('')}>
                          <ClearIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={() => handleManualSearch()}
                disabled={geocodingLoading || !manualQuery.trim()}
                sx={{ minWidth: 64, whiteSpace: 'nowrap' }}
              >
                {geocodingLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  'Search'
                )}
              </Button>
            </Box>
          </Grid>

          {/* Accepted Device Category Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>Accepted Category</InputLabel>
              <Select
                value={categoryId}
                label="Accepted Category"
                displayEmpty
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.category_id} value={c.category_id}>
                    {c.name} ({c.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search Radius Slider */}
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                Radius: {radiusKm} km
              </Typography>
            </Box>
            <Slider
              value={radiusKm}
              min={5}
              max={50}
              step={5}
              onChange={(_, val) => setRadiusKm(val as number)}
              color="primary"
              size="small"
            />
          </Grid>

          {/* Verified Only Switch */}
          <Grid size={{ xs: 6, sm: 4, md: 1.3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.8rem' }}>
                  Verified
                </Typography>
              }
            />
          </Grid>

          {/* My Location GPS Refresh Button */}
          <Grid size={{ xs: 6, sm: 4, md: 1.2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={locating ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
              onClick={detectUserLocation}
              disabled={locating}
              title="Detect your browser GPS location"
              sx={{ color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.4)', textTransform: 'none', py: 0.8 }}
            >
              GPS
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Dynamic Content: Pending Detection State */}
      {locating && (
        <Card sx={{ p: 5, textAlign: 'center', my: 4, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CircularProgress color="primary" size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
            Detecting your location...
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mt: 1, maxWidth: 500, mx: 'auto' }}>
            Please click "Allow" if prompted by your browser to find e-waste recycling centers near you.
          </Typography>
        </Card>
      )}

      {/* Dynamic Content: Geolocation Not Available / Denied and No Coords Yet */}
      {!locating && lat === null && (
        <Card sx={{ p: 5, textAlign: 'center', my: 4, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <LocationIcon sx={{ fontSize: 52, color: '#06b6d4', mb: 1.5 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 1 }}>
            Find Recycling Centers in Your Area
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3, maxWidth: 550, mx: 'auto' }}>
            Enter your City name (e.g. Mumbai, Pune, Bengaluru, New Delhi) or 6-digit postal PIN code in the search bar above to locate authorized recycling facilities.
          </Typography>
          <Box
            component="form"
            onSubmit={handleManualSearch}
            sx={{ display: 'flex', gap: 1, maxWidth: 450, mx: 'auto' }}
          >
            <TextField
              fullWidth
              size="medium"
              placeholder="e.g. Mumbai, Pune, 560038..."
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              autoFocus
            />
            <Button
              variant="contained"
              onClick={() => handleManualSearch()}
              disabled={geocodingLoading || !manualQuery.trim()}
              startIcon={geocodingLoading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              sx={{ px: 3 }}
            >
              Search
            </Button>
          </Box>
          <Box sx={{ mt: 2.5 }}>
            <Button
              variant="text"
              startIcon={<MyLocationIcon />}
              onClick={detectUserLocation}
              sx={{ color: '#22d3ee', textTransform: 'none' }}
            >
              Retry browser location permission
            </Button>
          </Box>
        </Card>
      )}

      {/* Dynamic Content: Active Coordinates Present */}
      {!locating && lat !== null && lng !== null && (
        <>
          {/* Active Search Origin Banner */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2.5,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <LocationIcon sx={{ fontSize: 20, color: '#10b981' }} />
              <Typography variant="body2" sx={{ color: '#f3f4f6', fontWeight: 600 }}>
                Active Location:{' '}
                <span style={{ color: '#22d3ee' }}>
                  {locationLabel || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                </span>
              </Typography>
              {isUsingGps ? (
                <Chip
                  icon={<GpsFixedIcon style={{ fontSize: 13, color: '#10b981' }} />}
                  label="Live GPS"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ) : (
                <Chip
                  icon={<CityIcon style={{ fontSize: 13, color: '#38bdf8' }} />}
                  label="Resolved Location"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon fontSize="small" />}
              onClick={handleUpdateSearch}
              disabled={loading}
              sx={{ fontSize: '0.75rem', py: 0.4 }}
            >
              Update Search
            </Button>
          </Box>

          {/* Main Map & Center List Layout */}
          <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
            {/* Interactive Leaflet Map (Left Column) */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Box
                id="find-centers-map-container"
                sx={{
                  position: { lg: 'sticky' },
                  top: { lg: 96 },
                  height: { xs: 380, md: 520, lg: 680 },
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid rgba(155, 227, 36, 0.2)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
                }}
              >
                <MapContainer
                  center={[lat, lng]}
                  zoom={mapZoom}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <ChangeView center={mapCenter || [lat, lng]} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* User Search Origin Pin */}
                  <Marker position={[lat, lng]} icon={customIcon}>
                    <Popup>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {locationLabel || 'Search Origin'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
                        Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                      </Typography>
                    </Popup>
                  </Marker>

                  {/* Recycling Center Pins */}
                  {centers.map((c) => {
                    const centerMapUrl = getOpenMapUrl(c);
                    return (
                      <Marker
                        key={c.center_id}
                        position={[c.latitude, c.longitude]}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => {
                            setSelectedCenterId(c.center_id);
                          },
                        }}
                      >
                        <Popup>
                          <Box sx={{ p: 0.5, maxWidth: 240 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#9be324' }}>
                              {c.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: '#d1d5db', display: 'block', my: 0.5, wordBreak: 'break-word' }}
                            >
                              {c.address}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, my: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={`${c.distance_km} km away`}
                                size="small"
                                color="info"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                              />
                              <Chip
                                label={c.verification_status}
                                size="small"
                                color={c.verification_status === 'verified' ? 'success' : 'warning'}
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                              />
                            </Box>
                            {c.contact_phone && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#9ca3af', mb: 1 }}>
                                📞 {c.contact_phone}
                              </Typography>
                            )}
                            {centerMapUrl && (
                              <Button
                                size="small"
                                variant="contained"
                                fullWidth
                                href={centerMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon fontSize="small" />}
                                sx={{
                                  fontSize: '0.72rem',
                                  py: 0.4,
                                  backgroundColor: '#9be324',
                                  color: '#07160c',
                                  fontWeight: 700,
                                  '&:hover': { backgroundColor: '#aef42e' },
                                }}
                              >
                                Open in Google Maps
                              </Button>
                            )}
                          </Box>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </Box>
            </Grid>

            {/* Center List Column (Right Column) */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: { lg: 680 },
                  maxHeight: { xs: 600, md: 640, lg: 680 },
                }}
              >
                {/* Header Row (Fixed above scrollable list) */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                    flexShrink: 0,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#f4fbf5', lineHeight: 1.2 }}
                    >
                      Centers Found ({centers.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
                      Sorted by PostGIS Distance
                    </Typography>
                  </Box>

                  {centers.length > 0 && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleToggleAllExpanded}
                      startIcon={allExpanded ? <UnfoldLessIcon fontSize="small" /> : <UnfoldMoreIcon fontSize="small" />}
                      sx={{
                        color: '#9be324',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        p: 0.5,
                        '&:hover': { backgroundColor: 'rgba(155, 227, 36, 0.08)' },
                      }}
                    >
                      {allExpanded ? 'Collapse All' : 'Expand All'}
                    </Button>
                  )}
                </Box>

                {/* Loading / Empty / Scrollable Cards */}
                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      py: 8,
                      flex: 1,
                    }}
                  >
                    <CircularProgress color="primary" />
                  </Box>
                ) : centers.length === 0 ? (
                  <Alert severity="warning" sx={{ borderRadius: 3 }}>
                    No recycling centers found within {radiusKm} km of{' '}
                    <strong>{locationLabel || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`}</strong>{' '}
                    matching your filters.
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ display: 'block', color: '#d1d5db' }}>
                        Try widening the search radius (up to 50 km), selecting "All Categories", or searching for a different city or PIN code above.
                      </Typography>
                    </Box>
                  </Alert>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      pr: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {centers.map((c) => {
                      const isExpanded = expandedCenterIds.has(c.center_id);
                      const isSelected = selectedCenterId === c.center_id;
                      const openMapUrl = getOpenMapUrl(c);

                      return (
                        <Card
                          key={c.center_id}
                          sx={{
                            p: { xs: 2, sm: 2.25 },
                            flexShrink: 0,
                            width: '100%',
                            boxSizing: 'border-box',
                            borderRadius: 3.5,
                            border: isSelected
                              ? '1.5px solid #9be324'
                              : '1px solid rgba(155, 227, 36, 0.14)',
                            boxShadow: isSelected
                              ? '0 0 22px rgba(155, 227, 36, 0.25)'
                              : undefined,
                            transition: 'all 0.22s ease',
                            background: 'rgba(14, 31, 20, 0.88)',
                            backdropFilter: 'blur(16px)',
                          }}
                        >
                          {/* Top Header Row: Center Name + Badges + Distance */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 1.5,
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: '#f4fbf5',
                                  lineHeight: 1.3,
                                  wordBreak: 'break-word',
                                  fontSize: '0.98rem',
                                }}
                              >
                                {c.name}
                              </Typography>

                              {/* Verification Status Badge */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 0.6 }}>
                                {c.verification_status === 'verified' && (
                                  <Chip
                                    icon={<CheckCircleIcon sx={{ '&&': { color: '#10b981', fontSize: 13 } }} />}
                                    label="Verified"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                  />
                                )}
                                {c.verification_status === 'expired' && (
                                  <Chip
                                    icon={<WarningIcon sx={{ '&&': { color: '#f59e0b', fontSize: 13 } }} />}
                                    label="Auth Expired"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                      color: '#fbbf24',
                                      border: '1px solid rgba(245, 158, 11, 0.3)',
                                    }}
                                  />
                                )}
                                {c.verification_status === 'pending' && (
                                  <Chip
                                    label="Pending Verification"
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      backgroundColor: 'rgba(6, 182, 212, 0.12)',
                                      color: '#38bdf8',
                                      border: '1px solid rgba(6, 182, 212, 0.3)',
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* Distance Badge */}
                            <Chip
                              label={`${c.distance_km} km`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                backgroundColor: 'rgba(155, 227, 36, 0.15)',
                                color: '#9be324',
                                border: '1px solid rgba(155, 227, 36, 0.35)',
                                flexShrink: 0,
                                height: 24,
                              }}
                            />
                          </Box>

                          {/* Collapsed view summary */}
                          {!isExpanded && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#9ca3af',
                                display: 'flex',
                                alignItems: 'flex-start',
                                mt: 1,
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              <LocationIcon sx={{ fontSize: 15, mr: 0.5, color: '#10b981', flexShrink: 0, mt: 0.1 }} />
                              <Box
                                component="span"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {c.address}
                              </Box>
                            </Typography>
                          )}

                          {/* Primary Toggle Row (View Details / Hide Details & Collapsed Quick Map) */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 1.2,
                              pt: isExpanded ? 0 : 0.8,
                              borderTop: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => toggleCenterExpanded(c.center_id)}
                              aria-expanded={isExpanded}
                              aria-controls={`center-details-${c.center_id}`}
                              endIcon={isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              sx={{
                                color: '#9be324',
                                fontWeight: 600,
                                fontSize: '0.76rem',
                                p: 0,
                                textTransform: 'none',
                                '&:hover': { background: 'none', color: '#aef42e', textDecoration: 'underline' },
                              }}
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </Button>

                            {!isExpanded && openMapUrl && (
                              <Button
                                size="small"
                                variant="text"
                                href={openMapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon sx={{ fontSize: '0.8rem !important' }} />}
                                sx={{
                                  color: '#34d399',
                                  fontWeight: 600,
                                  fontSize: '0.74rem',
                                  p: 0,
                                  textTransform: 'none',
                                  '&:hover': { background: 'none', textDecoration: 'underline' },
                                }}
                              >
                                Open Map
                              </Button>
                            )}
                          </Box>

                          {/* Expanded Details Section */}
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit id={`center-details-${c.center_id}`}>
                            <Box
                              sx={{
                                pt: 1.5,
                                mt: 1.2,
                                borderTop: '1px solid rgba(155, 227, 36, 0.12)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                              }}
                            >
                              {/* Full Unclipped Address */}
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#9eb5a5',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.68rem',
                                    letterSpacing: '0.05em',
                                    display: 'block',
                                    mb: 0.3,
                                  }}
                                >
                                  Complete Address
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: '#e5e7eb',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    lineHeight: 1.5,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'normal',
                                    fontSize: '0.82rem',
                                  }}
                                >
                                  <LocationIcon sx={{ fontSize: 16, mr: 0.6, color: '#10b981', flexShrink: 0, mt: 0.2 }} />
                                  {c.address}
                                </Typography>
                              </Box>

                              {/* Contact Details */}
                              {(c.contact_phone || c.contact_email) && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                  {c.contact_phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                      <PhoneIcon sx={{ fontSize: 14, color: '#22d3ee' }} />
                                      <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                                        Phone:
                                      </Typography>
                                      <Typography
                                        component="a"
                                        href={`tel:${c.contact_phone}`}
                                        variant="caption"
                                        sx={{
                                          color: '#22d3ee',
                                          textDecoration: 'none',
                                          fontWeight: 600,
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                      >
                                        {c.contact_phone}
                                      </Typography>
                                    </Box>
                                  )}

                                  {c.contact_email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                      <EmailIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                                      <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
                                        Email:
                                      </Typography>
                                      <Typography
                                        component="a"
                                        href={`mailto:${c.contact_email}`}
                                        variant="caption"
                                        sx={{
                                          color: '#38bdf8',
                                          textDecoration: 'none',
                                          fontWeight: 600,
                                          wordBreak: 'break-all',
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                      >
                                        {c.contact_email}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {/* Accepted Categories */}
                              {c.accepted_categories && c.accepted_categories.length > 0 && (
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: '#9eb5a5',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      fontSize: '0.68rem',
                                      letterSpacing: '0.05em',
                                      display: 'block',
                                      mb: 0.6,
                                    }}
                                  >
                                    Accepted E-Waste Categories
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
                                    {c.accepted_categories.map((code) => (
                                      <Chip
                                        key={code}
                                        label={code}
                                        size="small"
                                        sx={{
                                          height: 22,
                                          fontSize: '0.68rem',
                                          fontWeight: 600,
                                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                          color: '#d1d5db',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Action Buttons Toolbar: Show on Map & Open Map */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  pt: 1.5,
                                  mt: 0.5,
                                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                  flexWrap: 'wrap',
                                  gap: 1,
                                }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleShowOnMap(c)}
                                  startIcon={<LocationIcon fontSize="small" />}
                                  sx={{
                                    color: '#22d3ee',
                                    borderColor: 'rgba(34, 211, 238, 0.4)',
                                    fontSize: '0.75rem',
                                    py: 0.5,
                                    px: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    '&:hover': {
                                      borderColor: '#22d3ee',
                                      backgroundColor: 'rgba(34, 211, 238, 0.08)',
                                    },
                                  }}
                                >
                                  Show on Map
                                </Button>

                                {openMapUrl ? (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    href={openMapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    endIcon={<OpenInNewIcon fontSize="small" />}
                                    sx={{
                                      backgroundColor: '#9be324',
                                      color: '#07160c',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      py: 0.5,
                                      px: 1.8,
                                      textTransform: 'none',
                                      borderRadius: 2,
                                      boxShadow: '0 4px 14px rgba(155, 227, 36, 0.25)',
                                      '&:hover': {
                                        backgroundColor: '#aef42e',
                                        boxShadow: '0 6px 20px rgba(155, 227, 36, 0.35)',
                                      },
                                    }}
                                  >
                                    Open Map
                                  </Button>
                                ) : (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled
                                    endIcon={<OpenInNewIcon fontSize="small" />}
                                    sx={{
                                      fontSize: '0.75rem',
                                      py: 0.5,
                                      px: 1.8,
                                      textTransform: 'none',
                                      borderRadius: 2,
                                    }}
                                  >
                                    Map Unavailable
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Collapse>
                        </Card>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};
