import { ParsedDebtResult } from '@/types/debt';
import { format, subDays } from 'date-fns';

export function parseSpeechToDebt(text: string): ParsedDebtResult {
  let nguoi_no = "";
  let so_tien = 0;
  let noi_dung = "";
  let ngay = format(new Date(), 'yyyy-MM-dd'); // default today
  
  const normalizedText = text.toLowerCase();
  
  // 1. Date extraction
  let dateMatched = false;
  // Look for "ngày mùng XX tháng YY năm ZZZZ" or "mùng XX tháng YY"
  const exactDateMatch = normalizedText.match(/(?:ngày\s+)?(?:mùng\s+|mồng\s+)?(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/);
  
  if (exactDateMatch) {
    const day = parseInt(exactDateMatch[1], 10);
    const month = parseInt(exactDateMatch[2], 10);
    const year = exactDateMatch[3] ? parseInt(exactDateMatch[3], 10) : new Date().getFullYear();
    const specificDate = new Date(year, month - 1, day);
    if (!isNaN(specificDate.getTime())) {
      ngay = format(specificDate, 'yyyy-MM-dd');
      dateMatched = true;
    }
  }

  if (!dateMatched) {
    if (normalizedText.includes('hôm qua')) {
      ngay = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    } else if (normalizedText.includes('hôm nay')) {
      ngay = format(new Date(), 'yyyy-MM-dd');
    }
  }
  
  // 2. Name extraction
  // Handles cases like "anh Nam", "chị Lan", "em Huy"
  const nameMatch = text.match(/(?:anh|chị|em)\s+([A-ZÀ-Ỹ][a-zà-ỹ]*)/i) 
    || text.match(/(?:anh|chị|em)\s+([a-zà-ỹ]+)/i); 
  
  if (nameMatch && nameMatch[1]) {
    nguoi_no = nameMatch[1];
    // Capitalize properly
    nguoi_no = nguoi_no.charAt(0).toUpperCase() + nguoi_no.slice(1);
  } else {
    // Fallback: find the first capitalized word
    const capitalMatch = text.match(/\b([A-ZÀ-Ỹ][a-zà-ỹ]*)\b/);
    if (capitalMatch && capitalMatch[1]) {
      nguoi_no = capitalMatch[1];
    } else {
      // Last resort fallback
      const words = text.trim().split(/\s+/);
      if (words.length > 0 && words[0]) {
        nguoi_no = words[0];
        // Don't auto capitalize fallback unless we want to
      }
    }
  }

  // 3. Amount extraction
  
  // Normalize number words to digits for better parsing
  const numberMap: Record<string, string> = {
    'một': '1', 'hai': '2', 'ba': '3', 'bốn': '4', 'năm': '5', 
    'sáu': '6', 'bảy': '7', 'tám': '8', 'chín': '9', 'mười': '10'
  };
  
  let textForAmount = normalizedText;
  Object.keys(numberMap).forEach(word => {
    // Replace word with digit in a copy for regex matching
    textForAmount = textForAmount.replace(new RegExp(`\\b${word}\\b`, 'g'), numberMap[word]);
  });

  // Matches "200k", "2.5 triệu", "50 nghìn", "50 ngàn", "1 triệu" or raw outputs like "200.000", "200,000"
  const amountMatch = textForAmount.match(/(\d[\d.,]*)\s*(k|nghìn|ngàn|triệu)?(?:\s+(rưỡi))?/);
  
  if (amountMatch) {
    const rawStr = amountMatch[1];
    const unit = amountMatch[2];
    const ruoi = amountMatch[3]; // "rưỡi" -> + 0.5 of range
    
    if (!unit) {
      so_tien = parseInt(rawStr.replace(/[.,]/g, ''), 10);
    } else {
      const rawAmount = parseFloat(rawStr.replace(',', '.'));
      
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngàn') {
        so_tien = rawAmount * 1000;
        if (ruoi) so_tien += 500;
      } else if (unit === 'triệu') {
        so_tien = rawAmount * 1000000;
        if (ruoi) so_tien += 500000;
      }
    }
  }

  // 4. Content (Product) extraction
  // After keyword "tiền"
  const contentIndex = normalizedText.indexOf("tiền ");
  if (contentIndex !== -1) {
    // Keep raw casing for product
    let afterTien = text.substring(contentIndex + 5).trim();
    // Strip trailing date words if any
    afterTien = afterTien.replace(/\s+hôm\s+(nay|qua).*$/i, '').trim();
    // Strip explicit dates out of the product (matching mùng/mồng variations)
    afterTien = afterTien.replace(/\s*(?:ngày\s+)?(?:mùng\s+|mồng\s+)?\d{1,2}\s+tháng\s+\d{1,2}(?:\s+năm\s+\d{4})?.*/i, '').trim();
    
    // Sometimes people say "tiền nhậu hôm qua", we want just "nhậu"
    if (afterTien) {
      noi_dung = afterTien;
    }
  }

  return {
    nguoi_no,
    so_tien,
    noi_dung,
    ngay
  };
}
