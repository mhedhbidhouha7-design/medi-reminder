// app/(app)/medications/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
};

const MOCK_MEDICATIONS: Medication[] = [
  { id: "1", name: "Metformine", dosage: "500 mg", time: "08:00", taken: true },
  { id: "2", name: "Ramipril", dosage: "5 mg", time: "08:00", taken: true },
  {
    id: "3",
    name: "Atorvastatine",
    dosage: "20 mg",
    time: "20:00",
    taken: false,
  },
];

export default function MedicationsScreen() {
  console.log("Rendering MedicationsScreen");
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: Medication }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={{ color: colors.text + "80" }}>
          {item.dosage} • {item.time}
        </Text>
      </View>
      <TouchableOpacity>
        <Ionicons
          name={item.taken ? "checkmark-circle" : "ellipse-outline"}
          size={28}
          color={item.taken ? colors.primary : colors.text + "60"}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Mes médicaments
        </Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_MEDICATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: colors.text + "70",
              marginTop: 40,
            }}
          >
            Aucun médicament ajouté pour le moment
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#0066cc",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
});
