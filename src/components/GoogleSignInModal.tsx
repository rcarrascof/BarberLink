import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';

interface GoogleProfile {
  name: string;
  email: string;
}

interface GoogleSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (profile: GoogleProfile) => void;
  locale: string;
  t: (key: string) => string;
}

export default function GoogleSignInModal({
  visible,
  onClose,
  onSuccess,
  locale,
  t,
}: GoogleSignInModalProps) {
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);

  const accounts = [
    { name: 'Carlos Mendoza', email: 'carlos.mendoza@gmail.com', avatar: 'C' },
    { name: 'Barbería Real', email: 'contacto.barberiareal@gmail.com', avatar: 'B' },
  ];

  const handleSelectAccount = (account: typeof accounts[0]) => {
    setLoadingAccount(account.email);
    setTimeout(() => {
      setLoadingAccount(null);
      onSuccess({ name: account.name, email: account.email });
      onClose();
    }, 1200);
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.logoRow}>
              <Text style={styles.googleIconText}>G</Text>
              <Text style={styles.modalTitle}>
                {t('loginGoogleSelectAccount')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={!!loadingAccount}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account Chooser */}
          <View style={styles.accountsContainer}>
            {accounts.map((acc) => {
              const isCurrentLoading = loadingAccount === acc.email;
              return (
                <TouchableOpacity
                  key={acc.email}
                  style={styles.accountItem}
                  onPress={() => handleSelectAccount(acc)}
                  disabled={!!loadingAccount}
                >
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarText}>{acc.avatar}</Text>
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    <Text style={styles.accountEmail}>{acc.email}</Text>
                  </View>
                  {isCurrentLoading ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    <Text style={styles.chevronIcon}>›</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Other Account Option */}
            <TouchableOpacity
              style={[styles.accountItem, styles.otherAccountItem]}
              onPress={() => {
                setLoadingAccount('other');
                setTimeout(() => {
                  setLoadingAccount(null);
                  onSuccess({ name: 'Nuevo Barbero', email: 'barberia.onboarding@gmail.com' });
                  onClose();
                }, 1200);
              }}
              disabled={!!loadingAccount}
            >
              <View style={[styles.avatarBadge, styles.otherAvatarBadge]}>
                <Text style={styles.avatarText}>+</Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.otherAccountText}>
                  {t('loginGoogleUseOther')}
                </Text>
              </View>
              {loadingAccount === 'other' ? (
                <ActivityIndicator size="small" color="#10b981" />
              ) : (
                <Text style={styles.chevronIcon}>›</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Compliance Footer */}
          <Text style={styles.googleFooter}>
            {locale === 'es'
              ? 'Para continuar, Google compartirá tu nombre, dirección de correo electrónico y foto de perfil con BarberLink.'
              : 'To continue, Google will share your name, email address, and profile picture with BarberLink.'}
          </Text>
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
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34a853', // Google green representation
    backgroundColor: '#ffffff',
    width: 28,
    height: 28,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeModalText: {
    fontSize: 18,
    color: '#a1a1aa',
    fontWeight: 'bold',
    padding: 6,
  },
  accountsContainer: {
    marginBottom: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  otherAccountItem: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: '#3f3f46',
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  otherAvatarBadge: {
    backgroundColor: '#27272a',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  accountEmail: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  otherAccountText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  chevronIcon: {
    color: '#71717a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  googleFooter: {
    color: '#52525b',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
});
