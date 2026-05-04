import Dexie, { type EntityTable } from 'dexie';
import { IDebt, IUser } from '@/types/debt';

const db = new Dexie('VoiceDebtTrackerDB') as Dexie & {
  debts: EntityTable<
    IDebt,
    'id'
  >;
  users: EntityTable<
    IUser,
    'id'
  >;
  deletedDebts: EntityTable<
    IDebt & { deleted_at: string },
    'id'
  >;
};

// Schema declaration
db.version(3).stores({
  debts: '++id, nguoi_no, so_tien, ngay, loai',
  users: '++id, &name',
  deletedDebts: '++id, nguoi_no, so_tien, ngay, loai, deleted_at'
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
  return await moveToTrash(id);
}

export async function moveToTrash(id: number) {
  const debt = await db.debts.get(id);
  if (debt) {
    await db.deletedDebts.add({
      ...debt,
      deleted_at: new Date().toISOString()
    });
    return await db.debts.delete(id);
  }
}

export async function bulkMoveToTrash(userName: string) {
  const debts = await db.debts.where('nguoi_no').equalsIgnoreCase(userName).toArray();
  for (const debt of debts) {
    if (debt.id) {
      await db.deletedDebts.add({
        ...debt,
        deleted_at: new Date().toISOString()
      });
    }
  }
  return await db.debts.where('nguoi_no').equalsIgnoreCase(userName).delete();
}

export async function restoreFromTrash(id: number) {
  const deleted = await db.deletedDebts.get(id);
  if (deleted) {
    const { deleted_at: _, ...debtData } = deleted;
    await db.debts.add(debtData as IDebt);
    return await db.deletedDebts.delete(id);
  }
}

export async function getAllDebts() {
  return await db.debts.toArray();
}

export async function getAllUsers() {
  return await db.users.toArray();
}

export async function addUser(name: string) {
  // Use unique check before add to prevent ConstraintError
  const trimmed = name.trim();
  const existing = await db.users.where('name').equalsIgnoreCase(trimmed).first();
  if (existing) return existing.id;
  return await db.users.add({ name: trimmed });
}

export async function updateUser(id: number, name: string) {
  return await db.users.update(id, { name });
}

export async function deleteUser(id: number) {
  // 1. Tìm tên của user trước khi xóa
  const user = await db.users.get(id);
  if (user) {
    // 2. Archive all debts related to this person
    const userDebts = await db.debts.where('nguoi_no').equalsIgnoreCase(user.name).toArray();
    for (const d of userDebts) {
      if (d.id) await moveToTrash(d.id);
    }
  }
  // 3. Xóa user (users table is small and metadata, we can permanently delete users or move to private archive)
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
  const debts = await db.debts.toArray();
  const trashEntries = debts.map(d => ({
    ...d,
    deleted_at: new Date().toISOString()
  }));
  
  if (trashEntries.length > 0) {
    await db.deletedDebts.bulkAdd(trashEntries as (IDebt & { deleted_at: string })[]);
  }
  
  await db.debts.clear();
  // We keep users table to preserve contact list
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

export async function bulkRestoreFromTrash(ids: number[]) {
  const deleted = await db.deletedDebts.where('id').anyOf(ids).toArray();
  for (const item of deleted) {
    const { deleted_at: _, ...debtData } = item;
    await db.debts.add(debtData as IDebt);
  }
  return await db.deletedDebts.where('id').anyOf(ids).delete();
}

export async function bulkPermanentDeleteFromTrash(ids: number[]) {
  return await db.deletedDebts.where('id').anyOf(ids).delete();
}
