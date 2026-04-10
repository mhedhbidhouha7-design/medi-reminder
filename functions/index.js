const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const db = admin.database();
const firestoreDb = admin.firestore();

/**
 * GET /api/patient/:userId
 * 
 * Returns all information about a patient:
 * - Profile (name, email, phone, dateOfBirth, gender, address, profileImageUrl)
 * - Medications (name, schedules, startDate, endDate, takenLogs)
 * - Appointments (title, doctor, date, time, done)
 * - Health Journal (mood, bloodSugar, bloodPressure, notes)
 * - Proches/Contacts (name, phone, email)
 * - Medication History (intake logs)
 * - Appointment History (completed appointments)
 */
exports.getPatientInfo = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed. Use GET." });
    }

    // Extract userId from query param or path
    // Usage: /getPatientInfo?userId=XXXX
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "Missing required parameter: userId",
        usage: "GET /getPatientInfo?userId=YOUR_USER_ID",
      });
    }

    try {
      // 1. Fetch profile from Realtime Database
      const profileSnapshot = await db.ref(`users/${userId}`).once("value");
      const profileData = profileSnapshot.val();

      if (!profileData) {
        return res.status(404).json({ error: `Patient not found: ${userId}` });
      }

      // Extract profile fields (exclude nested data)
      const profile = {
        name: profileData.name || null,
        email: profileData.email || null,
        phone: profileData.phone || null,
        dateOfBirth: profileData.dateOfBirth || null,
        gender: profileData.gender || null,
        address: profileData.address || null,
        profileImageUrl: profileData.profileImageUrl || null,
        createdAt: profileData.createdAt || null,
      };

      // Calculate age from dateOfBirth
      let age = null;
      if (profileData.dateOfBirth) {
        const birth = new Date(profileData.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      // 2. Fetch medications from Realtime Database
      const medsData = profileData.medications || {};
      const medications = Object.keys(medsData).map((key) => ({
        id: key,
        name: medsData[key].name,
        startDate: medsData[key].startDate,
        endDate: medsData[key].endDate,
        schedules: medsData[key].schedules || [],
        takenLogs: medsData[key].takenLogs || {},
        createdAt: medsData[key].createdAt,
      }));

      // 3. Fetch appointments from Realtime Database
      const apptsData = profileData.appointments || {};
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

      // 4. Fetch proches (contacts) from Realtime Database
      const prochesData = profileData.proches || {};
      const proches = Object.keys(prochesData).map((key) => ({
        id: key,
        name: prochesData[key].name,
        phone: prochesData[key].phone,
        email: prochesData[key].email,
        createdAt: prochesData[key].createdAt || null,
      }));

      // 5. Fetch medication history from Realtime Database
      const medHistoryData = profileData.medicationHistory || {};
      const medicationHistory = Object.keys(medHistoryData).map((key) => ({
        id: key,
        medicationName: medHistoryData[key].medicationName,
        dose: medHistoryData[key].dose,
        scheduledTime: medHistoryData[key].scheduledTime,
        takenAt: medHistoryData[key].takenAt,
        date: medHistoryData[key].date,
      }));

      // 6. Fetch appointment history from Realtime Database
      const apptHistoryData = profileData.appointmentHistory || {};
      const appointmentHistory = Object.keys(apptHistoryData).map((key) => ({
        id: key,
        title: apptHistoryData[key].title,
        doctor: apptHistoryData[key].doctor || null,
        date: apptHistoryData[key].date,
        time: apptHistoryData[key].time,
        completedAt: apptHistoryData[key].completedAt,
      }));

      // 7. Fetch health journal entries from Firestore
      const journalSnapshot = await firestoreDb
        .collection("journal")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const journal = journalSnapshot.docs.map((doc) => ({
        id: doc.id,
        date: doc.data().date,
        mood: doc.data().mood,
        bloodSugar: doc.data().bloodSugar || null,
        bloodPressure: doc.data().bloodPressure || null,
        notes: doc.data().notes || null,
        createdAt: doc.data().createdAt,
      }));

      // Build the full response
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
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});
