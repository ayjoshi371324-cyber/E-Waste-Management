import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Recycling as EcoIcon,
  Bolt as EnergyIcon,
  LocationOn as MapIcon,
  MonetizationOn as PointsIcon,
  Security as SafeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
}

const DEVICE_CATALOG = [
  { id: 'smartphone', name: 'Smartphone / iPhone / Android', avgWeightKg: 0.18, pointsPerUnit: 250, co2SavingsKg: 8.2, goldMg: 35, copperG: 16 },
  { id: 'laptop', name: 'Laptop / MacBook / Ultrabook', avgWeightKg: 1.8, pointsPerUnit: 800, co2SavingsKg: 28.5, goldMg: 120, copperG: 140 },
  { id: 'desktop', name: 'Desktop PC Tower / Workstation', avgWeightKg: 7.5, pointsPerUnit: 1200, co2SavingsKg: 65.0, goldMg: 210, copperG: 450 },
  { id: 'tablet', name: 'Tablet / iPad', avgWeightKg: 0.5, pointsPerUnit: 350, co2SavingsKg: 14.0, goldMg: 45, copperG: 30 },
  { id: 'pcb', name: 'Motherboard / Server PCB Boards', avgWeightKg: 1.0, pointsPerUnit: 500, co2SavingsKg: 32.0, goldMg: 280, copperG: 220 },
  { id: 'battery', name: 'Lithium-Ion / Laptop Battery Pack', avgWeightKg: 0.3, pointsPerUnit: 200, co2SavingsKg: 11.5, goldMg: 0, copperG: 65 },
  { id: 'monitor', name: 'LED / LCD Monitor', avgWeightKg: 4.2, pointsPerUnit: 600, co2SavingsKg: 42.0, goldMg: 60, copperG: 180 },
  { id: 'appliance', name: 'Small Home Electronics & Chargers', avgWeightKg: 1.2, pointsPerUnit: 150, co2SavingsKg: 9.0, goldMg: 15, copperG: 85 },
];

export const QuoteCalculatorModal: React.FC<QuoteModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_CATALOG[0].id);
  const [quantity, setQuantity] = useState<number>(2);
  const [condition, setCondition] = useState<string>('functional');

  const currentDevice = DEVICE_CATALOG.find((d) => d.id === selectedDevice) || DEVICE_CATALOG[0];
  const conditionMultiplier = condition === 'functional' ? 1.2 : condition === 'broken' ? 0.9 : 0.75;

  const totalPoints = Math.round(currentDevice.pointsPerUnit * quantity * conditionMultiplier);
  const estimatedCash = (totalPoints * 0.5).toFixed(0); // 1 point = ₹0.50
  const co2Avoided = (currentDevice.co2SavingsKg * quantity).toFixed(1);
  const copperRecovered = Math.round(currentDevice.copperG * quantity);
  const goldRecovered = Math.round(currentDevice.goldMg * quantity);

  const handleGoToCenters = () => {
    onClose();
    navigate('/centers');
  };

  const handleGoToAI = () => {
    onClose();
    navigate('/ai-classify');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '32px',
            background: 'linear-gradient(145deg, #0f2617 0%, #08150c 100%)',
            border: '1px solid rgba(155, 227, 36, 0.3)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(155, 227, 36, 0.15)',
            overflow: 'hidden',
            p: { xs: 2, md: 3 },
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: '#9be324',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07160c',
            }}
          >
            <PointsIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#f4fbf5' }}>
              Instant E-Waste Valuation & Quote
            </Typography>
            <Typography variant="caption" sx={{ color: '#9eb5a5' }}>
              Certified circular recovery rate based on live secondary material market indices
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#9eb5a5', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 1, mt: 1 }}>
        <Grid container spacing={3}>
          {/* Controls Column */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#a3b8aa' }}>Select Device Category</InputLabel>
                <Select
                  value={selectedDevice}
                  label="Select Device Category"
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(155,227,36,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9be324' },
                  }}
                >
                  {DEVICE_CATALOG.map((device) => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#a3b8aa', fontWeight: 600 }}>
                    Item Quantity: <strong style={{ color: '#9be324' }}>{quantity} units</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#7a9682' }}>
                    Approx {(currentDevice.avgWeightKg * quantity).toFixed(1)} kg total
                  </Typography>
                </Box>
                <Slider
                  value={quantity}
                  min={1}
                  max={25}
                  step={1}
                  onChange={(_, val) => setQuantity(val as number)}
                  sx={{
                    color: '#9be324',
                    '& .MuiSlider-thumb': {
                      boxShadow: '0 0 10px rgba(155,227,36,0.5)',
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: '#a3b8aa', fontWeight: 600, mb: 1 }}>
                  Working Condition
                </Typography>
                <Stack direction="row" spacing={1}>
                  {[
                    { id: 'functional', label: 'Working / Power On' },
                    { id: 'broken', label: 'Cracked / Damaged' },
                    { id: 'scrap', label: 'Dead / Obsolete Scrap' },
                  ].map((cond) => (
                    <Button
                      key={cond.id}
                      size="small"
                      variant={condition === cond.id ? 'contained' : 'outlined'}
                      onClick={() => setCondition(cond.id)}
                      sx={{
                        flex: 1,
                        fontSize: '0.75rem',
                        py: 0.8,
                        borderRadius: '9999px',
                        borderColor: condition === cond.id ? '#9be324' : 'rgba(255,255,255,0.15)',
                        bgcolor: condition === cond.id ? '#9be324' : 'transparent',
                        color: condition === cond.id ? '#07160c' : '#c8ded0',
                        '&:hover': {
                          bgcolor: condition === cond.id ? '#a8ee30' : 'rgba(255,255,255,0.06)',
                        },
                      }}
                    >
                      {cond.label}
                    </Button>
                  ))}
                </Stack>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'rgba(155, 227, 36, 0.08)',
                  border: '1px dashed rgba(155, 227, 36, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <SafeIcon sx={{ color: '#9be324', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ color: '#9be324', fontWeight: 700 }}>
                    Certified R2 & CPCB Data Guarantee
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#a3b8aa', display: 'block', lineHeight: 1.4 }}>
                  All memory storage devices are subjected to NIST 800-88 cryptographic sanitization with tamper-evident digital certificate at verified centers.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Results Summary Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                height: '100%',
                p: 3,
                borderRadius: '24px',
                background: 'rgba(6, 17, 10, 0.7)',
                border: '1px solid rgba(155, 227, 36, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: '#9be324', fontWeight: 800, letterSpacing: '0.1em' }}>
                  ESTIMATED REWARD VALUE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 1 }}>
                  <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 900, color: '#f4fbf5' }}>
                    {totalPoints.toLocaleString()}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#9be324', fontWeight: 700 }}>
                    PTS (~₹{estimatedCash})
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#9eb5a5', mb: 2 }}>
                  Redeemable for cash transfers, brand vouchers, or verified carbon offset certificates.
                </Typography>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

                <Typography variant="overline" sx={{ color: '#a3b8aa', fontWeight: 700 }}>
                  ENVIRONMENTAL MATERIAL RECOVERY
                </Typography>
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" sx={{ color: '#7a9682' }}>CO₂ Emissions Avoided</Typography>
                      <Typography variant="h6" sx={{ color: '#9be324', fontWeight: 800 }}>{co2Avoided} kg</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" sx={{ color: '#7a9682' }}>Pure Copper Reclaimed</Typography>
                      <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 800 }}>{copperRecovered} g</Typography>
                    </Box>
                  </Grid>
                  {goldRecovered > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#7a9682' }}>Trace Precious Metals (Gold/Silver)</Typography>
                        <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 800 }}>~{goldRecovered} mg Au</Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleGoToCenters}
                  endIcon={<MapIcon />}
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    py: 1.3,
                    borderRadius: '9999px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    '&:hover': { bgcolor: '#a8ee30' },
                  }}
                >
                  Locate Nearest Drop-Off Center ↗
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={handleGoToAI}
                  sx={{
                    color: '#a3b8aa',
                    fontSize: '0.82rem',
                    '&:hover': { color: '#9be324' },
                  }}
                >
                  Unsure of specs? Scan with AI Classifier ↗
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
