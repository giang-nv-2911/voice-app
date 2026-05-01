import { ParsedDebtResult } from '@/types/debt';
import { format, subDays } from 'date-fns';

export function parseSpeechToDebt(text: string): ParsedDebtResult {
  let nguoi_no = "";
  let so_tien = 0;
  let noi_dung = "";
  let ngay = format(new Date(), 'yyyy-MM-dd');
  
  const normalizedText = text.toLowerCase();
  
  // 0. Sửa lỗi chính tả/phát âm phổ biến (Phonetic mapping)
  let processedText = normalizedText
    .replace(/\btiền nhật\b/g, 'tiền nhậu')
    .replace(/\bnhật\b/g, 'nhậu')
    .replace(/\brồi\b/g, 'rưỡi')
    .replace(/\bsao lại\b/g, '') // Xóa các từ thừa bị máy nghe nhầm
    .replace(/\bghi là\b/g, '')
    .replace(/\bghi hộ\b/g, '')
    .replace(/\bcho\b/g, '');
  
  // 1. Xử lý ngày tháng
  let dateMatched = false;
  if (processedText.includes('hôm qua')) {
    ngay = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    dateMatched = true;
  } else if (processedText.includes('hôm kia')) {
    ngay = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    dateMatched = true;
  }
  
  if (!dateMatched) {
    const exactDateMatch = processedText.match(/(?:ngày\s+)?(?:mùng\s+|mồng\s+)?(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/);
    if (exactDateMatch) {
      const day = parseInt(exactDateMatch[1], 10);
      const month = parseInt(exactDateMatch[2], 10);
      const year = exactDateMatch[3] ? parseInt(exactDateMatch[3], 10) : new Date().getFullYear();
      const specificDate = new Date(year, month - 1, day);
      if (!isNaN(specificDate.getTime())) {
        ngay = format(specificDate, 'yyyy-MM-dd');
      }
    }
  }

  // 2. Chuyển đổi số chữ sang số số (Giữ nguyên các từ tiếng lóng để regex nhận diện sau)
  processedText = processedText
    .replace(/không/g, '0')
    .replace(/một/g, '1')
    .replace(/hai/g, '2')
    .replace(/ba/g, '3')
    .replace(/bốn/g, '4')
    .replace(/năm/g, '5')
    .replace(/sáu/g, '6')
    .replace(/bảy/g, '7')
    .replace(/tám/g, '8')
    .replace(/chín/g, '9')
    .replace(/mười/g, '10')
    .replace(/lăm|nhăm/g, '5')
    .replace(/chục/g, 'chục'); // Giữ lại để xử lý ở bước 3

  // 3. Trích xuất số tiền (Cải tiến với Tiếng lóng và Phép nhân)
  const textForAmount = processedText;
  
  // Xử lý các cụm từ đặc biệt trước: "5 lít", "2 củ", "3 chục"
  const slangMatch = textForAmount.match(/(\d+)\s*(lít|củ|chục|mẻ)(?:\s*(rưỡi))?/);
  if (slangMatch) {
    const value = parseFloat(slangMatch[1]);
    const unit = slangMatch[2];
    const hasRuoi = slangMatch[3];
    
    if (unit === 'lít') so_tien = value * 100000 + (hasRuoi ? 50000 : 0);
    else if (unit === 'củ') so_tien = value * 1000000 + (hasRuoi ? 500000 : 0);
    else if (unit === 'chục') so_tien = value * 10000 + (hasRuoi ? 5000 : 0);
  }

  if (so_tien === 0) {
    const amountPatterns = [
      /(\d+)\s*(tỷ|tỉ)/,
      /(\d+)\s*(triệu|tr)(?:\s*(rưỡi))?/,
      /(\d+)\s*(nghìn|ngàn|k)(?:\s*(rưỡi))?/,
      /(\d+[\d.,]*)/
    ];

    for (const pattern of amountPatterns) {
      const match = textForAmount.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/[.,]/g, ''));
        const unit = match[2];
        const hasRuoi = match[3];
        
        if (unit === 'tỷ' || unit === 'tỉ') so_tien = value * 1000000000;
        else if (unit === 'triệu' || unit === 'tr') so_tien = value * 1000000 + (hasRuoi ? 500000 : 0);
        else if (unit === 'nghìn' || unit === 'ngàn' || unit === 'k') so_tien = value * 1000 + (hasRuoi ? 500 : 0);
        else if (value > 1000) so_tien = value;
        else if (value > 0 && value < 1000) so_tien = value * 1000;
        
        if (so_tien > 0) break;
      }
    }
  }

  // 4. Trích xuất tên (Cải tiến)
  // Ưu tiên theo sau các từ: anh, chị, em, thằng, con, bác, chú, cô
  const namePrefixMatch = text.match(/(?:anh|chị|em|thằng|con|bác|chú|cô|ông|bà)\s+([A-ZÀ-Ỹ][a-zà-ỹ]*)/i);
  if (namePrefixMatch && namePrefixMatch[1]) {
    nguoi_no = namePrefixMatch[1];
  } else {
    // Nếu không thấy prefix, tìm từ viết hoa đầu tiên không phải đầu câu
    const words = text.split(' ');
    for (let i = 1; i < words.length; i++) {
      if (/^[A-ZÀ-Ỹ]/.test(words[i]) && words[i].length > 1) {
        nguoi_no = words[i];
        break;
      }
    }
    // Nếu vẫn không có, lấy từ đầu tiên
    if (!nguoi_no) nguoi_no = words[0];
  }
  nguoi_no = nguoi_no ? nguoi_no.charAt(0).toUpperCase() + nguoi_no.slice(1).toLowerCase() : "";

  // 5. Trích xuất nội dung
  // Thường nằm sau các từ: tiền, cho, nợ, mượn, về
  const contentKeywords = ['tiền', 'nợ', 'mượn', 'ăn', 'uống', 'mua'];
  let bestContent = "";
  
  for (const kw of contentKeywords) {
    const idx = normalizedText.indexOf(kw);
    if (idx !== -1) {
      const after = text.substring(idx + kw.length).trim();
      // Loại bỏ phần liên quan đến số tiền nếu nó nằm trong chuỗi này
      bestContent = after.replace(/\d+.*/, '').trim();
      if (bestContent.length > 2) break;
    }
  }
  
  if (!bestContent) {
    // Fallback: Lấy tất cả trừ tên và tiền
    noi_dung = text.replace(new RegExp(nguoi_no, 'i'), '')
                  .replace(/\d+.*/, '')
                  .replace(/(anh|chị|em|nợ|mượn|ghi)/gi, '')
                  .trim();
  } else {
    noi_dung = bestContent;
  }

  return { nguoi_no, so_tien, noi_dung, ngay };
}
