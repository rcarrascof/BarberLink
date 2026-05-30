import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../services/CustomAlertContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import { storage } from '../services/storage';
import Icon from 'react-native-vector-icons/Ionicons';

import Button from '../components/Button';
import Card from '../components/Card';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import CountrySelectorModal, { COUNTRIES, Country } from '../components/CountrySelectorModal';
import GoogleSignInModal from '../components/GoogleSignInModal';
import AppleSignInModal from '../components/AppleSignInModal';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const { t, locale } = useLanguage();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { showAlert } = useAlert();
  
  // State toggles
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Country code selector state
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);

  const checkOnboardingAndRedirect = async () => {
    const completed = await storage.getOnboardingCompleted();
    if (completed) {
      navigation.replace('MainApp');
    } else {
      navigation.replace('Onboarding');
    }
  };

  const handleSocialSuccess = async (profile: { name: string; email: string }) => {
    setLoading(true);
    const currentShopName = await storage.getShopName();
    if (!currentShopName) {
      await storage.saveShopName(isRegisterMode && shopName ? shopName.trim() : 'Mi Barbería');
    }
    await storage.saveOwnerName(profile.name);
    await storage.saveCountryCode(selectedCountry.code);
    
    setTimeout(() => {
      setLoading(false);
      showAlert(
        locale === 'es' ? '¡Sesión Iniciada!' : 'Logged In!',
        t('loginSocialSuccess'),
        'success',
        () => {
          checkOnboardingAndRedirect();
        }
      );
    }, 1000);
  };

  // Detect country on mount via public non-blocking API
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.country_code) {
          const detected = COUNTRIES.find(c => c.code === data.country_code);
          if (detected) {
            setSelectedCountry(detected);
          }
        }
      } catch (e) {
        console.log('Failed to detect country, falling back to default', e);
      }
    };
    detectCountry();
  }, []);

  const handleSubmit = async () => {
    if (isRegisterMode) {
      if (!shopName.trim() || !ownerName.trim() || !phone.trim() || !email.trim()) {
        showAlert('Error', t('loginAlertEmptyFields'), 'error');
        return;
      }
      setLoading(true);
      
      // Save credentials in centralized AsyncStorage storage
      await storage.saveShopName(shopName.trim());
      await storage.saveOwnerName(ownerName.trim());
      await storage.saveCountryCode(selectedCountry.code);

      setTimeout(() => {
        setLoading(false);
        showAlert(
          locale === 'es' ? '¡Registro Exitoso!' : 'Registration Successful!',
          t('loginAlertRegisterSuccess'),
          'success',
          () => navigation.replace('Onboarding')
        );
      }, 1500);
    } else {
      if (!phone) {
        showAlert('Error', t('loginError'), 'error');
        return;
      }
      setLoading(true);
      await storage.saveCountryCode(selectedCountry.code);
      
      // Simulate API authorization response
      setTimeout(() => {
        setLoading(false);
        checkOnboardingAndRedirect();
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.logoBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary, borderWidth: 1.5 }]}>
              <Icon name="cut-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('loginTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('loginSubtitle')}</Text>
          </View>

          <Card style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {isRegisterMode ? t('loginRegisterWelcome') : t('loginWelcome')}
            </Text>
            <Text style={[styles.instructionText, { color: colors.textMuted }]}>
              {isRegisterMode ? t('loginRegisterInstruction') : t('loginInstruction')}
            </Text>

            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('loginShopLabel')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  placeholder={locale === 'es' ? 'Ej. Barbería Central' : 'e.g., Central Barbershop'}
                  placeholderTextColor={colors.textDim}
                  value={shopName}
                  onChangeText={setShopName}
                />
              </View>
            )}

            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('loginOwnerLabel')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  placeholder={locale === 'es' ? 'Ej. Carlos Mendoza' : 'e.g., Carlos Mendoza'}
                  placeholderTextColor={colors.textDim}
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('loginPhoneLabel')}</Text>
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
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {isRegisterMode && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{t('loginEmailLabel')}</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
                  placeholder="ejemplo@barberlink.com"
                  placeholderTextColor={colors.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            )}

            <Button
              title={isRegisterMode ? t('loginRegisterBtn') : t('loginButton')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              onPress={() => setIsRegisterMode(!isRegisterMode)}
              style={styles.toggleContainer}
            >
              <Text style={[styles.toggleText, { color: colors.primary }]}>
                {isRegisterMode ? t('loginLoginToggle') : t('loginRegisterToggle')}
              </Text>
            </TouchableOpacity>

            {/* Visual Separator */}
            <View style={styles.separatorRow}>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.separatorText, { color: colors.textDim }]}>{t('loginOrSeparator')}</Text>
              <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Authentication Buttons */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => setShowGoogleModal(true)}
              disabled={loading}
            >
              <View style={styles.socialBtnContent}>
                <View style={styles.googleLogoBadge}>
                  <Text style={styles.googleLogoText}>G</Text>
                </View>
                <Text style={[styles.googleBtnText, { color: colors.text }]}>
                  {t('loginContinueWithGoogle')}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.appleBtn, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={() => setShowAppleModal(true)}
              disabled={loading}
            >
              <View style={styles.socialBtnContent}>
                <Text style={[styles.appleLogoIcon, { color: colors.text }]}></Text>
                <Text style={[styles.socialBtnText, { color: colors.text }]}>
                  {t('loginContinueWithApple')}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textDim }]}>
              {t('loginFooter')}
            </Text>
            <TouchableOpacity onPress={() => setShowPrivacy(true)} style={styles.privacyLink}>
              <Text style={[styles.privacyLinkText, { color: colors.textMuted }]}>
                {locale === 'es' ? 'Ver Política de Privacidad 🛡️' : 'View Privacy Policy 🛡️'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Code Picker Modal */}
      <CountrySelectorModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onSelect={setSelectedCountry}
        locale={locale}
      />
      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
      {/* Google Authentication Modal Choice */}
      <GoogleSignInModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleSocialSuccess}
        locale={locale}
        t={t}
      />
      {/* Apple Authentication Modal Choice */}
      <AppleSignInModal
        visible={showAppleModal}
        onClose={() => setShowAppleModal(false)}
        onSuccess={handleSocialSuccess}
        locale={locale}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 6,
  },
  card: {
    padding: 24,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  countryCodeBadge: {
    width: 85,
    height: '100%',
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#3f3f46',
  },
  countryCodeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  phoneInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  textInput: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#ffffff',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  toggleText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#52525b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyLink: {
    marginTop: 12,
    paddingVertical: 4,
  },
  privacyLinkText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'center',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#27272a',
  },
  separatorText: {
    color: '#71717a',
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  googleBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appleBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoBadge: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  googleLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ea4335',
  },
  appleLogoIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginRight: 10,
  },
  socialBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  googleBtnText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
