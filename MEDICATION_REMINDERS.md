# Medication Reminder System

## Overview

This implementation provides a comprehensive medication reminder system with two types of notifications:

### 1. **Pre-Reminder Notifications** (30 & 15 minutes before)

- Displayed as standard notifications (not full-screen)
- Includes sound alert
- User can dismiss and continue using the app
- SMS notifications sent to emergency contacts ("proches")
- **Non-blocking**: App remains fully accessible

### 2. **On-Time Medication Notification** (at exact scheduled time)

- Displayed as a full-screen modal overlay
- High-visibility with pulsing animation
- Includes sound and haptic feedback
- **Blocking**: User cannot access any other part of the app
- Must confirm "I have taken my medication" to dismiss
- Prevents accidental skipping of important doses

## Architecture

### Files Created/Modified

#### New Files:

1. **`services/medicationNotificationHandler.ts`**
   - Manages pending medication alerts
   - Handles notification responses
   - Provides subscription system for overlay state
   - Functions:
     - `subscribeToPendingMedicationAlert()` - Listen to alert state changes
     - `handleMedicationNotification()` - Process incoming notifications
     - `confirmMedicationTaken()` - Mark medication as taken
     - `dismissMedicationAlert()` - Close overlay (for skipped doses)

2. **`components/FullScreenMedicationOverlay.tsx`**
   - Full-screen modal displayed when it's time to take medication
   - Features:
     - Animated pulsing background
     - Clear medication information (name, dose, time)
     - Two action buttons:
       - **Confirm Button**: "I HAVE TAKEN MY MEDICATION" - marks as taken
       - **Skip Button**: "REMIND ME LATER" - requires confirmation
     - Emergency help button
     - Prevents back button from closing
   - Uses theme colors for consistent look

3. **`utils/medicationTracker.ts`**
   - Tracks medication completion
   - Records to both local storage and Firebase
   - Functions:
     - `recordMedicationTaken()` - Record a dose as taken
     - `recordMedicationSkipped()` - Record a skipped dose
     - `isMedicationTakenToday()` - Check if dose was taken
     - `getMedicationsTakenToday()` - Get all doses taken today

#### Modified Files:

1. **`services/notificationService.ts`**
   - Enhanced medication reminders with metadata
   - Now includes in notification data:
     - `medicationName` - For display in overlay
     - `dose` - Dosage information
     - `scheduledTime` - When medication should be taken
     - `isFullScreen` - Flag to indicate full-screen vs normal notification

2. **`app/(app)/_layout.tsx`**
   - Added notification listener setup
   - Added medication alert state management
   - Renders `FullScreenMedicationOverlay` on top of navigation
   - Creates Android notification channels for full-screen alerts

3. **`constants/theme.ts`**
   - Added notification color palette to all themes
   - Colors include:
     - `background` - Main overlay background
     - `pulse` - Animation pulse color
     - `text` - Primary text
     - `subtext` - Secondary text
     - `cardBackground` - Medication info card
     - `accent` - Button colors

## How It Works

### Notification Flow

```
scheduleMedicationReminders()
  ↓
  ├─ 30 min before → Normal notification
  ├─ 15 min before → Normal notification
  └─ At exact time → Notification + Full-screen overlay

Normal Notification:
  - Shows in notification center
  - User can dismiss
  - App continues normally

Full-Screen Notification:
  - Dismisses notification center
  - Shows FullScreenMedicationOverlay
  - Modal covers entire screen
  - User must confirm medication taken
  - Overlay closes only after confirmation
```

### State Management

1. **Local State**: `pendingMedicationAlert` in `_layout.tsx`
   - Holds current medication alert
   - Triggers overlay visibility

2. **Global Subscription System**: `medicationNotificationHandler.ts`
   - Notifies all listeners when alert changes
   - Multiple components can subscribe
   - Decoupled from React component lifecycle

3. **Persistent Storage**:
   - **AsyncStorage**: Local device storage for offline reliability
   - **Firebase**: Cloud storage for sync across devices and backup
   - Key: `med_{medicationId}_{scheduleIndex}_{date}`

## Usage Examples

### Scheduling Reminders

```typescript
import { scheduleMedicationReminders } from "@/services/notificationService";

// When adding a new medication
const medication = {
  id: "med123",
  name: "Doliprane",
  schedules: [
    { time: "08:00", dose: "500mg" },
    { time: "20:00", dose: "500mg" },
  ],
  startDate: "2024-04-01",
  endDate: "2024-04-30",
  createdAt: new Date().toISOString(),
};

await scheduleMedicationReminders(userId, medication);
```

### Checking if Medication Was Taken

```typescript
import { isMedicationTakenToday } from "@/utils/medicationTracker";

const taken = await isMedicationTakenToday("med123", 0);
if (!taken) {
  console.log("User has not taken their 8 AM dose yet");
}
```

### Getting Medication History

```typescript
import { getMedicationsTakenToday } from "@/utils/medicationTracker";

const today = await getMedicationsTakenToday();
console.log("Medications taken today:", today);
// Output: [{ medicationId: 'med123', scheduleIndex: 0, takenAt: '2024-04-01T08:15:00Z' }]
```

## Android Notification Channels

Two channels are created:

1. **default** - Standard pre-reminder notifications
2. **medication_fullscreen** - Full-screen dose time notifications

## Testing

### Test in Expo Go

```typescript
import { testNotifications } from "@/services/notificationService";

// Call from any screen to fire test notifications at 5s, 10s, 15s
testNotifications();
```

### Manual Testing

1. Add a medication with specific times close to current time
2. Wait for notifications to fire
3. Verify 30-min and 15-min pre-reminders appear normally
4. Verify on-time notification shows full-screen overlay
5. Confirm medication taken button dismisses overlay
6. Check Firebase shows medication as taken

## Integration with Medication Management

The system integrates with existing medication management:

1. **Creating Medication**
   - `addMedication()` in `medicationController.ts` automatically calls `scheduleMedicationReminders()`

2. **Updating Medication**
   - `updateMedication()` reschedules all reminders

3. **Medication History**
   - Automatically tracked in `takenLogs` field of medication
   - Also stored in separate `medicationHistory` collection for analytics

## Error Handling

- If notification scheduling fails, error is logged but doesn't prevent app operation
- If user is not logged in when trying to record taken status, error is logged
- Pre-reminder notifications continue even if on-time overlay has issues

## Performance Considerations

1. **Notification Scheduling**: Limited to next 7 days (configurable)
2. **Local Storage**: Async via AsyncStorage to prevent blocking
3. **Firebase Writes**: Batched to reduce quota usage
4. **Animation**: Uses native driver for 60 FPS performance

## Customization

### Change Notification Times

Edit `scheduleMedicationReminders()` in `notificationService.ts`:

```typescript
// Currently: 30 min, 15 min, on-time
// To add 1 hour before:
const reminder60 = new Date(doseTime.getTime() - 60 * 60 * 1000);
```

### Customize Overlay Appearance

- Modify colors in `constants/theme.ts` (notification section)
- Edit component in `components/FullScreenMedicationOverlay.tsx`
- Change animations in the `useEffect` hook

### Change Scheduling Range

Edit in `notificationService.ts`:

```typescript
const maxDays = 7; // Change this number
```

## Troubleshooting

### Notifications Not Appearing

1. Check notification permissions are granted
2. Verify notification times are in the future
3. Check Android notification channels are created
4. In Expo Go, ensure local notifications are enabled

### Full-Screen Overlay Not Showing

1. Verify notification data includes `type: 'medication_dose'`
2. Check `pendingMedicationAlert` state updates
3. Verify FullScreenMedicationOverlay is rendered in app layout

### Medication Not Recording as Taken

1. Verify user is logged in when confirming
2. Check Firebase permissions allow writes
3. Check AsyncStorage available on device
4. Review console for specific error messages

## Future Enhancements

1. **Smart Reminders**: Remind sooner if user is away
2. **Medication Interactions**: Alert if conflicting medications
3. **Compliance Analytics**: Show medication adherence graphs
4. **AI Assistant**: Use IA tab to help with dosage questions
5. **Biometric Confirmation**: Require fingerprint to confirm taken
6. **Recurring Schedules**: Monthly or custom interval medications
