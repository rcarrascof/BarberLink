import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';

interface AppleProfile {
  name: string;
  email: string;
}

interface AppleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (profile: AppleProfile) => void;
  locale: string;
  t: (key: string) => string;
}

export default function AppleSignInModal({
  visible,
  onClose,
  onSuccess,
  locale,
  t,
}: AppleSignInModalProps) {
  const [shareEmail, setShareEmail] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleConfirm = () => {
    setAuthenticating(true);
    
    // Simulate Face ID / Biometric authentication scan
    setTimeout(() => {
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthenticating(false);
        setAuthSuccess(false);
        onSuccess({
          name: 'Carlos Mendoza',
          email: shareEmail ? 'carlos.mendoza@icloud.com' : 'c.mendoza@privaterelay.appleid.com',
        });
        onClose();
      }, 1000);
    }, 1800);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          {/* Main authentication screen */}
          {!authenticating ? (
            <View>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.logoRow}>
                  <Text style={styles.appleLogo}></Text>
                  <Text style={styles.appleTitle}>{t('loginAppleIDTitle')}</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeModalText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>{t('loginAppleIDSub')}</Text>

              {/* Profile Block */}
              <View style={styles.profileBox}>
                <Text style={styles.profileLabel}>
                  {locale === 'es' ? 'CUENTA' : 'ACCOUNT'}
                </Text>
                <Text style={styles.profileValue}>Carlos Mendoza</Text>
                <Text style={styles.profileSubText}>carlos.mendoza@icloud.com</Text>
              </View>

              {/* Email Options Selector */}
              <Text style={styles.optionsTitle}>
                {locale === 'es' ? 'CORREO ELECTRÓNICO' : 'EMAIL ADDRESS'}
              </Text>
              
              <TouchableOpacity
                style={[styles.optionRow, shareEmail && styles.optionRowActive]}
                onPress={() => setShareEmail(true)}
              >
                <View style={styles.radioOutline}>
                  {shareEmail && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionDetails}>
                  <Text style={styles.optionName}>{t('loginAppleShareEmail')}</Text>
                  <Text style={styles.optionDesc}>carlos.mendoza@icloud.com</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionRow, !shareEmail && styles.optionRowActive]}
                onPress={() => setShareEmail(false)}
              >
                <View style={styles.radioOutline}>
                  {!shareEmail && <View style={styles.radioDot} />}
                </View>
                <View style={styles.optionDetails}>
                  <Text style={styles.optionName}>{t('loginAppleHideEmail')}</Text>
                  <Text style={styles.optionDesc}>
                    {locale === 'es' 
                      ? 'Reenvía correos a tu buzón real de forma encriptada.' 
                      : 'Forwards emails to your real inbox securely.'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Actions */}
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>
                  {t('loginAppleButtonConfirm')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* BIOMETRIC / FACE ID AUTHS DISPLAY SHEET */
            <View style={styles.biometricContainer}>
              <View style={styles.faceIdCircle}>
                {authSuccess ? (
                  <Text style={styles.checkMark}>✓</Text>
                ) : (
                  <View style={styles.scannerAnimationBox}>
                    <ActivityIndicator size="large" color="#ffffff" />
                  </View>
                )}
              </View>
              <Text style={styles.biometricStatus}>
                {authSuccess
                  ? (locale === 'es' ? '¡Verificación Exitosa!' : 'Verification Successful!')
                  : (locale === 'es' ? 'Verificando con Face ID...' : 'Verifying with Face ID...')}
              </Text>
              <Text style={styles.biometricDesc}>
                {locale === 'es'
                  ? 'Mantén la mirada en la pantalla para iniciar sesión.'
                  : 'Look at the screen to sign in.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#0a0a0a', // Solid black matching Apple premium
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1c1c1e',
    padding: 24,
    paddingBottom: 44,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleLogo: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 10,
  },
  appleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  closeModalText: {
    fontSize: 16,
    color: '#71717a',
    fontWeight: 'bold',
    padding: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 24,
  },
  profileBox: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 24,
  },
  profileLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
    marginBottom: 6,
  },
  profileValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileSubText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  optionsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 10,
  },
  optionRowActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#71717a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  optionDetails: {
    flex: 1,
  },
  optionName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  optionDesc: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff', // Clean Apple-like white CTA
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  biometricContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  faceIdCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  checkMark: {
    color: '#10b981',
    fontSize: 40,
    fontWeight: 'bold',
  },
  scannerAnimationBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  biometricDesc: {
    fontSize: 12,
    color: '#71717a',
  },
});
