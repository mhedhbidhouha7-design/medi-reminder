import { getStorage } from "firebase/storage";
import { app, auth, db } from "../firebaseConfig";

// Export the initialized services so other files can use them
export { app, auth, db };
export const storage = getStorage(app);
