import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { storage, AvailabilityDay } from '../services/storage';

import Card from '../components/Card';
import Button from '../components/Button';
import TimeSelectorModal from '../components/TimeSelectorModal';

const BLOCKOUT_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
  '08:00 PM', '09:00 PM'
];

export default function AvailabilityScreen() {
  const { t, locale } = useLanguage();
  const navigation = useNavigation();
  const { showToast } = useAlert();
  const { colors, isDark } = useTheme();

  // Availability state
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<Record<string, string[]>>({});
  const [selectedBlockDay, setSelectedBlockDay] = useState('Lunes');
  
  // Picker modal states
  const [showPicker, setShowPicker] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState<number | null>(null);
  const [activeTimeKey, setActiveTimeKey] = useState<'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd' | null>(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailabilityData();
  }, []);

  const loadAvailabilityData = async () => {
    const list = await storage.getAvailability();
    setAvailability(list);
    const blocked = await storage.getBlockedSlots();
    setBlockedSlots(blocked);
  };

  const handleToggleDayOpen = async (idx: number) => {
    const updated = availability.map((item, i) =>
      i === idx ? { ...item, isOpen: !item.isOpen } : item
    );
    setAvailability(updated);
    await storage.saveAvailability(updated);
  };

  const handleOpenPicker = (dayIdx: number, key: 'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd') => {
    setActiveDayIdx(dayIdx);
    setActiveTimeKey(key);
    setShowPicker(true);
  };

  const handleSelectTime = async (val: string) => {
    if (activeDayIdx !== null && activeTimeKey !== null) {
      const updated = availability.map((item, i) =>
        i === activeDayIdx ? { ...item, [activeTimeKey]: val } : item
      );
      setAvailability(updated);
      await storage.saveAvailability(updated);
    }
    setShowPicker(false);
    setActiveDayIdx(null);
    setActiveTimeKey(null);
  };

  const handleToggleBlockedSlot = async (timeSlot: string) => {
    const currentDaySlots = blockedSlots[selectedBlockDay] || [];
    let updatedSlots: string[];
    if (currentDaySlots.includes(timeSlot)) {
      updatedSlots = currentDaySlots.filter(s => s !== timeSlot);
    } else {
      updatedSlots = [...currentDaySlots, timeSlot];
    }
    const updated = {
      ...blockedSlots,
      [selectedBlockDay]: updatedSlots
    };
    setBlockedSlots(updated);
    await storage.saveBlockedSlots(updated);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await storage.saveAvailability(availability);
    await storage.saveBlockedSlots(blockedSlots);
    setTimeout(() => {
      setSaving(false);
      showToast(t('availabilityAlertSaved'), 'success');
    }, 800);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('agendaBtnBack')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('availabilityTitle')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.instructions, { color: colors.textDim }]}>
          {t('availabilityInstructions')}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {t('availabilitySectionTitle')}
        </Text>

        {availability.map((dayItem, idx) => (
          <Card key={dayItem.day} style={[styles.dayCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.dayHeaderRow}>
              <View style={styles.dayLabelColumn}>
                <Text style={[styles.dayNameText, { color: colors.text }]}>{dayItem.day}</Text>
                <Text style={[styles.statusText, dayItem.isOpen ? styles.statusOpen : styles.statusClosed]}>
                  {dayItem.isOpen ? t('availabilityStatusOpen') : t('availabilityStatusClosed')}
                </Text>
              </View>

              <Switch
                value={dayItem.isOpen}
                onValueChange={() => handleToggleDayOpen(idx)}
                trackColor={{ false: isDark ? '#27272a' : '#e4e4e7', true: '#10b981' }}
                thumbColor={dayItem.isOpen ? '#ffffff' : (isDark ? '#a1a1aa' : '#71717a')}
                style={styles.daySwitch}
              />
            </View>

            {dayItem.isOpen ? (
              <View style={[styles.detailsContainer, { borderTopColor: colors.border }]}>
                {/* General Hours Picker Row */}
                <View style={styles.hoursRow}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
                    {locale === 'es' ? 'Horario Comercial:' : 'Business Hours:'}
                  </Text>
                  <View style={styles.timeInputsRow}>
                    <TouchableOpacity
                      style={[styles.pickerTrigger, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                      onPress={() => handleOpenPicker(idx, 'openTime')}
                    >
                      <Text style={[styles.pickerTriggerText, { color: colors.text }]}>{dayItem.openTime || '09:00 AM'}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeDivider, { color: colors.textDim }]}>-</Text>
                    <TouchableOpacity
                      style={[styles.pickerTrigger, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                      onPress={() => handleOpenPicker(idx, 'closeTime')}
                    >
                      <Text style={[styles.pickerTriggerText, { color: colors.text }]}>{dayItem.closeTime || '08:00 PM'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Lunch Break Row */}
                <View style={styles.lunchToggleRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.lunchTitle, { color: colors.text }]}>
                      {locale === 'es' ? 'Hora de Almuerzo 🍽️' : 'Lunch Break 🍽️'}
                    </Text>
                    <Text style={[styles.lunchDesc, { color: colors.textDim }]}>
                      {locale === 'es' 
                        ? 'WhatsApp pausará agendamientos en este intervalo.' 
                        : 'WhatsApp bot will pause bookings during this time.'}
                    </Text>
                  </View>
                  <Switch
                    value={!!dayItem.hasLunchBreak}
                    onValueChange={async (val) => {
                      const updated = availability.map((item, i) =>
                        i === idx ? { ...item, hasLunchBreak: val } : item
                      );
                      setAvailability(updated);
                      await storage.saveAvailability(updated);
                    }}
                    trackColor={{ false: isDark ? '#27272a' : '#e4e4e7', true: '#10b981' }}
                    thumbColor={dayItem.hasLunchBreak ? '#ffffff' : (isDark ? '#a1a1aa' : '#71717a')}
                    style={styles.daySwitch}
                  />
                </View>

                {dayItem.hasLunchBreak && (
                  <View style={[styles.hoursRow, { marginTop: 12 }]}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>
                      {locale === 'es' ? 'Intervalo Almuerzo:' : 'Lunch Break Hours:'}
                    </Text>
                    <View style={styles.timeInputsRow}>
                      <TouchableOpacity
                        style={[styles.pickerTrigger, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        onPress={() => handleOpenPicker(idx, 'lunchStart')}
                      >
                        <Text style={[styles.pickerTriggerText, { color: colors.text }]}>{dayItem.lunchStart || '12:00 PM'}</Text>
                      </TouchableOpacity>
                      <Text style={[styles.timeDivider, { color: colors.textDim }]}>-</Text>
                      <TouchableOpacity
                        style={[styles.pickerTrigger, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                        onPress={() => handleOpenPicker(idx, 'lunchEnd')}
                      >
                        <Text style={[styles.pickerTriggerText, { color: colors.text }]}>{dayItem.lunchEnd || '01:00 PM'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.dayOffContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.dayOffText, { color: colors.textDim }]}>
                  {t('availabilityDayOff')}
                </Text>
              </View>
            )}
          </Card>
        ))}

        {/* BLOQUEO DE HORAS ESPECÍFICAS / DISABLE SPECIFIC HOURS */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {locale === 'es' ? 'Desactivar Horas Específicas' : 'Block Specific Hours'}
        </Text>
        <Card style={[styles.blockedCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.blockedDesc, { color: colors.textDim }]}>
            {locale === 'es'
              ? 'Desactiva las horas específicas en las que el barbero estará ocupado o ausente. El bot de WhatsApp rechazará agendamientos en estas horas.'
              : 'Disable specific hours when the barber will be busy or absent. The WhatsApp bot will block appointments during these hours.'}
          </Text>

          {/* Day selection tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedBlockDay(day)}
                style={[
                  styles.daySelectorTab,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                  selectedBlockDay === day && [styles.daySelectorTabActive, { backgroundColor: colors.primary + '15', borderColor: colors.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.daySelectorTabText,
                    { color: colors.textMuted },
                    selectedBlockDay === day && [styles.daySelectorTabTextActive, { color: colors.primary }],
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grid of hourly slots to block/unblock */}
          <View style={styles.slotsGrid}>
            {BLOCKOUT_SLOTS.map((timeSlot) => {
              const isBlocked = (blockedSlots[selectedBlockDay] || []).includes(timeSlot);
              return (
                <TouchableOpacity
                  key={timeSlot}
                  onPress={() => handleToggleBlockedSlot(timeSlot)}
                  style={[
                    styles.slotPill,
                    isBlocked
                      ? [styles.slotPillBlocked, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]
                      : [styles.slotPillActive, { backgroundColor: colors.primary + '05', borderColor: colors.primary + '20' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.slotPillText,
                      isBlocked ? [styles.slotPillTextBlocked, { color: colors.error }] : [styles.slotPillTextActive, { color: colors.primary }],
                    ]}
                  >
                    {isBlocked ? `🚫 ${timeSlot}` : `✓ ${timeSlot}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button
          title={t('availabilityBtnSync')}
          onPress={handleSaveAll}
          loading={saving}
          style={styles.saveBtn}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Sleek Custom Picker Modal */}
      <TimeSelectorModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectTime}
        locale={locale}
      />
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
  content: {
    padding: 20,
  },
  instructions: {
    color: '#71717a',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    marginLeft: 4,
    marginTop: 10,
  },
  dayCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabelColumn: {
    width: 90,
  },
  dayNameText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  statusOpen: {
    color: '#10b981',
  },
  statusClosed: {
    color: '#ef4444',
  },
  daySwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '500',
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerTrigger: {
    width: 90,
    height: 38,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTriggerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeDivider: {
    color: '#71717a',
    marginHorizontal: 8,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 14,
  },
  lunchToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lunchTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  lunchDesc: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  dayOffContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    alignItems: 'center',
  },
  dayOffText: {
    color: '#71717a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  blockedCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  blockedDesc: {
    color: '#71717a',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  daySelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  daySelectorTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    marginRight: 8,
  },
  daySelectorTabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  daySelectorTabText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daySelectorTabTextActive: {
    color: '#10b981',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotPill: {
    width: '48%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  slotPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  slotPillBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  slotPillTextActive: {
    color: '#10b981',
  },
  slotPillTextBlocked: {
    color: '#ef4444',
  },
  saveBtn: {
    marginTop: 10,
    height: 44,
  },
});
