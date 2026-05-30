import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../services/LanguageContext';
import { useAlert } from '../services/CustomAlertContext';
import { useTheme } from '../services/ThemeContext';
import { storage } from '../services/storage';
import Icon from 'react-native-vector-icons/Ionicons';

import Card from '../components/Card';
import Button from '../components/Button';
import CountrySelectorModal, { COUNTRIES, Country } from '../components/CountrySelectorModal';

export default function OnboardingScreen() {
  const { locale } = useLanguage();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  // Onboarding step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 2 Core configs state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [basePrice, setBasePrice] = useState('500');

  // Step 3 Bot configs state
  const [botPhone, setBotPhone] = useState('');
  const [botGreeting, setBotGreeting] = useState('');
  const [botAutopilot, setBotAutopilot] = useState(true);

  // Country code selector state
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Load existing values on mount to pre-populate if editing
  useEffect(() => {
    const loadInitialConfigs = async () => {
      const sName = await storage.getShopName();
      const oName = await storage.getOwnerName();
      const sPhone = await storage.getShopPhone();
      const bMsg = await storage.getBotMessage();
      const cCode = await storage.getCountryCode();

      if (sName && sName !== 'Barbería Real') setShopName(sName);
      if (oName && oName !== 'Carlos') setOwnerName(oName);
      if (bMsg) {
        setBotGreeting(bMsg);
      } else {
        setBotGreeting(
          locale === 'es'
            ? '¡Hola! Bienvenido a nuestra barbería. ¿Con qué barbero deseas agendar tu cita hoy?'
            : 'Hello! Welcome to our barbershop. Which barber would you like to schedule your appointment with today?'
        );
      }

      if (sPhone) {
        // Remove country prefix from display input if it matches
        let clean = sPhone;
        const matchingCountry = COUNTRIES.find((c) => {
          if (sPhone.startsWith(c.dialCode)) {
            clean = sPhone.slice(c.dialCode.length);
            return true;
          }
          return false;
        });

        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
          setBotPhone(clean);
        } else {
          setBotPhone(sPhone);
        }
      }

      if (cCode) {
        const country = COUNTRIES.find((c) => c.code === cCode);
        if (country) setSelectedCountry(country);
      }
    };
    loadInitialConfigs();
  }, [locale]);

  // Validations per step
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!shopName.trim()) {
        showAlert(
          locale === 'es' ? 'Falta información' : 'Missing Information',
          locale === 'es'
            ? 'Por favor ingresa el nombre de tu barbería.'
            : 'Please enter your barbershop name.',
          'error'
        );
        return;
      }
      if (!ownerName.trim()) {
        showAlert(
          locale === 'es' ? 'Falta información' : 'Missing Information',
          locale === 'es'
            ? 'Por favor ingresa tu nombre como propietario.'
            : 'Please enter your name as the owner.',
          'error'
        );
        return;
      }
      if (!basePrice.trim() || isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
        showAlert(
          locale === 'es' ? 'Precio Inválido' : 'Invalid Price',
          locale === 'es'
            ? 'Por favor ingresa un precio base válido para tus servicios.'
            : 'Please enter a valid base price for your services.',
          'error'
        );
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!botPhone.trim()) {
        showAlert(
          locale === 'es' ? 'Falta número' : 'Missing Number',
          locale === 'es'
            ? 'Por favor ingresa el número de WhatsApp asignado a tu Bot.'
            : 'Please enter the WhatsApp number assigned to your Bot.',
          'error'
        );
        return;
      }
      if (!botGreeting.trim()) {
        showAlert(
          locale === 'es' ? 'Falta saludo' : 'Missing Greeting',
          locale === 'es'
            ? 'Por favor define el saludo inicial que enviará tu Bot.'
            : 'Please define the initial greeting your Bot will send.',
          'error'
        );
        return;
      }
      setCurrentStep(4);
      return;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      const cleanPhoneInput = botPhone.replace(/[\s\-\(\)\+]/g, '');
      const fullWhatsAppNumber = `${selectedCountry.dialCode}${cleanPhoneInput}`;

      // 1. Save Core Details to AsyncStorage
      await storage.saveShopName(shopName.trim());
      await storage.saveOwnerName(ownerName.trim());
      await storage.saveCountryCode(selectedCountry.code);
      await storage.saveShopPhone(fullWhatsAppNumber);
      await storage.saveBotMessage(botGreeting.trim());
      await storage.saveOnboardingCompleted(true);

      // 2. Adjust base service prices dynamically to match user's custom base price
      const services = await storage.getServices();
      if (services.length > 0) {
        const updatedServices = services.map((s, idx) => {
          if (idx === 1) {
            // Corte clásico = user custom basePrice
            return { ...s, price: Number(basePrice) };
          }
          if (idx === 0) {
            // Combo Corte + Barba = basePrice + 300
            return { ...s, price: Number(basePrice) + 300 };
          }
          return s;
        });
        await storage.saveServices(updatedServices);
      }

      // 3. Launch dynamic success confirmation alert
      showAlert(
        locale === 'es' ? '¡Configuración Exitosa!' : 'Setup Successful!',
        locale === 'es'
          ? `El bot de WhatsApp para "${shopName}" se ha sincronizado correctamente y está listo en modo piloto automático 🤖📱.`
          : `The WhatsApp scheduling bot for "${shopName}" is now fully synced and ready in autopilot mode 🤖📱.`,
        'success',
        () => {
          navigation.replace('MainApp');
        }
      );
    } catch (e) {
      console.log('Error completing onboarding configuration:', e);
      showAlert(
        locale === 'es' ? 'Error' : 'Error',
        locale === 'es'
          ? 'Ocurrió un error al guardar tu configuración. Intenta nuevamente.'
          : 'An error occurred while saving your configuration. Please try again.',
        'error'
      );
    }
  };

  // Render navigation dots bar
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <View
              key={stepNum}
              style={[
                styles.dot,
                { backgroundColor: colors.border },
                isActive && [styles.dotActive, { backgroundColor: colors.primary }],
                isCompleted && [styles.dotCompleted, { backgroundColor: colors.success }],
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* PROGRESS INDICATOR HEADER */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => {
              if (currentStep > 1) {
                handlePrevStep();
              } else {
                navigation.replace('Login');
              }
            }}
          >
            <Icon name="arrow-back-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {locale === 'es' ? 'Asistente de Inicio' : 'Setup Wizard'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textDim }]}>
              {locale === 'es' ? `Paso ${currentStep} de ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </Text>
          </View>
          {renderDots()}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* STEP 1: PRESENTATION SLIDE */}
          {currentStep === 1 && (
            <View style={styles.stepWrapper}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primary + '1a', borderColor: colors.primary }]}>
                  <Icon name="rocket-outline" size={48} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {locale === 'es' ? '¡Bienvenido a BarberLink!' : 'Welcome to BarberLink!'}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                {locale === 'es'
                  ? 'La plataforma definitiva para gestionar tu barbería de forma inteligente e internacional. Lleva tu negocio al siguiente nivel con nuestras herramientas premium.'
                  : 'The ultimate platform to manage your barbershop intelligently and internationally. Take your business to the next level with our premium tools.'}
              </Text>

              <Card style={[styles.featureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
                    <Icon name="logo-whatsapp" size={20} color={colors.success} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {locale === 'es' ? 'Piloto Automático 24/7' : '24/7 Autopilot Booking'}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textDim }]}>
                      {locale === 'es'
                        ? 'Tu bot de WhatsApp responderá, agendará y confirmará citas automáticamente por ti.'
                        : 'Your WhatsApp bot will automatically answer, schedule, and confirm appointments for you.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />

                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Icon name="people-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {locale === 'es' ? 'Importación de Contactos Real' : 'Real Contacts Import'}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textDim }]}>
                      {locale === 'es'
                        ? 'Importa rápidamente tu agenda telefónica directo al sistema con compatibilidad total.'
                        : 'Quickly import your phone contacts directly to the system with full native compatibility.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />

                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#3b82f615' }]}>
                    <Icon name="trending-up-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {locale === 'es' ? 'Estadísticas e Ingresos' : 'Revenue Analytics'}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.textDim }]}>
                      {locale === 'es'
                        ? 'Controla las ganancias de la barbería, comisiones de barberos y flujo de efectivo.'
                        : 'Track barbershop earnings, barber commissions, and overall cash flows.'}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* STEP 2: BARBERSHOP CORE CONFIGS */}
          {currentStep === 2 && (
            <View style={styles.stepWrapper}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {locale === 'es' ? 'Configuración de Barbería' : 'Barbershop Setup'}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                {locale === 'es'
                  ? 'Establece los datos clave de tu negocio. Estos datos serán utilizados por el bot de WhatsApp para personalizar la atención.'
                  : 'Define the core details of your business. This data will be used by the WhatsApp bot to customize customer relations.'}
              </Text>

              <Card style={[styles.inputCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {locale === 'es' ? 'Nombre de la Barbería 💈' : 'Barbershop Name 💈'}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                    placeholder={locale === 'es' ? 'Ej. Barbería Real' : 'e.g., Royal Barbershop'}
                    placeholderTextColor={colors.textDim}
                    value={shopName}
                    onChangeText={setShopName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {locale === 'es' ? 'Nombre del Propietario 👑' : 'Owner Name 👑'}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                    placeholder={locale === 'es' ? 'Ej. Carlos Mendoza' : 'e.g., Carlos Mendoza'}
                    placeholderTextColor={colors.textDim}
                    value={ownerName}
                    onChangeText={setOwnerName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {locale === 'es' ? 'Precio Base del Corte ($) 💵' : 'Base Haircut Price ($) 💵'}
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                    placeholder="500"
                    placeholderTextColor={colors.textDim}
                    keyboardType="number-pad"
                    value={basePrice}
                    onChangeText={setBasePrice}
                  />
                  <Text style={[styles.helperText, { color: colors.textDim }]}>
                    {locale === 'es'
                      ? 'Este precio configurará por defecto tu menú inicial de servicios.'
                      : 'This price will configure your initial services menu by default.'}
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* STEP 3: WHATSAPP BOT CONFIGURATION */}
          {currentStep === 3 && (
            <View style={styles.stepWrapper}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {locale === 'es' ? 'Configuración del Bot' : 'WhatsApp Bot Setup'}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                {locale === 'es'
                  ? 'Configura la línea móvil asignada al piloto automático y el saludo de bienvenida que recibirán tus clientes.'
                  : 'Configure the mobile line assigned to the autopilot and the welcome greeting that your clients will receive.'}
              </Text>

              <Card style={[styles.inputCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {/* Bot Phone Number Input with Flag selector */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {locale === 'es' ? 'Número del Bot (WhatsApp) 📱' : 'Bot Number (WhatsApp) 📱'}
                  </Text>
                  <View style={[styles.phoneInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.countryCodeBadge, { backgroundColor: colors.cardSub, borderRightColor: colors.border }]}
                      onPress={() => setShowCountryPicker(true)}
                    >
                      <Text style={[styles.countryCodeText, { color: colors.text }]}>
                        {selectedCountry.flag} {selectedCountry.dialCode}
                      </Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.phoneInput, { color: colors.text }]}
                      placeholder={selectedCountry.placeholder}
                      placeholderTextColor={colors.textDim}
                      keyboardType="phone-pad"
                      value={botPhone}
                      onChangeText={setBotPhone}
                    />
                  </View>
                </View>

                {/* Bot Greeting Welcome Message */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {locale === 'es' ? 'Mensaje de Saludo 💬' : 'Greeting Message 💬'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textAreaInput,
                      { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text },
                    ]}
                    multiline={true}
                    numberOfLines={4}
                    placeholder={
                      locale === 'es'
                        ? 'Escribe el saludo de tu bot...'
                        : 'Write your bot welcome message...'
                    }
                    placeholderTextColor={colors.textDim}
                    value={botGreeting}
                    onChangeText={setBotGreeting}
                  />
                </View>

                {/* Autopilot active flag */}
                <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.switchLabel, { color: colors.text }]}>
                      {locale === 'es' ? 'Modo Piloto Automático 🤖' : 'Autopilot Mode 🤖'}
                    </Text>
                    <Text style={[styles.helperText, { color: colors.textDim }]}>
                      {locale === 'es'
                        ? 'Permitir que el bot responda y agende citas 24/7 sin interrupción.'
                        : 'Allow the bot to answer and schedule appointments 24/7 uninterrupted.'}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={Platform.OS === 'ios' ? '#ffffff' : botAutopilot ? colors.primary : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setBotAutopilot}
                    value={botAutopilot}
                  />
                </View>
              </Card>
            </View>
          )}

          {/* STEP 4: REVIEW & COMPLETE */}
          {currentStep === 4 && (
            <View style={styles.stepWrapper}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconBadge, { backgroundColor: colors.success + '1a', borderColor: colors.success }]}>
                  <Icon name="checkmark-circle-outline" size={48} color={colors.success} />
                </View>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                {locale === 'es' ? '¡Todo Listo para Despegar!' : 'Ready for Takeoff!'}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                {locale === 'es'
                  ? 'Revisa el resumen de la configuración del asistente. Al completar, el bot de WhatsApp se sincronizará automáticamente.'
                  : 'Review the setup wizard summary. Upon completion, the WhatsApp bot will be synced automatically.'}
              </Text>

              <Card style={[styles.reviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textDim }]}>
                    {locale === 'es' ? 'Barbería' : 'Barbershop'}
                  </Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{shopName}</Text>
                </View>

                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textDim }]}>
                    {locale === 'es' ? 'Dueño / Admin' : 'Owner / Admin'}
                  </Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>{ownerName}</Text>
                </View>

                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textDim }]}>
                    {locale === 'es' ? 'Línea del Bot (WhatsApp)' : 'Bot Line (WhatsApp)'}
                  </Text>
                  <Text style={[styles.reviewValue, { color: colors.primary, fontWeight: 'bold' }]}>
                    {selectedCountry.dialCode} {botPhone}
                  </Text>
                </View>

                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textDim }]}>
                    {locale === 'es' ? 'Estado del Autopilot' : 'Autopilot Status'}
                  </Text>
                  <View style={[styles.reviewBadge, { backgroundColor: botAutopilot ? colors.success + '20' : colors.error + '20' }]}>
                    <Text style={[styles.reviewBadgeText, { color: botAutopilot ? colors.success : colors.error }]}>
                      {botAutopilot
                        ? locale === 'es'
                          ? 'ACTIVO 🤖'
                          : 'ACTIVE 🤖'
                        : locale === 'es'
                          ? 'DESACTIVADO'
                          : 'DISABLED'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

                <View style={styles.reviewItem}>
                  <Text style={[styles.reviewLabel, { color: colors.textDim }]}>
                    {locale === 'es' ? 'Menú de Servicios' : 'Services Menu'}
                  </Text>
                  <Text style={[styles.reviewValue, { color: colors.text }]}>
                    {locale === 'es'
                      ? `Corte Clásico configurado a RD$ ${basePrice}`
                      : `Classic Haircut configured to RD$ ${basePrice}`}
                  </Text>
                </View>
              </Card>

              <Text style={[styles.finalDeclarationText, { color: colors.textMuted }]}>
                {locale === 'es'
                  ? 'Al presionar el botón inferior, habilitarás las respuestas inteligentes del bot basadas en tus horarios hábiles y barberos registrados.'
                  : 'By pressing the button below, you will enable intelligent bot responses based on your operating hours and active barbers.'}
              </Text>
            </View>
          )}

        </ScrollView>

        {/* BOTTOM ACTION BUTTONS ROW */}
        <View style={[styles.footerActions, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
          {currentStep > 1 && (
            <Button
              title={locale === 'es' ? 'Atrás' : 'Back'}
              variant="outline"
              onPress={handlePrevStep}
              style={styles.backBtn}
            />
          )}
          <Button
            title={
              currentStep === totalSteps
                ? locale === 'es'
                  ? 'Sincronizar y Comenzar 🚀'
                  : 'Sync & Start 🚀'
                : locale === 'es'
                  ? 'Continuar'
                  : 'Continue'
            }
            onPress={currentStep === totalSteps ? handleCompleteOnboarding : handleNextStep}
            style={currentStep > 1 ? styles.continueBtnHalf : styles.continueBtnFull}
          />
        </View>

        {/* COUNTRY BADGE CODE SELECTOR MODAL */}
        <CountrySelectorModal
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          onSelect={setSelectedCountry}
          locale={locale}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 65,
  },
  backArrow: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  dotActive: {
    width: 18,
  },
  dotCompleted: {},
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  stepWrapper: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featureCard: {
    padding: 20,
    marginTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  featureDivider: {
    height: 1,
    marginVertical: 16,
  },
  inputCard: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textAreaInput: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    height: '100%',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 18,
    borderTopWidth: 1,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewCard: {
    padding: 20,
    marginTop: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewDivider: {
    height: 1,
    marginVertical: 14,
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  finalDeclarationText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  footerActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: '32%',
  },
  continueBtnHalf: {
    width: '64%',
  },
  continueBtnFull: {
    width: '100%',
  },
});
