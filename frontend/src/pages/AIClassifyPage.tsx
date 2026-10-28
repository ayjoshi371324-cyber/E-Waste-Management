import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
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
  LocationOn as MapIcon,
  PictureAsPdf as PdfIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { AIClassifyResponse, DeviceCategory } from '../types';

const FALLBACK_CATEGORIES = [
  { code: 'SMARTPHONE', name: 'Smartphones & Mobile Devices' },
  { code: 'LAPTOP', name: 'Laptops & Notebooks' },
  { code: 'TABLET', name: 'Tablets & E-Readers' },
  { code: 'BATTERY', name: 'Lithium-Ion & Secondary Batteries' },
  { code: 'PCB', name: 'Printed Circuit Boards & Motherboards' },
  { code: 'MONITOR', name: 'Monitors & Displays' },
  { code: 'KEYBOARD_PERIPHERAL', name: 'Keyboards & Peripherals' },
  { code: 'CHARGER_CABLE', name: 'Chargers, Adapters & Cables' },
  { code: 'SMALL_APPLIANCE', name: 'Small Household Electronics' },
];

export const AIClassifyPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdfFile, setIsPdfFile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AIClassifyResponse | null>(null);
  const [confirmedCategory, setConfirmedCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ code: string; name: string }>>(FALLBACK_CATEGORIES);

  useEffect(() => {
    // Fetch supported categories from catalog
    api
      .getCategories()
      .then((catList: DeviceCategory[]) => {
        if (catList && catList.length > 0) {
          setCategories(catList.map((c) => ({ code: c.code, name: c.name })));
        }
      })
      .catch(() => {
        // Fallback categories remain active
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      // Validate file size (10 MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10 MB limit. Please choose a smaller file.');
        return;
      }

      // Validate allowed file types
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!isPdf && !allowedImageTypes.includes(file.type.toLowerCase())) {
        setError('Invalid file format. Please upload a JPEG, PNG, or WebP image, or a PDF document.');
        return;
      }

      setSelectedFile(file);
      setIsPdfFile(isPdf);
      setPreviewUrl(isPdf ? null : URL.createObjectURL(file));
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

      // Automatically preselect the predicted category in the dropdown
      if (data.predicted_category_code && data.predicted_category_code !== 'NON_EWASTE') {
        setConfirmedCategory(data.predicted_category_code);
      } else {
        // If non-ewaste was detected, preselect best alternative or default
        const bestAlt = data.top_predictions.find((p) => p.category_code !== 'NON_EWASTE')?.category_code || 'SMARTPHONE';
        setConfirmedCategory(bestAlt);
      }
    } catch (err: any) {
      setError(err.message || 'Classification failed. Please check the uploaded file and try again.');
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
          Upload a photo or multi-page PDF document of your electronic device. Our neural network analyzes visual
          features to classify e-waste categories, assess handling priority, and calculate recycling rewards.
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
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf,.pdf"
                hidden
                onChange={handleFileChange}
              />
              {selectedFile ? (
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
                    {isPdfFile ? (
                      <Box
                        sx={{
                          py: 4,
                          px: 5,
                          bgcolor: 'rgba(14, 31, 20, 0.7)',
                          border: '1px solid rgba(155, 227, 36, 0.3)',
                          borderRadius: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <PdfIcon sx={{ fontSize: 64, color: '#f87171' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f3f4f6' }}>
                          PDF Document Selected
                        </Typography>
                        <Chip
                          label="PDF ready for multi-page page extraction"
                          size="small"
                          sx={{ bgcolor: 'rgba(155, 227, 36, 0.15)', color: '#9be324', fontWeight: 700 }}
                        />
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={previewUrl || ''}
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
                    )}

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
                          SCANNING VISUAL CONTOURS...
                        </Box>
                      </>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ color: '#9be324', fontWeight: 600 }}>
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
                    Click to choose a different photo or PDF
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <UploadIcon sx={{ fontSize: 56, color: '#9be324', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 0.5 }}>
                    Choose Device Photo or PDF
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    Click to browse or drag file here (JPEG, PNG, WebP, or PDF up to 10MB)
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

              {/* PDF Extraction Badge if applicable */}
              {result.is_pdf && (
                <Alert
                  severity="info"
                  icon={<PdfIcon />}
                  sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd' }}
                >
                  Processed PDF document ({result.page_count} {result.page_count === 1 ? 'page' : 'pages'}, {result.images_detected} {result.images_detected === 1 ? 'image' : 'images'} extracted).
                </Alert>
              )}

              {/* Non-E-Waste or Low Confidence Warning */}
              {result.predicted_category_code === 'NON_EWASTE' ? (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                  <strong>No Electronic Waste Detected:</strong> The uploaded file does not appear to contain recognizable
                  electronic waste. If you intended to submit an e-waste item, please select the matching category from
                  the dropdown below or upload a clearer photo.
                </Alert>
              ) : result.is_low_confidence ? (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
                  Low prediction confidence (&lt; 60%). Please verify or select the correct category below.
                </Alert>
              ) : null}

              {/* Best Prediction Chip & Confidence */}
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'rgba(255, 255, 255, 0.04)', mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700 }}>
                  TOP DETECTED CATEGORY
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: result.predicted_category_code === 'NON_EWASTE' ? '#fbbf24' : '#9be324',
                      fontFamily: '"Outfit", sans-serif',
                    }}
                  >
                    {result.predicted_category_code === 'NON_EWASTE' ? 'UNRECOGNIZED / NON-E-WASTE' : result.predicted_category_code}
                  </Typography>
                  <Chip
                    label={`${(result.confidence * 100).toFixed(1)}% match`}
                    color={result.predicted_category_code === 'NON_EWASTE' ? 'warning' : result.is_low_confidence ? 'warning' : 'primary'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(result.confidence * 100, 100)}
                  color={result.predicted_category_code === 'NON_EWASTE' || result.is_low_confidence ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255, 255, 255, 0.08)' }}
                />
              </Box>

              {/* Top Alternative Predictions (Normalized to 100%) */}
              <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, mb: 1, display: 'block' }}>
                PROBABILITY DISTRIBUTION (NORMALIZED FROM MODEL)
              </Typography>
              <Stack spacing={1} sx={{ mb: 3 }}>
                {result.top_predictions.map((p) => (
                  <Box key={p.category_code} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                      {p.category_code === 'NON_EWASTE' ? 'NON-E-WASTE (UNRECOGNIZED)' : p.category_code}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#9be324' }}>
                      {(p.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

              {/* Automated Confirm or Correct Category Dropdown */}
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
                  {categories.map((cat) => (
                    <MenuItem key={cat.code} value={cat.code}>
                      {cat.name} ({cat.code})
                    </MenuItem>
                  ))}
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
              <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 320, mt: 1 }}>
                Upload a device photo or multi-page PDF on the left and run analysis to inspect predicted categories and confidence scores.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};
