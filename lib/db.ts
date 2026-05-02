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
  debts: '++id, nguoi_no, so_tien, ngay, loai',
  users: '++id, &name'
});

export type { IDebt, IUser };
export { db };

// Helper functions for easy import everywhere
export async function addDebt(data: Omit<IDebt, 'id'>) {
  return await db.debts.add(data as IDebt);
}

export async function updateDebt(id: number, data: Partial<IDebt>) {
  return await db.debts.update(id, data);
}

export async function deleteDebt(id: number) {
  return await db.debts.delete(id);
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
  // 1. Tìm tên của user trước khi xóa
  const user = await db.users.get(id);
  if (user) {
    // 2. Cascade Delete: Xóa toàn bộ nợ liên quan đến người này
    await db.debts.where('nguoi_no').equalsIgnoreCase(user.name).delete();
  }
  // 3. Xóa user
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
 * Returns a summary grouped by the debtor's name (Debt - Repayment)
 */
export async function getSummaryByPerson() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const db of allDebts) {
    if (!summary[db.nguoi_no]) summary[db.nguoi_no] = 0;
    const value = db.so_tien || 0;
    summary[db.nguoi_no] += db.loai === 'tra' ? -value : value;
  }
  return summary;
}

/**
 * Returns a summary grouped by the product (Debt - Repayment)
 */
export async function getSummaryByProduct() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const db of allDebts) {
    const key = db.noi_dung || 'Khác';
    if (!summary[key]) summary[key] = 0;
    const value = db.so_tien || 0;
    summary[key] += db.loai === 'tra' ? -value : value;
  }
  return summary;
}

/**
 * Returns a summary grouped by date (Debt - Repayment)
 */
export async function getSummaryByDate() {
  const allDebts = await getAllDebts();
  const summary: Record<string, number> = {};
  for (const db of allDebts) {
    if (!summary[db.ngay]) summary[db.ngay] = 0;
    const value = db.so_tien || 0;
    summary[db.ngay] += db.loai === 'tra' ? -value : value;
  }
  return summary;
}
