import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { storage, Barber } from '../services/storage';

import Card from '../components/Card';
import Button from '../components/Button';

export default function BarbersScreen() {
  const { t, locale } = useLanguage();
  const navigation = useNavigation();
  const { showAlert, showConfirm, showToast } = useAlert();
  const { colors, isDark } = useTheme();

  // Barbers state
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    const list = await storage.getBarbers();
    setBarbers(list);
  };

  const handleAddBarber = async () => {
    if (!name.trim()) {
      showAlert(
        locale === 'es' ? 'Nombre obligatorio' : 'Name required',
        t('barbersAlertEmpty'),
        'error'
      );
      return;
    }

    setFormLoading(true);
    const newBarber: Barber = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim() || '+1 555-555-0100',
      status: 'active',
    };

    const updatedList = [...barbers, newBarber];
    setBarbers(updatedList);
    await storage.saveBarbers(updatedList);

    setName('');
    setPhone('');
    setFormLoading(false);

    showToast(t('barbersAlertSaved'), 'success');
  };

  const handleDeleteBarber = (id: string, barberName: string) => {
    showConfirm(
      locale === 'es' ? 'Eliminar Barbero' : 'Delete Barber',
      t('barbersAlertDelete', { name: barberName }),
      async () => {
        const updatedList = barbers.filter(item => item.id !== id);
        setBarbers(updatedList);
        await storage.saveBarbers(updatedList);
        showToast(locale === 'es' ? 'Barbero eliminado' : 'Barber deleted', 'success');
      },
      {
        confirmText: locale === 'es' ? 'Eliminar' : 'Delete',
        cancelText: locale === 'es' ? 'Cancelar' : 'Cancel',
        isDanger: true,
      }
    );
  };

  const handleToggleBarberStatus = async (id: string) => {
    const updatedList = barbers.map(item =>
      item.id === id 
        ? { ...item, status: (item.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' } 
        : item
    );
    setBarbers(updatedList);
    await storage.saveBarbers(updatedList);
  };

  // Filter staff by search query
  const filteredBarbers = barbers.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.phone.includes(searchQuery)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Dynamic Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('agendaBtnBack')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('barbersTitle')}</Text>
        <Text style={[styles.headerCount, { color: colors.primary }]}>
          {barbers.filter(b => b.status === 'active').length} {t('barbersActiveLabel')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* NEW BARBER REGISTRATION FORM */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {t('barbersFormAddTitle')}
        </Text>
        <Card style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textDim }]}>{t('barbersLabelName')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={locale === 'es' ? 'Ej. Juan Pérez' : 'e.g., Juan Pérez'}
              placeholderTextColor={colors.textDim}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textDim }]}>{t('barbersLabelPhone')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. +1 555-555-0199"
              placeholderTextColor={colors.textDim}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title={t('barbersBtnAdd')}
            onPress={handleAddBarber}
            loading={formLoading}
            style={styles.saveBtn}
          />
        </Card>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('barbersPlaceholderSearch')}
            placeholderTextColor={colors.textDim}
          />
        </View>

        {/* ROSTER STAFF LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {t('barbersRosterTitle')}
        </Text>

        {filteredBarbers.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              {t('barbersEmptyRoster')}
            </Text>
          </Card>
        ) : (
          filteredBarbers.map((barber) => (
            <Card key={barber.id} style={[styles.barberCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.barberLayout}>
                <View style={[styles.avatarCircle, barber.status !== 'active' && styles.avatarInactive]}>
                  <Text style={styles.avatarText}>
                    {barber.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailsColumn}>
                  <Text style={[styles.barberName, { color: colors.text }, barber.status !== 'active' && styles.textMuted]}>
                    {barber.name}
                  </Text>
                  <Text style={[styles.barberPhone, { color: colors.textMuted }]}>{barber.phone}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <Switch
                    value={barber.status === 'active'}
                    onValueChange={() => handleToggleBarberStatus(barber.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={barber.status === 'active' ? '#ffffff' : colors.textDim}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  
                  <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => handleDeleteBarber(barber.id, barber.name)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerCount: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  formCard: {
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 44,
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 4,
    height: 42,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#121214',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 13,
  },
  barberCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  barberLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInactive: {
    backgroundColor: '#3f3f46',
    opacity: 0.5,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailsColumn: {
    flex: 1,
    marginLeft: 14,
  },
  barberName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  textMuted: {
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
  barberPhone: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
});
