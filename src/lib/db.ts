import { openDB, type IDBPDatabase } from 'idb';
import type { Project, GlobalPerson } from '@/types';

const DB_NAME = 'wedding-photo-selector';
const DB_VERSION = 1;

const PROJECTS_STORE = 'projects';
const PEOPLE_STORE = 'globalPeople';

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'folderName' });
      }
      if (!db.objectStoreNames.contains(PEOPLE_STORE)) {
        const peopleStore = db.createObjectStore(PEOPLE_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        peopleStore.createIndex('name', 'name', { unique: false });
      }
    },
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb();
  await db.put(PROJECTS_STORE, project);
}

export async function getProject(folderName: string): Promise<Project | undefined> {
  const db = await getDb();
  return db.get(PROJECTS_STORE, folderName);
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDb();
  return db.getAll(PROJECTS_STORE);
}

export async function deleteProject(folderName: string): Promise<void> {
  const db = await getDb();
  await db.delete(PROJECTS_STORE, folderName);
}

export async function addGlobalPerson(name: string): Promise<void> {
  const db = await getDb();
  await db.add(PEOPLE_STORE, { name, createdAt: Date.now() } as GlobalPerson);
}

export async function getAllPeople(): Promise<GlobalPerson[]> {
  const db = await getDb();
  return db.getAll(PEOPLE_STORE);
}

export async function deleteGlobalPerson(id: number): Promise<void> {
  const db = await getDb();
  await db.delete(PEOPLE_STORE, id);
}