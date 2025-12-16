import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExcelStudent {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  joinedAt: string;
  className?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor() { }

  /**
   * Đọc file Excel và chuyển đổi thành array object
   */
  readExcelFile(file: File): Promise<ExcelStudent[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Lấy sheet đầu tiên
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Chuyển đổi sang JSON với header từ row đầu tiên
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Sử dụng array thay vì object
            defval: '', // Giá trị mặc định cho cell trống
            blankrows: false // Bỏ qua row trống
          });

          if (jsonData.length === 0) {
            reject(new Error('File Excel trống hoặc không có dữ liệu'));
            return;
          }

          // Lấy header (row đầu tiên) - các cột phải theo thứ tự chính xác
          const headers = (jsonData[0] as string[]).map(h => h ? h.trim() : '');

          // Chuyển đổi data từ row 2 trở đi
          const students: ExcelStudent[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row && row.length > 0 && row.some(cell => cell !== '')) {
              const student: ExcelStudent = {
                fullName: String(row[0] || '').trim(),
                email: String(row[1] || '').trim(),
                phone: String(row[2] || '').trim(),
                address: String(row[3] || '').trim(),
                dob: this.formatDate(String(row[4] || '').trim()),
                gender: this.formatGender(String(row[5] || '').trim()),
                joinedAt: this.formatDate(String(row[6] || '').trim()),
                className: String(row[7] || '').trim()
              };

              // Validate dữ liệu cơ bản - chỉ cần có họ tên
              if (student.fullName) {
                students.push(student);
              }
            }
          }

          if (students.length === 0) {
            reject(new Error('Không tìm thấy dữ liệu hợp lệ trong file Excel'));
            return;
          }

          resolve(students);
        } catch (error) {
          reject(new Error(`Lỗi đọc file Excel: ${error.message || error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Lỗi đọc file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Lấy giá trị cell dựa trên tên cột có thể có (không dùng nữa)
   */
  private getCellValue(row: any[], headers: string[], possibleNames: string[]): string {
    for (const name of possibleNames) {
      const index = headers.findIndex(h =>
        h && h.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (index !== -1 && row[index] !== undefined && row[index] !== null) {
        return String(row[index]).trim();
      }
    }
    return '';
  }

  /**
   * Format ngày sinh
   */
  private formatDate(dateValue: string): string {
    if (!dateValue) return '';

    try {
      // Nếu là số (Excel date serial number)
      if (!isNaN(Number(dateValue))) {
        const excelDate = new Date((Number(dateValue) - 25569) * 86400 * 1000);
        return excelDate.toISOString().split('T')[0];
      }

      // Nếu là string, thử parse các format phổ biến
      const formats = [
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // dd/mm/yyyy
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // dd-mm-yyyy
      ];

      for (const format of formats) {
        const match = dateValue.match(format);
        if (match) {
          let day, month, year;
          if (format === formats[1]) { // yyyy-mm-dd
            [, year, month, day] = match;
          } else { // dd/mm/yyyy or dd-mm-yyyy
            [, day, month, year] = match;
          }

          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }

      // Thử parse trực tiếp
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      }

    return dateValue; // Trả về giá trị gốc nếu không parse được
  }

  /**
   * Format giới tính
   */
  private formatGender(genderValue: string): string {
    if (!genderValue) return '';

    const gender = genderValue.toLowerCase().trim();
    if (gender === 'nam' || gender === 'male' || gender === 'm') {
      return 'Male';
    }
    if (gender === 'nữ' || gender === 'nu' || gender === 'female' || gender === 'f') {
      return 'Female';
    }

    return genderValue; // Trả về giá trị gốc nếu không nhận diện được
  }

  /**
   * Tạo file Excel mẫu để download
   */
  downloadSampleExcel(): void {
    const sampleData = [
      {
        'Họ và tên': 'Nguyễn Văn A',
        'Email': 'nguyenvana@example.com',
        'Số điện thoại': '0123456789',
        'Địa chỉ': '123 Đường ABC, Quận 1, TP.HCM',
        'Ngày sinh': '01/01/2000',
        'Giới tính': 'Nam',
        'Ngày vào trung tâm': '01/09/2024'
      },
      {
        'Họ và tên': 'Trần Thị B',
        'Email': 'tranthib@example.com',
        'Số điện thoại': '0987654321',
        'Địa chỉ': '456 Đường XYZ, Quận 2, TP.HCM',
        'Ngày sinh': '15/05/1999',
        'Giới tính': 'Nữ',
        'Ngày vào trung tâm': '01/09/2024'
      },
      {
        'Họ và tên': 'Trần Văn Sáng',
        'Email': '',
        'Số điện thoại': '',
        'Địa chỉ': '',
        'Ngày sinh': '',
        'Giới tính': '',
        'Ngày vào trung tâm': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh');

    // Tạo file Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, 'Mau_Danh_Sach_Hoc_Sinh.xlsx');
  }

  /**
   * Validate dữ liệu trước khi import
   */
  validateStudentData(students: ExcelStudent[]): { valid: ExcelStudent[], errors: string[] } {
    const valid: ExcelStudent[] = [];
    const errors: string[] = [];

    students.forEach((student, index) => {
      const rowNumber = index + 2; // +2 vì bắt đầu từ row 2 trong Excel
      const rowErrors: string[] = [];

      // Validate required fields - chỉ họ tên là bắt buộc
      if (!student.fullName || student.fullName.trim().length === 0) {
        rowErrors.push(`Dòng ${rowNumber}: Thiếu họ và tên`);
      }

      // Validate email format nếu có nhập
      if (student.email && student.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(student.email)) {
          rowErrors.push(`Dòng ${rowNumber}: Email không hợp lệ`);
        }
      }

      // Validate phone number
      if (student.phone && student.phone.trim().length > 0) {
        const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
        if (!phoneRegex.test(student.phone.replace(/\s/g, ''))) {
          rowErrors.push(`Dòng ${rowNumber}: Số điện thoại không hợp lệ`);
        }
      }

      if (rowErrors.length === 0) {
        valid.push(student);
      } else {
        errors.push(...rowErrors);
      }
    });

    return { valid, errors };
  }
}
