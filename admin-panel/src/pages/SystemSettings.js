import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Settings,
  Security,
  Notifications,
  Api,
  Backup,
  CloudUpload,
  Refresh,
  Save,
  Restore,
  Delete,
  Edit,
  Visibility,
  VisibilityOff,
  ExpandMore,
  Warning,
  CheckCircle,
  Error,
  Info,
  Lock,
  Email,
  Sms,
  Language,
  CurrencyExchange,
  Storage,
  Speed,
  People,
  Timeline,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    // General Settings
    platformName: "Crypto Trading Platform",
    platformEmail: "support@croktrade.com",
    supportPhone: "+1 (555) 123-4567",
    defaultLanguage: "en",
    timezone: "UTC",
    currency: "USD",

    // Security Settings
    twoFARequired: true,
    loginAttempts: 5,
    sessionTimeout: 30,
    ipWhitelist: [],
    maintenanceMode: false,

    // Trading Settings
    tradingEnabled: true,
    maxLeverage: 100,
    minTradeAmount: 10,
    maxTradeAmount: 1000000,
    takerFee: 0.1,
    makerFee: 0.05,
    fundingRate: 0.01,

    // Withdrawal Settings
    withdrawalEnabled: true,
    withdrawalLimit24h: 50000,
    withdrawalFeeBTC: 0.0005,
    withdrawalFeeETH: 0.005,
    withdrawalFeeUSDT: 10,
    kycRequiredForWithdrawal: true,

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    depositNotifications: true,
    withdrawalNotifications: true,
    tradeNotifications: true,

    // API Settings
    apiEnabled: true,
    rateLimit: 1000,
    ipRestriction: true,
    webhookUrl: "https://webhook.croktrade.com",

    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    lastBackup: "2024-01-15 02:00:00",
  });

  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [apiKeyDialog, setApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [expanded, setExpanded] = useState("general");

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "ru", name: "Russian" },
  ];

  const timezones = [
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CNY"];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Settings saved successfully");
      setLoading(false);
    }, 1000);
  };

  const handleResetSettings = () => {
    toast.success("Settings reset to default");
    // Reset to initial state
    fetchSettings();
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddIP = () => {
    if (ipAddress && !settings.ipWhitelist.includes(ipAddress)) {
      handleSettingChange("ipWhitelist", [...settings.ipWhitelist, ipAddress]);
      setIpAddress("");
      toast.success("IP address added");
    }
  };

  const handleRemoveIP = (ip) => {
    handleSettingChange(
      "ipWhitelist",
      settings.ipWhitelist.filter((item) => item !== ip),
    );
    toast.success("IP address removed");
  };

  const handleGenerateAPIKey = () => {
    const key =
      "sk_live_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    setNewApiKey(key);
    setApiKeyDialog(true);
  };

  const SettingSection = ({ title, icon, children }) => (
    <Card className="admin-card" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: "rgba(0, 211, 149, 0.1)", color: "#00D395" }}>
            {icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  const SettingItem = ({
    label,
    description,
    children,
    type = "text",
    min,
    max,
    step,
  }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
        {label}
      </Typography>
      {description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          {description}
        </Typography>
      )}
      {type === "switch" ? (
        <FormControlLabel
          control={
            <Switch
              checked={children}
              onChange={(e) =>
                handleSettingChange(
                  label.toLowerCase().replace(/ /g, ""),
                  e.target.checked,
                )
              }
              color="primary"
            />
          }
          label={children ? "Enabled" : "Disabled"}
        />
      ) : type === "slider" ? (
        <Box sx={{ px: 2 }}>
          <Slider
            value={children}
            onChange={(e, value) =>
              handleSettingChange(label.toLowerCase().replace(/ /g, ""), value)
            }
            min={min}
            max={max}
            step={step}
            valueLabelDisplay="auto"
          />
        </Box>
      ) : type === "select" ? (
        <Select
          value={children}
          onChange={(e) =>
            handleSettingChange(
              label.toLowerCase().replace(/ /g, ""),
              e.target.value,
            )
          }
          fullWidth
          size="small"
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <TextField
          fullWidth
          size="small"
          value={children}
          onChange={(e) =>
            handleSettingChange(
              label.toLowerCase().replace(/ /g, ""),
              e.target.value,
            )
          }
          type={type}
        />
      )}
    </Box>
  );

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure platform settings and preferences
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettings}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Restore />}
            onClick={handleResetSettings}
            disabled={loading}
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": { fontWeight: "bold" },
          }}
        >
          <Tab label="General" />
          <Tab label="Security" />
          <Tab label="Trading" />
          <Tab label="Withdrawals" />
          <Tab label="Notifications" />
          <Tab label="API" />
          <Tab label="Backup" />
        </Tabs>
      </Paper>

      {/* Settings Content */}
      <Box>
        {activeTab === 0 && (
          <>
            <SettingSection title="General Settings" icon={<Settings />}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Platform Name">
                    {settings.platformName}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Support Email" type="email">
                    {settings.platformEmail}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Support Phone">
                    {settings.supportPhone}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Default Language" type="select">
                    {settings.defaultLanguage}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.timezone}
                      label="Timezone"
                      onChange={(e) =>
                        handleSettingChange("timezone", e.target.value)
                      }
                    >
                      {timezones.map((tz) => (
                        <MenuItem key={tz} value={tz}>
                          {tz}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Default Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      label="Default Currency"
                      onChange={(e) =>
                        handleSettingChange("currency", e.target.value)
                      }
                    >
                      {currencies.map((curr) => (
                        <MenuItem key={curr} value={curr}>
                          {curr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </SettingSection>

            <SettingSection title="System Status" icon={<Speed />}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "rgba(0, 211, 149, 0.05)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      99.9%
                    </Typography>
                    <Chip
                      label="Good"
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "rgba(255, 107, 107, 0.05)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Server Load
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      45%
                    </Typography>
                    <Chip
                      label="Normal"
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "rgba(255, 193, 7, 0.05)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Database
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      2.4 GB
                    </Typography>
                    <Chip
                      label="Healthy"
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "rgba(67, 97, 238, 0.05)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Active Users
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      1,245
                    </Typography>
                    <Chip
                      label="Online"
                      size="small"
                      color="info"
                      sx={{ mt: 1 }}
                    />
                  </Card>
                </Grid>
              </Grid>
            </SettingSection>
          </>
        )}

        {activeTab === 1 && (
          <>
            <SettingSection title="Security Settings" icon={<Security />}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SettingItem label="2FA Required" type="switch">
                    {settings.twoFARequired}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Maintenance Mode" type="switch">
                    {settings.maintenanceMode}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem
                    label="Max Login Attempts"
                    description="Number of failed login attempts before lockout"
                    type="slider"
                    min={1}
                    max={10}
                    step={1}
                  >
                    {settings.loginAttempts}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem
                    label="Session Timeout (minutes)"
                    description="Inactivity timeout for user sessions"
                    type="slider"
                    min={5}
                    max={120}
                    step={5}
                  >
                    {settings.sessionTimeout}
                  </SettingItem>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    IP Whitelist
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Enter IP address (e.g., 192.168.1.1)"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="outlined" onClick={handleAddIP}>
                      Add IP
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {settings.ipWhitelist.map((ip, index) => (
                      <Chip
                        key={index}
                        label={ip}
                        onDelete={() => handleRemoveIP(ip)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {settings.ipWhitelist.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No IP addresses whitelisted
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </SettingSection>

            <SettingSection title="Security Audit Log" icon={<Lock />}>
              <List>
                {[
                  {
                    action: "Login attempt",
                    user: "admin@croktrade.com",
                    ip: "192.168.1.1",
                    time: "2 minutes ago",
                    status: "success",
                  },
                  {
                    action: "Settings changed",
                    user: "Admin User",
                    ip: "192.168.1.2",
                    time: "15 minutes ago",
                    status: "warning",
                  },
                  {
                    action: "Failed login",
                    user: "unknown@email.com",
                    ip: "203.0.113.1",
                    time: "1 hour ago",
                    status: "error",
                  },
                  {
                    action: "User created",
                    user: "Admin User",
                    ip: "192.168.1.1",
                    time: "3 hours ago",
                    status: "success",
                  },
                ].map((log, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {log.status === "success" && (
                        <CheckCircle color="success" />
                      )}
                      {log.status === "warning" && <Warning color="warning" />}
                      {log.status === "error" && <Error color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.action}
                      secondary={`${log.user} • ${log.ip} • ${log.time}`}
                    />
                    <Chip label={log.status} size="small" color={log.status} />
                  </ListItem>
                ))}
              </List>
            </SettingSection>
          </>
        )}

        {activeTab === 2 && (
          <SettingSection title="Trading Settings" icon={<Timeline />}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingItem label="Trading Enabled" type="switch">
                  {settings.tradingEnabled}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem
                  label="Max Leverage"
                  description="Maximum leverage allowed for trading"
                  type="slider"
                  min={1}
                  max={100}
                  step={1}
                >
                  {settings.maxLeverage}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="Minimum Trade Amount (USD)" type="number">
                  {settings.minTradeAmount}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="Maximum Trade Amount (USD)" type="number">
                  {settings.maxTradeAmount}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem
                  label="Taker Fee (%)"
                  description="Fee for market orders"
                  type="slider"
                  min={0.01}
                  max={0.5}
                  step={0.01}
                >
                  {settings.takerFee}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem
                  label="Maker Fee (%)"
                  description="Fee for limit orders"
                  type="slider"
                  min={0.01}
                  max={0.3}
                  step={0.01}
                >
                  {settings.makerFee}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem
                  label="Funding Rate (%)"
                  description="Perpetual swap funding rate"
                  type="slider"
                  min={0.001}
                  max={0.1}
                  step={0.001}
                >
                  {settings.fundingRate}
                </SettingItem>
              </Grid>
            </Grid>
          </SettingSection>
        )}

        {activeTab === 3 && (
          <SettingSection
            title="Withdrawal Settings"
            icon={<CurrencyExchange />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingItem label="Withdrawals Enabled" type="switch">
                  {settings.withdrawalEnabled}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="KYC Required" type="switch">
                  {settings.kycRequiredForWithdrawal}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="24h Withdrawal Limit (USD)" type="number">
                  {settings.withdrawalLimit24h}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="BTC Withdrawal Fee" type="number">
                  {settings.withdrawalFeeBTC}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="ETH Withdrawal Fee" type="number">
                  {settings.withdrawalFeeETH}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="USDT Withdrawal Fee" type="number">
                  {settings.withdrawalFeeUSDT}
                </SettingItem>
              </Grid>
            </Grid>
          </SettingSection>
        )}

        {activeTab === 4 && (
          <SettingSection
            title="Notification Settings"
            icon={<Notifications />}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SettingItem label="Email Notifications" type="switch">
                  {settings.emailNotifications}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="SMS Notifications" type="switch">
                  {settings.smsNotifications}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="Push Notifications" type="switch">
                  {settings.pushNotifications}
                </SettingItem>
              </Grid>
              <Divider sx={{ my: 2, width: "100%" }} />
              <Grid item xs={12} md={6}>
                <SettingItem label="Deposit Notifications" type="switch">
                  {settings.depositNotifications}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="Withdrawal Notifications" type="switch">
                  {settings.withdrawalNotifications}
                </SettingItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <SettingItem label="Trade Notifications" type="switch">
                  {settings.tradeNotifications}
                </SettingItem>
              </Grid>
            </Grid>
          </SettingSection>
        )}

        {activeTab === 5 && (
          <>
            <SettingSection title="API Settings" icon={<Api />}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SettingItem label="API Enabled" type="switch">
                    {settings.apiEnabled}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="IP Restriction" type="switch">
                    {settings.ipRestriction}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Rate Limit (requests/min)" type="number">
                    {settings.rateLimit}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Webhook URL" type="url">
                    {settings.webhookUrl}
                  </SettingItem>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<Lock />}
                    onClick={handleGenerateAPIKey}
                  >
                    Generate New API Key
                  </Button>
                </Grid>
              </Grid>
            </SettingSection>

            <SettingSection title="API Keys" icon={<Api />}>
              <List>
                {[
                  {
                    name: "Trading Bot",
                    key: "sk_live_********abcd",
                    created: "2024-01-10",
                    permissions: ["read", "trade"],
                  },
                  {
                    name: "Analytics Dashboard",
                    key: "sk_live_********efgh",
                    created: "2024-01-05",
                    permissions: ["read"],
                  },
                  {
                    name: "Mobile App",
                    key: "sk_live_********ijkl",
                    created: "2024-01-01",
                    permissions: ["read", "trade", "withdraw"],
                  },
                ].map((api, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <Api />
                    </ListItemIcon>
                    <ListItemText
                      primary={api.name}
                      secondary={`Created: ${api.created} • Key: ${api.key}`}
                    />
                    <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                      {api.permissions.map((perm) => (
                        <Chip key={perm} label={perm} size="small" />
                      ))}
                    </Box>
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </SettingSection>
          </>
        )}

        {activeTab === 6 && (
          <>
            <SettingSection title="Backup Settings" icon={<Backup />}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SettingItem label="Auto Backup" type="switch">
                    {settings.autoBackup}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={settings.backupFrequency}
                      label="Backup Frequency"
                      onChange={(e) =>
                        handleSettingChange("backupFrequency", e.target.value)
                      }
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SettingItem
                    label="Retention Days"
                    type="slider"
                    min={1}
                    max={90}
                    step={1}
                  >
                    {settings.backupRetention}
                  </SettingItem>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    startIcon={<CloudUpload />}
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    Backup Now
                  </Button>
                </Grid>
              </Grid>
            </SettingSection>

            <SettingSection title="Backup History" icon={<Storage />}>
              <List>
                {[
                  {
                    name: "Full Backup",
                    size: "2.4 GB",
                    date: "2024-01-15 02:00:00",
                    status: "success",
                  },
                  {
                    name: "Database Backup",
                    size: "1.2 GB",
                    date: "2024-01-14 02:00:00",
                    status: "success",
                  },
                  {
                    name: "Transaction Logs",
                    size: "450 MB",
                    date: "2024-01-13 02:00:00",
                    status: "success",
                  },
                  {
                    name: "User Data",
                    size: "780 MB",
                    date: "2024-01-12 02:00:00",
                    status: "warning",
                  },
                  {
                    name: "System Logs",
                    size: "120 MB",
                    date: "2024-01-11 02:00:00",
                    status: "success",
                  },
                ].map((backup, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {backup.status === "success" ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Warning color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={backup.name}
                      secondary={`${backup.date} • ${backup.size}`}
                    />
                    <Button size="small">Restore</Button>
                    <IconButton size="small">
                      <Delete />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </SettingSection>
          </>
        )}
      </Box>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)}>
        <DialogTitle>New API Key Generated</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Save this key now! You won't be able to see it again.
          </Alert>
          <TextField
            fullWidth
            value={newApiKey}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            Copy this key and store it securely. It will be shown only once.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(newApiKey);
              toast.success("API key copied to clipboard");
              setApiKeyDialog(false);
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      {/* Danger Zone */}
      <Card sx={{ mt: 3, border: "2px solid #FF6B6B" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Warning sx={{ color: "#FF6B6B", fontSize: 40 }} />
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#FF6B6B" }}
              >
                Danger Zone
              </Typography>
              <Typography variant="caption" color="text.secondary">
                These actions are irreversible. Proceed with caution.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<Delete />}
                onClick={() =>
                  toast.error("This feature is disabled in demo mode")
                }
              >
                Clear All Logs
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<Refresh />}
                onClick={() =>
                  toast.error("This feature is disabled in demo mode")
                }
              >
                Reset Database
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<Warning />}
                onClick={() =>
                  toast.error("This feature is disabled in demo mode")
                }
              >
                Shutdown Platform
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemSettings;
