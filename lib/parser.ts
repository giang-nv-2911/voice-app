     import { ParsedDebtResult } from '@/types/debt';
import { format, subDays } from 'date-fns';

/**
 * FIXED FORMAT PARSER:
 * Tên | Nợ/Trả | Số tiền | Ngày | Nội dung
 */
export function parseSpeechToDebt(text: string): ParsedDebtResult {
  const normalized = text.toLowerCase().trim();
  
  // 1. Tìm Từ khóa Hành động (Mốc phân tách Tên và Tiền/Ý định)
  const actionKeywords = [' nợ ', ' trả ', ' mượn ', ' vay ', ' cho nợ ', ' nợ thêm ', ' thanh toán ', 'hết nợ', 'xóa nợ'];
  let actionIdx = -1;
  let actionWord = "";

  for (const kw of actionKeywords) {
    const idx = normalized.indexOf(kw);
    if (idx !== -1 && (actionIdx === -1 || idx < actionIdx)) {
      actionIdx = idx;
      actionWord = kw;
    }
  }

  // 2. Tìm Mốc Ngày tháng (Mốc phân tách Tiền và Nội dung)
  const dateKeywords = [' ngày ', ' hôm ', ' mùng ', ' mồng '];
  let dateIdx = -1;
  let dateWord = "";

  for (const kw of dateKeywords) {
    const idx = normalized.indexOf(kw);
    if (idx !== -1 && (dateIdx === -1 || idx < dateIdx)) {
      // Đảm bảo mốc ngày phải đứng sau mốc hành động
      if (idx > actionIdx) {
        dateIdx = idx;
        dateWord = kw;
      }
    }
  }

  // --- BẮT ĐẦU BÓC TÁCH ---
  
  // A. TRÍCH XUẤT TÊN (Đứng trước hành động)
  let nguoi_no = "Người lạ";
  let loai: 'no' | 'tra' = 'no';
  let isClearAll = false;

  if (actionIdx !== -1) {
    let namePart = text.substring(0, actionIdx).trim();
    namePart = namePart.replace(/^(ghi|cho|ghi cho|hộ|anh|chị|em|bạn)\s+/i, '');
    if (namePart) {
      nguoi_no = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }

    // Xác định loại dựa trên từ khóa hành động
    const traKeywords = ['trả', 'hoàn', 'thanh toán', 'tất toán'];
    const clearAllKeywords = ['hết nợ', 'xóa nợ', 'xóa sổ', 'không còn nợ'];

    if (clearAllKeywords.some(k => actionWord.includes(k) || normalized.includes(k))) {
      loai = 'tra';
      isClearAll = true;
    } else if (traKeywords.some(k => actionWord.includes(k))) {
      loai = 'tra';
    }
  }

  // B. TRÍCH XUẤT SỐ TIỀN (Chỉ thực hiện nếu không phải lệnh xóa hết)
  let so_tien = 0;
  let moneyEndIdx = -1;
  if (actionIdx !== -1 && !isClearAll) {
    const start = actionIdx + actionWord.length;
    const end = dateIdx !== -1 ? dateIdx : normalized.length;
    const moneyPart = normalized.substring(start, end).trim();
    
    const moneyResult = calculateMoney(moneyPart);
    so_tien = moneyResult.value;
    
    // Tìm vị trí kết thúc của số tiền trong câu gốc
    if (moneyResult.matchedText) {
      const originalMoneyPos = text.toLowerCase().indexOf(moneyResult.matchedText, start);
      if (originalMoneyPos !== -1) {
        moneyEndIdx = originalMoneyPos + moneyResult.matchedText.length;
      }
    }
  }

  // C. TRÍCH XUẤT NGÀY (Nằm giữa Date và Nội dung)
  let ngay = format(new Date(), 'yyyy-MM-dd');
  let contentStartIdx = -1;

  if (dateIdx !== -1) {
    // Tìm ngày cụ thể hoặc ngày tương đối
    const remainingAfterDate = normalized.substring(dateIdx);
    
    const relativeDateMatch = remainingAfterDate.match(/^(\s*ngày\s+)?(\s*hôm\s+)?(nay|qua|kia)/i);
    const absoluteDateMatch = remainingAfterDate.match(/^(\s*ngày\s+)?(\s*mùng\s+|mồng\s+)?(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i);

    if (relativeDateMatch) {
      const d = relativeDateMatch[3].toLowerCase();
      if (d === 'qua') ngay = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      else if (d === 'kia') ngay = format(subDays(new Date(), 2), 'yyyy-MM-dd');
      contentStartIdx = dateIdx + relativeDateMatch[0].length;
    } else if (absoluteDateMatch) {
      const day = parseInt(absoluteDateMatch[3], 10);
      const month = parseInt(absoluteDateMatch[4], 10);
      const year = absoluteDateMatch[5] ? parseInt(absoluteDateMatch[5], 10) : new Date().getFullYear();
      const specificDate = new Date(year, month - 1, day);
      if (!isNaN(specificDate.getTime())) {
        ngay = format(specificDate, 'yyyy-MM-dd');
      }
      contentStartIdx = dateIdx + absoluteDateMatch[0].length;
    }
  }

  // D. TRÍCH XUẤT NỘI DUNG (Đứng cuối cùng)
  let noi_dung = "Ghi chú";
  let finalContentIdx = contentStartIdx;

  // Nếu không tìm thấy mốc ngày, dùng mốc sau số tiền
  if (finalContentIdx === -1 && moneyEndIdx !== -1) {
    finalContentIdx = moneyEndIdx;
  }

  if (finalContentIdx !== -1) {
    let rawContent = text.substring(finalContentIdx).trim();
    if (rawContent) {
      // Xóa các dấu chấm/phẩy/gạch ngang dư thừa ở đầu (thường do lỗi bóc tách số tiền)
      rawContent = rawContent.replace(/^[.,\-\s]+/, '').trim();
      
      if (rawContent) {
        // Làm sạch nội dung: xóa các từ đệm ở đầu
        noi_dung = rawContent.replace(/^(tiền|vì|tại|do|là|về|cho)\s+/i, '');
        noi_dung = noi_dung.charAt(0).toUpperCase() + noi_dung.slice(1);
      }
    }
  }

  return { nguoi_no, so_tien, noi_dung, ngay, loai, isClearAll };
}

/**
 * Helper: Chuyển đổi văn bản sang con số + trả về đoạn text đã khớp
 */
function calculateMoney(text: string): { value: number; matchedText: string } {
  let val = 0;
  let matched = "";
  
  // Chuyển chữ số thành số nhưng GIỮ LẠI dấu chấm/phẩy để xử lý số lớn
  const cleanText = text.replace(/không/g, '0').replace(/một/g, '1').replace(/hai/g, '2').replace(/ba/g, '3')
    .replace(/bốn/g, '4').replace(/năm/g, '5').replace(/sáu/g, '6').replace(/bảy/g, '7')
    .replace(/tám/g, '8').replace(/chín/g, '9').replace(/mười/g, '10')
    .replace(/lăm|nhăm/g, '5');

  // 1. Trường hợp có đơn vị (triệu, nghìn, tỷ...)
  const amountWithUnitRegex = /(\d+[\d.,]*)\s*(tỷ|tỉ|triệu|tr|củ|lít|nghìn|ngàn|k|chục)/i;
  const matchWithUnit = cleanText.match(amountWithUnitRegex);

  if (matchWithUnit) {
    matched = matchWithUnit[0];
    const rawVal = parseFloat(matchWithUnit[1].replace(/[.,]/g, ''));
    const unit = matchWithUnit[2].toLowerCase();
    const isRuoi = cleanText.includes('rưỡi');

    if (unit === 'tỷ' || unit === 'tỉ') val = rawVal * 1000000000;
    else if (unit === 'triệu' || unit === 'tr' || unit === 'củ') val = rawVal * 1000000 + (isRuoi ? 500000 : 0);
    else if (unit === 'lít') val = rawVal * 100000 + (isRuoi ? 50000 : 0);
    else if (unit === 'chục') val = rawVal * 10000;
    else if (unit === 'nghìn' || unit === 'ngàn' || unit === 'k') val = rawVal * 1000 + (isRuoi ? 500 : 0);
    
    if (isRuoi && !matched.includes('rưỡi')) matched += " rưỡi";
  } else {
    // 2. Trường hợp chỉ có số (có thể có dấu chấm phân cách như 100.000)
    const onlyNumRegex = /\d+(?:[.,]\d+)*/;
    const matchOnlyNum = cleanText.match(onlyNumRegex);
    if (matchOnlyNum) {
      matched = matchOnlyNum[0];
      // Xóa dấu chấm/phẩy để tính toán
      const v = parseInt(matched.replace(/[.,]/g, ''), 10);
      // Logic thông minh: nếu số nhỏ (ví dụ 100) thì tự hiểu là hàng nghìn (100k)
      // Nhưng nếu số đã lớn sẵn (ví dụ 100000) thì giữ nguyên
      val = (v > 0 && v < 1000) ? v * 1000 : v;
    }
  }
  return { value: val, matchedText: matched };
}
