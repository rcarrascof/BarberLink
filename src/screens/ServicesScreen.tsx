import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { storage, ServiceItem } from '../services/storage';

import Card from '../components/Card';
import Button from '../components/Button';

export default function ServicesScreen() {
  const { t, locale } = useLanguage();
  const navigation = useNavigation();
  const { showAlert, showConfirm, showToast } = useAlert();
  const { colors, isDark } = useTheme();

  // Services state
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const list = await storage.getServices();
    setServices(list);
  };

  const handleAddService = async () => {
    if (!name.trim() || !price.trim()) {
      showAlert(
        locale === 'es' ? 'Campos obligatorios' : 'Required Fields',
        t('servicesAlertEmpty'),
        'error'
      );
      return;
    }

    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration, 10);

    if (isNaN(priceNum) || isNaN(durationNum) || priceNum <= 0 || durationNum <= 0) {
      showAlert(
        locale === 'es' ? 'Valores incorrectos' : 'Invalid values',
        t('servicesAlertInvalid'),
        'error'
      );
      return;
    }

    setFormLoading(true);
    const newService: ServiceItem = {
      id: Date.now().toString(),
      name: name.trim(),
      price: priceNum,
      duration: durationNum,
    };

    const updatedList = [...services, newService];
    setServices(updatedList);
    await storage.saveServices(updatedList);
    
    setName('');
    setPrice('');
    setDuration('30');
    setFormLoading(false);

    showToast(t('servicesAlertSaved'), 'success');
  };

  const handleDeleteService = (id: string, serviceName: string) => {
    showConfirm(
      locale === 'es' ? 'Eliminar Servicio' : 'Delete Service',
      t('servicesAlertDelete', { name: serviceName }),
      async () => {
        const updatedList = services.filter(item => item.id !== id);
        setServices(updatedList);
        await storage.saveServices(updatedList);
        showToast(locale === 'es' ? 'Servicio eliminado' : 'Service deleted', 'success');
      },
      {
        confirmText: locale === 'es' ? 'Eliminar' : 'Delete',
        cancelText: locale === 'es' ? 'Cancelar' : 'Cancel',
        isDanger: true,
      }
    );
  };

  // Filter list by search query
  const filteredServices = services.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Dynamic Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>‹ {t('agendaBtnBack')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('servicesTitle')}</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>{services.length} {locale === 'es' ? 'Items' : 'Items'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* NEW SERVICE REGISTRATION FORM */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {t('servicesFormAddTitle')}
        </Text>
        <Card style={[styles.formCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textDim }]}>{t('servicesLabelName')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t('servicesPlaceholderName')}
              placeholderTextColor={colors.textDim}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textDim }]}>{t('servicesLabelPrice')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={price}
                onChangeText={setPrice}
                placeholder="600"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textDim }]}>{t('servicesLabelDuration')}</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                value={duration}
                onChangeText={setDuration}
                placeholder="30"
                placeholderTextColor={colors.textDim}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Button
            title={t('servicesBtnCreate')}
            onPress={handleAddService}
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
            placeholder={t('servicesPlaceholderSearch')}
            placeholderTextColor={colors.textDim}
          />
        </View>

        {/* CATALOG LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textDim }]}>
          {t('servicesCatalogTitle')}
        </Text>

        {filteredServices.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              {t('servicesEmptyCatalog')}
            </Text>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} style={[styles.serviceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.serviceLayout}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>✂️</Text>
                </View>

                <View style={styles.detailsColumn}>
                  <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                  <Text style={[styles.serviceMeta, { color: colors.textMuted }]}>
                    {t('servicesDurationText', { price: service.price.toLocaleString(), duration: service.duration.toString() })}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDeleteService(service.id, service.name)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
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
    color: '#71717a',
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  serviceCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  serviceLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  iconEmoji: {
    fontSize: 16,
  },
  detailsColumn: {
    flex: 1,
    marginLeft: 14,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  serviceMeta: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },
});
