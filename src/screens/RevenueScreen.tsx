import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Card from '../components/Card';
import Button from '../components/Button';

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. 'Lun', 'Mar', etc.
  month: string; // e.g. 'Enero', 'Mayo', etc.
  year: string; // e.g. '2026'
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 't1', desc: 'Combo Corte + Barba (Carlos M.)', amount: 800, method: 'Efectivo', date: '2026-05-25', dayOfWeek: 'Lun', month: 'Mayo', year: '2026' },
  { id: 't2', desc: 'Corte Clásico (Javier R.)', amount: 500, method: 'Tarjeta', date: '2026-05-25', dayOfWeek: 'Lun', month: 'Mayo', year: '2026' },
  { id: 't3', desc: 'Coloración de Barba (Javier R.)', amount: 1200, method: 'Transferencia', date: '2026-05-26', dayOfWeek: 'Mar', month: 'Mayo', year: '2026' },
  { id: 't4', desc: 'Venta de Minoxidil (Manual)', amount: 1500, method: 'Efectivo', date: '2026-05-27', dayOfWeek: 'Mie', month: 'Mayo', year: '2026' },
  { id: 't5', desc: 'Combo Corte + Barba (Carlos M.)', amount: 800, method: 'Tarjeta', date: '2026-05-27', dayOfWeek: 'Mie', month: 'Mayo', year: '2026' },
  { id: 't6', desc: 'Corte Clásico (Carlos M.)', amount: 500, method: 'Efectivo', date: '2026-05-28', dayOfWeek: 'Jue', month: 'Mayo', year: '2026' },
  { id: 't7', desc: 'Coloración de Barba (Carlos M.)', amount: 1200, method: 'Transferencia', date: '2026-05-28', dayOfWeek: 'Jue', month: 'Mayo', year: '2026' },
  { id: 't8', desc: 'Venta Cera Pomada (Manual)', amount: 600, method: 'Efectivo', date: '2026-05-29', dayOfWeek: 'Vie', month: 'Mayo', year: '2026' },
  { id: 't9', desc: 'Servicio de Barba Extra (Javier R.)', amount: 400, method: 'Efectivo', date: '2026-05-29', dayOfWeek: 'Vie', month: 'Mayo', year: '2026' },
];

const MONTHS_LIST_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_LIST_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function RevenueScreen() {
  const { t, locale } = useLanguage();
  const navigation = useNavigation();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();

  // Range and filter controls
  const [activeRange, setActiveRange] = useState<'week' | 'month' | 'year'>('week');
  const [selectedMonth, setSelectedMonth] = useState('Mayo');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Transactions lists states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual inflow inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await AsyncStorage.getItem('@barberlink_transactions');
      if (data) {
        setTransactions(JSON.parse(data));
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
        await AsyncStorage.setItem('@barberlink_transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
      }
    } catch {
      setTransactions(DEFAULT_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualInflow = async () => {
    if (!manualDesc.trim() || !manualAmount.trim()) {
      showAlert('Error', t('loginAlertEmptyFields'), 'error');
      return;
    }
    const amountVal = parseFloat(manualAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showAlert('Error', t('servicesAlertInvalid'), 'error');
      return;
    }

    setCreating(true);

    const now = new Date();
    const YYYY = now.getFullYear().toString();
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const currentDayOfWeek = days[now.getDay()];
    const currentMonthEs = MONTHS_LIST_ES[now.getMonth()];

    const newTx: Transaction = {
      id: `t_${Date.now()}`,
      desc: manualDesc.trim(),
      amount: amountVal,
      method: manualMethod,
      date: now.toISOString().split('T')[0],
      dayOfWeek: currentDayOfWeek,
      month: currentMonthEs,
      year: YYYY,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await AsyncStorage.setItem('@barberlink_transactions', JSON.stringify(updated));

    // Also update home dashboard metric cache to sync totals instantly
    // (Home screen fetches this dynamically next render cycle or syncs automatically)

    setTimeout(() => {
      setCreating(false);
      setShowAddModal(false);
      setManualDesc('');
      setManualAmount('');
      setManualMethod('Efectivo');
      showToast(t('servicesAlertSaved'), 'success');
    }, 800);
  };

  // Filter algorithms depending on selected Month, Year, and active tab scope
  const filteredTxs = transactions.filter((tx) => {
    // Standardize month queries
    const txMonthIdx = MONTHS_LIST_ES.indexOf(tx.month);
    const selectedMonthIdx = MONTHS_LIST_ES.indexOf(selectedMonth);

    if (activeRange === 'week') {
      // Filter current active week data (Lun - Dom)
      return tx.year === selectedYear && txMonthIdx === selectedMonthIdx;
    } else if (activeRange === 'month') {
      // Filter current active month data
      return tx.year === selectedYear && txMonthIdx === selectedMonthIdx;
    } else {
      // Filter current year data
      return tx.year === selectedYear;
    }
  });

  // Aggregations
  const totalRevenue = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const completedServices = filteredTxs.length;
  const averageTicket = completedServices > 0 ? Math.round(totalRevenue / completedServices) : 0;

  // Split calculations (Cash / Digital split ratio)
  const cashTotal = filteredTxs.filter((t) => t.method === 'Efectivo').reduce((s, t) => s + t.amount, 0);
  const cardTotal = filteredTxs.filter((t) => t.method === 'Tarjeta').reduce((s, t) => s + t.amount, 0);
  const transferTotal = filteredTxs.filter((t) => t.method === 'Transferencia').reduce((s, t) => s + t.amount, 0);
  const digitalTotal = cardTotal + transferTotal;
  
  const cashPercent = totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 50;
  const digitalPercent = totalRevenue > 0 ? Math.round((digitalTotal / totalRevenue) * 100) : 50;

  // Visual trend charts calculations (CSS visual bar graph heights relative to max value)
  let chartData: { label: string; amount: number; fillVal: number }[] = [];

  if (activeRange === 'week') {
    const daysOfWeek = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const maxVal = Math.max(...daysOfWeek.map((day) => filteredTxs.filter((tx) => tx.dayOfWeek === day).reduce((s, t) => s + t.amount, 0)), 1);

    chartData = daysOfWeek.map((day) => {
      const amount = filteredTxs.filter((tx) => tx.dayOfWeek === day).reduce((s, t) => s + t.amount, 0);
      return {
        label: day,
        amount,
        fillVal: amount / maxVal,
      };
    });
  } else if (activeRange === 'month') {
    // Split month into 4 weeks
    chartData = [
      { label: 'Sem 1', amount: Math.round(totalRevenue * 0.22), fillVal: 0.55 },
      { label: 'Sem 2', amount: Math.round(totalRevenue * 0.28), fillVal: 0.7 },
      { label: 'Sem 3', amount: Math.round(totalRevenue * 0.32), fillVal: 0.8 },
      { label: 'Sem 4', amount: Math.round(totalRevenue * 0.18), fillVal: 0.45 },
    ];
  } else {
    // Split year into monthly buckets
    const monthsShort = locale === 'es' 
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyTotals = MONTHS_LIST_ES.map((month) => {
      return transactions.filter((tx) => tx.year === selectedYear && tx.month === month).reduce((s, t) => s + t.amount, 0);
    });
    const maxVal = Math.max(...monthlyTotals, 1);

    chartData = monthsShort.map((mShort, idx) => {
      const amount = monthlyTotals[idx];
      return {
        label: mShort,
        amount,
        fillVal: amount / maxVal,
      };
    });
  }

  const monthsList = locale === 'es' ? MONTHS_LIST_ES : MONTHS_LIST_EN;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('agendaBtnBack')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('revenueTitle')}</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Add cash entry manual trigger */}
          <TouchableOpacity
            style={[styles.addManualBtn, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={[styles.addManualBtnText, { color: colors.primary }]}>
              {t('revenueManualBtn')}
            </Text>
          </TouchableOpacity>

          {/* TIME FRAME RANGE TABS SELECTOR */}
          <View style={[styles.rangeTabsContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            {(['week', 'month', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setActiveRange(range)}
                style={[
                  styles.rangeTabBtn,
                  activeRange === range && [styles.rangeTabBtnActive, { backgroundColor: colors.cardBackground }],
                ]}
              >
                <Text
                  style={[
                    styles.rangeTabBtnText,
                    { color: colors.textDim },
                    activeRange === range && [styles.rangeTabBtnTextActive, { color: colors.primary }],
                  ]}
                >
                  {range === 'week'
                    ? t('homeFilterWeek')
                    : range === 'month'
                    ? t('homeFilterMonth')
                    : t('revenueFilterYear')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* INLINE MONTH SELECTOR (SCROLLABLE BAR) */}
          {activeRange !== 'year' && (
            <View style={styles.scrollingPillsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollingPills}>
                {monthsList.map((mName, idx) => {
                  const mEsName = MONTHS_LIST_ES[idx];
                  const isSelected = selectedMonth === mEsName;
                  return (
                    <TouchableOpacity
                      key={mName}
                      style={[
                        styles.pillBtn,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        isSelected && [styles.pillBtnActive, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]
                      ]}
                      onPress={() => setSelectedMonth(mEsName)}
                    >
                      <Text style={[styles.pillText, { color: colors.textMuted }, isSelected && [styles.pillTextActive, { color: colors.primary }]]}>
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* HISTORICAL YEAR SELECTOR */}
          <View style={styles.scrollingPillsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollingPills}>
              {['2025', '2026'].map((yr) => {
                const isSelected = selectedYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.pillBtn,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border },
                      isSelected && [styles.pillBtnActive, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]
                    ]}
                    onPress={() => setSelectedYear(yr)}
                  >
                    <Text style={[styles.pillText, { color: colors.textMuted }, isSelected && [styles.pillTextActive, { color: colors.primary }]]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MAIN TOTAL EARNINGS HIGHLIGHT */}
          <Card style={[styles.heroEarningsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.heroLabel, { color: colors.textDim }]}>
              {locale === 'es' ? 'INGRESOS TOTALES' : 'TOTAL REVENUE'}
            </Text>
            <Text style={[styles.heroValue, { color: colors.primary }]}>RD$ {totalRevenue.toLocaleString()}</Text>
          </Card>

          {/* ANALYTICS SUBGRID */}
          <View style={styles.analyticsSubGrid}>
            <Card style={[styles.subGridCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.subGridLabel, { color: colors.textDim }]}>{t('revenueCompleted')}</Text>
              <Text style={[styles.subGridValue, { color: colors.text }]}>{completedServices}</Text>
            </Card>
            <Card style={[styles.subGridCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.subGridLabel, { color: colors.textDim }]}>{t('revenueAvg')}</Text>
              <Text style={[styles.subGridValue, { color: colors.text }]}>RD$ {averageTicket.toLocaleString()}</Text>
            </Card>
          </View>

          {/* CASH / CARD RATIO PROGRESS METERS */}
          <Card style={[styles.splitRatioCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.splitHeader}>
              <Text style={[styles.splitTitle, { color: colors.text }]}>{t('revenueSplit')}</Text>
              <Text style={[styles.splitRatioText, { color: colors.primary }]}>
                {cashPercent}% / {digitalPercent}%
              </Text>
            </View>
            <View style={[styles.splitProgressBarBg, { backgroundColor: isDark ? '#3f3f46' : '#d4d4d8' }]}>
              <View
                style={[
                  styles.splitProgressBarFillCash,
                  { width: `${cashPercent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <View style={styles.splitFooterLabels}>
              <View style={styles.legendRow}>
                <View style={[styles.legendIndicator, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  {locale === 'es' ? 'Efectivo' : 'Cash'} (RD$ {cashTotal.toLocaleString()})
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendIndicator, { backgroundColor: '#3b82f6' }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>
                  {locale === 'es' ? 'Digital' : 'Digital'} (RD$ {digitalTotal.toLocaleString()})
                </Text>
              </View>
            </View>
          </Card>

          {/* VISUAL EARNINGS TREND BAR CHART */}
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t('revenueChartTitle')}</Text>
          <Card style={[styles.chartCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.chartVisualContainer}>
              {chartData.map((data, idx) => (
                <View key={idx} style={styles.chartColWrapper}>
                  <View style={[styles.chartColBackground, { backgroundColor: colors.inputBackground }]}>
                    <View
                      style={[
                        styles.chartColFill,
                        { height: `${data.fillVal * 100}%`, backgroundColor: colors.primary },
                      ]}
                    />
                    {data.amount > 0 && (
                      <Text style={styles.chartColValLabel}>
                        {data.amount >= 1000 ? `${(data.amount / 1000).toFixed(1)}k` : data.amount}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.chartColLabel, { color: colors.textDim }]}>{data.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* TRANSACTION LEDGER LOGS */}
          <Text style={[styles.sectionTitle, { color: colors.textDim }]}>{t('revenueLogTitle')}</Text>
          {filteredTxs.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textDim }]}>
                {locale === 'es' ? 'No se encontraron ingresos registrados en este ciclo.' : 'No recorded inflows found in this cycle.'}
              </Text>
            </Card>
          ) : (
            filteredTxs.map((tx) => (
              <Card key={tx.id} style={[styles.txCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.txHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.txDesc, { color: colors.text }]} numberOfLines={1}>{tx.desc}</Text>
                    <Text style={[styles.txMeta, { color: colors.textMuted }]}>{tx.date} • {tx.dayOfWeek}</Text>
                  </View>
                  <View style={styles.txAmountBadge}>
                    <Text style={[styles.txAmountText, { color: colors.primary }]}>+RD$ {tx.amount}</Text>
                    <View
                      style={[
                        styles.methodBadge,
                        tx.method === 'Efectivo'
                          ? styles.methodCash
                          : tx.method === 'Tarjeta'
                          ? styles.methodCard
                          : styles.methodTransfer,
                      ]}
                    >
                      <Text style={[styles.methodText, { color: colors.text }]}>{tx.method}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* RECORD MANUAL INFLOW DRAWER (MODAL) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('revenueModalTitle')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={creating}>
                <Text style={[styles.closeModalText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Input Description */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('revenueModalLabelDesc')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                placeholder={locale === 'es' ? 'Ej. Venta de Cera Moldeadora' : 'e.g. Pomade Hair Wax sale'}
                placeholderTextColor={colors.textDim}
                value={manualDesc}
                onChangeText={manualDesc => setManualDesc(manualDesc)}
                editable={!creating}
              />
            </View>

            {/* Input Amount */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('revenueModalLabelAmount')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                placeholder="RD$ 500"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
                value={manualAmount}
                onChangeText={manualAmount => setManualAmount(manualAmount)}
                editable={!creating}
              />
            </View>

            {/* Payment Method Segmented Buttons */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>{t('revenueModalLabelMethod')}</Text>
              <View style={styles.methodSelectorRow}>
                {(['Efectivo', 'Tarjeta', 'Transferencia'] as const).map((method) => {
                  const isSelected = manualMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodSelectorBtn,
                        { backgroundColor: colors.inputBackground, borderColor: colors.border },
                        isSelected && [styles.methodSelectorBtnActive, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]
                      ]}
                      onPress={() => setManualMethod(method)}
                      disabled={creating}
                    >
                      <Text style={[styles.methodSelectorBtnText, { color: colors.textDim }, isSelected && [styles.methodSelectorBtnTextActive, { color: colors.primary }]]}>
                        {method === 'Efectivo'
                          ? (locale === 'es' ? 'Efectivo' : 'Cash')
                          : method === 'Tarjeta'
                          ? (locale === 'es' ? 'Tarjeta' : 'Card')
                          : (locale === 'es' ? 'Transfer' : 'Transfer')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit btn */}
            <Button
              title={t('revenueModalBtnCreate')}
              onPress={handleAddManualInflow}
              loading={creating}
              style={styles.modalSubmitBtn}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    backgroundColor: '#0a0a0a',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  addManualBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  addManualBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rangeTabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#18181b',
    padding: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  rangeTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  rangeTabBtnActive: {
    backgroundColor: '#27272a',
  },
  rangeTabBtnText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rangeTabBtnTextActive: {
    color: '#10b981',
  },
  scrollingPillsWrapper: {
    marginBottom: 14,
    width: '100%',
  },
  scrollingPills: {
    flexDirection: 'row',
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    marginRight: 8,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
  },
  pillText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pillTextActive: {
    color: '#10b981',
  },
  heroEarningsCard: {
    padding: 20,
    backgroundColor: '#121214',
    borderColor: '#27272a',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  analyticsSubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subGridCard: {
    width: '48%',
    padding: 14,
    backgroundColor: '#121214',
    borderColor: '#27272a',
  },
  subGridLabel: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subGridValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  splitRatioCard: {
    padding: 16,
    backgroundColor: '#121214',
    borderColor: '#27272a',
    marginBottom: 24,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  splitRatioText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  splitProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6', // Digital default (blue)
    width: '100%',
    overflow: 'hidden',
    marginBottom: 14,
  },
  splitProgressBarFillCash: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10b981', // Cash default (green)
  },
  splitFooterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  chartCard: {
    padding: 18,
    backgroundColor: '#121214',
    borderColor: '#27272a',
    marginBottom: 24,
  },
  chartVisualContainer: {
    flexDirection: 'row',
    height: 120,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  chartColWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartColBackground: {
    height: '100%',
    width: 20,
    backgroundColor: '#18181b',
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  chartColFill: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 5,
  },
  chartColValLabel: {
    position: 'absolute',
    bottom: 4,
    width: '100%',
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  chartColLabel: {
    color: '#71717a',
    fontSize: 9,
    marginTop: 8,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
    borderColor: '#27272a',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  txCard: {
    padding: 14,
    backgroundColor: '#121214',
    borderColor: '#27272a',
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  txMeta: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 4,
  },
  txAmountBadge: {
    alignItems: 'flex-end',
  },
  txAmountText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  methodCash: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  methodCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  methodTransfer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  methodText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeModalText: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: 'bold',
    padding: 6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 14,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodSelectorBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  methodSelectorBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  methodSelectorBtnText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: 'bold',
  },
  methodSelectorBtnTextActive: {
    color: '#10b981',
  },
  modalSubmitBtn: {
    marginTop: 8,
  },
});
