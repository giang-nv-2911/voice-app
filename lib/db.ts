import Dexie, { type EntityTable } from 'dexie';
import { IDebt, IUser } from '@/types/debt';

const db = new Dexie('VoiceDebtTrackerDB') as Dexie & {
  debts: EntityTable<
    IDebt,
    'id' // primary key "id" (for the typings only)
  >;
  users: EntityTable<
    IUser,
    'id'
  >;
};

// Schema declaration
db.version(2).stores({
  debts: '++id, nguoi_no, so_tien, noi_dung, ngay',
  users: '++id, &name'
});

export type { IDebt, IUser };
export { db };

// Helper functions for easy import everywhere
export async function addDebt(data: Omit<IDebt, 'id'>) {
  return await db.debts.add(data as IDebt);
}

export async function getAllDebts() {
  return await db.debts.toArray();
}

export async function getAllUsers() {
  return await db.users.toArray();
}

export async function addUser(name: string) {
  return await db.users.add({ name });
}

export async function updateUser(id: number, name: string) {
  return await db.users.update(id, { name });
}

export async function deleteUser(id: number) {
  return await db.users.delete(id);
}

export async function getDebtsByUser(userName: string) {
  return await db.debts
    .where('nguoi_no')
    .equalsIgnoreCase(userName)
    .reverse()
    .toArray();
}

export async function clearAllData() {
  await db.debts.clear();
  await db.users.clear();
}

/**
 * Returns a summary grouped by the debtor's name
 */
export async function getSummaryByPerson() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const debt of allDebts) {
    if (!summary[debt.nguoi_no]) {
      summary[debt.nguoi_no] = 0;
    }
    summary[debt.nguoi_no] += debt.so_tien;
  }
  return summary;
}

/**
 * Returns a summary grouped by the product (noi_dung)
 */
export async function getSummaryByProduct() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const debt of allDebts) {
    if (!summary[debt.noi_dung]) {
      summary[debt.noi_dung] = 0;
    }
    summary[debt.noi_dung] += debt.so_tien;
  }
  return summary;
}

/**
 * Returns a summary grouped by date
 */
export async function getSummaryByDate() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const debt of allDebts) {
    if (!summary[debt.ngay]) {
      summary[debt.ngay] = 0;
    }
    summary[debt.ngay] += debt.so_tien;
  }
  return summary;
}
