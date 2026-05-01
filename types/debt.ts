export interface IDebt {
  id?: number;
  nguoi_no: string;
  so_tien: number;
  noi_dung: string;
  ngay: string; // ISO date format YYYY-MM-DD
}

export interface ParsedDebtResult {
  nguoi_no: string;
  so_tien: number;
  noi_dung: string;
  ngay: string;
}

export interface IUser {
  id?: number;
  name: string;
}
