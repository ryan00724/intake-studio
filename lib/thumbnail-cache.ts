const DB_NAME = "intake-studio-thumbnails";
const STORE_NAME = "thumbnails";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get a cached thumbnail data URL.
 * Returns null if the cache is missing or stale (updatedAt mismatch).
 */
export async function getCachedThumbnail(
  intakeId: string,
  updatedAt: string
): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(intakeId);
      req.onsuccess = () => {
        const entry = req.result;
        if (entry && entry.updatedAt === updatedAt && entry.dataUrl) {
          resolve(entry.dataUrl as string);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Store a thumbnail data URL in the cache.
 */
export async function setCachedThumbnail(
  intakeId: string,
  updatedAt: string,
  dataUrl: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ updatedAt, dataUrl }, intakeId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail
  }
}
