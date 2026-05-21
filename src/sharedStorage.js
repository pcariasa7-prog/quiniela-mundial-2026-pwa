import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_CONFIG, USE_FIREBASE } from "./firebaseConfig.js";

const LOCAL_PREFIX = "quiniela_mundial_2026:";
let db = null;

function firebaseReady() {
  return Boolean(
    USE_FIREBASE &&
    FIREBASE_CONFIG?.apiKey &&
    FIREBASE_CONFIG.apiKey !== "PEGA_AQUI_TU_API_KEY" &&
    FIREBASE_CONFIG?.projectId &&
    FIREBASE_CONFIG.projectId !== "PEGA_AQUI_TU_PROJECT_ID"
  );
}

function safeId(key) {
  return key.replaceAll(":", "_").replaceAll("/", "_");
}

function getDb() {
  if (!firebaseReady()) return null;
  if (!db) {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
  }
  return db;
}

export async function getShared(key) {
  const firestore = getDb();

  if (!firestore) {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  try {
    const ref = doc(firestore, "quiniela_mundial_2026", safeId(key));
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().value ?? null : null;
  } catch (error) {
    console.error("Error leyendo Firebase:", error);
    return null;
  }
}

export async function setShared(key, value) {
  const firestore = getDb();

  if (!firestore) {
    try {
      localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
    } catch {}
    return;
  }

  try {
    const ref = doc(firestore, "quiniela_mundial_2026", safeId(key));
    await setDoc(ref, {
      value,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error guardando en Firebase:", error);
  }
}
