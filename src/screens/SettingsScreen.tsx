import React, { useState, useCallback } from 'react';
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
  Modal,
  Platform,
  Share,
  Clipboard,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

import Card from '../components/Card';
import Button from '../components/Button';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import { storage, Barber, ServiceItem, AvailabilityDay } from '../services/storage';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useLanguage();
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const { showAlert, showConfirm, showToast } = useAlert();
  const navigation = useNavigation<any>();
  
  // Shop details
  const [shopName, setShopName] = useState('Barbería Real');
  const [botMessage, setBotMessage] = useState('¡Hola! Bienvenido a Barbería Real. ¿Con qué barbero deseas agendar tu cita hoy?');
  const [autoReminder, setAutoReminder] = useState(true);
  
  // SaaS Billing states
  const [billingMode, setBillingMode] = useState<'trial' | 'subscribed'>('trial');
  const [trialDays, setTrialDays] = useState(7);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [nextBilling] = useState('28 Jun 2026');

  // Native Store modal state
  const [showStoreSheet, setShowStoreSheet] = useState(false);
  const [countryCode, setCountryCode] = useState('US');
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Share bot states
  const [shopPhone, setShopPhone] = useState('+15551234567');
  const [editingPhone, setEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  // Maintenance lists
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);


  // Sincronizar mantenimientos al enfocar
  useFocusEffect(
    useCallback(() => {
      loadSettingsData();
    }, [])
  );

  const loadSettingsData = async () => {
    const listB = await storage.getBarbers();
    const listS = await storage.getServices();
    const listA = await storage.getAvailability();
    setBarbers(listB);
    setServices(listS);
    setAvailability(listA);

    const sName = await storage.getShopName();
    if (sName) {
      setShopName(sName);
    }

    const cCode = await storage.getCountryCode();
    if (cCode) {
      setCountryCode(cCode);
    }

    const sPhone = await storage.getShopPhone();
    if (sPhone) {
      setShopPhone(sPhone);
    }

    const bMsg = await storage.getBotMessage();
    if (bMsg) {
      setBotMessage(bMsg);
    }

    const bState = await storage.getBillingState();
    setBillingMode(bState.mode);
    setTrialDays(bState.trialDays);
  };

  const handleSaveSettings = async () => {
    await storage.saveShopName(shopName);
    await storage.saveBotMessage(botMessage);
    showToast(t('settingsBtnSave') + '...', 'success');
  };

  // Share bot helpers
  const getCleanPhone = (phone: string) => phone.replace(/[\s\-\(\)\+]/g, '');
  const getWhatsAppLink = () => `https://wa.me/${getCleanPhone(shopPhone)}`;

  const handleSavePhone = async () => {
    await storage.saveShopPhone(tempPhone || shopPhone);
    if (tempPhone) {
      setShopPhone(tempPhone);
    }
    setEditingPhone(false);
    showToast(t('shareSavePhone') + ' ✓', 'success');
  };

  const handleCopyLink = () => {
    Clipboard.setString(getWhatsAppLink());
    showToast(t('shareCopied'), 'success');
  };

  const handleShareLink = async () => {
    try {
      const link = getWhatsAppLink();
      const message = t('shareMsg', { shop: shopName, link });
      await Share.share({
        message,
        url: link,
      });
    } catch (e) {
      console.log('Error sharing bot', e);
    }
  };

  const handleLogout = () => {
    showConfirm(
      locale === 'es' ? 'Cerrar Sesión' : 'Logout',
      locale === 'es' ? '¿Estás seguro de que deseas cerrar tu sesión en BarberLink?' : 'Are you sure you want to log out of BarberLink?',
      () => {
        showToast(locale === 'es' ? 'Sesión cerrada' : 'Logged out', 'info');
        navigation.replace('Login');
      }
    );
  };

  const handleDeleteAccount = () => {
    showConfirm(
      locale === 'es' ? 'Eliminar Cuenta Permanentes' : 'Delete Account Permanently',
      locale === 'es'
        ? '¿Deseas eliminar permanentemente tu barbería? Se borrarán todos los barberos, servicios y configuraciones. Esta acción es irreversible.'
        : 'Do you want to permanently delete your barbershop? All barbers, services, and configurations will be wiped. This action is irreversible.',
      async () => {
        showToast(locale === 'es' ? 'Cuenta Eliminada con éxito' : 'Account deleted successfully', 'error');
        navigation.replace('Login');
      },
      {
        isDanger: true,
        confirmText: locale === 'es' ? 'Eliminar Definitivamente' : 'Delete Definitively',
      }
    );
  };

  const simulateStorePayment = () => {
    setPaymentLoading(true);
    setTimeout(async () => {
      setPaymentLoading(false);
      setShowStoreSheet(false);
      setBillingMode('subscribed');
      setTrialDays(0);
      await storage.saveBillingState({ mode: 'subscribed', trialDays: 0 });
      showAlert(
        locale === 'es' ? '¡Pago Exitoso!' : 'Payment Successful!',
        locale === 'es'
          ? 'Felicidades, tu barbería ahora tiene acceso Premium completo. El bot está listo.'
          : 'Congratulations, your barbershop now has full Premium access. The bot is ready.',
        'success'
      );
    }, 2000);
  };

  const getLocalizedPrice = (code: string) => {
    if (code === 'US') return '$9.99 / ' + (locale === 'es' ? 'mes' : 'mo');
    if (code === 'ES') return '9,99 € / ' + (locale === 'es' ? 'mes' : 'mo');
    return 'RD$ 550 / ' + (locale === 'es' ? 'mes' : 'mo');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* SHOP OWNER PROFILE HEADER */}
        <View style={[styles.profileHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {shopName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.profileShop, { color: colors.text }]}>{shopName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={[styles.trialBadge, { backgroundColor: billingMode === 'trial' ? (trialDays === 0 ? colors.error + '20' : colors.warning + '20') : colors.success + '20' }]}>
                <Text style={[styles.trialBadgeText, { color: billingMode === 'trial' ? (trialDays === 0 ? colors.error : colors.warning) : colors.success }]}>
                  {billingMode === 'trial' ? (trialDays === 0 ? (locale === 'es' ? 'Prueba Expirada' : 'Trial Expired') : `${locale === 'es' ? 'Prueba' : 'Trial'}: ${trialDays}d`) : 'Premium Link'}
                </Text>
              </View>
              {billingMode === 'trial' && (
                <TouchableOpacity
                  onPress={async () => {
                    const nextDays = trialDays > 0 ? 0 : 7;
                    setTrialDays(nextDays);
                    await storage.saveBillingState({ mode: 'trial', trialDays: nextDays });
                    showToast(
                      locale === 'es'
                        ? nextDays === 0 ? 'Simulación: Prueba Expirada' : 'Simulación: Prueba Reiniciada (7d)'
                        : nextDays === 0 ? 'Simulation: Trial Expired' : 'Simulation: Trial Reset (7d)',
                      nextDays === 0 ? 'error' : 'success'
                    );
                  }}
                >
                  <Text style={[styles.quickSimText, { color: colors.primary }]}>
                    {trialDays > 0
                      ? (locale === 'es' ? '[Simular Expiración]' : '[Simulate Expiration]')
                      : (locale === 'es' ? '[Reiniciar Prueba (7d)]' : '[Reset Trial (7d)]')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* IDIOMA / LANGUAGE SELECTOR */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settingsLanguageTitle')}</Text>
        <Card style={[styles.languageCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              onPress={() => setLocale('es')}
              style={[
                styles.languageTab,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                locale === 'es' && [styles.languageTabActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
            >
              <Text style={[styles.languageTabText, { color: colors.textMuted }, locale === 'es' && { color: '#ffffff', fontWeight: 'bold' }]}>
                {t('settingsLanguageEsp')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setLocale('en')}
              style={[
                styles.languageTab,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                locale === 'en' && [styles.languageTabActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
            >
              <Text style={[styles.languageTabText, { color: colors.textMuted }, locale === 'en' && { color: '#ffffff', fontWeight: 'bold' }]}>
                {t('settingsLanguageEng')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* TEMA / THEME SELECTOR */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{locale === 'es' ? 'Tema de la Aplicación' : 'Application Theme'}</Text>
        <Card style={[styles.languageCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.languageRow}>
            <TouchableOpacity
              onPress={() => { if (theme !== 'light') toggleTheme(); }}
              style={[
                styles.languageTab,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                theme === 'light' && [styles.languageTabActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="sunny-outline" size={16} color={theme === 'light' ? '#ffffff' : colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.languageTabText, { color: colors.textMuted }, theme === 'light' && { color: '#ffffff', fontWeight: 'bold' }]}>
                  {locale === 'es' ? 'Claro' : 'Light'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => { if (theme !== 'dark') toggleTheme(); }}
              style={[
                styles.languageTab,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                theme === 'dark' && [styles.languageTabActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="moon-outline" size={16} color={theme === 'dark' ? '#ffffff' : colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.languageTabText, { color: colors.textMuted }, theme === 'dark' && { color: '#ffffff', fontWeight: 'bold' }]}>
                  {locale === 'es' ? 'Oscuro' : 'Dark'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* COMPARTIR BOT / SHARE BOT */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('shareTitle')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {/* WhatsApp Number Config */}
          <View style={styles.sharePhoneRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sharePhoneLabel, { color: colors.text }]}>{t('sharePhoneLabel')}</Text>
              {editingPhone ? (
                <TextInput
                  style={[styles.sharePhoneInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  placeholder={t('sharePhonePlaceholder')}
                  placeholderTextColor={colors.textDim}
                  keyboardType="phone-pad"
                  autoFocus
                />
              ) : (
                <Text style={[styles.sharePhoneVal, { color: colors.primary }]}>{shopPhone}</Text>
              )}
            </View>
            {editingPhone ? (
              <TouchableOpacity
                style={[styles.sharePhoneSaveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSavePhone}
              >
                <Icon name="checkmark" size={18} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sharePhoneEditBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={() => { setTempPhone(shopPhone); setEditingPhone(true); }}
              >
                <Icon name="create-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* WhatsApp Link */}
          <Text style={[styles.shareLinkLabel, { color: colors.text }]}>{t('shareYourLink')}</Text>
          <View style={[styles.shareLinkBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            <Text style={[styles.shareLinkText, { color: colors.textMuted }]} numberOfLines={1}>
              {getWhatsAppLink()}
            </Text>
            <TouchableOpacity style={[styles.shareCopyBtn, { backgroundColor: colors.cardSub }]} onPress={handleCopyLink}>
              <Icon name="copy-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* QR Code Visual */}
          <Text style={[styles.shareQrLabel, { color: colors.text }]}>{t('shareQrTitle')}</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrBox}>
              <Image
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&data=${encodeURIComponent(getWhatsAppLink())}` }}
                style={{ width: 150, height: 150 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.qrDesc, { color: colors.textMuted }]}>{t('shareQrDesc')}</Text>
            <Text style={[styles.qrLinkUnder, { color: colors.primary }]}>{getWhatsAppLink()}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Share Actions */}
          <View style={styles.shareActionsRow}>
            <TouchableOpacity style={[styles.shareActionBtn, { backgroundColor: colors.inputBackground }]} onPress={handleCopyLink}>
              <Icon name="copy-outline" size={20} color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.shareActionLabel, { color: colors.text }]}>{t('shareCopyLink')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareActionBtn, { backgroundColor: colors.inputBackground }]} onPress={handleShareLink}>
              <Icon name="share-social-outline" size={20} color={colors.primary} style={{ marginBottom: 6 }} />
              <Text style={[styles.shareActionLabel, { color: colors.text }]}>{t('shareNativeBtn')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* AJUSTES DEL BOT */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settingsTitle')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('settingsShopNameLabel')}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={shopName}
              onChangeText={setShopName}
              placeholderTextColor={colors.textDim}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('settingsBotMsgLabel')}</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              value={botMessage}
              onChangeText={setBotMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Automatic Reminder Option Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>{t('settingsRemindersTitle')}</Text>
              <Text style={[styles.switchDesc, { color: colors.textMuted }]}>{t('settingsRemindersDesc')}</Text>
            </View>
            <Switch
              value={autoReminder}
              onValueChange={setAutoReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={autoReminder ? '#ffffff' : colors.textDim}
            />
          </View>

          <Button
            title={t('settingsBtnSave')}
            variant="outline"
            onPress={handleSaveSettings}
            style={styles.saveBtn}
          />

          <View style={{ height: 10 }} />

          <Button
            title={locale === 'es' ? 'Asistente de Configuración Bot 🚀' : 'WhatsApp Bot Setup Wizard 🚀'}
            variant="secondary"
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.saveBtn}
          />
        </Card>

        {/* BARBERSHOP MANAGEMENT SUITE ("MANTENIMIENTOS") */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{locale === 'es' ? 'Administración de Barbería' : 'Barbershop Administration'}</Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.managementDesc, { color: colors.textMuted }]}>
            {locale === 'es' 
              ? 'Mantenimiento del equipo de barberos, servicios ofrecidos y disponibilidad horaria sincronizados con el bot de WhatsApp.' 
              : 'Maintenance of the barber team, services, and schedules synchronized with the WhatsApp autopilot bot.'}
          </Text>

          <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('Barbers')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="people-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>{locale === 'es' ? 'Gestionar Equipo (Barberos)' : 'Manage Team (Barbers)'}</Text>
                <Text style={[styles.menuItemSub, { color: colors.textDim }]}>{locale === 'es' ? `${barbers.filter(b => b.status === 'active').length} Activos • Configurar roles` : `${barbers.filter(b => b.status === 'active').length} Active • Configure roles`}</Text>
              </View>
            </View>
            <Icon name="chevron-forward-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('Services')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="cut-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>{locale === 'es' ? 'Gestionar Servicios' : 'Manage Services'}</Text>
                <Text style={[styles.menuItemSub, { color: colors.textDim }]}>{locale === 'es' ? `${services.length} Categorías • Precios & Tiempos` : `${services.length} Categories • Prices & Durations`}</Text>
              </View>
            </View>
            <Icon name="chevron-forward-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.menuItemRow} onPress={() => navigation.navigate('Availability')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <Icon name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>{locale === 'es' ? 'Horarios & Disponibilidad' : 'Schedules & Availability'}</Text>
                <Text style={[styles.menuItemSub, { color: colors.textDim }]}>{locale === 'es' ? 'Configurar días libres y horarios de trabajo' : 'Configure days off and working shifts'}</Text>
              </View>
            </View>
            <Icon name="chevron-forward-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>
        </Card>

        {/* SUSCRIPCION SAAS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settingsBillingTitle')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.billingRow}>
            <Text style={[styles.billingLabel, { color: colors.textMuted }]}>{t('settingsBillingNext')}</Text>
            <Text style={[styles.billingVal, { color: colors.text }]}>
              {billingMode === 'trial' && trialDays > 0 ? t('settingsBillingNextTrial') : nextBilling}
            </Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={[styles.billingLabel, { color: colors.textMuted }]}>{t('settingsBillingCost')}</Text>
            <Text style={[styles.priceText, { color: colors.primary }]}>{getLocalizedPrice(countryCode)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {billingMode === 'trial' ? (
            <View style={styles.formContainer}>
              <Text style={[styles.formDesc, { color: colors.textMuted }]}>
                {Platform.OS === 'ios' 
                  ? 'Activa tu suscripción premium al instante utilizando el sistema oficial de pagos de Apple App Store.' 
                  : 'Activa tu suscripción premium al instante utilizando el sistema oficial de pagos de Google Play Store.'}
              </Text>
              <Button
                title={Platform.OS === 'ios' ? 'Suscribirse con App Store' : 'Suscribirse con Google Play'}
                onPress={() => setShowStoreSheet(true)}
                style={styles.actionBtn}
              />
            </View>
          ) : (
            <View style={styles.subscribedContainer}>
              <View style={styles.successBadgeRow}>
                <View style={[styles.checkIconCircle, { backgroundColor: colors.success + '18', borderColor: colors.success }]}>
                  <Icon name="checkmark" size={16} color={colors.success} />
                </View>
                <Text style={[styles.subscribedStatusTitle, { color: colors.text }]}>Suscripción Activa</Text>
              </View>
              <Text style={[styles.subscribedDesc, { color: colors.textMuted }]}>
                {Platform.OS === 'ios'
                  ? 'Tu cuenta está vinculada a BarberLink Premium. Los cargos se realizan a través de tu cuenta de Apple.'
                  : 'Tu cuenta está vinculada a BarberLink Premium. Los cargos se realizan a través de tu cuenta de Google Play.'}
              </Text>
              <Text style={[styles.subscribedFooter, { color: colors.textDim }]}>
                Puedes gestionar tu suscripción o cancelarla en cualquier momento desde los ajustes de tu cuenta del sistema.
              </Text>
            </View>
          )}
        </Card>

        {/* PRIVACY POLICY BUTTON */}
        <TouchableOpacity style={styles.privacyBtnRow} onPress={() => setShowPrivacy(true)}>
          <Text style={[styles.privacyBtnText, { color: colors.textMuted }]}>
            {locale === 'es' ? 'Ver Política de Privacidad 🛡️' : 'View Privacy Policy 🛡️'}
          </Text>
        </TouchableOpacity>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
          <Text style={[styles.logoutLinkText, { color: colors.primary }]}>{t('settingsLogoutBtn')}</Text>
        </TouchableOpacity>

        {/* DANGER ZONE - MINI & POLISHED */}
        <TouchableOpacity style={styles.deleteLink} onPress={handleDeleteAccount}>
          <Text style={[styles.deleteLinkText, { color: colors.error }]}>{t('settingsDeleteTitle')}</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />

      </ScrollView>

      {/* DYNAMIC NATIVE STORE CHECKOUT SHEET MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showStoreSheet}
        onRequestClose={() => setShowStoreSheet(false)}
      >
        <View style={styles.storeOverlay}>
          <View style={Platform.OS === 'ios' ? styles.appleSheet : styles.googleSheet}>
            {/* Store Title */}
            <View style={styles.storeHeader}>
              <Text style={styles.storeLogo}>{Platform.OS === 'ios' ? '' : '🤖'}</Text>
              <Text style={styles.storeTitle}>
                {Platform.OS === 'ios' ? 'App Store Subscription' : 'Google Play Subscription'}
              </Text>
            </View>

            <View style={styles.storeDivider} />

            {/* Product details */}
            <View style={styles.productRow}>
              <View style={styles.productLogoBadge}>
                <Text style={styles.productLogoEmoji}>💈</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.productName}>BarberLink Premium</Text>
                <Text style={styles.productDetail}>Acceso Ilimitado • WhatsApp Bot</Text>
              </View>
            </View>

            <View style={styles.storeDivider} />

            {/* Billing details */}
            <View style={styles.billingDetail}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Precio / Price:</Text>
                <Text style={styles.priceVal}>{getLocalizedPrice(countryCode)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Cuenta / Account:</Text>
                <Text style={styles.priceVal}>reinold.carrasco@gmail.com</Text>
              </View>
            </View>

            <View style={styles.storeDivider} />

            {/* Platform-specific purchase CTA buttons */}
            <Button
              title={Platform.OS === 'ios' ? 'Confirmar con Face ID' : 'Confirmar Compra'}
              onPress={simulateStorePayment}
              loading={paymentLoading}
              style={Platform.OS === 'ios' ? styles.appleConfirmBtn : styles.googleConfirmBtn}
            />

            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowStoreSheet(false)}>
              <Text style={Platform.OS === 'ios' ? styles.appleCancelText : styles.googleCancelText}>
                {locale === 'en' ? 'Cancel' : 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileShop: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trialBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subscribedBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  trialBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickSimText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 10,
    textDecorationLine: 'underline',
  },
  languageCard: {
    padding: 12,
    marginBottom: 20,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageTab: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  languageTabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  languageTabText: {
    color: '#71717a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  languageTabTextActive: {
    color: '#10b981',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    padding: 16,
    marginBottom: 20,
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
  textArea: {
    height: 64,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  switchTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  switchDesc: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 4,
    height: 40,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billingLabel: {
    color: '#71717a',
    fontSize: 13,
  },
  billingVal: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 13,
  },
  priceText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 12,
  },
  formContainer: {
    marginTop: 8,
  },
  formDesc: {
    color: '#71717a',
    fontSize: 11,
    marginBottom: 12,
  },
  actionBtn: {
    height: 42,
  },
  subscribedContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  successBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  subscribedStatusTitle: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subscribedDesc: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  subscribedFooter: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteLinkText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  logoutLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  logoutLinkText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  privacyBtnRow: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  privacyBtnText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Custom Modal Store styles
  storeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
  },
  appleSheet: {
    width: '100%',
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 24,
    alignItems: 'stretch',
    maxWidth: 500,
  },
  googleSheet: {
    width: '100%',
    backgroundColor: '#2b2b2b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'stretch',
    maxWidth: 500,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogo: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  storeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  storeDivider: {
    height: 1,
    backgroundColor: '#3a3a3c',
    marginVertical: 16,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productLogoEmoji: {
    fontSize: 24,
  },
  productName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productDetail: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  billingDetail: {
    paddingVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    color: '#8e8e93',
    fontSize: 13,
  },
  priceVal: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  appleConfirmBtn: {
    backgroundColor: '#0a84ff', // iOS Blue
    borderRadius: 14,
    height: 50,
  },
  googleConfirmBtn: {
    backgroundColor: '#00c853', // Android green
    borderRadius: 10,
    height: 48,
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  appleCancelText: {
    color: '#0a84ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleCancelText: {
    color: '#00c853',
    fontSize: 14,
    fontWeight: 'bold',
  },
  managementDesc: {
    color: '#71717a',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  menuItemTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuItemSub: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 10,
  },
  arrowIcon: {
    color: '#71717a',
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  formSubtitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  listSectionTitle: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  itemBarberCard: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  barberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barberAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  barberNameText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  barberPhoneText: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 1,
  },
  deleteBarberBtn: {
    padding: 8,
    marginLeft: 6,
  },
  deleteTrashEmoji: {
    fontSize: 16,
  },
  serviceLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  availabilityInstructions: {
    color: '#71717a',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  timeInputMini: {
    width: 76,
    height: 32,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 4,
  },

  // Share Bot styles
  sharePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharePhoneLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sharePhoneVal: {
    color: '#25d366',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sharePhoneInput: {
    height: 40,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  sharePhoneEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sharePhoneEditBtnText: {
    fontSize: 14,
  },
  sharePhoneSaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sharePhoneSaveBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 18,
  },
  shareLinkLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  shareLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingLeft: 14,
    height: 44,
  },
  shareLinkText: {
    flex: 1,
    color: '#10b981',
    fontSize: 13,
    fontWeight: '500',
  },
  shareCopyBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#27272a',
  },
  shareCopyBtnText: {
    fontSize: 16,
  },
  shareQrLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrBox: {
    width: 180,
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 14,
  },
  qrGrid: {
    width: 160,
    height: 160,
    position: 'relative',
  },
  qrFinder: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: '#0a0a0a',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFinderInner: {
    width: 14,
    height: 14,
    backgroundColor: '#0a0a0a',
    borderRadius: 2,
  },
  qrCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  qrCenterEmoji: {
    fontSize: 18,
  },
  qrDotRow: {
    position: 'absolute',
    left: 42,
    right: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qrDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  qrDotFilled: {
    backgroundColor: '#0a0a0a',
  },
  qrDotEmpty: {
    backgroundColor: 'transparent',
  },
  qrDesc: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 16,
  },
  qrLinkUnder: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  shareActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareActionBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  shareActionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  shareActionLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuItemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
