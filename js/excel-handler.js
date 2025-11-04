/**
 * Excel Handler - Xử lý Import/Export Excel
 * Sử dụng SheetJS để xử lý file Excel
 */

const ExcelHandler = {
    currentStudentData: [],

    /**
     * Import sinh viên từ file Excel
     */
    importFromExcel(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Đọc sheet đầu tiên
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert sang JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Parse dữ liệu
                const students = this.parseStudentData(jsonData);
                
                callback(students);
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert('Có lỗi khi đọc file Excel! Vui lòng kiểm tra lại format file.');
            }
        };
        
        reader.readAsArrayBuffer(file);
    },

    /**
     * Parse dữ liệu sinh viên từ Excel
     */
    parseStudentData(data) {
        const students = [];
        
        // Bỏ qua dòng header (dòng đầu tiên)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            if (!row || row.length === 0) continue;
            
            // Format: [MSSV, Họ tên, Điểm/Trạng thái]
            const mssv = String(row[0] || '').trim();
            const name = String(row[1] || '').trim();
            
            // Check for absent status (V, v, or variations)
            let score = null;
            let isAbsent = false;
            
            if (row[2]) {
                const scoreStr = String(row[2]).trim().toUpperCase();
                if (scoreStr === 'V' || scoreStr === 'VẮNG') {
                    isAbsent = true;
                } else {
                    // Normalize decimal separator (comma to period)
                    const normalizedScore = scoreStr.replace(',', '.');
                    score = parseFloat(normalizedScore);
                }
            }
            
            if (mssv && name) {
                students.push({
                    id: this.generateId(),
                    mssv: mssv,
                    name: name,
                    score: score || 0,
                    isAbsent: isAbsent
                });
            }
        }
        
        return students;
    },

    /**
     * Parse dữ liệu từ paste (tab-separated hoặc comma-separated)
     */
    parseFromPaste(text) {
        const students = [];
        const lines = text.trim().split('\n');
        
        lines.forEach(line => {
            if (!line.trim()) return;
            
            // Thử tab-separated trước, sau đó comma-separated
            let parts = line.split('\t').map(p => p.trim()).filter(p => p);
            if (parts.length < 2) {
                parts = line.split(',').map(p => p.trim()).filter(p => p);
            }
            
            if (parts.length >= 2) {
                const mssv = String(parts[0] || '').trim();
                const name = String(parts[1] || '').trim();
                
                // Check for absent status (V, v, or variations)
                // Score is typically the last non-empty column
                let score = 0;
                let isAbsent = false;
                
                // Find the last non-empty part (should be the score)
                if (parts.length > 2) {
                    const lastPart = parts[parts.length - 1];
                    const scoreStr = String(lastPart).trim().toUpperCase();
                    
                    if (scoreStr === 'V' || scoreStr === 'VẮNG') {
                        isAbsent = true;
                    } else {
                        // Normalize decimal separator (comma to period)
                        const normalizedScore = scoreStr.replace(',', '.');
                        const parsedScore = parseFloat(normalizedScore);
                        if (!isNaN(parsedScore)) {
                            score = parsedScore;
                        }
                    }
                }
                
                if (mssv && name) {
                    students.push({
                        id: this.generateId(),
                        mssv: mssv,
                        name: name,
                        score: score,
                        isAbsent: isAbsent
                    });
                }
            }
        });
        
        return students;
    },

    /**
     * Export ra file Excel
     */
    exportToExcel(data, filename = 'bang_diem_clo.xlsx') {
        try {
            // Tạo workbook
            const wb = XLSX.utils.book_new();
            
            // Tạo worksheet từ dữ liệu
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // Thêm styling cho header (optional, cần xlsx-style)
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Set column widths
            const colWidths = data[0].map((_, i) => {
                let maxLength = 10;
                for (let row of data) {
                    if (row[i]) {
                        const cellLength = String(row[i]).length;
                        maxLength = Math.max(maxLength, cellLength);
                    }
                }
                return { wch: Math.min(maxLength + 2, 50) };
            });
            ws['!cols'] = colWidths;
            
            // Thêm worksheet vào workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
            
            // Xuất file
            XLSX.writeFile(wb, filename);
            
            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Có lỗi khi xuất file Excel!');
            return false;
        }
    },

    /**
     * Tạo Google Sheet (sử dụng Google Sheets API)
     */
    async createGoogleSheet(data, sheetName = 'Bảng điểm CLO') {
        // Tạo CSV string
        const csvContent = data.map(row => 
            row.map(cell => {
                // Escape quotes và wrap trong quotes nếu có comma
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');
        
        // Tạo blob CSV
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Download CSV file (user có thể upload lên Google Sheets)
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${sheetName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show instruction
        alert('File CSV đã được tải xuống!\n\nĐể tạo Google Sheet:\n1. Mở Google Drive\n2. Nhấp chuột phải > New > Google Sheets\n3. File > Import > Upload > Chọn file CSV vừa tải\n4. Chọn "Replace spreadsheet"');
        
        return true;
    },

    /**
     * Export ra JSON
     */
    exportToJSON(data, filename = 'clo_data.json') {
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            alert('Có lỗi khi xuất file JSON!');
            return false;
        }
    },

    /**
     * Import từ JSON
     */
    importFromJSON(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                callback(data);
            } catch (error) {
                console.error('Error reading JSON file:', error);
                alert('File JSON không hợp lệ!');
            }
        };
        
        reader.readAsText(file);
    },

    /**
     * Preview dữ liệu import
     */
    previewImportData(students) {
        if (!students || students.length === 0) {
            return '<p class="text-muted">Không có dữ liệu</p>';
        }
        
        let html = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Tìm thấy <strong>${students.length}</strong> sinh viên
            </div>
            <div class="table-responsive" style="max-height: 300px;">
                <table class="table table-sm table-bordered">
                    <thead>
                        <tr>
                            <th width="10%">#</th>
                            <th width="30%">MSSV</th>
                            <th width="45%">Họ tên</th>
                            <th width="15%">Điểm</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        students.slice(0, 10).forEach((student, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.mssv}</td>
                    <td>${student.name}</td>
                    <td>${student.score || '-'}</td>
                </tr>
            `;
        });
        
        if (students.length > 10) {
            html += `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        <em>...và ${students.length - 10} sinh viên khác</em>
                    </td>
                </tr>
            `;
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    },

    /**
     * Generate ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Set current student data
     */
    setStudentData(students) {
        this.currentStudentData = students;
    },

    /**
     * Get current student data
     */
    getStudentData() {
        return this.currentStudentData;
    },

    /**
     * Clear student data
     */
    clearStudentData() {
        this.currentStudentData = [];
    }
};

// Export cho sử dụng global
window.ExcelHandler = ExcelHandler;
