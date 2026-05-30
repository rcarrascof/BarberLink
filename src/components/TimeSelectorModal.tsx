import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';

export const TIME_OPTIONS = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

interface TimeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  locale: string;
}

export default function TimeSelectorModal({
  visible,
  onClose,
  onSelect,
  locale,
}: TimeSelectorModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {locale === 'es' ? 'Selecciona una hora' : 'Select a time'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeModalText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.pickerList} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={styles.pickerOption}
                onPress={() => onSelect(time)}
              >
                <Text style={styles.pickerOptionText}>{time}</Text>
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
  pickerContainer: {
    width: '85%',
    maxHeight: '65%',
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
  pickerList: {
    paddingBottom: 10,
  },
  pickerOption: {
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  pickerOptionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
