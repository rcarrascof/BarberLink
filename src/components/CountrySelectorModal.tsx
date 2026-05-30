import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', placeholder: '201-555-0123' },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1', flag: '🇩🇴', placeholder: '809-555-0199' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1', flag: '🇵🇷', placeholder: '787-555-0123' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', placeholder: '300 123 4567' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', placeholder: '11 1234-5678' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪', placeholder: '912 345 678' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', placeholder: '412-1234567' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', placeholder: '091 234 5678' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹', placeholder: '4123 4567' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷', placeholder: '8123 4567' },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦', placeholder: '6123-4567' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾', placeholder: '091 234 567' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', placeholder: '71234567' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾', placeholder: '981 123456' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳', placeholder: '9123-4567' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻', placeholder: '7123-4567' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮', placeholder: '8123-4567' },
];

interface CountrySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  locale: string;
}

export default function CountrySelectorModal({
  visible,
  onClose,
  onSelect,
  locale,
}: CountrySelectorModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.countryPickerContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {locale === 'es' ? 'Selecciona tu país 🌎' : 'Select your country 🌎'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.countryList} showsVerticalScrollIndicator={false}>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={styles.countryOption}
                onPress={() => {
                  onSelect(country);
                  onClose();
                }}
              >
                <Text style={styles.countryOptionText}>
                  {country.flag}   {country.name} ({country.dialCode})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  countryPickerContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeModalText: {
    fontSize: 20,
    color: '#a1a1aa',
    fontWeight: 'bold',
    padding: 4,
  },
  countryList: {
    paddingBottom: 10,
  },
  countryOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  countryOptionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
