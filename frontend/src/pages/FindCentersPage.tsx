import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Directions as DirectionsIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
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
  // Default coordinates (Bengaluru tech hub from 008_seed.sql)
  const [lat, setLat] = useState<number>(12.9716);
  const [lng, setLng] = useState<number>(77.5946);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [categoryId, setCategoryId] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(true);

  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [centers, setCenters] = useState<CenterSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const data = await api.searchNearbyCenters(lat, lng, radiusKm, categoryId || undefined, verifiedOnly);
      setCenters(data);
    } catch (err) {
      console.error('Failed to search centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        // Automatically search with new coordinates
        api.searchNearbyCenters(pos.coords.latitude, pos.coords.longitude, radiusKm, categoryId || undefined, verifiedOnly)
          .then(setCenters)
          .catch(console.error);
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setLocating(false);
      }
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
          Certified Recycling Centers Map
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
          PostGIS spatial search locates authorized e-waste facilities based on precise coordinates and accepted categories.
        </Typography>
      </Box>

      {/* Filter Toolbar Card */}
      <Card sx={{ p: 2.5, mb: 4 }}>
        <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
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

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 600 }}>
              Search Radius: {radiusKm} km
            </Typography>
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

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                  Verified Only
                </Typography>
              }
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<MyLocationIcon />}
              onClick={handleUseMyLocation}
              disabled={locating}
              sx={{ color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              {locating ? 'Locating...' : 'My Location'}
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              onClick={fetchCenters}
              disabled={loading}
            >
              Update Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Main Map & Center List Layout */}
      <Grid container spacing={3}>
        {/* Interactive Leaflet Map */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box
            sx={{
              height: { xs: 400, md: 620 },
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <MapContainer
              center={[lat, lng]}
              zoom={12}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <ChangeView center={[lat, lng]} zoom={12} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User location pin */}
              <Marker position={[lat, lng]} icon={customIcon}>
                <Popup>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                    Search Origin
                  </Typography>
                  <Typography variant="caption">Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}</Typography>
                </Popup>
              </Marker>

              {/* Recycling Center Pins */}
              {centers.map((c) => (
                <Marker key={c.center_id} position={[c.latitude, c.longitude]} icon={customIcon}>
                  <Popup>
                    <Box sx={{ p: 0.5, maxWidth: 220 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981' }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', my: 0.5 }}>
                        {c.address}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, my: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${c.distance_km} km away`}
                          size="small"
                          color="info"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Chip
                          label={c.verification_status}
                          size="small"
                          color={c.verification_status === 'verified' ? 'success' : 'warning'}
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                        target="_blank"
                        startIcon={<DirectionsIcon fontSize="small" />}
                        sx={{ fontSize: '0.7rem', py: 0.3 }}
                      >
                        Directions
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>
        </Grid>

        {/* Center List Column */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
              Centers Found ({centers.length})
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Sorted by PostGIS Distance
            </Typography>
          </Box>

          {centers.length === 0 ? (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              No recycling centers found within {radiusKm} km matching your filters. Try widening the search radius or changing categories.
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ maxHeight: 580, overflowY: 'auto', pr: 1 }}>
              {centers.map((c) => (
                <Card key={c.center_id} sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ pr: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6', lineHeight: 1.2 }}>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: '#10b981' }} />
                        {c.address}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${c.distance_km} km`}
                      color="secondary"
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </Box>

                  {/* Accepted Categories Pills */}
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', my: 1.5 }}>
                    {c.accepted_categories.map((code) => (
                      <Chip
                        key={code}
                        label={code}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#d1d5db',
                        }}
                      />
                    ))}
                  </Box>

                  {/* Contact & Navigation Details */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      {c.contact_phone && (
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ fontSize: 13, mr: 0.3 }} /> {c.contact_phone}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                      target="_blank"
                      endIcon={<DirectionsIcon fontSize="small" />}
                      sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.75rem', p: 0 }}
                    >
                      Open Map
                    </Button>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
