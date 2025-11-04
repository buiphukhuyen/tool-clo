/**
 * Main Application - Core logic only
 */

/**
 * Khởi tạo ứng dụng
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateStats();
    loadRecentActivities();
    UIManager.updateStudentCountDisplay(0);
});

/**
 * Khởi tạo navigation
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-section], .dropdown-item[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            navigateTo(sectionId);
        });
    });
}

/**
 * Navigate to section
 */
function navigateTo(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update nav links
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`.nav-link[data-section="${sectionId}"], .dropdown-item[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Reload specific managers based on section
    if (sectionId === 'category') {
        CategoryManager.init();
    } else if (sectionId === 'template') {
        TemplateManager.init();
    } else if (sectionId === 'criteria') {
        CriteriaManager.init();
    } else if (sectionId === 'generator') {
        TemplateManager.loadTemplateOptions();
        setTimeout(() => updateRealtimePreview(), 100);
    } else if (sectionId === 'history') {
        HistoryManager.init();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

/**
 * Update statistics on dashboard
 */
function updateStats() {
    const stats = StorageManager.getStats();
    
    document.getElementById('stat-templates').textContent = stats.templates;
    document.getElementById('stat-categories').textContent = stats.categories || 0;
    document.getElementById('stat-courses').textContent = stats.courses;
    document.getElementById('stat-history').textContent = stats.history;
}

/**
 * Load recent activities
 */
function loadRecentActivities() {
    const history = StorageManager.getHistory();
    const container = document.getElementById('recent-activities');
    
    if (!container) return;
    
    if (history.length === 0) {
        container.innerHTML = '<div class="text-muted text-center py-3">Chưa có hoạt động nào</div>';
        return;
    }
    
    let html = '';
    history.slice(0, 5).forEach(item => {
        const date = new Date(item.timestamp).toLocaleString('vi-VN');
        html += `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <strong>${item.courseName}</strong> - ${item.className}
                    <br><small class="text-muted">${date}</small>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="HistoryManager.viewHistory('${item.id}')">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Confirm paste students
 */
function confirmPasteStudents() {
    const text = document.getElementById('textarea-paste-students').value;
    
    if (!text.trim()) {
        alert('Vui lòng nhập dữ liệu sinh viên!');
        return;
    }
    
    const students = ExcelHandler.parseFromPaste(text);
    
    if (students.length === 0) {
        alert('Không thể parse dữ liệu! Vui lòng kiểm tra format.');
        return;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('pasteStudentsModal'));
    modal.hide();
    
    // Set student data for generation
    ExcelHandler.setStudentData(students);
    
    // Update student count display
    UIManager.updateStudentCountDisplay(students.length);
    
    // Show success message
    UIManager.showToast(`Đã nhập thành công ${students.length} sinh viên!`, 'success');
    
    // Update realtime preview
    updateRealtimePreview();
}

/**
 * Update realtime preview
 */
function updateRealtimePreview() {
    const container = document.getElementById('preview-container');
    if (!container) return;
    
    const templateId = document.getElementById('select-template')?.value;
    const courseName = document.getElementById('input-course')?.value.trim();
    const className = document.getElementById('input-class')?.value.trim();
    const groupName = document.getElementById('input-group')?.value.trim();
    
    // Show different messages based on what's missing
    if (!templateId) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-table fs-2"></i>
                <p class="mt-3 small">Vui lòng chọn <strong>Mẫu chấm</strong> để bắt đầu</p>
            </div>
        `;
        return;
    }
    
    if (!courseName) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-pencil fs-2"></i>
                <p class="mt-3 small">Vui lòng nhập <strong>Tên học phần</strong></p>
            </div>
        `;
        return;
    }
    
    if (!className) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-people fs-2"></i>
                <p class="mt-3 small">Vui lòng nhập <strong>Lớp</strong></p>
            </div>
        `;
        return;
    }
    
    const template = StorageManager.getTemplate(templateId);
    if (!template) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Không tìm thấy mẫu chấm. Vui lòng chọn lại.
            </div>
        `;
        return;
    }
    
    const criteria = StorageManager.getCriteriaByCategory(template.categoryId);
    if (!criteria || criteria.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                Nhóm tiêu chí của mẫu này chưa có tiêu chí nào. Vui lòng thêm tiêu chí trước.
            </div>
        `;
        return;
    }
    
    // Render preview structure (without actual scores)
    renderPreviewStructure(template, criteria, courseName, className, groupName);
}

/**
 * Render preview structure (without actual scores)
 */
function renderPreviewStructure(template, criteria, courseName, className, groupName) {
    const container = document.getElementById('preview-container');
    if (!container) return;
    
    const students = ExcelHandler.getStudentData();
    const hasStudents = students && students.length > 0;
    
    // Create header
    let headerHTML = `
        <div class="mb-3">
            <h6><strong>Môn học:</strong> ${courseName}</h6>
            <div class="small text-muted">
                <strong>Lớp:</strong> ${className} | 
                <strong>Nhóm:</strong> ${groupName || 'N/A'} | 
                <strong>Mẫu:</strong> ${template.name}
            </div>
        </div>
    `;
    
    // Create table with scroll container
    let tableHTML = '<div class="table-responsive" style="max-height: 500px; overflow-y: auto;">';
    tableHTML += '<table class="table table-bordered table-sm table-hover" style="font-size: 0.8rem;">';
    
    // Table header - make it sticky
    tableHTML += '<thead class="table-light" style="position: sticky; top: 0; z-index: 10; background-color: #f8f9fa;"><tr>';
    tableHTML += '<th class="text-center align-middle" style="width: 60px; vertical-align: middle;">STT</th>';
    tableHTML += '<th class="text-center align-middle" style="width: 120px; vertical-align: middle;">Mã SV</th>';
    tableHTML += '<th class="text-center align-middle" style="vertical-align: middle;">Họ và tên</th>';
    
    criteria.forEach(c => {
        const displayName = c.code || c.name || 'CLO';
        tableHTML += `<th class="text-center align-middle" style="width: 80px; vertical-align: middle;">${displayName}<br><small class="text-muted">(${c.percentage}%)</small></th>`;
    });
    
    tableHTML += '<th class="text-center align-middle bg-warning-subtle" style="width: 80px; vertical-align: middle;"><strong>Tổng</strong></th>';
    tableHTML += '</tr></thead>';
    
    // Table body
    tableHTML += '<tbody>';
    
    if (!hasStudents) {
        // Show placeholder row when no students
        const colSpan = 3 + criteria.length + 1;
        tableHTML += `<tr>
            <td colspan="${colSpan}" class="text-center text-muted py-4">
                <i class="bi bi-inbox"></i> Cần nhập dữ liệu sinh viên
            </td>
        </tr>`;
    } else {
        // Show all students (not just 5)
        students.forEach((student, index) => {
            tableHTML += '<tr>';
            tableHTML += `<td class="text-center align-middle">${index + 1}</td>`;
            tableHTML += `<td class="text-center align-middle">${student.mssv || student.studentId || ''}</td>`;
            tableHTML += `<td class="align-middle">${student.name || student.studentName || ''}</td>`;
            
            // Empty cells for criteria scores
            criteria.forEach(() => {
                tableHTML += '<td class="text-center text-muted align-middle">--</td>';
            });
            
            // Editable score input - allow editing V to score
            let displayValue = '';
            // Check if absent or score is 'V' string
            if (student.isAbsent || student.score === 'V' || (typeof student.score === 'string' && student.score.toUpperCase() === 'V')) {
                displayValue = 'V';
            } else if (typeof student.score === 'number' && !isNaN(student.score)) {
                // Format 0 as 00.0 to prevent fraud
                displayValue = student.score === 0 ? '00.0' : student.score.toFixed(1);
            } else {
                displayValue = ''; // Empty for null or undefined
            }
            
            tableHTML += `<td class="text-center bg-warning-subtle align-middle p-1">
                <input type="text" 
                       class="form-control form-control-sm text-center score-input" 
                       style="font-size: 0.8rem; padding: 2px 4px; width: 60px; margin: 0 auto;"
                       data-index="${index}"
                       value="${displayValue}"
                       placeholder="V hoặc 0-10"
                       onchange="updateStudentScore(${index}, this.value)"
                       title="Nhập V (vắng) hoặc điểm 0-10">
            </td>`;
            tableHTML += '</tr>';
        });
    }
    
    tableHTML += '</tbody>';
    tableHTML += '</table></div>';
    
    if (hasStudents && students.length > 10) {
        tableHTML += `<div class="small text-muted text-center mt-2">
            <i class="bi bi-info-circle"></i> Tổng cộng: <strong>${students.length}</strong> sinh viên
        </div>`;
    }
    
    container.innerHTML = headerHTML + tableHTML;
}

/**
 * Generate scores
 */
function generateScores() {
    // Validate form
    const templateId = document.getElementById('select-template').value;
    const courseName = document.getElementById('input-course').value.trim();
    const className = document.getElementById('input-class').value.trim();
    const groupName = document.getElementById('input-group').value.trim();
    const algorithm = document.getElementById('select-algorithm').value;
    
    if (!templateId) {
        alert('Vui lòng chọn template!');
        return;
    }
    
    if (!courseName || !className) {
        alert('Vui lòng nhập đầy đủ thông tin học phần và lớp!');
        return;
    }
    
    const students = ExcelHandler.getStudentData();
    if (!students || students.length === 0) {
        alert('Vui lòng import danh sách sinh viên!');
        return;
    }
    
    // Get template first to get categoryId
    const template = StorageManager.getTemplate(templateId);
    if (!template) {
        alert('Không tìm thấy mẫu chấm!');
        return;
    }
    
    // Get criteria by category from template
    const criteria = StorageManager.getCriteriaByCategory(template.categoryId);
    if (!criteria || criteria.length === 0) {
        alert('Mẫu chấm này chưa có tiêu chí đánh giá! Vui lòng thêm tiêu chí trước.');
        return;
    }
    
    // Validate total percentage for this category
    const totalPercentage = criteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
        if (!confirm(`Tổng tỷ lệ % của các tiêu chí là ${totalPercentage.toFixed(1)}%.\nBạn có muốn tiếp tục?`)) {
            return;
        }
    }
    
    // Calculate scores
    UIManager.showLoading();
    
    setTimeout(() => {
        let results;
        
        // Use optimized algorithm for better accuracy
        if (algorithm === 'even') {
            results = ScoreCalculator.calculateScores(students, criteria, 'even');
        } else {
            // Use optimization for random and weighted
            results = ScoreCalculator.optimizeScores(students, criteria, 200);
        }
        
        // Store config
        const config = {
            templateId,
            template,
            courseName,
            className,
            groupName,
            algorithm,
            criteria,
            students
        };
        
        // Save course info
        StorageManager.saveCourse({
            name: courseName,
            class: className,
            group: groupName
        });
        
        UIManager.hideLoading();
        
        // Open result modal
        ResultManager.openResultModal(results, template, criteria, config);
        
        UIManager.showToast('Đã tạo bảng điểm thành công!', 'success');
    }, 500);
}

/**
 * Update student score from preview input
 */
function updateStudentScore(index, value) {
    const students = ExcelHandler.getStudentData();
    if (!students || !students[index]) return;
    
    const trimmedValue = value.trim().toUpperCase();
    
    // Check if it's "V" (absent)
    if (trimmedValue === 'V') {
        students[index].score = 'V';
        students[index].isAbsent = true;
        ExcelHandler.setStudentData(students);
        return;
    }
    
    // Parse and validate numeric score
    const score = parseFloat(value);
    if (isNaN(score)) {
        if (trimmedValue !== '') {
            alert('Vui lòng nhập "V" (vắng) hoặc điểm từ 0 đến 10!');
        }
        students[index].score = null;
        students[index].isAbsent = false;
    } else if (score < 0 || score > 10) {
        alert('Điểm phải từ 0 đến 10!');
        students[index].score = null;
        students[index].isAbsent = false;
    } else {
        students[index].score = Math.round(score * 10) / 10; // Round to 1 decimal
        students[index].isAbsent = false;
    }
    
    // Update student data
    ExcelHandler.setStudentData(students);
}

/**
 * Clear generator form
 */
function clearGenerator() {
    if (!confirm('Bạn có chắc muốn làm mới form? Dữ liệu chưa lưu sẽ bị mất.')) {
        return;
    }
    
    document.getElementById('score-config-form').reset();
    ExcelHandler.clearStudentData();
    UIManager.updateStudentCountDisplay(0);
    updateRealtimePreview();
}

/**
 * Search preview table by MSSV or Name
 */
function searchPreview(searchValue) {
    const searchTerm = searchValue.toLowerCase().trim();
    const previewTable = document.querySelector('#preview-container table');
    
    if (!previewTable) {
        return;
    }
    
    const rows = previewTable.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Get MSSV (column 2) and Name (column 3)
        const mssvCell = row.cells[1];
        const nameCell = row.cells[2];
        
        if (!mssvCell || !nameCell) {
            return;
        }
        
        const mssv = mssvCell.textContent.toLowerCase();
        const name = nameCell.textContent.toLowerCase();
        
        // Check if search term matches MSSV or Name
        if (searchTerm === '' || mssv.includes(searchTerm) || name.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show message if no results
    const existingMessage = document.getElementById('search-no-results');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    if (searchTerm !== '' && visibleCount === 0) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'search-no-results';
        noResultsMsg.className = 'alert alert-warning mt-2';
        noResultsMsg.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Không tìm thấy sinh viên nào phù hợp.';
        previewTable.parentElement.appendChild(noResultsMsg);
    }
}
