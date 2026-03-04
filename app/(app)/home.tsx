// app/(app)/index.tsx
import { useTheme } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  console.log("Rendering HomeScreen");
  const { colors } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Bienvenue sur Medi Reminder
        </Text>

        {/* Next medication reminder */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Prochain médicament
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, marginTop: 8 }}>
            Metformine 500 mg - 20:00
          </Text>
          <Text style={{ color: colors.text + "80", marginTop: 4 }}>
            Dans 2 heures 15 min
          </Text>
        </View>

        {/* Quick stats */}
        <View style={styles.row}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              7
            </Text>
            <Text style={{ color: colors.text + "90" }}>jours consécutifs</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              128/82
            </Text>
            <Text style={{ color: colors.text + "90" }}>Dernière tension</Text>
          </View>
        </View>

        <Text
          style={{
            color: colors.text + "70",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Appuyez sur les onglets pour naviguer
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
  },
});
