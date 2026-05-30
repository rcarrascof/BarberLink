import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '../services/LanguageContext';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { locale } = useLanguage();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {locale === 'es' ? 'Política de Privacidad 🛡️' : 'Privacy Policy 🛡️'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Modal Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {locale === 'es' ? (
              <>
                <Text style={styles.introText}>
                  En **BarberLink**, tu privacidad y la seguridad de los datos de tu negocio son nuestra máxima prioridad. Esta política detalla cómo gestionamos tu información para garantizar el 100% de cumplimiento con las tiendas Google Play y Apple App Store.
                </Text>

                <Text style={styles.sectionTitle}>1. Propiedad Absoluta de los Datos</Text>
                <Text style={styles.bodyText}>
                  Tú eres el único propietario de la base de datos de tus clientes, barberos, agendas e historial de WhatsApp. BarberLink actúa únicamente como procesador de datos para tu conveniencia operativa y **nunca** venderá, compartirá ni alquilará tu información a terceros para fines comerciales o de publicidad.
                </Text>

                <Text style={styles.sectionTitle}>2. Datos Recopilados</Text>
                <Text style={styles.bodyText}>
                  Para el correcto funcionamiento del piloto automático de WhatsApp, recopilamos únicamente:
                  {'\n'}• Datos de acceso (Nombre del Propietario, Nombre de la Barbería, Correo, Teléfono).
                  {'\n'}• Información del personal (Nombres de barberos, teléfonos y estados).
                  {'\n'}• Registros de reservas (Nombre de cliente, teléfono, hora y servicio).
                </Text>

                <Text style={styles.sectionTitle}>3. Seguridad y Encriptación</Text>
                <Text style={styles.bodyText}>
                  Toda tu información está protegida en bases de datos con encriptación SSL durante el tránsito y en reposo mediante los servidores altamente seguros de Google Firebase Firestore. El acceso a los datos de tu negocio está restringido únicamente a usuarios autorizados mediante autenticación cifrada.
                </Text>

                <Text style={styles.sectionTitle}>4. Derechos de Eliminación de Cuenta</Text>
                <Text style={styles.bodyText}>
                  En cumplimiento con la directiva APNs de Apple y Data Safety de Google, te otorgamos el control total sobre tus datos. Puedes solicitar la eliminación definitiva de tu cuenta y toda tu información asociada en cualquier momento desde los Ajustes de la App de forma instantánea.
                </Text>

                <Text style={styles.sectionTitle}>5. Cumplimiento de API de Meta WhatsApp</Text>
                <Text style={styles.bodyText}>
                  El canal de comunicación y notificaciones opera de forma automatizada mediante los servicios oficiales de Meta WhatsApp API Cloud. Respetamos y cumplimos con los lineamientos internacionales de spam y protección del consumidor.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.introText}>
                  At **BarberLink**, your privacy and the security of your business data are our highest priorities. This policy details how we manage your information to ensure 100% compliance with Google Play and Apple App Store guidelines.
                </Text>

                <Text style={styles.sectionTitle}>1. Absolute Data Ownership</Text>
                <Text style={styles.bodyText}>
                  You are the sole owner of your client database, barbers list, schedules, and WhatsApp booking history. BarberLink acts strictly as a data processor for your operational convenience and will **never** sell, share, or rent your business information to third parties for marketing or advertising.
                </Text>

                <Text style={styles.sectionTitle}>2. Data We Collect</Text>
                <Text style={styles.bodyText}>
                  For the WhatsApp autopilot features to operate correctly, we collect only:
                  {'\n'}• Access credentials (Owner Name, Barbershop Name, Email, Phone).
                  {'\n'}• Roster information (Barber names, phone numbers, and statuses).
                  {'\n'}• Appointment logs (Client name, phone number, duration, price).
                </Text>

                <Text style={styles.sectionTitle}>3. Security & Encryption</Text>
                <Text style={styles.bodyText}>
                  All business data is fully secured in transit and at rest with SSL-encrypted protocols via Google Firebase Firestore servers. Account access is heavily restricted to authenticated device profiles only.
                </Text>

                <Text style={styles.sectionTitle}>4. Account Deletion Rights</Text>
                <Text style={styles.bodyText}>
                  To ensure complete compliance with Apple APNs and Google Play Data Safety, you retain full control. You can permanently delete your profile and purge all stored data instantly at any time inside the App Settings.
                </Text>

                <Text style={styles.sectionTitle}>5. Meta WhatsApp API Compliance</Text>
                <Text style={styles.bodyText}>
                  All appointment alerts and WhatsApp notifications are processed via official Meta WhatsApp API channels, strictly complying with international anti-spam and customer protection guidelines.
                </Text>
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Modal Footer */}
          <TouchableOpacity onPress={onClose} style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>
              {locale === 'es' ? 'Entendido' : 'Understood'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '95%',
    maxHeight: '80%',
    backgroundColor: '#121214',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 20,
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#71717a',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 14,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  introText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 14,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
  },
  footerBtn: {
    marginTop: 16,
    height: 44,
    backgroundColor: '#10b981',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
