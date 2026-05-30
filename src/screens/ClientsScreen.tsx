import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Contacts from 'react-native-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { storage } from '../services/storage';

import Card from '../components/Card';
import Button from '../components/Button';

interface Client {
  id: string;
  name: string;
  phone: string;
  visits: number;
  lastVisit: string;
  preferences: string;
  imported?: boolean; // Flag for contacts imported from phone
}

interface PhoneContact {
  recordID: string;
  givenName: string;
  familyName: string;
  phoneNumber: string;
  selected: boolean;
}

const DEFAULT_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Reinold Carrasco',
    phone: '+1 555-123-4567',
    visits: 14,
    lastVisit: 'Hoy, 3:00 PM',
    preferences:
      'Prefiere corte degradado (mid fade) muy pulido, navaja en contornos. Solo usa pomada con efecto mate. Le gusta tomar café negro sin azúcar.',
  },
  {
    id: '2',
    name: 'Juan Pérez',
    phone: '+1 555-555-0192',
    visits: 6,
    lastVisit: 'Ayer, 4:15 PM',
    preferences:
      'Corte tradicional corto, tijera arriba. No le gustan productos con aroma fuerte.',
  },
  {
    id: '3',
    name: 'Lucas Mateo',
    phone: '+1 555-222-3344',
    visits: 9,
    lastVisit: 'Hoy, 11:15 AM',
    preferences:
      'Corte tipo Buzzcut. Barba bien delineada con afeitado al ras en cuello.',
  },
  {
    id: '4',
    name: 'Daniel Ortiz',
    phone: '+1 555-777-6655',
    visits: 21,
    lastVisit: '27 May 2026',
    preferences:
      'Coloración de barba completa tono castaño oscuro. Lavado con champú especial.',
  },
];

const STORAGE_KEY = '@barberlink_clients';

export default function ClientsScreen() {
  const { t, locale } = useLanguage();
  const { showAlert, showToast } = useAlert();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Contact import states
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const checkBilling = async () => {
        const bState = await storage.getBillingState();
        setIsExpired(bState.mode === 'trial' && bState.trialDays === 0);
      };
      checkBilling();
    }, [])
  );

  // Load clients from storage
  useEffect(() => {
    const loadClients = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setClients(JSON.parse(stored));
        } else {
          setClients(DEFAULT_CLIENTS);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(DEFAULT_CLIENTS),
          );
        }
      } catch {
        setClients(DEFAULT_CLIENTS);
      }
    };
    loadClients();
  }, []);

  // Save clients to storage
  const saveClients = async (list: Client[]) => {
    setClients(list);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.log('Failed to save clients', e);
    }
  };

  // Load contacts from phone and validate permissions dynamically
  const loadPhoneContacts = async () => {
    setLoadingContacts(true);

    // 1. Core library capability check (Cross-architecture: supports both Old Arch and New Arch/TurboModules)
    if (!Contacts || typeof Contacts.checkPermission !== 'function') {
      setLoadingContacts(false);
      showAlert(
        locale === 'es' ? 'Error del Sistema' : 'System Error',
        locale === 'es'
          ? 'El módulo nativo de contactos no está enlazado en este binario de la aplicación. Por favor, asegúrate de recompilar e instalar la app nuevamente en el iPhone.'
          : 'The native contacts module is not linked in this app binary. Please make sure you rebuild and reinstall the app on your iPhone.',
        'error'
      );
      return;
    }

    try {
      // 2. Perform native permission check
      const permission = await Contacts.checkPermission();
      let finalHasPermission = false;

      if (permission === 'authorized' || permission === 'limited') {
        finalHasPermission = true;
      } else if (permission === 'denied') {
        setLoadingContacts(false);
        showAlert(
          locale === 'es' ? 'Permiso Desactivado' : 'Permission Disabled',
          locale === 'es'
            ? 'El acceso a los contactos está desactivado en los Ajustes de tu iPhone. Por favor, ve a Ajustes > BarberLink y activa el acceso a tus Contactos.'
            : 'Access to contacts is disabled in your iPhone settings. Please go to Settings > BarberLink and enable access to your Contacts.',
          'error'
        );
        return;
      } else {
        // 'undefined' status - request access
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
              {
                title: locale === 'es' ? 'Permiso de Contactos' : 'Contacts Permission',
                message: locale === 'es'
                  ? 'BarberLink necesita acceso a tus contactos para importar clientes.'
                  : 'BarberLink needs access to your contacts to import clients.',
                buttonPositive: 'OK',
              },
            );
            finalHasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
          } catch {
            finalHasPermission = false;
          }
        } else {
          const newPermission = await Contacts.requestPermission();
          if (newPermission === 'authorized' || newPermission === 'limited') {
            finalHasPermission = true;
          } else if (newPermission === 'denied') {
            setLoadingContacts(false);
            showAlert(
              locale === 'es' ? 'Permiso Desactivado' : 'Permission Disabled',
              locale === 'es'
                ? 'El acceso a los contactos está desactivado en los Ajustes de tu iPhone. Por favor, ve a Ajustes > BarberLink y activa el acceso a tus Contactos.'
                : 'Access to contacts is disabled in your iPhone settings. Please go to Settings > BarberLink and enable access to your Contacts.',
              'error'
            );
            return;
          }
        }
      }

      // 3. Attempt contact retrieval (Ultimate iOS 18 limited-access and status validation)
      let contactsResult;
      try {
        contactsResult = await Contacts.getAll();
        finalHasPermission = true; // Succeeding in fetching means we definitely have valid permission!
      } catch (getAllError) {
        console.log('Contacts.getAll rejected:', getAllError);
        // If we hadn't already confirmed permission and the fetch failed, block
        if (!finalHasPermission) {
          setLoadingContacts(false);
          showAlert(
            locale === 'es' ? 'Permiso Requerido' : 'Permission Required',
            t('clientsImportPermDenied'),
            'error',
          );
          return;
        } else {
          // If permission was confirmed but something else caused failure, pass to outer handler
          throw getAllError;
        }
      }

      // 4. Map and filter contacts that have at least a name and phone
      const mapped: PhoneContact[] = contactsResult
        .filter(
          (c) =>
            (c.givenName || c.familyName) &&
            c.phoneNumbers &&
            c.phoneNumbers.length > 0,
        )
        .map((c) => ({
          recordID: c.recordID,
          givenName: c.givenName || '',
          familyName: c.familyName || '',
          phoneNumber: c.phoneNumbers[0]?.number || '',
          selected: false,
        }))
        .sort((a, b) => {
          const nameA = `${a.givenName} ${a.familyName}`.trim().toLowerCase();
          const nameB = `${b.givenName} ${b.familyName}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });

      // Mark already-existing clients to avoid duplicate imports
      const existingPhones = clients.map((cl) =>
        cl.phone.replace(/[\s\-\(\)]/g, ''),
      );
      const filtered = mapped.filter((mc) => {
        const cleanPhone = mc.phoneNumber.replace(/[\s\-\(\)]/g, '');
        return !existingPhones.includes(cleanPhone);
      });

      setPhoneContacts(filtered);
      setShowImportPanel(true);
    } catch (e) {
      console.log('Error in contacts loading logic', e);
      showAlert(
        locale === 'es' ? 'Error' : 'Error',
        locale === 'es'
          ? 'No se pudieron cargar los contactos del teléfono.'
          : 'Failed to load phone contacts.',
        'error',
      );
    }
    setLoadingContacts(false);
  };

  // Toggle contact selection
  const toggleContactSelection = (recordID: string) => {
    setPhoneContacts((prev) =>
      prev.map((c) =>
        c.recordID === recordID ? { ...c, selected: !c.selected } : c,
      ),
    );
  };

  // Select / Deselect all
  const toggleSelectAll = () => {
    const filteredVisible = getFilteredContacts();
    const allSelected = filteredVisible.every((c) => c.selected);

    // Get IDs of visible contacts
    const visibleIds = new Set(filteredVisible.map((c) => c.recordID));

    setPhoneContacts((prev) =>
      prev.map((c) =>
        visibleIds.has(c.recordID) ? { ...c, selected: !allSelected } : c,
      ),
    );
  };

  // Get filtered contacts for display
  const getFilteredContacts = () => {
    if (!contactSearch.trim()) {
      return phoneContacts;
    }
    const q = contactSearch.toLowerCase();
    return phoneContacts.filter(
      (c) =>
        `${c.givenName} ${c.familyName}`.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q),
    );
  };

  // Perform the import
  const importSelectedContacts = () => {
    const selected = phoneContacts.filter((c) => c.selected);
    if (selected.length === 0) {
      return;
    }

    const now = new Date();
    const dateStr =
      locale === 'es'
        ? `${now.getDate()} ${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][now.getMonth()]} ${now.getFullYear()}`
        : `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const newClients: Client[] = selected.map((c, idx) => ({
      id: `imported_${Date.now()}_${idx}`,
      name: `${c.givenName} ${c.familyName}`.trim(),
      phone: c.phoneNumber,
      visits: 0,
      lastVisit: dateStr,
      preferences:
        locale === 'es'
          ? 'Importado desde contactos del teléfono.'
          : 'Imported from phone contacts.',
      imported: true,
    }));

    const updatedClients = [...clients, ...newClients];
    saveClients(updatedClients);

    setShowImportPanel(false);
    setPhoneContacts([]);
    setContactSearch('');

    showToast(
      t('clientsImportCount', { count: String(selected.length) }),
      'success',
    );
  };

  const selectedCount = phoneContacts.filter((c) => c.selected).length;
  const filteredDisplayContacts = getFilteredContacts();

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Search Header + Import Button */}
      <View style={[styles.searchHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            placeholder={t('clientsSearchPlaceholder')}
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => {
              if (isExpired) {
                showAlert(
                  locale === 'es' ? 'Prueba Expirada' : 'Trial Expired',
                  locale === 'es'
                    ? 'La importación de contactos está bloqueada. Activa BarberLink Premium en Ajustes para importar tus clientes.'
                    : 'Importing contacts is locked. Activate BarberLink Premium in Settings to import your clients.',
                  'error'
                );
              } else {
                loadPhoneContacts();
              }
            }}
            activeOpacity={0.8}
            disabled={loadingContacts}
          >
            <Text style={styles.importBtnIcon}>📇</Text>
            <Text style={styles.importBtnText}>
              {loadingContacts
                ? '...'
                : locale === 'es'
                  ? 'Importar'
                  : 'Import'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('clientsTitle')}</Text>
          <Text style={[styles.clientCount, { color: colors.textMuted }]}>
            {clients.length}{' '}
            {locale === 'es' ? 'clientes' : 'clients'}
          </Text>
        </View>

        {filteredClients.map((client) => (
          <TouchableOpacity
            key={client.id}
            onPress={() => setSelectedClient(client)}
            activeOpacity={0.9}
          >
            <Card style={[styles.clientCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.clientRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                  <Text style={styles.avatarText}>
                    {client.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.clientName, { color: colors.text }]}>{client.name}</Text>
                    {client.imported && (
                      <View style={styles.importedBadge}>
                        <Text style={styles.importedBadgeText}>
                          {t('clientsAddedLabel')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.clientPhone}>💬 {client.phone}</Text>

                  <View style={styles.visitRow}>
                    <Text style={[styles.visitTag, { color: colors.textMuted }]}>
                      🎯 {client.visits} {t('clientsVisits')}
                    </Text>
                    <Text style={[styles.lastVisitTag, { color: colors.textDim }]}>
                      {t('clientsLastVisit')} {client.lastVisit}
                    </Text>
                  </View>
                </View>

                {/* Direct quick action */}
                <TouchableOpacity
                  style={[styles.quickChatBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                  onPress={() =>
                    showToast(
                      `Redirigiendo a WhatsApp con ${client.name}...`,
                      'info',
                    )
                  }
                >
                  <Text style={styles.quickChatEmoji}>💬</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {filteredClients.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('clientsEmpty')}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Client Detail Panel — absolute overlay (no Modal to avoid stacking freeze) */}
      {selectedClient && (
        <View style={styles.panelOverlay}>
          <TouchableOpacity
            style={[styles.panelBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)' }]}
            activeOpacity={1}
            onPress={() => setSelectedClient(null)}
          />
          <View style={[styles.panelContent, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
            <View style={[styles.panelHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('clientsModalTitle')}</Text>
              <TouchableOpacity onPress={() => setSelectedClient(null)}>
                <Text style={[styles.closeBtn, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Card style={[styles.modalCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                <View style={styles.modalProfileRow}>
                  <View style={[styles.modalAvatar, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
                    <Text style={styles.modalAvatarText}>
                      {selectedClient.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalClientName, { color: colors.text }]}>
                      {selectedClient.name}
                    </Text>
                    <Text style={styles.modalClientPhone}>
                      💬 {selectedClient.phone}
                    </Text>
                  </View>
                </View>

                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                <Text style={[styles.prefLabel, { color: colors.text }]}>
                  {t('clientsPreferencesLabel')}
                </Text>
                <Text style={[styles.prefText, { color: colors.textMuted }]}>
                  {selectedClient.preferences}
                </Text>

                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

                <View style={styles.metricRow}>
                  <View style={[styles.metricBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>
                      {t('clientsMetricVisits')}
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>
                      {selectedClient.visits}
                    </Text>
                  </View>
                  <View style={[styles.metricBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.textDim }]}>
                      {t('clientsMetricFreq')}
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>
                      {t('clientsMetricFreqVal')}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Action buttons */}
              <Button
                title={t('clientsBtnHistory')}
                variant="outline"
                onPress={() => {
                  showToast(
                    `Mostrando logs de confirmación enviados a ${selectedClient.name}`,
                    'success',
                  );
                }}
                style={styles.modalBtn}
              />

              <Button
                title={t('clientsBtnClose')}
                variant="secondary"
                onPress={() => setSelectedClient(null)}
                style={styles.modalBtn}
              />
            </ScrollView>
          </View>
        </View>
      )}

      {/* Contact Import Selection Panel — also absolute overlay */}
      {showImportPanel && (
        <View style={styles.panelOverlay}>
          <TouchableOpacity
            style={[styles.panelBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.45)' }]}
            activeOpacity={1}
            onPress={() => {
              setShowImportPanel(false);
              setContactSearch('');
            }}
          />
          <View style={[styles.importPanelContent, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
            <View style={[styles.panelHandle, { backgroundColor: colors.border }]} />

            {/* Import Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('clientsImportTitle')}
                </Text>
                <Text style={[styles.importSubtitle, { color: colors.textDim }]}>
                  {t('clientsImportSubtitle')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowImportPanel(false);
                  setContactSearch('');
                }}
              >
                <Text style={[styles.closeBtn, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search within contacts */}
            <TextInput
              style={[styles.contactSearchInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder={t('clientsImportSearch')}
              placeholderTextColor={colors.textDim}
              value={contactSearch}
              onChangeText={setContactSearch}
            />

            {/* Selection controls bar */}
            <View style={styles.selectionBar}>
              <TouchableOpacity onPress={toggleSelectAll}>
                <Text style={styles.selectAllText}>
                  {filteredDisplayContacts.every((c) => c.selected) &&
                  filteredDisplayContacts.length > 0
                    ? t('clientsImportDeselectAll')
                    : t('clientsImportSelectAll')}
                </Text>
              </TouchableOpacity>
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>
                  {selectedCount} {t('clientsImportSelected')}
                </Text>
              </View>
            </View>

            {/* Contacts List */}
            <ScrollView
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            >
              {filteredDisplayContacts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📇</Text>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {t('clientsImportEmpty')}
                  </Text>
                </View>
              ) : (
                filteredDisplayContacts.map((contact) => {
                  const fullName =
                    `${contact.givenName} ${contact.familyName}`.trim();
                  const initials = fullName
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const isSelected = contact.selected;

                  return (
                    <TouchableOpacity
                      key={contact.recordID}
                      style={[
                        styles.contactItem,
                        { backgroundColor: colors.inputBackground, borderColor: colors.border },
                        isSelected && [styles.contactItemSelected, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }],
                      ]}
                      onPress={() =>
                        toggleContactSelection(contact.recordID)
                      }
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.contactAvatar,
                          { backgroundColor: colors.cardBackground, borderColor: colors.border },
                          isSelected && [styles.contactAvatarSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                        ]}
                      >
                        {isSelected ? (
                          <Text style={styles.contactCheckmark}>✓</Text>
                        ) : (
                          <Text style={[styles.contactInitials, { color: colors.textMuted }]}>
                            {initials}
                          </Text>
                        )}
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{fullName}</Text>
                        <Text style={[styles.contactPhone, { color: colors.textDim }]}>
                          {contact.phoneNumber}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Import Action Button */}
            {selectedCount > 0 && (
              <View style={[styles.importActionBar, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.importConfirmBtn}
                  onPress={importSelectedContacts}
                  activeOpacity={0.8}
                >
                  <Text style={styles.importConfirmText}>
                    {t('clientsImportConfirm')} ({selectedCount})
                  </Text>
                </TouchableOpacity>
              </View>
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
  searchHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
    backgroundColor: '#0a0a0a',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 10,
  },
  importBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  importBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  importBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientCount: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '600',
  },
  clientCard: {
    padding: 16,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  importedBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  importedBadgeText: {
    color: '#3b82f6',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  clientPhone: {
    fontSize: 13,
    color: '#25d366',
    marginTop: 3,
    fontWeight: '500',
  },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  visitTag: {
    color: '#a1a1aa',
    fontSize: 11,
    marginRight: 12,
  },
  lastVisitTag: {
    color: '#71717a',
    fontSize: 11,
  },
  quickChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  quickChatEmoji: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
  },

  // Panel overlay styles (no Modal — absolute positioned)
  panelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  panelBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  panelContent: {
    backgroundColor: '#0f0f11',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    maxHeight: '85%',
  },
  panelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginBottom: 16,
  },
  importPanelContent: {
    backgroundColor: '#0f0f11',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    maxHeight: '92%',
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
  importSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  closeBtn: {
    color: '#a1a1aa',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  modalCard: {
    padding: 18,
    marginBottom: 20,
  },
  modalProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalAvatarText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 18,
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
  prefLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 8,
  },
  prefText: {
    color: '#a1a1aa',
    fontSize: 13,
    lineHeight: 18,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    width: '48%',
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#71717a',
    fontSize: 11,
    marginBottom: 4,
  },
  metricVal: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBtn: {
    marginBottom: 12,
  },

  // Contact Import Panel styles
  contactSearchInput: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 13,
    marginBottom: 12,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  selectAllText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  selectedCountText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  contactsList: {
    flex: 1,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#1f1f22',
  },
  contactItemSelected: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  contactCheckmark: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInitials: {
    color: '#a1a1aa',
    fontWeight: 'bold',
    fontSize: 13,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  contactPhone: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
  },
  importActionBar: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    borderTopWidth: 1,
    borderTopColor: '#1f1f22',
  },
  importConfirmBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  importConfirmText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
