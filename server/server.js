import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// ============================================================
// SETUP: ESM equivalent of __dirname
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// SETUP: You need a Firebase service account key.
// 1. Go to: https://console.firebase.google.com/project/medi-reminder-2c715/settings/serviceaccounts/adminsdk
// 2. Click "Generate New Private Key"
// 3. Save the file as "serviceAccountKey.json" in this /server folder
// ============================================================

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://medi-reminder-2c715-default-rtdb.europe-west1.firebasedatabase.app",
  });
} catch (error) {
  console.error("\n❌ ERROR: serviceAccountKey.json not found or invalid!\n");
  console.error("To fix this:");
  console.error(
    "1. Go to: https://console.firebase.google.com/project/medi-reminder-2c715/settings/serviceaccounts/adminsdk",
  );
  console.error("2. Click 'Generate New Private Key'");
  console.error(
    "3. Save the downloaded file as 'serviceAccountKey.json' in the /server folder\n",
  );
  process.exit(1);
}

const db = admin.database();
const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
// GET /api/patient/:userId
// Returns ALL patient information
// ============================================================
app.get("/api/patient/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Fetch everything from Realtime Database in one call
    const snapshot = await db.ref(`users/${userId}`).once("value");
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Patient not found with ID: ${userId}`,
      });
    }

    // 2. Extract profile info
    const profile = {
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: data.gender || null,
      address: data.address || null,
      profileImageUrl: data.profileImageUrl || null,
      createdAt: data.createdAt || null,
    };

    // 3. Calculate age
    let age = null;
    if (data.dateOfBirth) {
      const birth = new Date(data.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    // 4. Extract medications
    const medsData = data.medications || {};
    const medications = Object.keys(medsData).map((key) => ({
      id: key,
      name: medsData[key].name,
      startDate: medsData[key].startDate,
      endDate: medsData[key].endDate,
      schedules: medsData[key].schedules || [],
      takenLogs: medsData[key].takenLogs || {},
      createdAt: medsData[key].createdAt,
    }));

    // 5. Extract appointments
    const apptsData = data.appointments || {};
    const appointments = Object.keys(apptsData).map((key) => ({
      id: key,
      title: apptsData[key].title,
      doctor: apptsData[key].doctor || null,
      location: apptsData[key].location || null,
      date: apptsData[key].date,
      time: apptsData[key].time,
      done: apptsData[key].done || false,
      notes: apptsData[key].notes || null,
      status: apptsData[key].status || "planned",
      type: apptsData[key].type || null,
      createdAt: apptsData[key].createdAt || null,
    }));

    // 6. Extract proches (contacts)
    const prochesData = data.proches || {};
    const proches = Object.keys(prochesData).map((key) => ({
      id: key,
      name: prochesData[key].name,
      phone: prochesData[key].phone,
      email: prochesData[key].email,
      createdAt: prochesData[key].createdAt || null,
    }));

    // 7. Extract medication history
    const medHistData = data.medicationHistory || {};
    const medicationHistory = Object.keys(medHistData).map((key) => ({
      id: key,
      medicationName: medHistData[key].medicationName,
      dose: medHistData[key].dose,
      scheduledTime: medHistData[key].scheduledTime,
      takenAt: medHistData[key].takenAt,
      date: medHistData[key].date,
    }));

    // 8. Extract appointment history
    const apptHistData = data.appointmentHistory || {};
    const appointmentHistory = Object.keys(apptHistData).map((key) => ({
      id: key,
      title: apptHistData[key].title,
      doctor: apptHistData[key].doctor || null,
      date: apptHistData[key].date,
      time: apptHistData[key].time,
      completedAt: apptHistData[key].completedAt,
    }));

    // 9. Extract health journal from Realtime Database
    const journalData = data.journal || {};
    const journal = Object.keys(journalData).map((key) => ({
      id: key,
      date: journalData[key].date,
      mood: journalData[key].mood,
      bloodSugar: journalData[key].bloodSugar || null,
      bloodPressure: journalData[key].bloodPressure || null,
      weight: journalData[key].weight || null,
      height: journalData[key].height || null,
      illness: journalData[key].illness || null,
      symptoms: journalData[key].symptoms || null,
      notes: journalData[key].notes || null,
      createdAt: journalData[key].createdAt,
    }));
    // Trier par date de création (décroissant)
    journal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 10. Build response
    const response = {
      success: true,
      patient: {
        userId,
        age,
        profile,
        medications,
        appointments,
        proches,
        medicationHistory,
        appointmentHistory,
        journal,
        summary: {
          totalMedications: medications.length,
          totalAppointments: appointments.length,
          totalProches: proches.length,
          totalJournalEntries: journal.length,
          totalMedicationsTaken: medicationHistory.length,
          totalAppointmentsCompleted: appointmentHistory.length,
        },
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching patient info:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// ============================================================
// GET /api/journal/:userId
// Returns ALL journal entries for a specific user
// ============================================================
app.get("/api/journal/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const snapshot = await db.ref(`users/${userId}/journal`).once("value");
    const data = snapshot.val();

    if (!data) {
      return res.status(200).json({
        success: true,
        userId,
        totalEntries: 0,
        journal: []
      });
    }

    const journal = Object.keys(data).map((key) => ({
      id: key,
      date: data[key].date,
      mood: data[key].mood,
      bloodSugar: data[key].bloodSugar || null,
      bloodPressure: data[key].bloodPressure || null,
      weight: data[key].weight || null,
      height: data[key].height || null,
      illness: data[key].illness || null,
      symptoms: data[key].symptoms || null,
      notes: data[key].notes || null,
      createdAt: data[key].createdAt,
    }));

    // Trier par date de création (décroissant - plus récent en premier)
    journal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({
      success: true,
      userId,
      totalEntries: journal.length,
      journal,
    });
  } catch (error) {
    console.error("Error fetching journal:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "running",
    endpoints: {
      getPatient: "GET /api/patient/:userId",
      getJournal: "GET /api/journal/:userId",
    },
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Medi-Reminder API running at: http://localhost:${PORT}`);
  console.log(`\n📋 Test with Postman:`);
  console.log(`   GET http://localhost:${PORT}/api/patient/YOUR_USER_ID`);
  console.log(`   GET http://localhost:${PORT}/api/journal/YOUR_USER_ID\n`);
});
