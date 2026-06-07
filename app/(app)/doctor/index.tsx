import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { equalTo, onValue, orderByChild, query, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../../firebaseConfig';

const SPECIALTIES = [
  'Tous',
  'Médecin généraliste',
  'Cardiologue',
  'Dermatologue',
  'Neurologue',
  'Pédiatre',
  'Psychiatre',
  'Ophtalmologue',
  'Dentiste',
];

interface Doctor {
  id: string;
  firstName?: string;
  lastName: string;
  specialty: string;
  hospital: string;
  phone: string;
  email?: string;
  role: string;
  uid: string;
  licenseNumber?: string;
  rating?: number | string;
}

const DoctorListScreen = () => {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const medecinsRef = ref(db, 'medecins');//pointe vers le dossier principal medecins
    //  dans la base de données Firebase.
    const medecinsQuery = query(medecinsRef, orderByChild('role'), equalTo('medecin'));//filtre les résultats
    //  pour récupérer uniquement les utilisateurs ayant le rôle "medecin".

    const unsubscribe = onValue(medecinsQuery, (snapshot) => {//c’est un écouteur en temps réel. À chaque changement dans Firebase, 
      // ce code s’exécute automatiquement pour mettre à jour l’écran.
      const data = snapshot.val();
      if (data) {
        const doctorsList: Doctor[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
          // Add a default rating for UI if not present
          rating: data[key].rating || (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1),
        }));
        
        // Log unique specialties for debugging
        const uniqueSpecialties = [...new Set(doctorsList.map(doc => doc.specialty))];
        console.log('🔍 DOCTOR FILTER DEBUG - Spécialités trouvées dans Firebase:', uniqueSpecialties);
        console.log('🔍 DOCTOR FILTER DEBUG - Nombre total de médecins:', doctorsList.length);
        
        setDoctors(doctorsList);
      } else {
        setDoctors([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching doctors:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fonction de normalisation pour comparaison flexible
  const normalizeSpecialty = (specialty: string): string => {
    return specialty.toLowerCase().trim();
  };

  // Fonction de correspondance flexible
  const specialtyMatches = (doctorSpecialty: string, filterSpecialty: string): boolean => {
    const normalized = normalizeSpecialty(doctorSpecialty);
    const filter = normalizeSpecialty(filterSpecialty);
    
    // Correspondance exacte
    if (normalized === filter) return true;
    
    // Correspondance partielle (contient)
    if (normalized.includes(filter) || filter.includes(normalized)) return true;
    
    // Correspondances spécifiques pour gérer les variations
    const specialtyMap: { [key: string]: string[] } = {
      'cardiologue': ['cardiologie', 'cardio'],
      'dermatologue': ['dermatologie', 'dermato', 'dermatologist'],
      'neurologue': ['neurologie', 'neuro', 'neurologist'],
      'pédiatre': ['pédiatrie', 'pediatre', 'pediatrie', 'pediatrician'],
      'psychiatre': ['psychiatrie', 'psy', 'psychiatrist'],
      'ophtalmologue': ['ophtalmologie', 'ophtalmo', 'ophthalmologist'],
      'médecin généraliste': ['généraliste', 'general', 'medecin generaliste', 'general practitioner'],
      'dentiste': ['dentistry', 'dental', 'dentist'],
    };
    
    // Vérifier les correspondances dans le map
    for (const [key, variations] of Object.entries(specialtyMap)) {
      if (normalized === key || variations.includes(normalized)) {
        if (filter === key || variations.includes(filter)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Filtre par spécialité
  let filteredBySpecialty = selectedSpecialty === 'Tous'
    ? doctors
    : doctors.filter(doc => {
        const matches = specialtyMatches(doc.specialty, selectedSpecialty);
        console.log(`🔍 Comparaison spécialité: "${doc.specialty}" vs "${selectedSpecialty}" = ${matches}`);
        return matches;
      });
  
  // Filtre par nom de recherche
  const filteredDoctors = searchQuery.trim() === ''
    ? filteredBySpecialty
    : filteredBySpecialty.filter(doc => {
        const fullName = doc.firstName 
          ? `${doc.firstName} ${doc.lastName}`.toLowerCase()
          : doc.lastName.toLowerCase();
        const search = searchQuery.toLowerCase().trim();
        const matches = fullName.includes(search);
        console.log(`🔎 Recherche nom: "${fullName}" contient "${search}" = ${matches}`);
        return matches;
      });
  
  console.log(`📊 Médecins filtrés: ${filteredDoctors.length}/${doctors.length} (Spécialité: "${selectedSpecialty}", Recherche: "${searchQuery}")`);

  const renderSpecialty = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.specialtyChip,
        selectedSpecialty === item && styles.specialtyChipActive
      ]}
      onPress={() => {
        console.log('🏥 Spécialité sélectionnée:', item);
        setSelectedSpecialty(item);
      }}
    >
      <Text style={[
        styles.specialtyText,
        selectedSpecialty === item && styles.specialtyTextActive
      ]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const displayName = item.firstName
      ? `Dr. ${item.firstName} ${item.lastName}`
      : `Dr. ${item.lastName}`;

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => router.push(`/doctor/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={30} color="#ADB5BD" />
        </View>
        <View style={styles.doctorInfo}>
          <View style={styles.doctorHeader}>
            <Text style={styles.doctorName}>{displayName}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FAB005" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>
          <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="business-outline" size={14} color="#999" />
            <Text style={styles.doctorCity}>{item.hospital || "Hôpital non spécifié"}</Text>
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="#1971C2" />
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContent}>
      <Text style={styles.title}>Trouver un médecin</Text>
      <Text style={styles.subtitle}>Prenez rendez-vous avec les meilleurs spécialistes</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Rechercher par nom..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            console.log('🔎 Recherche modifiée:', text);
            setSearchQuery(text);
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              console.log('🔎 Recherche effacée');
              setSearchQuery('');
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.specialtyContainer}>
        <Text style={styles.sectionTitle}>Spécialités</Text>
        <FlatList
          data={SPECIALTIES}
          renderItem={renderSpecialty}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtyList}
          style={styles.specialtyFlatList}
        />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Médecins disponibles</Text>
        {(searchQuery.trim() !== '' || selectedSpecialty !== 'Tous') && (
          <Text style={styles.resultsCount}>
            {filteredDoctors.length} résultat{filteredDoctors.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1971C2" />
            <Text style={styles.loadingText}>Chargement des médecins...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDoctors}
            renderItem={renderDoctor}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={50} color="#DEE2E6" />
                <Text style={styles.emptyText}>
                  {searchQuery.trim() !== '' 
                    ? `Aucun médecin trouvé pour "${searchQuery}"`
                    : selectedSpecialty !== 'Tous'
                    ? `Aucun médecin trouvé dans cette spécialité`
                    : 'Aucun médecin disponible'}
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#868E96',
    marginTop: 5,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  specialtyContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  resultsCount: {
    fontSize: 14,
    color: '#1971C2',
    fontWeight: '600',
    backgroundColor: '#E7F5FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyFlatList: {
    marginLeft: -20,
    marginRight: -20,
  },
  specialtyList: {
    paddingHorizontal: 20,
  },
  specialtyChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  specialtyChipActive: {
    backgroundColor: '#1971C2',
    borderColor: '#1971C2',
  },
  specialtyText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
  },
  specialtyTextActive: {
    color: '#FFF',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 15,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#F08C00',
    marginLeft: 3,
    fontWeight: 'bold',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#1971C2',
    marginTop: 2,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  doctorCity: {
    fontSize: 13,
    color: '#868E96',
    marginLeft: 4,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#868E96',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#ADB5BD',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default DoctorListScreen;
