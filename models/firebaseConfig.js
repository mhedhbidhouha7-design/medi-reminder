import { getStorage } from "firebase/storage";
import { app, auth, db } from "../firebaseConfig";
// Export de l'application Firebase initialisée
//export = rendre une variable, fonction ou objet disponible pour d’autres fichiers
export { app, auth, db };
// Export du service de stockage
export const storage = getStorage(app);
