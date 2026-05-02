export interface IDebt {
  id?: number;
  nguoi_no: string;
  so_tien: number;
  noi_dung: string;
  ngay: string; // ISO date format YYYY-MM-DD
  loai: 'no' | 'tra'; // Phân loại: Nợ hoặc Trả
}

export interface ParsedDebtResult {
  id?: number;
  nguoi_no: string;
  so_tien: number;
  noi_dung: string;
  ngay: string;
  loai: 'no' | 'tra';
  isClearAll?: boolean; // Cờ hiệu xóa toàn bộ nợ
}

export interface IUser {
  id?: number;
  name: string;
}
