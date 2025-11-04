/**
 * Excel Exporter - Export bảng điểm với ExcelJS (format chuẩn theo mẫu)
 */

const ExcelExporter = {
    /**
     * Export to Excel with full styling using ExcelJS
     */
    async exportScoreTable(scoreData, config) {
        const { results, template, criteria, courseName, className, groupName } = config;
        
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bảng điểm');
        
        // Calculate total columns needed
        const numCriteria = criteria.length;
        const totalColumns = 3 + numCriteria + 1; // STT + MSSV + Name + Criteria + Total
        const lastColLetter = this.getColumnLetter(totalColumns);
        
        // Row 1: School name (left aligned)
        worksheet.mergeCells(`A1:${lastColLetter}1`);
        const row1 = worksheet.getRow(1);
        row1.getCell(1).value = template.schoolName || 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM';
        row1.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row1.height = 16;
        
        // Row 2: Faculty name (left aligned)
        worksheet.mergeCells(`A2:${lastColLetter}2`);
        const row2 = worksheet.getRow(2);
        row2.getCell(1).value = template.departmentName || 'KHOA CÔNG NGHỆ THÔNG TIN';
        row2.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row2.height = 16;
        
        // Row 3: Empty
        worksheet.getRow(3).height = 8;
        
        // Row 4: Title
        worksheet.mergeCells(`A4:${lastColLetter}4`);
        const row4 = worksheet.getRow(4);
        row4.getCell(1).value = 'BẢNG ĐIỂM CHẤM ĐỒ ÁN';
        row4.getCell(1).font = { name: 'Times New Roman', size: 13, bold: true };
        row4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row4.height = 18;
        
        // Row 5: Course info - BOLD and CENTERED
        worksheet.mergeCells(`A5:${lastColLetter}5`);
        const row5 = worksheet.getRow(5);
        row5.getCell(1).value = `Học phần: ${courseName}   Lớp: ${className}   Nhóm: ${groupName || '33'}`;
        row5.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row5.height = 16;
        
        // Row 6: Empty
        worksheet.getRow(6).height = 6;
        
        // Calculate column positions
        const lastCriteriaCol = 3 + numCriteria; // D + numCriteria
        const totalCol = lastCriteriaCol + 1;
        
        // Row 7: "Các tiêu chí đánh giá" merged header
        const criteriaStartCol = 'D';
        const criteriaEndCol = this.getColumnLetter(lastCriteriaCol);
        worksheet.mergeCells(`${criteriaStartCol}7:${criteriaEndCol}7`);
        
        const row7 = worksheet.getRow(7);
        row7.height = 25;
        
        // Set STT, MSSV, Họ và tên, Tổng
        row7.getCell(1).value = 'STT';
        row7.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row7.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row7.getCell(1).border = this.getBorder();
        
        row7.getCell(2).value = 'MÃ SV';
        row7.getCell(2).font = { name: 'Times New Roman', size: 11, bold: true };
        row7.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        row7.getCell(2).border = this.getBorder();
        
        row7.getCell(3).value = 'Họ và tên';
        row7.getCell(3).font = { name: 'Times New Roman', size: 11, bold: true };
        row7.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row7.getCell(3).border = this.getBorder();
        
        row7.getCell(4).value = 'Các tiêu chí đánh giá';
        row7.getCell(4).font = { name: 'Times New Roman', size: 12, bold: true };
        row7.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row7.getCell(4).border = this.getBorder();
        
        row7.getCell(totalCol).value = 'Tổng';
        row7.getCell(totalCol).font = { name: 'Times New Roman', size: 11, bold: true };
        row7.getCell(totalCol).alignment = { horizontal: 'center', vertical: 'middle' };
        row7.getCell(totalCol).border = this.getBorder();
        
        // Row 8: Criteria details (name, percentage, CLO code in red)
        const row8 = worksheet.getRow(8);
        row8.height = 55; // Compact but readable
        
        // Empty cells for STT, MSSV, Name
        row8.getCell(1).border = this.getBorder();
        row8.getCell(2).border = this.getBorder();
        row8.getCell(3).border = this.getBorder();
        
        // Add criteria headers
        criteria.forEach((criterion, index) => {
            const colNum = 4 + index;
            const cell = row8.getCell(colNum);
            
            // Build text: Name\n(percentage%)\nCLO_CODE
            const name = criterion.name || criterion.code || 'CLO';
            const percentage = criterion.percentage || 0;
            const cloCode = criterion.clo || criterion.code || `CLO${index + 1}`;
            
            cell.value = {
                richText: [
                    { text: `${name}\n`, font: { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF000000' } } },
                    { text: `(${percentage}%)\n`, font: { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF000000' } } },
                    { text: cloCode, font: { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFF0000' } } }
                ]
            };
            
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = this.getBorder();
        });
        
        // Tổng column in row 8
        row8.getCell(totalCol).border = this.getBorder();
        
        // Merge STT, MSSV, Họ và tên, Tổng from row 7 to row 8
        worksheet.mergeCells(`A7:A8`);
        worksheet.mergeCells(`B7:B8`);
        worksheet.mergeCells(`C7:C8`);
        worksheet.mergeCells(`${this.getColumnLetter(totalCol)}7:${this.getColumnLetter(totalCol)}8`);
        
        // Data rows (starting from row 9)
        results.forEach((result, index) => {
            const rowNum = 9 + index;
            const dataRow = worksheet.getRow(rowNum);
            dataRow.height = 18; // Compact fit
            
            // STT
            dataRow.getCell(1).value = index + 1;
            dataRow.getCell(1).font = { name: 'Times New Roman', size: 11 };
            dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(1).border = this.getBorder();
            
            // MSSV
            dataRow.getCell(2).value = result.mssv;
            dataRow.getCell(2).font = { name: 'Times New Roman', size: 11 };
            dataRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            dataRow.getCell(2).border = this.getBorder();
            
            // Name
            dataRow.getCell(3).value = result.name;
            dataRow.getCell(3).font = { name: 'Times New Roman', size: 11 };
            dataRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
            dataRow.getCell(3).border = this.getBorder();
            
            // Criteria scores - show actual scores
            criteria.forEach((criterion, idx) => {
                const colNum = 4 + idx;
                const cell = dataRow.getCell(colNum);
                
                const score = result.criteriaScores[criterion.id];
                if (result.isAbsent || score === 'V') {
                    cell.value = 'V';
                    cell.font = { name: 'Times New Roman', size: 11 };
                } else if (typeof score === 'number') {
                    cell.value = parseFloat(score.toFixed(1));
                    cell.font = { name: 'Times New Roman', size: 11 };
                    cell.numFmt = '0.0';
                } else {
                    cell.value = '';
                    cell.font = { name: 'Times New Roman', size: 11 };
                }
                
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = this.getBorder();
            });
            
            // Total score - red and bold
            const totalCell = dataRow.getCell(totalCol);
            if (result.isAbsent) {
                totalCell.value = 'V';
                totalCell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FFFF0000' }, bold: true };
            } else {
                totalCell.value = parseFloat(result.originalScore.toFixed(1));
                totalCell.font = { name: 'Times New Roman', size: 11, color: { argb: 'FFFF0000' }, bold: true };
                totalCell.numFmt = '0.0';
            }
            totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
            totalCell.border = this.getBorder();
        });
        
        // Add signature section at the end
        const lastDataRow = 9 + results.length;
        const signatureStartRow = lastDataRow + 2;
        
        // Empty row
        worksheet.getRow(lastDataRow + 1).height = 10;
        
        // Signature row with date and signatures
        const signatureRow = worksheet.getRow(signatureStartRow);
        signatureRow.height = 16;
        
        // Left side: empty or could be used
        // Middle-right: Date and signatures
        const dateColStart = Math.floor(totalColumns / 2) + 1;
        
        // Merge cells for date
        worksheet.mergeCells(`${this.getColumnLetter(dateColStart)}${signatureStartRow}:${lastColLetter}${signatureStartRow}`);
        const dateCell = signatureRow.getCell(dateColStart);
        dateCell.value = `Tp.Hồ Chí Minh, ngày ..... tháng ..... năm 2025`;
        dateCell.font = { name: 'Times New Roman', size: 11, italic: true };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Signature labels row
        const sigLabelRow = worksheet.getRow(signatureStartRow + 1);
        sigLabelRow.height = 16;
        
        // Giảng viên chấm 2 (left side)
        const gv2Col = 2;
        worksheet.mergeCells(`${this.getColumnLetter(gv2Col)}${signatureStartRow + 1}:${this.getColumnLetter(gv2Col + 1)}${signatureStartRow + 1}`);
        const gv2Cell = sigLabelRow.getCell(gv2Col);
        gv2Cell.value = 'Giảng viên chấm 2';
        gv2Cell.font = { name: 'Times New Roman', size: 11 };
        gv2Cell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Giảng viên chấm 1 (right side)
        const gv1Col = dateColStart;
        worksheet.mergeCells(`${this.getColumnLetter(gv1Col)}${signatureStartRow + 1}:${lastColLetter}${signatureStartRow + 1}`);
        const gv1Cell = sigLabelRow.getCell(gv1Col);
        gv1Cell.value = 'Giảng viên chấm 1';
        gv1Cell.font = { name: 'Times New Roman', size: 11 };
        gv1Cell.alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add empty rows for signatures (3-4 rows)
        for (let i = 0; i < 4; i++) {
            worksheet.getRow(signatureStartRow + 2 + i).height = 16;
        }
        
        // Calculate optimal widths based on content
        let maxMSSVLength = 'MÃ SV'.length;
        let maxNameLength = 'Họ và tên'.length;
        
        results.forEach(result => {
            if (result.mssv && result.mssv.length > maxMSSVLength) {
                maxMSSVLength = result.mssv.length;
            }
            if (result.name && result.name.length > maxNameLength) {
                maxNameLength = result.name.length;
            }
        });
        
        // Set column widths - auto-fit with padding
        worksheet.getColumn(1).width = 5.5;   // STT - just enough for "STT" and numbers
        worksheet.getColumn(2).width = Math.max(10, maxMSSVLength + 2);    // MSSV - auto-fit with padding
        worksheet.getColumn(3).width = Math.max(15, Math.min(maxNameLength + 3, 30));    // Họ tên - auto-fit with max 30
        
        // Criteria columns - fit for wrapped text
        for (let i = 0; i < numCriteria; i++) {
            worksheet.getColumn(4 + i).width = 13; // Compact fit for criteria
        }
        
        // Total column
        worksheet.getColumn(totalCol).width = 7.5;
        
        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `BangDiem_${className}_${timestamp}.xlsx`;
        
        // Write file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return filename;
    },
    
    /**
     * Get column letter from number (1=A, 2=B, etc.)
     */
    getColumnLetter(colNum) {
        let letter = '';
        while (colNum > 0) {
            const modulo = (colNum - 1) % 26;
            letter = String.fromCharCode(65 + modulo) + letter;
            colNum = Math.floor((colNum - modulo) / 26);
        }
        return letter;
    },
    
    /**
     * Remove Vietnamese accents for PDF compatibility
     */
    removeVietnameseAccents(str) {
        if (!str) return '';
        
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
        str = str.replace(/đ/g, 'd');
        
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
        str = str.replace(/Đ/g, 'D');
        
        return str;
    },
    
    /**
     * Get border style
     */
    getBorder() {
        return {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        };
    },
    
    /**
     * Export to CSV for Google Sheets
     */
    exportToCSV(scoreData, config) {
        const { results, template, criteria, courseName, className, groupName } = config;
        
        let csv = '';
        
        // Header rows
        csv += `${template.schoolName || 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM'}\n`;
        csv += `${template.departmentName || 'KHOA CÔNG NGHỆ THÔNG TIN'}\n`;
        csv += '\n';
        csv += 'BẢNG ĐIỂM CHẤM ĐỒ ÁN\n';
        csv += `Học phần: ${courseName}    Lớp: ${className}    Nhóm: ${groupName || 'N/A'}\n`;
        csv += '\n\n';
        
        // Column headers
        csv += 'STT,MÃ SV,Họ và tên';
        criteria.forEach(criterion => {
            csv += `,${criterion.name || criterion.code}`;
        });
        csv += ',Tổng\n';
        
        // Data rows
        results.forEach((result, index) => {
            csv += `${index + 1},${result.mssv},${result.name}`;
            
            // Criteria scores
            criteria.forEach(criterion => {
                const score = result.criteriaScores[criterion.id];
                if (result.isAbsent || score === 'V') {
                    csv += ',V';
                } else if (typeof score === 'number') {
                    csv += `,${score.toFixed(1)}`;
                } else {
                    csv += ',';
                }
            });
            
            // Total
            if (result.isAbsent) {
                csv += ',V';
            } else {
                csv += `,${result.originalScore.toFixed(1)}`;
            }
            csv += '\n';
        });
        
        // Add signature section
        csv += '\n';
        csv += ',,,,,,Tp.Hồ Chí Minh ngày ..... tháng ..... năm 2025\n';
        csv += 'Giảng viên chấm 2,,,,,,Giảng viên chấm 1\n';
        
        // Create blob and download
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `BangDiem_${className}_${timestamp}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return filename;
    },
    
    /**
     * Export to Google Sheets directly
     */
    async exportToGoogleSheets(scoreData, config) {
        const { results, template, criteria, courseName, className, groupName } = config;
        
        // First, create Excel file in memory
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bảng điểm');
        
        // Use same logic as exportScoreTable to create worksheet
        // (Copy the worksheet creation code from exportScoreTable)
        const numCriteria = criteria.length;
        const totalColumns = 3 + numCriteria + 1;
        const lastColLetter = this.getColumnLetter(totalColumns);
        
        // Row 1: School name
        worksheet.mergeCells(`A1:${lastColLetter}1`);
        const row1 = worksheet.getRow(1);
        row1.getCell(1).value = template.schoolName || 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM';
        row1.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row1.height = 16;
        
        // Row 2: Faculty name
        worksheet.mergeCells(`A2:${lastColLetter}2`);
        const row2 = worksheet.getRow(2);
        row2.getCell(1).value = template.departmentName || 'KHOA CÔNG NGHỆ THÔNG TIN';
        row2.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
        row2.height = 16;
        
        // Add remaining rows (simplified version)
        worksheet.getRow(3).height = 8;
        
        worksheet.mergeCells(`A4:${lastColLetter}4`);
        const row4 = worksheet.getRow(4);
        row4.getCell(1).value = 'BẢNG ĐIỂM CHẤM ĐỒ ÁN';
        row4.getCell(1).font = { name: 'Times New Roman', size: 13, bold: true };
        row4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        
        worksheet.mergeCells(`A5:${lastColLetter}5`);
        const row5 = worksheet.getRow(5);
        row5.getCell(1).value = `Học phần: ${courseName}   Lớp: ${className}   Nhóm: ${groupName || '33'}`;
        row5.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
        row5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        
        // Add headers and data (simplified)
        const headerRow = worksheet.getRow(7);
        headerRow.getCell(1).value = 'STT';
        headerRow.getCell(2).value = 'MÃ SV';
        headerRow.getCell(3).value = 'Họ và tên';
        criteria.forEach((c, i) => {
            headerRow.getCell(4 + i).value = c.name || c.code;
        });
        headerRow.getCell(totalColumns).value = 'Tổng';
        
        // Add data rows
        results.forEach((result, index) => {
            const row = worksheet.getRow(8 + index);
            row.getCell(1).value = index + 1;
            row.getCell(2).value = result.mssv;
            row.getCell(3).value = result.name;
            
            criteria.forEach((criterion, idx) => {
                const score = result.criteriaScores[criterion.id];
                row.getCell(4 + idx).value = result.isAbsent || score === 'V' ? 'V' : 
                    (typeof score === 'number' ? parseFloat(score.toFixed(1)) : '');
            });
            
            row.getCell(totalColumns).value = result.isAbsent ? 'V' : parseFloat(result.originalScore.toFixed(1));
        });
        
        // Convert to base64
        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
        
        // Create Google Sheets URL with import
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `BangDiem_${className}_${timestamp}`;
        
        // Open instruction modal
        const instructionHTML = `
            <div class="modal fade" id="googleSheetsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-google"></i> Xuất lên Google Sheets</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i> 
                                <strong>Hướng dẫn:</strong> File Excel sẽ được tải xuống. Sau đó làm theo các bước sau:
                            </div>
                            <ol class="mb-3">
                                <li class="mb-2">Truy cập <a href="https://sheets.google.com" target="_blank">Google Sheets</a></li>
                                <li class="mb-2">Nhấn <strong>File → Import → Upload</strong></li>
                                <li class="mb-2">Chọn file <code>${filename}.xlsx</code> vừa tải xuống</li>
                                <li class="mb-2">Chọn <strong>"Replace spreadsheet"</strong> hoặc <strong>"Insert new sheet(s)"</strong></li>
                                <li class="mb-2">Nhấn <strong>Import data</strong></li>
                            </ol>
                            <div class="alert alert-success">
                                <i class="bi bi-check-circle"></i> File Excel đã được tạo với đầy đủ format và styling!
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" onclick="window.open('https://sheets.google.com', '_blank')">
                                <i class="bi bi-google"></i> Mở Google Sheets
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove old modal if exists
        const oldModal = document.getElementById('googleSheetsModal');
        if (oldModal) oldModal.remove();
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', instructionHTML);
        
        // Download Excel file first
        await this.exportScoreTable(scoreData, config);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('googleSheetsModal'));
        modal.show();
        
        return filename;
    },
    
    /**
     * Export to PDF with A4 format (Portrait) - Vietnamese support using html2pdf
     */
    async exportToPDF(scoreData, config) {
        const { results, template, criteria, courseName, className, groupName } = config;
        
        // Generate HTML content for PDF
        const htmlContent = this.generatePDFHTML(results, template, criteria, courseName, className, groupName);
        
        // Title section
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // School name
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(template.schoolName || 'TRUONG DAI HOC CONG NGHE TP.HCM', 14, 15);
        
        // Faculty name
        doc.text(template.departmentName || 'KHOA CONG NGHE THONG TIN', 14, 21);
        
        // Title
        doc.setFontSize(13);
        doc.text('BANG DIEM CHAM DO AN', pageWidth / 2, 32, { align: 'center' });
        
        // Course info
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const courseInfo = `Hoc phan: ${this.removeVietnameseAccents(courseName)}   Lop: ${className}   Nhom: ${groupName || '33'}`;
        doc.text(courseInfo, pageWidth / 2, 40, { align: 'center' });
        
        // Prepare table data - remove Vietnamese accents for PDF
        const headers = [['STT', 'MA SV', 'Ho va ten']];
        
        // Add criteria headers
        criteria.forEach(c => {
            const name = c.name || c.code || 'CLO';
            const cleanName = this.removeVietnameseAccents(name);
            headers[0].push(`${cleanName}\n(${c.percentage}%)`);
        });
        headers[0].push('Tong');
        
        // Prepare body data - remove Vietnamese accents for PDF
        const body = [];
        results.forEach((result, index) => {
            const row = [
                index + 1,
                result.mssv,
                this.removeVietnameseAccents(result.name) // Remove accents for PDF compatibility
            ];
            
            // Add criteria scores
            criteria.forEach(criterion => {
                const score = result.criteriaScores[criterion.id];
                if (result.isAbsent || score === 'V') {
                    row.push('V');
                } else if (typeof score === 'number') {
                    row.push(score.toFixed(1));
                } else {
                    row.push('');
                }
            });
            
            // Add total
            if (result.isAbsent) {
                row.push('V');
            } else {
                row.push(result.originalScore.toFixed(1));
            }
            
            body.push(row);
        });
        
        // Calculate optimal column widths for portrait
        const availableWidth = pageWidth - 28; // Total width minus margins
        const sttWidth = 10;
        const mssvWidth = 22;
        const nameWidth = 35;
        const totalWidth = 12;
        const criteriaWidth = (availableWidth - sttWidth - mssvWidth - nameWidth - totalWidth) / criteria.length;
        
        // Generate table
        doc.autoTable({
            startY: 45,
            head: headers,
            body: body,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 8, // Smaller font for portrait
                cellPadding: 1.5,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'center',
                valign: 'middle',
                fontStyle: 'normal'
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                font: 'helvetica',
                fontStyle: 'bold',
                fontSize: 8,
                halign: 'center',
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: sttWidth, halign: 'center' }, // STT
                1: { cellWidth: mssvWidth, halign: 'center' }, // MSSV
                2: { cellWidth: nameWidth, halign: 'left' },   // Name
                // Criteria columns
                [3 + criteria.length]: { cellWidth: totalWidth, halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } // Total
            },
            didParseCell: function(data) {
                // Bold and red for total column
                if (data.column.index === 3 + criteria.length) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [255, 0, 0];
                }
                
                // Red V for absent
                if (data.cell.text[0] === 'V') {
                    data.cell.styles.textColor = [255, 0, 0];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: 14, right: 14 },
            tableWidth: 'auto'
        });
        
        // Add signature section - remove Vietnamese accents
        const finalY = doc.lastAutoTable.finalY + 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Tp.Ho Chi Minh, ngay ..... thang ..... nam 2025', pageWidth - 14, finalY, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.text('Giang vien cham 2', 40, finalY + 7, { align: 'center' });
        doc.text('Giang vien cham 1', pageWidth - 40, finalY + 7, { align: 'center' });
        
        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `BangDiem_${className}_${timestamp}.pdf`;
        
        // Save PDF
        doc.save(filename);
        
        return filename;
    }
};

// Export for global use
window.ExcelExporter = ExcelExporter;
