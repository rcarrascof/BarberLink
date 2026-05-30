import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useLanguage } from '../services/LanguageContext';
import { useNotificationCenter } from '../services/NotificationCenterContext';
import { useTheme } from '../services/ThemeContext';
import { useAlert } from '../services/CustomAlertContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { storage } from '../services/storage';
import { notifications } from '../services/notifications';
import Icon from 'react-native-vector-icons/Ionicons';

import Card from '../components/Card';

const RANGE_METRICS = {
  today: {
    citas: '8',
    ingresos: 'RD$ 4,200',
    promedio: 'RD$ 525',
    canal: '100%',
    chartData: [
      { day: '09-11h', val: 0.45, display: '1.8k' },
      { day: '11-13h', val: 0.3, display: '1.2k' },
      { day: '13-15h', val: 0.15, display: '600' },
      { day: '15-17h', val: 0.6, display: '2.4k' },
      { day: '17-19h', val: 0.8, display: '3.2k' },
    ],
    teamShares: [
      { name: 'Carlos M.', val: 0.65, display: 'RD$ 2,730 (65%)' },
      { name: 'Javier R.', val: 0.35, display: 'RD$ 1,470 (35%)' },
    ]
  },
  week: {
    citas: '48',
    ingresos: 'RD$ 26,400',
    promedio: 'RD$ 550',
    canal: '98%',
    chartData: [
      { day: 'Lun', val: 0.65, display: '3.5k' },
      { day: 'Mar', val: 0.72, display: '4.0k' },
      { day: 'Mie', val: 0.88, display: '4.8k' },
      { day: 'Jue', val: 0.76, display: '4.2k' },
      { day: 'Vie', val: 1.0, display: '5.5k' },
    ],
    teamShares: [
      { name: 'Carlos M.', val: 0.62, display: 'RD$ 16,368 (62%)' },
      { name: 'Javier R.', val: 0.38, display: 'RD$ 10,032 (38%)' },
    ]
  },
  month: {
    citas: '192',
    ingresos: 'RD$ 108,000',
    promedio: 'RD$ 562',
    canal: '99%',
    chartData: [
      { day: 'Sem 1', val: 0.75, display: '22k' },
      { day: 'Sem 2', val: 0.85, display: '25k' },
      { day: 'Sem 3', val: 0.95, display: '28k' },
      { day: 'Sem 4', val: 1.0, display: '33k' },
    ],
    teamShares: [
      { name: 'Carlos M.', val: 0.6, display: 'RD$ 64,800 (60%)' },
      { name: 'Javier R.', val: 0.4, display: 'RD$ 43,200 (40%)' },
    ]
  }
};

export default function HomeScreen() {
  const { t, locale } = useLanguage();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const navigation = useNavigation<any>();
  const {
    notifications: allNotis,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationCenter();

  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notiFilter, setNotiFilter] = useState<'all' | 'unread'>('all');
  const [autoBooking, setAutoBooking] = useState(true);
  const [shopName, setShopName] = useState('Barbería Real');
  const [ownerName, setOwnerName] = useState('Carlos');
  const [isExpired, setIsExpired] = useState(false);

  // Filters State
  const [activeRange, setActiveRange] = useState<'today' | 'week' | 'month'>('today');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupNotifications = async () => {
      const permitted = await notifications.requestUserPermission();
      if (permitted) {
        await notifications.getFCMToken();
        unsubscribe = notifications.registerNotificationListeners((title, body) => {
          addNotification(title, body, 'whatsapp');
        });
      }
    };
    
    setupNotifications();
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const sName = await storage.getShopName();
        const oName = await storage.getOwnerName();
        if (sName) setShopName(sName);
        if (oName) setOwnerName(oName);

        const bState = await storage.getBillingState();
        setIsExpired(bState.mode === 'trial' && bState.trialDays === 0);
      };
      loadProfile();
    }, [])
  );

  const activeData = RANGE_METRICS[activeRange];

  // Quick dynamic stats block
  const stats = [
    { label: t('homeMetricCitas'), value: activeData.citas, icon: 'calendar-outline', color: colors.success },
    { label: t('homeMetricIngresos'), value: activeData.ingresos, icon: 'cash-outline', color: colors.warning },
    { label: t('homeMetricPromedio'), value: activeData.promedio, icon: 'trending-up-outline', color: colors.info },
    { label: t('homeMetricCanal'), value: activeData.canal, icon: 'chatbubbles-outline', color: colors.whatsapp },
  ];

  // Recent bookings made via WhatsApp
  const recentBookings = [
    {
      id: '1',
      client: 'Reinold Carrasco',
      phone: '+1 555-123-4567',
      barber: 'Carlos M.',
      service: 'Combo Corte + Barba',
      time: '3:00 PM',
      status: t('homeStatusConfirmed'),
      source: 'WhatsApp',
    },
    {
      id: '2',
      client: 'Juan Pérez',
      phone: '+1 555-555-0192',
      barber: 'Javier R.',
      service: 'Corte Clásico',
      time: '4:15 PM',
      status: t('homeStatusConfirmed'),
      source: 'WhatsApp',
    },
    {
      id: '3',
      client: 'Miguel Gómez',
      phone: '+1 555-333-8822',
      barber: 'Carlos M.',
      service: 'Afeitado Barba',
      time: '5:30 PM',
      status: t('homeStatusPending'),
      source: 'WhatsApp',
    },
  ];

  // Filter dynamic bookings list
  const filteredBookings = recentBookings.filter(booking => {
    if (activeStatusFilter === 'all') return true;
    if (activeStatusFilter === 'confirmed') return booking.status === t('homeStatusConfirmed');
    if (activeStatusFilter === 'pending') return booking.status === t('homeStatusPending');
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Block */}
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {locale === 'es' ? `¡Hola, ${ownerName}!` : `Hello, ${ownerName}!`}
            </Text>
            <Text style={[styles.shopText, { color: colors.textMuted }]}>{shopName} 🌍</Text>
          </View>
          
          {/* Bell Icon Trigger */}
          <TouchableOpacity
            style={[styles.bellBtn, { backgroundColor: colors.cardSub, borderColor: colors.border }]}
            onPress={() => setShowNotificationsPanel(true)}
            activeOpacity={0.8}
          >
            <Icon name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={22} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.badgeIndicator, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={[
            styles.whatsappBadge,
            {
              borderColor: isExpired ? colors.error : colors.whatsapp,
              backgroundColor: isExpired ? colors.error + '10' : colors.whatsapp + '10'
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name={isExpired ? "alert-circle-outline" : "logo-whatsapp"}
                size={12}
                color={isExpired ? colors.error : colors.whatsapp}
                style={{ marginRight: 4 }}
              />
              <Text style={[
                styles.whatsappBadgeText,
                { color: isExpired ? colors.error : colors.whatsapp }
              ]}>
                {isExpired
                  ? (locale === 'es' ? 'Bot Expirado' : 'Bot Expired')
                  : t('homeBotActive')}
              </Text>
            </View>
          </View>
        </View>

        {/* Gorgeous Simulated Expired Banner Card */}
        {isExpired && (
          <Card style={[styles.expiredBanner, { backgroundColor: colors.error + '10', borderColor: colors.error }]}>
            <View style={styles.expiredBannerHeader}>
              <Icon name="alert-circle-outline" size={24} color={colors.error} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.expiredBannerTitle, { color: colors.error }]}>
                  {locale === 'es' ? 'Piloto Automático Suspendido' : 'Autopilot Bot Suspended'}
                </Text>
                <Text style={[styles.expiredBannerDesc, { color: colors.textMuted }]}>
                  {locale === 'es'
                    ? 'Tu período de prueba ha finalizado. El bot de WhatsApp está pausado y tus clientes no pueden reservar citas automáticamente.'
                    : 'Your free trial period has ended. The WhatsApp bot is paused and your clients cannot book appointments automatically.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.expiredBannerBtn, { backgroundColor: colors.error }]}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <Text style={styles.expiredBannerBtnText}>
                {locale === 'es' ? 'Activar BarberLink Premium' : 'Activate BarberLink Premium'}
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Real-time incoming notification alert */}
        <TouchableOpacity onPress={() => setShowNotificationsPanel(true)} activeOpacity={0.95}>
          <Card style={[styles.notificationAlert, { backgroundColor: colors.primary + '0a', borderColor: colors.primary }]}>
            <View style={styles.alertHeader}>
              <Icon name="notifications-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.alertTitle, { color: colors.primary }]}>
                {locale === 'es' ? 'Ver Notificaciones Recientes ›' : 'View Recent Notifications ›'}
              </Text>
              {unreadCount > 0 && <View style={[styles.greenDotIndicator, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[styles.alertText, { color: colors.textMuted }]}>
              {locale === 'es'
                ? 'Tienes citas coordinadas por WhatsApp e informes de autopilot listos en tu centro.'
                : 'You have WhatsApp scheduled appointments and autopilot reports ready in your center.'}
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Autopilot Switcher */}
        <Card style={[styles.controlsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.controlRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.controlTitle, { color: colors.text }]}>{t('homeAutopilotTitle')}</Text>
              <Text style={[styles.controlDesc, { color: colors.textMuted }]}>{t('homeAutopilotDesc')}</Text>
            </View>
            <Switch
              value={isExpired ? false : autoBooking}
              onValueChange={(val) => {
                if (isExpired) {
                  showAlert(
                    locale === 'es' ? 'Prueba Expirada' : 'Trial Expired',
                    locale === 'es'
                      ? 'El piloto automático de WhatsApp se encuentra desactivado. Activa BarberLink Premium desde la pestaña de Ajustes.'
                      : 'WhatsApp autopilot is disabled. Activate BarberLink Premium from the Settings tab.',
                    'error'
                  );
                } else {
                  setAutoBooking(val);
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isExpired ? colors.textDim : (autoBooking ? '#ffffff' : colors.textDim)}
            />
          </View>
        </Card>

        {/* DYNAMIC METRICS SECTION WITH CALENDAR PILLS */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          {t('homeMetricsTitle')}
        </Text>
        {/* Segmented Filter Pills */}
        <View style={[styles.rangeTabsRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          {(['today', 'week', 'month'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => setActiveRange(range)}
              style={[
                styles.rangeTab,
                activeRange === range && [styles.rangeTabActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
            >
              <Text
                style={[
                  styles.rangeTabText,
                  { color: colors.textMuted },
                  activeRange === range && [styles.rangeTabTextActive, { color: '#ffffff' }],
                ]}
              >
                {range === 'today'
                  ? t('homeFilterToday')
                  : range === 'week'
                  ? t('homeFilterWeek')
                  : t('homeFilterMonth')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick metrics grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => {
            const isRevenueCard = stat.label === t('homeMetricIngresos');
            const cardContent = (
              <Card style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }, isRevenueCard ? styles.revenueTouchableCard : null]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {stat.label}
                  </Text>
                  <Icon name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                {isRevenueCard && (
                  <Text style={[styles.revenueCardTapPrompt, { color: colors.primary }]}>
                    {locale === 'es' ? 'Ver reportes ›' : 'View reports ›'}
                  </Text>
                )}
              </Card>
            );

            if (isRevenueCard) {
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => navigation.navigate('Revenue')}
                  style={{ width: '48%' }}
                >
                  {cardContent}
                </TouchableOpacity>
              );
            }

            return (
              <View key={i} style={{ width: '48%' }}>
                {cardContent}
              </View>
            );
          })}
        </View>

        {/* REVENUE GRAPHIC ANALYTICS PANEL */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('homeAnalyticsTitle')}</Text>
        <Card style={[styles.analyticsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {/* Weekly Trend Title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="trending-up-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.analyticsChartTitle, { color: colors.text }]}>
              {t('homeAnalyticsTrend')}
            </Text>
          </View>
          {/* Custom Pure-CSS bar chart column representations */}
          <View style={styles.chartVisualContainer}>
            {activeData.chartData.map((data, idx) => (
              <View key={idx} style={styles.chartColWrapper}>
                <View style={[styles.chartColBackground, { backgroundColor: colors.inputBackground }]}>
                  <View
                    style={[
                      styles.chartColFill,
                      { height: `${data.val * 100}%`, backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.chartColValLabel, { color: colors.text }]}>{data.display}</Text>
                </View>
                <Text style={[styles.chartColLabel, { color: colors.textMuted }]}>{data.day}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartDivider, { backgroundColor: colors.border }]} />

          {/* Team performance share visual meters */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="cut-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.analyticsChartTitle, { color: colors.text }]}>
              {t('homeAnalyticsBarbers')}
            </Text>
          </View>
          <View style={styles.barbersBoardContainer}>
            {activeData.teamShares.map((barber, idx) => (
              <View key={idx} style={styles.barberShareRow}>
                <View style={styles.barberLabelRow}>
                  <Text style={[styles.barberShareName, { color: colors.text }]}>{barber.name}</Text>
                  <Text style={[styles.barberShareVal, { color: colors.textMuted }]}>{barber.display}</Text>
                </View>
                {/* Visual Progress Meter */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.inputBackground }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${barber.val * 100}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* CLIENT BOOKINGS FILTER & GRID SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16, marginBottom: 12 }]}>
          {t('homeRecentTitle')}
        </Text>
        {/* Bookings Filters */}
        <View style={[styles.statusFiltersContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          {(['all', 'confirmed', 'pending'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              onPress={() => setActiveStatusFilter(filterType)}
              style={[
                styles.statusFilterBtn,
                activeStatusFilter === filterType && [styles.statusFilterBtnActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
              ]}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  { color: colors.textMuted },
                  activeStatusFilter === filterType && [styles.statusFilterTextActive, { color: '#ffffff' }],
                ]}
              >
                {filterType === 'all'
                  ? t('homeBookingsFilterAll')
                  : filterType === 'confirmed'
                  ? t('homeBookingsFilterConfirmed')
                  : t('homeBookingsFilterPending')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookings cards lists */}
        {filteredBookings.map((booking) => (
          <Card key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.bookingHeader}>
              <View>
                <Text style={[styles.bookingClient, { color: colors.text }]}>{booking.client}</Text>
                <Text style={[styles.bookingPhone, { color: colors.textMuted }]}>{booking.phone}</Text>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: colors.inputBackground }]}>
                <Text style={[styles.timeText, { color: colors.primary }]}>{booking.time}</Text>
              </View>
            </View>

            <View style={[styles.bookingDivider, { backgroundColor: colors.border }]} />

            <View style={styles.bookingFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="cut-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.bookingDetail, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
                  <Text style={{ fontWeight: 'bold', color: colors.text }}>{booking.barber}</Text> • {booking.service}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  booking.status === t('homeStatusConfirmed') 
                    ? [styles.statusConfirmed, { backgroundColor: colors.success + '15', borderColor: colors.success }] 
                    : [styles.statusPending, { backgroundColor: colors.warning + '15', borderColor: colors.warning }],
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    booking.status === t('homeStatusConfirmed') ? { color: colors.success } : { color: colors.warning },
                  ]}
                >
                  {booking.status}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PREMIUM NOTIFICATION CENTER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotificationsPanel}
        onRequestClose={() => setShowNotificationsPanel(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {locale === 'es' ? 'Centro de Notificaciones' : 'Notification Center'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {unreadCount} {locale === 'es' ? 'sin leer' : 'unread'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotificationsPanel(false)}
                style={[styles.closeModalBtn, { backgroundColor: colors.inputBackground }]}
              >
                <Icon name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Bar */}
            {allNotis.length > 0 && (
              <View style={[styles.quickActionsBar, { backgroundColor: colors.cardSub, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={markAllAsRead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="checkmark-done" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.quickActionText, { color: colors.primary }]}>
                      {locale === 'es' ? 'Marcar todo leídos' : 'Mark all read'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearAll}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                    <Icon name="trash-outline" size={16} color={colors.error} style={{ marginRight: 4 }} />
                    <Text style={[styles.quickActionText, { color: colors.error }]}>
                      {locale === 'es' ? 'Limpiar todo' : 'Clear all'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Filter Segmented Controls */}
            <View style={[styles.rangeTabsContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setNotiFilter('all')}
                style={[
                  styles.rangeTabBtn,
                  notiFilter === 'all' && [styles.rangeTabBtnActive, { backgroundColor: colors.cardBackground }],
                ]}
              >
                <Text
                  style={[
                    styles.rangeTabBtnText,
                    { color: colors.textMuted },
                    notiFilter === 'all' && [styles.rangeTabBtnTextActive, { color: colors.primary }],
                  ]}
                >
                  {locale === 'es' ? 'Todas' : 'All'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNotiFilter('unread')}
                style={[
                  styles.rangeTabBtn,
                  notiFilter === 'unread' && [styles.rangeTabBtnActive, { backgroundColor: colors.cardBackground }],
                ]}
              >
                <Text
                  style={[
                    styles.rangeTabBtnText,
                    { color: colors.textMuted },
                    notiFilter === 'unread' && [styles.rangeTabBtnTextActive, { color: colors.primary }],
                  ]}
                >
                  {locale === 'es' ? 'No Leídas' : 'Unread'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              {allNotis.filter(n => notiFilter === 'all' || !n.read).length === 0 ? (
                <View style={styles.emptyCenter}>
                  <Icon name="notifications-off-outline" size={48} color={colors.textDim} style={{ marginBottom: 16 }} />
                  <Text style={[styles.emptyCenterText, { color: colors.textMuted }]}>
                    {locale === 'es'
                      ? 'No tienes notificaciones en este filtro.'
                      : 'You have no notifications in this filter.'}
                  </Text>
                </View>
              ) : (
                allNotis
                  .filter(n => notiFilter === 'all' || !n.read)
                  .map((noti) => {
                    let iconName = 'notifications-outline';
                    let iconColor = colors.primary;
                    if (noti.type === 'whatsapp') {
                      iconName = 'logo-whatsapp';
                      iconColor = colors.whatsapp;
                    } else if (noti.type === 'billing') {
                      iconName = 'card-outline';
                      iconColor = colors.warning;
                    }
                    return (
                      <Card
                        key={noti.id}
                        style={[
                          styles.notiCard,
                          { backgroundColor: colors.cardBackground, borderColor: colors.border },
                          !noti.read && [styles.notiCardUnread, { backgroundColor: colors.cardSub, borderColor: colors.primary + '30' }],
                        ]}
                      >
                        <View style={styles.notiCardHeader}>
                          <View style={[styles.notiIconWrapper, { backgroundColor: iconColor + '10' }]}>
                            <Icon name={iconName} size={18} color={iconColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.notiCardTitle, { color: colors.text }]}>{noti.title}</Text>
                            <Text style={[styles.notiCardBody, { color: colors.textMuted }]}>{noti.body}</Text>
                            <Text style={[styles.notiCardTime, { color: colors.textDim }]}>{noti.time}</Text>
                          </View>
                          {!noti.read && (
                            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        
                        <View style={[styles.notiCardActions, { borderTopColor: colors.border }]}>
                          {noti.type === 'whatsapp' && (
                            <TouchableOpacity
                              style={[styles.notiActionBtn, { backgroundColor: colors.primary + '15' }]}
                              onPress={() => {
                                markAsRead(noti.id);
                                setShowNotificationsPanel(false);
                                navigation.navigate('Agenda' as any);
                              }}
                            >
                              <Text style={[styles.notiActionText, { color: colors.primary }]}>
                                {locale === 'es' ? 'Ver en Agenda ›' : 'View in Agenda ›'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {!noti.read && (
                            <TouchableOpacity
                              style={[styles.notiActionBtn, { marginLeft: 12, backgroundColor: colors.inputBackground }]}
                              onPress={() => markAsRead(noti.id)}
                            >
                              <Text style={[styles.notiActionText, { color: colors.textMuted }]}>
                                {locale === 'es' ? 'Marcar leída' : 'Mark read'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.notiActionBtn, { marginLeft: 'auto', backgroundColor: colors.error + '10' }]}
                            onPress={() => deleteNotification(noti.id)}
                          >
                            <Text style={[styles.notiActionText, { color: colors.error }]}>
                              {locale === 'es' ? 'Eliminar' : 'Delete'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </Card>
                    );
                  })
              )}
            </ScrollView>
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
  content: {
    padding: 20,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shopText: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  whatsappBadge: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    borderWidth: 1,
    borderColor: '#25d366',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  whatsappBadgeText: {
    color: '#25d366',
    fontWeight: 'bold',
    fontSize: 11,
  },
  notificationAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: '#10b981',
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  alertTitle: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertText: {
    color: '#d4d4d8',
    fontSize: 13,
    lineHeight: 18,
  },
  controlsCard: {
    padding: 16,
    marginBottom: 24,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  controlDesc: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  rangeTabsRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    marginBottom: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  rangeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  rangeTabActive: {
    backgroundColor: '#27272a',
  },
  rangeTabText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rangeTabTextActive: {
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '100%',
    padding: 14,
    backgroundColor: '#121214',
    borderColor: '#27272a',
  },
  revenueTouchableCard: {
    borderColor: 'rgba(251, 191, 36, 0.4)',
    backgroundColor: 'rgba(251, 191, 36, 0.02)',
  },
  revenueCardTapPrompt: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '500',
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyticsCard: {
    padding: 18,
    backgroundColor: '#121214',
    borderColor: '#27272a',
    marginBottom: 24,
  },
  analyticsChartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  chartVisualContainer: {
    flexDirection: 'row',
    height: 120,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  chartColWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  chartColBackground: {
    height: '100%',
    width: 24,
    backgroundColor: '#18181b',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  chartColFill: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  chartColValLabel: {
    position: 'absolute',
    bottom: 4,
    width: '100%',
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  chartColLabel: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '600',
  },
  chartDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 20,
  },
  barbersBoardContainer: {
    paddingHorizontal: 2,
  },
  barberShareRow: {
    marginBottom: 14,
  },
  barberLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barberShareName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  barberShareVal: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#18181b',
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusFiltersContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    marginBottom: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  statusFilterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusFilterBtnActive: {
    backgroundColor: '#27272a',
  },
  statusFilterText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusFilterTextActive: {
    color: '#10b981',
  },
  bookingCard: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#121214',
    borderColor: '#27272a',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingClient: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bookingPhone: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bookingDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 12,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDetail: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  textConfirmed: {
    color: '#10b981',
  },
  textPending: {
    color: '#fbbf24',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  bellEmoji: {
    fontSize: 18,
  },
  badgeIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981', // Emerald unread indicator
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0a0a0a',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  greenDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginLeft: 8,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '80%',
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    fontWeight: '600',
  },
  closeModalBtn: {
    padding: 6,
  },
  closeModalText: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: 'bold',
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
  },
  rangeTabsContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#18181b',
    padding: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 20,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  rangeTabBtnTextActive: {
    color: '#10b981',
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyCenterEmoji: {
    fontSize: 40,
    marginBottom: 14,
    opacity: 0.6,
  },
  emptyCenterText: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  notiCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#121214',
    borderColor: '#27272a',
  },
  notiCardUnread: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  notiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notiCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notiCardBody: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  notiCardTime: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginLeft: 10,
    marginTop: 4,
  },
  notiIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notiCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1f1f22',
    marginTop: 12,
    paddingTop: 10,
    alignItems: 'center',
  },
  notiActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  notiActionText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: 'bold',
  },
  expiredBanner: {
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  expiredBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expiredBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expiredBannerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  expiredBannerBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  expiredBannerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
