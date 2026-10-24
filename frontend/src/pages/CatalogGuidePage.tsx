import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  BatteryAlert as BatteryIcon,
  CheckCircleOutlined as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  LockReset as DataWipeIcon,
  MenuBook as GuideIcon,
  PrecisionManufacturing as PcbIcon,
  Recycling as RecycleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { api } from '../api/client';
import { CategoryMaterial, DeviceCategory } from '../types';

export const CatalogGuidePage: React.FC = () => {
  const [categories, setCategories] = useState<DeviceCategory[]>([]);
  const [materialsMap, setMaterialsMap] = useState<Record<string, CategoryMaterial[]>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);

        // Fetch materials for each category
        const map: Record<string, CategoryMaterial[]> = {};
        for (const cat of cats) {
          try {
            const mats = await api.getCategoryMaterials(cat.category_id);
            map[cat.category_id] = mats;
          } catch {
            // ignore
          }
        }
        setMaterialsMap(map);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.handling_priority.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hazardous':
        return 'error';
      case 'secure_data_wipe':
        return 'secondary';
      default:
        return 'success';
    }
  };

  const getGuidanceSteps = (priority: string, code: string) => {
    if (priority === 'secure_data_wipe') {
      return [
        'Backup critical photos, contacts, and personal data to cloud or external storage.',
        'Sign out of Google / Apple / Samsung cloud accounts to remove remote device locks.',
        'Perform a full cryptographic Factory Data Reset (Settings > Reset > Erase All Data).',
        'Remove physical SIM cards and microSD expansion cards.',
        'Ensure the device casing is closed and free of physical battery bloating.',
      ];
    }
    if (priority === 'hazardous' || code === 'BATTERY') {
      return [
        'Never puncture, bend, incinerate, or crush lithium-ion battery cells.',
        'Insulate battery contact terminals with non-conductive electrical tape.',
        'If the battery is swollen or leaking, store in a non-combustible sand container immediately.',
        'Transport directly to authorized hazardous e-waste collection bins.',
      ];
    }
    return [
      'Disconnect power plugs and detach non-integrated cables and peripherals.',
      'Wipe down external surfaces to remove dust or grease.',
      'Check that heating elements or motors contain no remaining liquid.',
      'Bundle power cords neatly with a rubber band or twist-tie.',
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
          Device Recycling Catalog & Safe Preparation Guide
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
          Inspect certified e-waste categories, recycling-handling priority protocols, material composition factors, and
          essential pre-drop-off preparation procedures.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by category name, code (e.g. SMARTPHONE, LAPTOP), or priority..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Categories Accordion List */}
      <Grid container spacing={3}>
        {filtered.map((cat) => {
          const mats = materialsMap[cat.category_id] || [];
          const steps = getGuidanceSteps(cat.handling_priority, cat.code);

          return (
            <Grid key={cat.category_id} size={{ xs: 12 }}>
              <Accordion
                sx={{
                  backgroundColor: 'rgba(17, 24, 39, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px !important',
                  overflow: 'hidden',
                  mb: 1.5,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#9ca3af' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10b981',
                        }}
                      >
                        {cat.handling_priority === 'hazardous' ? (
                          <BatteryIcon />
                        ) : cat.handling_priority === 'secure_data_wipe' ? (
                          <DataWipeIcon />
                        ) : (
                          <RecycleIcon />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                          {cat.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Code: {cat.code} • Base Points: {cat.base_points} pts • Multiplier: {cat.points_per_kg} pts/kg
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={cat.handling_priority.toUpperCase().replace(/_/g, ' ')}
                      color={getPriorityColor(cat.handling_priority) as any}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 1, pb: 3, px: 3, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <Typography variant="body2" sx={{ color: '#d1d5db', mb: 3 }}>
                    {cat.description}
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Guidance Checklist */}
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#10b981', mb: 1.5 }}>
                        MANDATORY PRE-RECYCLING PREPARATION STEPS:
                      </Typography>
                      <List dense disablePadding>
                        {steps.map((step, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.75 }}>
                            <ListItemIcon sx={{ minWidth: 32, color: '#10b981' }}>
                              <CheckIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={step}
                              slotProps={{ primary: { variant: 'body2', sx: { color: '#e5e7eb', lineHeight: 1.5 } } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>

                    {/* Materials Composition */}
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#22d3ee', mb: 1.5 }}>
                        MATERIAL RECOVERY COMPOSITION:
                      </Typography>
                      {mats.length === 0 ? (
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Standard non-ferrous and polymeric composition model.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {mats.map((m) => (
                            <Box
                              key={m.material_id}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                                  {m.material_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                  Impact factor: {m.default_impact_factor} kg CO2e / {m.unit}
                                </Typography>
                              </Box>
                              <Chip
                                label={`${m.estimated_percentage}%`}
                                size="small"
                                sx={{ bgcolor: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};
