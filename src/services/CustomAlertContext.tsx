import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface CustomAlertContextType {
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info', onClose?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }
  ) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useAlert must be used within a CustomAlertProvider');
  }
  return context;
}

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  // Modal alert/confirm states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const [isConfirm, setIsConfirm] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);
  const [confirmBtnText, setConfirmBtnText] = useState('OK');
  const [cancelBtnText, setCancelBtnText] = useState('Cancel');
  const [isDangerConfirm, setIsDangerConfirm] = useState(false);

  // Toast states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  // Animation values
  const toastY = useRef(new Animated.Value(-120)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Trigger modal animations
  useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    }
  }, [modalVisible, modalOpacity, modalScale]);

  // Show a standard modal alert
  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    onClose?: () => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setIsConfirm(false);
    setOnConfirmCallback(() => onClose || null);
    setConfirmBtnText('OK');
    setIsDangerConfirm(false);
    setModalVisible(true);
  };

  // Show a confirmation modal dialog
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsConfirm(true);
    setOnConfirmCallback(() => onConfirm);
    setConfirmBtnText(options?.confirmText || 'OK');
    setCancelBtnText(options?.cancelText || t('agendaBtnBack'));
    setIsDangerConfirm(options?.isDanger || false);
    setModalVisible(true);
  };

  // Show a quick toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    // Slide in
    Animated.parallel([
      Animated.spring(toastY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      dismissToast();
    }, 3000);
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(toastY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleConfirm = () => {
    setModalVisible(false);
    if (onConfirmCallback) {
      onConfirmCallback();
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const renderIcon = () => {
    switch (modalType) {
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: colors.success }]}>
            <Icon name="checkmark-circle-outline" size={28} color={colors.success} />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: colors.error }]}>
            <Icon name="close-circle-outline" size={28} color={colors.error} />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.12)', borderColor: colors.warning }]}>
            <Icon name="notifications-outline" size={28} color={colors.warning} />
          </View>
        );
    }
  };

  const getToastBgColor = () => {
    switch (toastType) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'info':
      default:
        return colors.border;
    }
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}

      {/* TOAST BANNER OVERLAY */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: getToastBgColor(),
              transform: [{ translateY: toastY }],
              opacity: toastOpacity,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Icon 
              name={toastType === 'success' ? 'checkmark-circle' : toastType === 'error' ? 'close-circle' : 'notifications'} 
              size={18} 
              color="#ffffff" 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* PREMIUM MODAL ALERT DIALOG */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            {renderIcon()}

            <Text style={[styles.modalTitle, { color: colors.text }]}>{modalTitle}</Text>
            <Text style={[styles.modalMessage, { color: colors.textMuted }]}>{modalMessage}</Text>

            <View style={styles.btnRow}>
              {isConfirm && (
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>{cancelBtnText}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.btn,
                  isConfirm
                    ? isDangerConfirm
                      ? styles.btnDanger
                      : styles.btnConfirmHalf
                    : styles.btnConfirmFull,
                  { backgroundColor: isDangerConfirm ? colors.error : colors.primary }
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.btnConfirmText}>{confirmBtnText}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </CustomAlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  // Toast styles
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Modal alert styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  btn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConfirmFull: {
    width: '100%',
  },
  btnConfirmHalf: {
    width: '48%',
  },
  btnCancel: {
    width: '48%',
    borderWidth: 1,
  },
  btnDanger: {
    width: '48%',
  },
  btnConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
