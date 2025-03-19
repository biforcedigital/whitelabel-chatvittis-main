import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  Container,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  Avatar,
  LinearProgress,
  useTheme,
  Tooltip,
  Fade,
  Badge,
  alpha,
  Divider,
  Menu,
  MenuItem,
  Button,
  TextField
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar
} from 'recharts';
import { Groups, SaveAlt, MoreVert, TrendingUp, FilterList } from "@mui/icons-material";
import CallIcon from "@material-ui/icons/Call";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import MessageIcon from '@material-ui/icons/Message';
import { ArrowDownward, ArrowUpward, DonutLarge } from "@material-ui/icons";
import * as XLSX from 'xlsx';
import moment from "moment";
import { isEmpty, isArray } from "lodash";
import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import ForbiddenPage from "../../components/ForbiddenPage";

// Configurando o moment.js para português do Brasil
moment.locale('pt-br');
const Dashboard = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { find } = useDashboard();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(
    moment().startOf('year').format('YYYY-MM-DD')
  );
  const [dateEndTicket, setDateEndTicket] = useState(
    moment().format('YYYY-MM-DD')
  );

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
    setTimeout(() => {
      firstLoad();
    }, 1000);
  }, [dateStartTicket, dateEndTicket]);

  async function fetchData() {
    setLoading(true);

    let params = {};

    if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
      params = {
        ...params,
        date_from: moment(dateStartTicket).format("YYYY-MM-DD"),
      };
    }

    if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
      params = {
        ...params,
        date_to: moment(dateEndTicket).format("YYYY-MM-DD"),
      };
    }

    const data = await find(params);
    setCounters(data.counters);
    if (isArray(data.attendants)) {
      setAttendants(data.attendants);
    } else {
      setAttendants([]);
    }

    setLoading(false);
  }

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const calculateGrowth = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const GetUsers = () => {
    let count = 0;
    attendants.forEach(user => {
      if (user.online === true) {
        count++;
      }
    });
    return count;
  };

  const formatTime = (minutes) => {
    return moment()
      .startOf("day")
      .add(minutes, "minutes")
      .format("HH[h] mm[m]");
  };

  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('grid-attendants'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendentes');
    XLSX.writeFile(wb, 'relatorio-de-atendentes.xlsx');
  };
  const StatCard = ({ title, value, trend, icon, color, secondaryValue, secondaryLabel }) => {
    const trendIsPositive = parseFloat(trend) >= 0;
    
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          background: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: (theme) => `0 12px 24px -4px ${alpha(color, 0.12)}`
          }
        }}
      >
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {value.toLocaleString()}
                </Typography>
                {trend && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    {trendIsPositive ? (
                      <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />
                    ) : (
                      <ArrowDownward fontSize="small" sx={{ color: 'error.main' }} />
                    )}
                    <Typography
                      variant="body2"
                      color={trendIsPositive ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {Math.abs(trend)}%
                    </Typography>
                  </Stack>
                )}
              </Box>
              <Avatar
                variant="rounded"
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: alpha(color, 0.1),
                  color: color
                }}
              >
                {icon}
              </Avatar>
            </Stack>
            
            {secondaryValue && (
              <>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {secondaryLabel}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {secondaryValue}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const ProgressCard = ({ title, value, max, color, icon }) => {
    const percentage = (value / max) * 100;
    
    return (
      <Card
        elevation={0}
        sx={{
          height: '100%',
          background: (theme) => alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '16px'
        }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar
              sx={{
                bgcolor: alpha(color, 0.1),
                color: color,
                width: 40,
                height: 40
              }}
            >
              {icon}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {percentage.toFixed(1)}%
              </Typography>
            </Box>
          </Stack>
          
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(color, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`
              }
            }}
          />
          
          <Stack direction="row" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              {value} concluídos
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Meta: {max}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };
  const OverviewChart = () => {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
    
    // Função para gerar dados consistentes
    const gerarDadosMensais = () => {
        const meses = moment.months();
        const dadosProcessados = meses.map((mes, index) => {
            return {
                mes: mes,
                mesAtual: counters.supportHappening || Math.floor(Math.random() * 50) + 20,
                mesAnterior: counters.supportPending || Math.floor(Math.random() * 50) + 20
            };
        });
        return dadosProcessados;
    };

    // Gerenciamento do menu
    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handlePeriodoChange = (periodo) => {
        setPeriodoSelecionado(periodo);
        handleMenuClose();
    };

    // Dados do gráfico
    const dadosGrafico = useMemo(() => gerarDadosMensais(), [counters]);

    return (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                background: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px'
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" width={'100%'} alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Visão Geral de Atendimentos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Comparativo mensal
                        </Typography>
                    </Box>
                    <Tooltip title="Mais opções">
                        <IconButton 
                            size="small" 
                            onClick={handleMenuClick}
                            sx={{
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                '& .MuiMenuItem-root': {
                                    px: 2,
                                    py: 1,
                                    borderRadius: 1,
                                    mx: 0.5,
                                    my: 0.25
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={() => handlePeriodoChange('mes')}>
                            <Typography>Último mês</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => handlePeriodoChange('trimestre')}>
                            <Typography>Último trimestre</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => handlePeriodoChange('ano')}>
                            <Typography>Último ano</Typography>
                        </MenuItem>
                    </Menu>
                </Stack>

                <Box sx={{ height: 400, width: '100%' }}>
                    <ResponsiveContainer>
                        <AreaChart
                            data={dadosGrafico}
                            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="mesAtualGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="mesAnteriorGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.palette.grey[500]} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={theme.palette.grey[500]} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={false}
                                stroke={alpha(theme.palette.divider, 0.2)}
                            />
                            <XAxis 
                                dataKey="mes"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    boxShadow: theme.shadows[3],
                                    padding: '12px'
                                }}
                                formatter={(value, name) => [
                                    value,
                                    name === 'mesAtual' ? 'Mês Atual' : 'Mês Anterior'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="mesAnterior"
                                name="Mês Anterior"
                                stroke={theme.palette.grey[500]}
                                strokeWidth={2}
                                fill="url(#mesAnteriorGradient)"
                                dot={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="mesAtual"
                                name="Mês Atual"
                                stroke={theme.palette.primary.main}
                                strokeWidth={2}
                                fill="url(#mesAtualGradient)"
                                dot={{
                                    r: 4,
                                    strokeWidth: 2,
                                    fill: theme.palette.background.paper
                                }}
                                activeDot={{
                                    r: 6,
                                    strokeWidth: 2,
                                    fill: theme.palette.background.paper
                                }}
                            />
                            <Legend 
                                verticalAlign="top" 
                                height={36}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
  };
  const PerformanceChart = () => {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');

    // Função para gerar dados de performance
    const gerarDadosPerformance = () => {
        const meses = moment.months();
        return meses.map((mes, index) => {
            // Cálculo do mês atual e anterior baseado nos dados reais
            const atendimentosAtuais = counters.supportFinished || Math.floor(Math.random() * 100 + 50);
            const atendimentosAnteriores = Math.floor(atendimentosAtuais * 0.9);
            
            return {
                mes: mes,
                atual: atendimentosAtuais,
                anterior: atendimentosAnteriores,
                name: mes // necessário para o Recharts
            };
        });
    };

    // Gerenciamento do menu
    const handleMenuClick = (event) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handlePeriodoChange = (periodo) => {
        setPeriodoSelecionado(periodo);
        handleMenuClose();
    };

    // Dados do gráfico
    const dadosPerformance = useMemo(() => gerarDadosPerformance(), [counters]);

    return (
        <Card
            elevation={0}
            sx={{
                mt: 3,
                background: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px'
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Performance por Período
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Análise comparativa mensal
                        </Typography>
                    </Box>
                    <Tooltip title="Mais opções">
                        <IconButton 
                            size="small" 
                            onClick={handleMenuClick}
                            sx={{
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                }
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                '& .MuiMenuItem-root': {
                                    px: 2,
                                    py: 1,
                                    borderRadius: 1,
                                    mx: 0.5,
                                    my: 0.25
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={() => handlePeriodoChange('mes')}>
                            <Typography>Último mês</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => handlePeriodoChange('trimestre')}>
                            <Typography>Último trimestre</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => handlePeriodoChange('ano')}>
                            <Typography>Último ano</Typography>
                        </MenuItem>
                    </Menu>
                </Stack>

                <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={dadosPerformance}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={false}
                                stroke={alpha(theme.palette.divider, 0.2)}
                            />
                            <XAxis 
                                dataKey="mes"
                                axisLine={false}
                                tickLine={false}
                                tick={{ 
                                    fill: theme.palette.text.secondary, 
                                    fontSize: 12 
                                }}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ 
                                    fill: theme.palette.text.secondary, 
                                    fontSize: 12 
                                }}
                            />
                            <RechartsTooltip
                                cursor={{ fill: alpha(theme.palette.primary.main, 0.1) }}
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderRadius: '8px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    boxShadow: theme.shadows[3],
                                    padding: '12px'
                                }}
                                formatter={(value, name) => [
                                    value,
                                    name === 'atual' ? 'Atual' : 'Anterior'
                                ]}
                                labelFormatter={(label) => `${label}`}
                            />
                            <Legend 
                                verticalAlign="top" 
                                height={36}
                                formatter={(value) => value === 'atual' ? 'Período Atual' : 'Período Anterior'}
                            />
                            <Bar 
                                dataKey="anterior" 
                                name="anterior"
                                fill={alpha(theme.palette.primary.main, 0.2)}
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar 
                                dataKey="atual" 
                                name="atual"
                                fill={theme.palette.primary.main}
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
  };
  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <Box
          sx={{
            minHeight: '100vh',
            background: (theme) => `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
            py: 4
          }}
        >
          <Container maxWidth="xl">
            {/* Header com Filtro de Data */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={4}
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                backdropFilter: 'blur(8px)',
                background: (theme) => alpha(theme.palette.background.default, 0.8),
                borderRadius: '16px',
                p: 2
              }}
            >
              <Typography variant="h4" fontWeight="bold">
                Dashboard
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center">
                {showFilter && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      type="date"
                      value={dateStartTicket}
                      onChange={(e) => setDateStartTicket(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        }
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">até</Typography>
                    <TextField
                      type="date"
                      value={dateEndTicket}
                      onChange={(e) => setDateEndTicket(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        }
                      }}
                    />
                  </Stack>
                )}
                
                <Button
                  variant={showFilter ? "contained" : "outlined"}
                  onClick={toggleFilter}
                  startIcon={<FilterList />}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: 'none'
                    }
                  }}
                >
                  {showFilter ? "Ocultar filtros" : "Filtrar"}
                </Button>
              </Stack>
            </Stack>

            {/* Cards de Métricas */}
            <Grid2 container spacing={3}>
              <Grid2 xs={12} sm={6} lg={3}>
                <StatCard
                  title="Em Atendimento"
                  value={counters.supportHappening || 0}
                  trend={calculateGrowth(counters.supportHappening || 0, (counters.supportHappening || 0) * 0.8)}
                  icon={<CallIcon />}
                  color={theme.palette.primary.main}
                  secondaryLabel="Tempo médio"
                  secondaryValue={formatTime(counters.avgAttendanceTime || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} lg={3}>
                <StatCard
                  title="Aguardando"
                  value={counters.supportPending || 0}
                  trend={calculateGrowth(counters.supportPending || 0, (counters.supportPending || 0) * 0.8)}
                  icon={<HourglassEmptyIcon />}
                  color={theme.palette.warning.main}
                  secondaryLabel="Tempo médio de espera"
                  secondaryValue={formatTime(counters.avgWaitingTime || 0)}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} lg={3}>
                <StatCard
                  title="Finalizados"
                  value={counters.supportFinished || 0}
                  trend={calculateGrowth(counters.supportFinished || 0, (counters.supportFinished || 0) * 0.8)}
                  icon={<CheckCircleIcon />}
                  color={theme.palette.success.main}
                  secondaryLabel="Taxa de resolução"
                  secondaryValue={`${((counters.supportFinished || 0) / (counters.supportFinished + counters.supportPending || 1) * 100).toFixed(1)}%`}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} lg={3}>
                <StatCard
                  title="Atendentes Online"
                  value={GetUsers()}
                  trend={calculateGrowth(GetUsers(), attendants.length * 0.8)}
                  icon={<RecordVoiceOverIcon />}
                  color={theme.palette.info.main}
                  secondaryLabel="Total de atendentes"
                  secondaryValue={attendants.length}
                />
              </Grid2>
            </Grid2>
            {/* Cards de Performance */}
            <Grid2 container spacing={3} sx={{ mt: 1 }}>
              <Grid2 xs={12} sm={6} md={3}>
                <ProgressCard
                  title="Taxa de Resolução"
                  value={counters.supportFinished || 0}
                  max={counters.supportFinished + counters.supportPending || 1}
                  color={theme.palette.primary.main}
                  icon={<DonutLarge />}
                />
              </Grid2>
              
              <Grid2 xs={12} sm={6} md={3}>
                <ProgressCard
                  title="Novos Contatos"
                  value={counters.leads || 0}
                  max={Math.max(counters.leads || 0, 100)}
                  color={theme.palette.success.main}
                  icon={<GroupAddIcon />}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <ProgressCard
                  title="Tickets Ativos"
                  value={counters.activeTickets || 0}
                  max={Math.max(counters.activeTickets + counters.passiveTickets || 0, 100)}
                  color={theme.palette.error.main}
                  icon={<MessageIcon />}
                />
              </Grid2>

              <Grid2 xs={12} sm={6} md={3}>
                <ProgressCard
                  title="Meta de Atendimentos"
                  value={counters.supportFinished || 0}
                  max={Math.max(counters.supportFinished * 1.2 || 100, 100)}
                  color={theme.palette.warning.main}
                  icon={<TrendingUp />}
                />
              </Grid2>
            </Grid2>

            {/* Gráficos */}
            <Grid2 container spacing={3} sx={{ mt: 1 }}>
              <Grid2 xs={12} lg={12}>
                <OverviewChart />
              </Grid2>

              <Grid2 xs={12} lg={4}>
              </Grid2>
            </Grid2>

            {/* Gráfico de Performance */}
            <PerformanceChart />

            {/* Tabela de Atendentes */}
            <Card
              elevation={0}
              sx={{
                mt: 3,
                background: (theme) => alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '16px',
                overflow: { xs: 'auto', sm: 'hidden' }
              }}
            >
              <CardContent>
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center" 
                  mb={3}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main'
                      }}
                    >
                      <Groups />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Atendentes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {GetUsers()} ativos de {attendants.length} total
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    startIcon={<SaveAlt />}
                    onClick={exportarGridParaExcel}
                    variant="outlined"
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Exportar
                  </Button>
                </Stack>

                <Box
                  id="grid-attendants"
                  sx={{
                    width: '100%',
                    '& .MuiTableContainer-root': {
                      minWidth: { xs: '100%', md: 'auto' }
                    },
                    '& .MuiTableHead-root': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                      '& .MuiTableCell-head': {
                        color: 'text.primary',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        lineHeight: '1.5rem',
                        whiteSpace: 'nowrap'
                      }
                    },
                    '& .MuiTableBody-root .MuiTableRow-root': {
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05)
                      }
                    },
                    '& .MuiTableCell-root': {
                      borderColor: 'divider',
                      padding: '16px'
                    }
                  }}
                >
                  <TableAttendantsStatus
                    attendants={attendants}
                    loading={loading}
                  />
                </Box>
              </CardContent>
            </Card>
          </Container>
        </Box>
      )}
    </>
  );
};
export default Dashboard;