import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { onValue, push, ref, serverTimestamp, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { Demande, Doctor } from '../../../models/interfaces';

const { width } = Dimensions.get('window');



const DoctorProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const doctorRef = ref(db, `medecins/${id}`);
    const unsubscribe = onValue(doctorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDoctor({
          ...data,
          // Fallback values for UI consistency
          bio: data.bio || "Médecin dévoué offrant des soins de qualité à ses patients.",
          rating: data.rating || (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1),
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching doctor details:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleAction = async (type: 'appointment' | 'follow-up') => {
    if (!doctor || !id) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour effectuer cette action.");
      return;
    }

    setRequesting(true);
    try {
      const demandesRef = ref(db, 'demandes');
      const newDemandeRef = push(demandesRef);

      const doctorName = doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : `Dr. ${doctor.lastName}`;

      const demandeData: Demande = {
        type: type,
        doctorId: id,
        doctorName: doctorName,
        patientId: user.uid,
        patientEmail: user.email,
        patientName: user.displayName || user.email?.split('@')[0] || "Patient",
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await set(newDemandeRef, demandeData);

      Alert.alert(
        "Succès",
        type === 'appointment'
          ? `Votre demande de rendez-vous avec ${doctorName} a été envoyée. Vous recevrez une notification dès qu'elle sera confirmée.`
          : `Votre demande de suivi avec ${doctorName} a été envoyée.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error sending request:", error);
      Alert.alert("Erreur", "Impossible d'envoyer la demande. Veuillez réessayer.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1971C2" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Médecin non trouvé.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonInline}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = doctor.firstName ? `Dr. ${doctor.firstName} ${doctor.lastName}` : `Dr. ${doctor.lastName}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Header */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil du Médecin</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarLarge}>
                <Ionicons name="person" size={60} color="#ADB5BD" />
              </View>
              <View style={styles.onlineBadge} />
            </View>

            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.specialty}>{doctor.specialty}</Text>

            <View style={styles.locationBadge}>
              <Ionicons name="business" size={14} color="#1971C2" />
              <Text style={styles.city}>{doctor.hospital || "Hôpital non spécifié"}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>10+</Text>
              <Text style={styles.statLabel}>Expérience</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>1.2k</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{doctor.rating}</Text>
              <Text style={styles.statLabel}>Avis</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.bio}>{doctor.bio}</Text>
            {doctor.licenseNumber && (
              <Text style={styles.licenseText}>Licence: {doctor.licenseNumber}</Text>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#1971C2" />
              <Text style={styles.contactText}>{doctor.phone}</Text>
            </View>
            {doctor.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={20} color="#1971C2" />
                <Text style={styles.contactText}>{doctor.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="time-outline" size={20} color="#1971C2" />
              </View>
              <View>
                <Text style={styles.scheduleDays}>Lundi - Vendredi</Text>
                <Text style={styles.scheduleHours}>09:00 AM - 18:00 PM</Text>
              </View>
            </View>
          </View>

          <View style={styles.dbFooter}>
            <Ionicons name="cloud-done-outline" size={14} color="#ADB5BD" />
            <Text style={styles.dbFooterText}>Données synchronisées en temps réel</Text>
          </View>
        </ScrollView>
      </View>

      {/* Floating Action Footer - Adjusted to be above the tab bar */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => Alert.alert("Chat", "Démarrage de la conversation...")}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#1971C2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, requesting && styles.disabledButton]}
            onPress={() => handleAction('appointment')}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Réserver maintenant</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.secondaryButton, requesting && styles.disabledButton]}
          onPress={() => handleAction('follow-up')}
          disabled={requesting}
        >
          <Text style={styles.secondaryButtonText}>Demander un suivi régulier</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moreButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dbFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  dbFooterText: {
    fontSize: 12,
    color: '#ADB5BD',
    fontStyle: 'italic',
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#F8F9FA',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#40C057',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  specialty: {
    fontSize: 16,
    color: '#1971C2',
    fontWeight: '600',
    marginTop: 5,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  city: {
    fontSize: 13,
    color: '#495057',
    marginLeft: 6,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 4,
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 24,
  },
  licenseText: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#495057',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
  },
  scheduleIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scheduleDays: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleHours: {
    fontSize: 13,
    color: '#868E96',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 110, // Increased to be above the floating tab bar (bottom: 24 + height: ~70)
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F3F5',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatButton: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1971C2',
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1971C2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  secondaryButtonText: {
    color: '#1971C2',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#868E96',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E03131',
    marginBottom: 20,
  },
  backButtonInline: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1971C2',
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default DoctorProfileScreen;
