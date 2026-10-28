import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  CheckCircle as ConfirmIcon,
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  LocationOn as MapIcon,
  MenuBook as GuideIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AIClassifyResponse } from '../types';

export const AIClassifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIClassifyResponse | null>(null);
  const [confirmedCategory, setConfirmedCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.classifyDevicePhoto(selectedFile);
      setResult(data);
      setConfirmedCategory(data.predicted_category_code);
    } catch (err: any) {
      setError(err.message || 'Image classification failed. Ensure the image is JPEG, PNG, or WebP and under 10MB.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Chip
          icon={<AIIcon />}
          label="PYTORCH MOBILENETV3 CLASSIFIER"
          color="secondary"
          size="small"
          sx={{ mb: 2, fontWeight: 700 }}
        />
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', color: '#f3f4f6' }}>
          Smart AI Device Classifier
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 650, mx: 'auto', mt: 1 }}>
          Snap or upload a photo of your obsolete device. Our neural network analyzes visual contours to suggest
          e-waste categories, handling priority levels, and recycling guidelines.
        </Typography>
      </Box>

      {/* Mandatory Safety Notice */}
      <Alert
        severity="warning"
        icon={<SecurityIcon />}
        sx={{
          mb: 4,
          borderRadius: 3,
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
        }}
      >
        <strong>Safety & Suggestion Notice:</strong> AI predictions are assistive suggestions, not certified safety
        assessments. Always review the predicted category and follow manual battery removal and data wipe guidelines.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Upload Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Box
              sx={{
                border: '2px dashed rgba(16, 185, 129, 0.4)',
                borderRadius: 4,
                p: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.06)',
                },
              }}
              component="label"
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <Box>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      maxWidth: '100%',
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: loading ? '0 0 30px rgba(155, 227, 36, 0.4)' : '0 8px 20px rgba(0,0,0,0.5)',
                      transition: 'box-shadow 0.3s ease',
                      mb: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="Uploaded Device"
                      sx={{
                        maxHeight: 280,
                        maxWidth: '100%',
                        display: 'block',
                        borderRadius: 3,
                        filter: loading ? 'brightness(0.9) contrast(1.1)' : 'none',
                        transition: 'filter 0.3s ease',
                      }}
                    />

                    {/* Scanning Laser Beam & Matrix Grid Overlay */}
                    {loading && (
                      <>
                        <Box className="laser-scanner-line" />
                        <Box
                          className="scanner-active-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 12,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'rgba(7, 18, 10, 0.85)',
                            border: '1px solid #9be324',
                            color: '#9be324',
                            px: 2,
                            py: 0.5,
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            backdropFilter: 'blur(8px)',
                            zIndex: 11,
                          }}
                        >
                          <CircularProgress size={12} sx={{ color: '#9be324' }} />
                          SCANNING CONTOURS...
                        </Box>
                      </>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ color: '#9be324', fontWeight: 600 }}>
                    {selectedFile?.name} ({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
                    Click to choose a different photo
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 56, color: '#9be324', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 0.5 }}>
                    Choose Device Photo
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Click to browse or drag image here (JPEG, PNG, WebP)
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={!selectedFile || loading}
              onClick={handleClassify}
              className="btn-premium-interactive"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                bgcolor: '#9be324',
                color: '#07160c',
                fontWeight: 800,
                borderRadius: '9999px',
                '&:hover': { bgcolor: '#a8ee30' },
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.12)', color: 'rgba(255, 255, 255, 0.3)' },
              }}
            >
              {loading ? 'Running Neural Analysis...' : 'Run AI Classification'}
            </Button>
          </Card>
        </Grid>

        {/* Prediction Results Column */}
        <Grid size={{ xs: 12, md: 6 }}>
          {result ? (
            <Card className="page-transition-enter" sx={{ p: 3, height: '100%', border: '1px solid rgba(155, 227, 36, 0.3)', borderRadius: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', mb: 2 }}>
                Classification Report
              </Typography>

              {/* Low Confidence Warning */}
              {result.is_low_confidence && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                  Low prediction confidence (&lt; 65%). Please verify or manually select the category below.
                </Alert>
              )}

              {/* Best Prediction Chip & Confidence */}
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.04)', mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                  TOP DETECTED CATEGORY
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#9be324', fontFamily: '"Outfit", sans-serif' }}>
                    {result.predicted_category_code}
                  </Typography>
                  <Chip
                    label={`${(result.confidence * 100).toFixed(1)}% match`}
                    color={result.is_low_confidence ? 'warning' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={result.confidence * 100}
                  color={result.is_low_confidence ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.08)' }}
                />
              </Box>

              {/* Top Alternative Predictions */}
              <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, mb: 1, display: 'block' }}>
                PROBABILITY DISTRIBUTION
              </Typography>
              <Stack spacing={1} sx={{ mb: 3 }}>
                {result.top_predictions.map((p) => (
                  <Box key={p.category_code} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                      {p.category_code}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#9ca3af' }}>
                      {(p.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

              {/* Confirm or Correct Flow */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Confirm or Correct Category:
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                <InputLabel shrink>Final Category</InputLabel>
                <Select
                  value={confirmedCategory}
                  label="Final Category"
                  onChange={(e) => setConfirmedCategory(e.target.value)}
                >
                  <MenuItem value="SMARTPHONE">Smartphones & Mobile Devices (SMARTPHONE)</MenuItem>
                  <MenuItem value="LAPTOP">Laptops & Notebooks (LAPTOP)</MenuItem>
                  <MenuItem value="TABLET">Tablets & E-Readers (TABLET)</MenuItem>
                  <MenuItem value="BATTERY">Lithium-Ion Batteries (BATTERY)</MenuItem>
                  <MenuItem value="PCB">Printed Circuit Boards (PCB)</MenuItem>
                  <MenuItem value="SMALL_APPLIANCE">Small Household Electronics (SMALL_APPLIANCE)</MenuItem>
                </Select>
              </FormControl>

              {/* Next Steps CTA */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  className="btn-premium-interactive"
                  startIcon={<ConfirmIcon />}
                  onClick={() => navigate(`/submit?category=${confirmedCategory}&photo_id=${result.photo_id}`)}
                  sx={{
                    bgcolor: '#9be324',
                    color: '#07160c',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    '&:hover': { bgcolor: '#a8ee30' },
                  }}
                >
                  Submit Evidence
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  className="btn-premium-interactive"
                  startIcon={<MapIcon />}
                  onClick={() => navigate('/centers')}
                  sx={{
                    color: '#9be324',
                    borderColor: 'rgba(155, 227, 36, 0.4)',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    '&:hover': { borderColor: '#9be324', bgcolor: 'rgba(155, 227, 36, 0.08)' },
                  }}
                >
                  Find Centers
                </Button>
              </Stack>
            </Card>
          ) : (
            <Card sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <AIIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#9ca3af' }}>
                Classification Output
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 300, mt: 1 }}>
                Upload a device photo on the left and run analysis to inspect predicted categories and confidence scores.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
