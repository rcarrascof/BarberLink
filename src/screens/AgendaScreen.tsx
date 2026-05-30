import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import Card from '../components/Card';
import Button from '../components/Button';
import { storage, Barber } from '../services/storage';

interface Appointment {
  id: string;
  client: string;
  phone: string;
  service: string;
  timeSlot: string;
  duration: number; // in minutes
  barber: string;
  price: string;
  day: string; // Matches day selector keys
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    client: 'Reinold Carrasco',
    phone: '+1 555-123-4567',
    service: 'Combo Corte + Barba',
    timeSlot: '10:00 AM',
    duration: 45,
    barber: 'Carlos M.',
    price: 'RD$ 800',
    day: 'Hoy',
  },
  {
    id: '2',
    client: 'Lucas Mateo',
    phone: '+1 555-222-3344',
    service: 'Corte Clásico',
    timeSlot: '11:15 AM',
    duration: 30,
    barber: 'Carlos M.',
    price: 'RD$ 500',
    day: 'Hoy',
  },
  {
    id: '3',
    client: 'Daniel Ortiz',
    phone: '+1 555-777-6655',
    service: 'Coloración de Barba',
    timeSlot: '2:30 PM',
    duration: 60,
    barber: 'Javier R.',
    price: 'RD$ 1,200',
    day: 'Mañana',
  },
  {
    id: '4',
    client: 'Juan Pérez',
    phone: '+1 555-555-0192',
    service: 'Corte Clásico',
    timeSlot: '4:15 PM',
    duration: 30,
    barber: 'Javier R.',
    price: 'RD$ 500',
    day: 'Hoy',
  },
  {
    id: '5',
    client: 'Miguel Gómez',
    phone: '+1 555-333-8822',
    service: 'Afeitado Premium',
    timeSlot: '9:30 AM',
    duration: 30,
    barber: 'Carlos M.',
    price: 'RD$ 600',
    day: 'Sábado',
  },
];

const AVAILABLE_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '5:00 PM', '6:30 PM'];

export default function AgendaScreen() {
  const { t, locale } = useLanguage();
  const { colors, isDark } = useTheme();
  const { showAlert, showConfirm, showToast } = useAlert();
  const [selectedDay, setSelectedDay] = useState('Hoy');
  const [appts, setAppts] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  
  // Rescheduling edit state
  const [isEditing, setIsEditing] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newBarber, setNewBarber] = useState('');

  // Loaded Team of Barbers
  const [barbersList, setBarbersList] = useState<Barber[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  const days = ['Ayer', 'Hoy', 'Mañana', 'Sábado', 'Domingo'];

  useFocusEffect(
    useCallback(() => {
      const loadBarbers = async () => {
        const list = await storage.getBarbers();
        setBarbersList(list.filter(b => b.status === 'active'));

        const bState = await storage.getBillingState();
        setIsExpired(bState.mode === 'trial' && bState.trialDays === 0);
      };
      loadBarbers();
    }, [])
  );

  const handleCancelAppointment = (appt: Appointment) => {
    // Close the detail panel first so only one overlay is active
    setSelectedAppt(null);
    setIsEditing(false);

    // Then show the confirmation dialog (no stacking)
    setTimeout(() => {
      showConfirm(
        t('agendaCancelTitle'),
        t('agendaCancelDesc', { client: appt.client }),
        () => {
          // Remove appointment from active state
          setAppts(prev => prev.filter(item => item.id !== appt.id));

          showAlert(
            t('agendaCancelSuccessTitle'),
            t('agendaCancelSuccessDesc', { client: appt.client, phone: appt.phone }),
            'success'
          );
        },
        {
          confirmText: t('agendaCancelConfirmBtn'),
          cancelText: t('agendaBtnBack'),
          isDanger: true,
        }
      );
    }, 100);
  };

  const handleReschedule = () => {
    if (!selectedAppt || !newTime) return;

    // Update appointment in in-memory state
    setAppts(prev =>
      prev.map(item =>
        item.id === selectedAppt.id
          ? { ...item, timeSlot: newTime, barber: newBarber || item.barber }
          : item
      )
    );

    const clientName = selectedAppt.client;
    const clientPhone = selectedAppt.phone;
    const savedTime = newTime;

    // Close the detail panel
    setSelectedAppt(null);
    setIsEditing(false);

    // Show success alert (no modal conflict since detail panel is a plain View)
    showAlert(
      t('agendaRescheduleSuccessTitle'),
      t('agendaRescheduleSuccessDesc', { client: clientName, time: savedTime, phone: clientPhone }),
      'success'
    );
  };

  const openDetails = (appt: Appointment) => {
    setSelectedAppt(appt);
    setNewTime(appt.timeSlot);
    setNewBarber(appt.barber);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Day Selector Header */}
      <View style={[styles.daySelectorContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayButton,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                selectedDay === day ? [styles.dayActive, { backgroundColor: colors.primary, borderColor: colors.primary }] : styles.dayInactive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: colors.textMuted },
                  selectedDay === day ? [styles.textActive, { color: '#ffffff' }] : styles.textInactive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.timelineContainer}>
        <Text style={[styles.timelineTitle, { color: colors.text }]}>{t('agendaTimelineTitle')} • {selectedDay}</Text>

        {appts.filter(a => a.day === selectedDay).length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>{t('agendaEmpty')}</Text>
          </Card>
        ) : (
          appts.filter(a => a.day === selectedDay).map((appt) => (
            <TouchableOpacity
              key={appt.id}
              onPress={() => openDetails(appt)}
              activeOpacity={0.9}
            >
              <Card style={[styles.timelineCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.cardLayout}>
                  {/* Time section */}
                  <View style={styles.timeColumn}>
                    <Text style={[styles.timeLabel, { color: colors.text }]}>{appt.timeSlot}</Text>
                    <Text style={[styles.durationLabel, { color: colors.textMuted }]}>{appt.duration} min</Text>
                  </View>

                  {/* Vertical separator */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Details section */}
                  <View style={styles.detailsColumn}>
                    <Text style={[styles.clientName, { color: colors.text }]}>{appt.client}</Text>
                    <Text style={[styles.serviceName, { color: colors.textMuted }]}>{appt.service}</Text>
                    
                    <View style={styles.footerRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="cut-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[styles.barberTag, { color: colors.textMuted }]}>{appt.barber}</Text>
                      </View>
                      <Text style={[styles.priceTag, { color: colors.primary }]}>{appt.price}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Appointment Detail Panel — absolute overlay (NOT a Modal, to avoid stacking freeze) */}
      {selectedAppt && (
        <View style={styles.panelOverlay}>
          <TouchableOpacity
            style={[styles.panelBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)' }]}
            activeOpacity={1}
            onPress={() => { setSelectedAppt(null); setIsEditing(false); }}
          />
          <View style={[styles.panelContent, { backgroundColor: colors.cardBackground, borderTopColor: colors.border, borderLeftColor: colors.border, borderRightColor: colors.border }]}>
            <View style={[styles.panelHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isEditing ? t('agendaEditTitle') : t('agendaDetailTitle')}
              </Text>
              <TouchableOpacity 
                onPress={() => { setSelectedAppt(null); setIsEditing(false); }}
                style={[styles.closeBtn, { backgroundColor: colors.inputBackground }]}
              >
                <Icon name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {!isEditing ? (
              // VIEW MODE
              <ScrollView showsVerticalScrollIndicator={false}>
                {isExpired && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error, borderRadius: 8, padding: 8, marginBottom: 12 }}>
                    <Icon name="lock-closed" size={14} color={colors.error} style={{ marginRight: 6 }} />
                    <Text style={{ color: colors.error, fontSize: 11, fontWeight: 'bold' }}>
                      {locale === 'es' ? 'Prueba Expirada: Acciones Desactivadas' : 'Trial Expired: Actions Disabled'}
                    </Text>
                  </View>
                )}

                <Card style={[styles.modalCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text style={[styles.modalClientName, { color: colors.text }]}>{selectedAppt.client}</Text>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name="logo-whatsapp" size={16} color={colors.whatsapp} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalClientPhone, { color: colors.whatsapp, marginBottom: 0 }]}>{selectedAppt.phone}</Text>
                  </View>

                  <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('agendaLabelService')}</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{selectedAppt.service}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('agendaLabelTime')}</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{selectedAppt.timeSlot} ({selectedAppt.duration} min)</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('agendaLabelBarber')}</Text>
                    <Text style={[styles.detailVal, { color: colors.text }]}>{selectedAppt.barber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{t('agendaLabelPrice')}</Text>
                    <Text style={[styles.detailVal, { color: colors.primary }]}>{selectedAppt.price}</Text>
                  </View>
                </Card>

                <Button
                  title={t('agendaBtnReschedule')}
                  onPress={() => {
                    if (isExpired) {
                      showAlert(
                        locale === 'es' ? 'Prueba Expirada' : 'Trial Expired',
                        locale === 'es'
                          ? 'No puedes reprogramar citas en el período expirado. Por favor, activa Premium desde los Ajustes.'
                          : 'You cannot reschedule appointments while expired. Please activate Premium from Settings.',
                        'error'
                      );
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  style={styles.modalBtn}
                />

                <Button
                  title={t('agendaBtnWhatsApp')}
                  variant="outline"
                  onPress={() => {
                    showToast(
                      locale === 'es'
                        ? `Abriendo chat de WhatsApp con ${selectedAppt.client}...`
                        : `Opening WhatsApp chat with ${selectedAppt.client}...`,
                      'info'
                    );
                  }}
                  style={styles.modalBtn}
                />

                <Button
                  title={t('agendaBtnCancel')}
                  variant="danger"
                  onPress={() => {
                    if (isExpired) {
                      showAlert(
                        locale === 'es' ? 'Prueba Expirada' : 'Trial Expired',
                        locale === 'es'
                          ? 'No puedes cancelar citas en el período expirado. Por favor, activa Premium desde los Ajustes.'
                          : 'You cannot cancel appointments while expired. Please activate Premium from Settings.',
                        'error'
                      );
                    } else {
                      handleCancelAppointment(selectedAppt);
                    }
                  }}
                  style={styles.modalBtn}
                />
              </ScrollView>
            ) : (
              // RESCHEDULE / EDIT MODE
              <ScrollView contentContainerStyle={styles.editForm} showsVerticalScrollIndicator={false}>
                <Card style={[styles.modalCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text style={[styles.editSubtitle, { color: colors.text }]}>{t('agendaEditSelectSlot')}</Text>
                  <View style={styles.slotGrid}>
                    {AVAILABLE_SLOTS.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setNewTime(slot)}
                        style={[
                          styles.slotButton,
                          { backgroundColor: colors.cardBackground, borderColor: colors.border },
                          newTime === slot ? [styles.slotActive, { backgroundColor: colors.primary, borderColor: colors.primary }] : null
                        ]}
                      >
                        <Text style={[styles.slotText, newTime === slot ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                  <Text style={[styles.editSubtitle, { color: colors.text }]}>{t('agendaEditSelectBarber')}</Text>
                  <View style={styles.barberRow}>
                    {barbersList.map((barber) => (
                      <TouchableOpacity
                        key={barber.id}
                        onPress={() => setNewBarber(barber.name)}
                        style={[
                          styles.barberBtn,
                          { backgroundColor: colors.cardBackground, borderColor: colors.border },
                          newBarber === barber.name ? [styles.barberActive, { backgroundColor: colors.primary, borderColor: colors.primary }] : null
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="cut-outline" size={14} color={newBarber === barber.name ? '#ffffff' : colors.textMuted} style={{ marginRight: 6 }} />
                          <Text style={[styles.barberBtnText, newBarber === barber.name ? styles.barberBtnTextActive : { color: colors.textMuted }]}>
                            {barber.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>

                <Button
                  title={t('agendaBtnConfirm')}
                  onPress={handleReschedule}
                  style={styles.modalBtn}
                />

                <Button
                  title={t('agendaBtnBack')}
                  variant="secondary"
                  onPress={() => setIsEditing(false)}
                  style={styles.modalBtn}
                />
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  daySelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  dayScroll: {
    paddingHorizontal: 16,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  dayActive: {
    backgroundColor: '#10b981',
  },
  dayInactive: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  textActive: {
    color: '#ffffff',
  },
  textInactive: {
  },
  timelineContainer: {
    padding: 20,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  timelineCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardLayout: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 80,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  timeLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  durationLabel: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#27272a',
  },
  detailsColumn: {
    flex: 1,
    padding: 16,
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  serviceName: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  barberTag: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceTag: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
  },
  panelOverlay: {
    ...StyleSheet.absoluteFill as object,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  panelContent: {
    backgroundColor: '#0f0f11',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    maxHeight: '90%',
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeBtn: {
    color: '#a1a1aa',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  modalCard: {
    padding: 16,
    marginBottom: 20,
  },
  modalClientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalClientPhone: {
    fontSize: 14,
    color: '#25d366',
    marginTop: 4,
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#71717a',
    fontSize: 13,
  },
  detailVal: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 13,
  },
  modalBtn: {
    marginBottom: 12,
  },
  editForm: {
    flexGrow: 1,
  },
  editSubtitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '31%',
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  slotActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  slotInactive: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  slotText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  slotTextActive: {
    color: '#ffffff',
  },
  slotTextInactive: {
    color: '#a1a1aa',
  },
  barberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barberBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  barberActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  barberInactive: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  barberBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  barberBtnTextActive: {
    color: '#10b981',
  },
  barberBtnTextInactive: {
    color: '#a1a1aa',
  },
});
