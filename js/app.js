/**
 * Main Application - Kết nối tất cả modules
 * Xử lý navigation, score generation, và các chức năng chính
 */

// Current state
let currentScoreData = null;
let currentConfig = null;

/**
 * Khởi tạo ứng dụng
 */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateStats();
    loadRecentActivities();
    updateStudentCountDisplay(0);
    
    // Setup file import handlers
    setupFileHandlers();
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
        const date = new Date(item.createdAt).toLocaleString('vi-VN');
        html += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${item.courseName} - ${item.className}</h6>
                    <small>${date}</small>
                </div>
                <p class="mb-1"><small>${item.studentCount} sinh viên - Thuật toán: ${getAlgorithmName(item.algorithm)}</small></p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Setup file import handlers
 */
function setupFileHandlers() {
    // Import students from Excel
    const fileInput = document.getElementById('file-import-students');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                ExcelHandler.importFromExcel(file, (students) => {
                    // Show preview
                    const previewContainer = document.getElementById('import-preview');
                    if (previewContainer) {
                        previewContainer.innerHTML = ExcelHandler.previewImportData(students);
                    }
                    
                    // Store temporarily
                    ExcelHandler.setStudentData(students);
                });
            }
        });
    }
}

/**
 * Confirm import students from Excel
 */
function confirmImportStudents() {
    const students = ExcelHandler.getStudentData();
    
    if (!students || students.length === 0) {
        alert('Không có dữ liệu sinh viên để import!');
        return;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('importStudentsModal'));
    modal.hide();
    
    // Set student data for generation
    ExcelHandler.setStudentData(students);
    
    // Show success message
    showToast(`Đã import thành công ${students.length} sinh viên!`, 'success');
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
    updateStudentCountDisplay(students.length);
    
    // Show success message
    showToast(`Đã nhập thành công ${students.length} sinh viên!`, 'success');
    
    // Update realtime preview
    updateRealtimePreview();
}

/**
 * Update student count display
 */
function updateStudentCountDisplay(count) {
    const display = document.getElementById('student-count-display');
    if (display) {
        if (count > 0) {
            display.innerHTML = `<i class="bi bi-check-circle text-success"></i> <strong>${count}</strong> sinh viên`;
            display.className = 'mt-1 p-2 bg-success bg-opacity-10 border border-success rounded small text-center';
        } else {
            display.innerHTML = `<i class="bi bi-info-circle text-muted"></i> Chưa có dữ liệu`;
            display.className = 'mt-1 p-2 bg-light rounded small text-center text-muted';
        }
    }
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
    tableHTML += '<th class="text-center" style="width: 60px;">STT</th>';
    tableHTML += '<th style="width: 120px;">Mã SV</th>';
    tableHTML += '<th>Họ và tên</th>';
    
    criteria.forEach(c => {
        const displayName = c.code || c.name || 'CLO';
        tableHTML += `<th class="text-center" style="width: 80px;">${displayName}<br><small class="text-muted">(${c.percentage}%)</small></th>`;
    });
    
    tableHTML += '<th class="text-center bg-warning-subtle" style="width: 80px;"><strong>Tổng</strong></th>';
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
            tableHTML += `<td class="text-center">${index + 1}</td>`;
            tableHTML += `<td>${student.mssv || student.studentId || ''}</td>`;
            tableHTML += `<td>${student.name || student.studentName || ''}</td>`;
            
            // Empty cells for criteria scores
            criteria.forEach(() => {
                tableHTML += '<td class="text-center text-muted">--</td>';
            });
            
            // Show score or V if absent
            let scoreDisplay = '--';
            if (student.isAbsent) {
                scoreDisplay = 'V';
            } else if (typeof student.score === 'number') {
                scoreDisplay = student.score.toFixed(1);
            }
            tableHTML += `<td class="text-center bg-warning-subtle">${scoreDisplay}</td>`;
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
    showLoading();
    
    setTimeout(() => {
        let results;
        
        // Use optimized algorithm for better accuracy
        if (algorithm === 'even') {
            results = ScoreCalculator.calculateScores(students, criteria, 'even');
        } else {
            // Use optimization for random and weighted
            results = ScoreCalculator.optimizeScores(students, criteria, 200);
        }
        
        // Store current data
        currentScoreData = results;
        currentConfig = {
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
        
        hideLoading();
        
        // Open result modal
        openResultModal(results, template, criteria);
        
        showToast('Đã tạo bảng điểm thành công!', 'success');
    }, 500);
}

/**
 * Open result modal with generated scores
 */
function openResultModal(results, template, criteria) {
    // Create modal if not exists
    let modal = document.getElementById('resultModal');
    if (!modal) {
        modal = createResultModal();
    }
    
    // Render content
    const container = document.getElementById('result-modal-body');
    if (container) {
        container.innerHTML = renderResultTable(results, template, criteria);
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

/**
 * Create result modal
 */
function createResultModal() {
    const modalHTML = `
        <div class="modal fade" id="resultModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="bi bi-table"></i> Bảng điểm CLO</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4" id="result-modal-body" style="overflow-y: auto;">
                        <!-- Content will be rendered here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" onclick="exportResultToExcel()">
                            <i class="bi bi-file-earmark-excel"></i> Xuất Excel
                        </button>
                        <button type="button" class="btn btn-info" onclick="exportResultToGoogleSheets()">
                            <i class="bi bi-google"></i> Google Sheet
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveResultToHistory()">
                            <i class="bi bi-save"></i> Lưu lịch sử
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('resultModal');
}

/**
 * Render result table (modern design with statistics)
 */
function renderResultTable(results, template, criteria) {
    const config = currentConfig;
    
    // Statistics
    const stats = ScoreCalculator.calculateStatistics(results);
    
    let html = `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body">
                            <h4 class="mb-3">${template.name}</h4>
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Học phần:</strong> ${config.courseName}
                                </div>
                                <div class="col-md-3">
                                    <strong>Lớp:</strong> ${config.className}
                                </div>
                                <div class="col-md-3">
                                    <strong>Nhóm:</strong> ${config.groupName || 'N/A'}
                                </div>
                                <div class="col-md-3">
                                    <strong>Thuật toán:</strong> ${getAlgorithmName(config.algorithm)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm bg-primary bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted small mb-1">Tổng sinh viên</h6>
                            <h3 class="mb-0">${stats.totalStudents}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm bg-warning bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted small mb-1">Sinh viên vắng</h6>
                            <h3 class="mb-0">${stats.absentStudents || 0}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm bg-success bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted small mb-1">Điểm trung bình</h6>
                            <h3 class="mb-0">${stats.averageScore}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm bg-info bg-opacity-10">
                        <div class="card-body text-center">
                            <h6 class="text-muted small mb-1">Khớp chính xác</h6>
                            <h3 class="mb-0">${stats.perfectMatches}/${stats.totalStudents - (stats.absentStudents || 0)}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Score Table -->
            <div class="row">
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-0">
                            <div class="table-responsive" style="max-height: 60vh; overflow-y: auto;">
    `;
    
    html += renderScoreTable(results, template, criteria);
    
    html += `
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Render score table only
 */
function renderScoreTable(results, template, criteria) {
    let html = '<table class="table table-hover table-sm mb-0" style="font-size: 0.875rem;">';
    
    // Table header - sticky
    html += '<thead class="table-light" style="position: sticky; top: 0; z-index: 10;">';
    
    // Header row
    html += '<tr>';
    html += '<th class="text-center" style="width: 50px;">STT</th>';
    html += '<th style="width: 120px;">Mã SV</th>';
    html += '<th>Họ và tên</th>';
    
    criteria.forEach(criterion => {
        html += `<th class="text-center" style="width: 100px;">
            ${criterion.code || criterion.name}<br>
            <small class="text-muted">(${criterion.percentage}%)</small>
        </th>`;
    });
    
    html += '<th class="text-center bg-warning bg-opacity-10" style="width: 80px;"><strong>Tổng</strong></th>';
    html += '</tr></thead>';
    
    // Table body
    html += '<tbody>';
    results.forEach((result, index) => {
        html += '<tr>';
        html += `<td class="text-center">${index + 1}</td>`;
        html += `<td>${result.mssv}</td>`;
        html += `<td>${result.name}</td>`;
        
        // Criteria scores
        criteria.forEach(criterion => {
            const score = result.criteriaScores[criterion.id];
            html += `<td class="text-center">${ScoreCalculator.formatScore(score)}</td>`;
        });
        
        // Total score
        const totalDisplay = result.isAbsent ? '<span class="badge bg-secondary">V</span>' : 
                           `<strong>${ScoreCalculator.formatScore(result.originalScore)}</strong>`;
        html += `<td class="text-center bg-warning bg-opacity-10">${totalDisplay}</td>`;
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    
    return html;
}

/**
 * Get algorithm display name
 */
function getAlgorithmName(algorithm) {
    const names = {
        'even': 'Phân bổ đều',
        'random': 'Ngẫu nhiên',
        'weighted': 'Theo trọng số'
    };
    return names[algorithm] || algorithm;
}

/**
 * Export result to Excel (from modal)
 */
function exportResultToExcel() {
    exportToExcel();
}

/**
 * Export result to Google Sheets (from modal)
 */
function exportResultToGoogleSheets() {
    exportToGoogleSheets();
}

/**
 * Save result to history (from modal)
 */
function saveResultToHistory() {
    saveToHistory();
}

/**
 * Render preview table (old function - keep for compatibility)
 */
function renderPreview(results, template, criteria) {
    const showCalc = document.getElementById('check-show-calc')?.checked || false;
    const showDiff = document.getElementById('check-show-diff')?.checked || false;
    
    const container = document.getElementById('preview-container');
    
    // Build table data
    let html = '<div class="preview-table-wrapper"><table class="table table-bordered preview-table">';
    
    // Header rows
    html += '<thead class="table-light">';
    
    // Title rows
    if (template.title1) {
        const colspan = 3 + criteria.length + (showCalc ? 1 : 0) + (showDiff ? 1 : 0);
        html += `<tr><th colspan="${colspan}" class="text-center">${template.title1}</th></tr>`;
    }
    if (template.title2) {
        const colspan = 3 + criteria.length + (showCalc ? 1 : 0) + (showDiff ? 1 : 0);
        html += `<tr><th colspan="${colspan}" class="text-center">${template.title2}</th></tr>`;
    }
    
    // Main title
    const colspan = 3 + criteria.length + (showCalc ? 1 : 0) + (showDiff ? 1 : 0);
    html += `<tr><th colspan="${colspan}" class="text-center fs-5 py-3">BẢNG ĐIỂM CHẤM ĐỒ ÁN</th></tr>`;
    
    // Course info
    html += `<tr><th colspan="${colspan}" class="text-center">Học phần: ${currentConfig.courseName} - Lớp: ${currentConfig.className}${currentConfig.groupName ? ' - Nhóm: ' + currentConfig.groupName : ''}</th></tr>`;
    
    // Criteria header
    html += '<tr><th rowspan="2">STT</th><th rowspan="2">MÃ SV</th><th rowspan="2">Họ và tên</th>';
    html += `<th colspan="${criteria.length}" class="text-center">Các tiêu chí đánh giá</th>`;
    html += '<th rowspan="2">Tổng</th>';
    if (showCalc) html += '<th rowspan="2" class="col-validation">Tính tổng</th>';
    if (showDiff) html += '<th rowspan="2" class="col-diff">Chênh lệch</th>';
    html += '</tr>';
    
    // Criteria names with percentage and CLO
    html += '<tr>';
    criteria.forEach(criterion => {
        html += `<th class="text-center" style="min-width: 120px;">
            ${criterion.name}<br>
            <small>(${criterion.percentage}%)</small><br>
            <span class="badge bg-info">${criterion.clo}</span>
        </th>`;
    });
    html += '</tr>';
    
    html += '</thead><tbody>';
    
    // Data rows
    results.forEach((result, index) => {
        html += '<tr>';
        html += `<td>${index + 1}</td>`;
        html += `<td>${result.mssv}</td>`;
        html += `<td class="text-start">${result.name}</td>`;
        
        // Criteria scores
        criteria.forEach(criterion => {
            const score = result.criteriaScores[criterion.id];
            html += `<td class="text-center">${ScoreCalculator.formatScore(score)}</td>`;
        });
        
        // Total score
        html += `<td class="text-center"><strong>${ScoreCalculator.formatScore(result.originalScore)}</strong></td>`;
        
        // Calculated total
        if (showCalc) {
            html += `<td class="text-center col-validation">${ScoreCalculator.formatScore(result.calculatedTotal)}</td>`;
        }
        
        // Difference
        if (showDiff) {
            const color = ScoreCalculator.getDifferenceColor(result.difference);
            const sign = result.difference > 0 ? '+' : '';
            html += `<td class="text-center col-diff text-${color}"><strong>${sign}${ScoreCalculator.formatScore(result.difference)}</strong></td>`;
        }
        
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    
    // Statistics
    const stats = ScoreCalculator.calculateStatistics(results);
    if (stats) {
        html += `
            <div class="alert alert-info mt-3">
                <h6><i class="bi bi-bar-chart"></i> Thống kê</h6>
                <div class="row">
                    <div class="col-md-3">
                        <strong>Tổng sinh viên:</strong> ${stats.totalStudents}
                    </div>
                    <div class="col-md-3">
                        <strong>Sinh viên vắng:</strong> ${stats.absentStudents || 0}
                    </div>
                    <div class="col-md-3">
                        <strong>Điểm TB:</strong> ${stats.averageScore}
                    </div>
                    <div class="col-md-3">
                        <strong>Điểm cao nhất:</strong> ${stats.maxScore}
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-3">
                        <strong>Điểm thấp nhất:</strong> ${stats.minScore}
                    </div>
                    <div class="col-md-3">
                        <strong>Chênh lệch TB:</strong> ${stats.averageDifference}
                    </div>
                    <div class="col-md-3">
                        <strong>Chênh lệch max:</strong> ${stats.maxDifference}
                    </div>
                    <div class="col-md-3">
                        <strong>Khớp chính xác:</strong> ${stats.perfectMatches}/${stats.totalStudents - (stats.absentStudents || 0)}
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Export to Excel with beautiful formatting
 */
function exportToExcel() {
    if (!currentScoreData || !currentConfig) {
        alert('Chưa có dữ liệu để xuất!');
        return;
    }
    
    const template = currentConfig.template;
    const criteria = currentConfig.criteria;
    
    // Build workbook
    const wb = XLSX.utils.book_new();
    const wsData = [];
    
    // Title row 1 (School name)
    wsData.push(['TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM']);
    // Title row 2 (Department)
    wsData.push(['        KHOA CÔNG NGHỆ THÔNG TIN']);
    // Empty row
    wsData.push([]);
    
    // Main title
    wsData.push(['BẢNG ĐIỂM CHẤM ĐỒ ÁN']);
    
    // Course info
    wsData.push([`Học phần: ${currentConfig.courseName}   Lớp: ${currentConfig.className}   Nhóm: ${currentConfig.groupName || 'N/A'}`]);
    
    // Empty row
    wsData.push([]);
    
    // Header row - Merge criteria section
    const headerRow1 = ['', '', '', ...Array(criteria.length).fill('Các tiêu chí đánh giá'), ''];
    wsData.push(headerRow1);
    
    // Sub-header row
    const headerRow2 = ['STT', 'MÃ SV', 'Họ và tên'];
    criteria.forEach(criterion => {
        headerRow2.push(`${criterion.name || criterion.code}\n(${criterion.percentage}%)\n${criterion.clo || ''}`);
    });
    headerRow2.push('Tổng');
    wsData.push(headerRow2);
    
    // Data rows
    currentScoreData.forEach((result, index) => {
        const row = [
            index + 1,
            result.mssv,
            result.name
        ];
        
        criteria.forEach(criterion => {
            const score = result.criteriaScores[criterion.id];
            row.push(score === 'V' ? 'V' : (typeof score === 'number' ? score : ''));
        });
        
        const total = result.isAbsent ? 'V' : result.originalScore;
        row.push(total);
        
        wsData.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    const colWidths = [
        { wch: 5 },  // STT
        { wch: 15 }, // MSSV
        { wch: 25 }, // Họ tên
    ];
    criteria.forEach(() => colWidths.push({ wch: 12 })); // Criteria columns
    colWidths.push({ wch: 10 }); // Tổng
    ws['!cols'] = colWidths;
    
    // Merge cells for title rows
    const mergeRanges = [];
    const numCols = 3 + criteria.length + 1;
    const colLetter = XLSX.utils.encode_col(numCols - 1);
    
    // Merge title rows
    mergeRanges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }); // Row 1
    mergeRanges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }); // Row 2
    mergeRanges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: numCols - 1 } }); // Main title
    mergeRanges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: numCols - 1 } }); // Course info
    
    // Merge "Các tiêu chí đánh giá" header
    mergeRanges.push({ s: { r: 6, c: 3 }, e: { r: 6, c: 2 + criteria.length } });
    
    ws['!merges'] = mergeRanges;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');
    
    // Generate filename
    const filename = `BangDiem_${currentConfig.className}_${Date.now()}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);
    
    showToast('Đã xuất file Excel thành công!', 'success');
}

/**
 * Export to Google Sheets
 */
function exportToGoogleSheets() {
    if (!currentScoreData || !currentConfig) {
        alert('Chưa có dữ liệu để xuất!');
        return;
    }
    
    // Use same data as Excel export
    const showCalc = document.getElementById('check-show-calc').checked;
    const showDiff = document.getElementById('check-show-diff').checked;
    
    const data = [];
    const template = currentConfig.template;
    const criteria = currentConfig.criteria;
    
    if (template.title1) data.push([template.title1]);
    if (template.title2) data.push([template.title2]);
    data.push(['BẢNG ĐIỂM CHẤM ĐỒ ÁN']);
    data.push([`Học phần: ${currentConfig.courseName}     Lớp: ${currentConfig.className}${currentConfig.groupName ? '     Nhóm: ' + currentConfig.groupName : ''}`]);
    data.push([]);
    
    const header1 = ['STT', 'MÃ SV', 'Họ và tên'];
    criteria.forEach(criterion => {
        header1.push(`${criterion.name} (${criterion.percentage}%) ${criterion.clo}`);
    });
    header1.push('Tổng');
    if (showCalc) header1.push('Tính tổng');
    if (showDiff) header1.push('Chênh lệch');
    data.push(header1);
    
    currentScoreData.forEach((result, index) => {
        const row = [index + 1, result.mssv, result.name];
        criteria.forEach(criterion => {
            row.push(result.criteriaScores[criterion.id]);
        });
        row.push(result.originalScore);
        if (showCalc) row.push(result.calculatedTotal);
        if (showDiff) row.push(result.difference);
        data.push(row);
    });
    
    const sheetName = `BangDiem_${currentConfig.className}`;
    ExcelHandler.createGoogleSheet(data, sheetName);
}

/**
 * Save to history
 */
function saveToHistory() {
    if (!currentScoreData || !currentConfig) {
        alert('Chưa có dữ liệu để lưu!');
        return;
    }
    
    const historyItem = {
        courseName: currentConfig.courseName,
        className: currentConfig.className,
        groupName: currentConfig.groupName,
        algorithm: currentConfig.algorithm,
        templateId: currentConfig.templateId,
        studentCount: currentScoreData.length,
        scoreData: currentScoreData,
        config: currentConfig
    };
    
    StorageManager.saveHistory(historyItem);
    
    updateStats();
    loadRecentActivities();
    
    showToast('Đã lưu vào lịch sử thành công!', 'success');
}

/**
 * Clear generator
 */
function clearGenerator() {
    if (!confirm('Bạn có chắc chắn muốn reset form?')) {
        return;
    }
    
    document.getElementById('score-config-form').reset();
    document.getElementById('preview-container').innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-table fs-1"></i>
            <p class="mt-3">Chưa có dữ liệu. Vui lòng cấu hình và tạo bảng điểm.</p>
        </div>
    `;
    
    ExcelHandler.clearStudentData();
    currentScoreData = null;
    currentConfig = null;
    
    document.getElementById('btn-export-excel').disabled = true;
    document.getElementById('btn-export-sheets').disabled = true;
    document.getElementById('btn-save-history').disabled = true;
}

/**
 * Get algorithm name in Vietnamese
 */
function getAlgorithmName(algorithm) {
    const names = {
        'even': 'Phân bổ đều',
        'random': 'Ngẫu nhiên',
        'weighted': 'Theo trọng số'
    };
    return names[algorithm] || algorithm;
}

/**
 * Show loading spinner
 */
function showLoading() {
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div>';
    document.body.appendChild(spinner);
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" role="alert" style="position: fixed; top: 80px; right: 20px; z-index: 9999;">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    const toastContainer = document.createElement('div');
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);
    
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

/**
 * History Management Functions
 */

function loadHistoryList() {
    const history = StorageManager.getHistory();
    const container = document.getElementById('history-list');
    
    if (!container) return;
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-1"></i>
                <p class="mt-3">Chưa có lịch sử nào</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    history.forEach(item => {
        const date = new Date(item.createdAt).toLocaleString('vi-VN');
        html += `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-title">
                        ${item.courseName} - ${item.className}${item.groupName ? ' - ' + item.groupName : ''}
                    </div>
                    <div class="history-item-date">${date}</div>
                </div>
                <div class="history-item-info">
                    <span class="badge bg-primary">${item.studentCount} sinh viên</span>
                    <span class="badge bg-info">${getAlgorithmName(item.algorithm)}</span>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-sm btn-primary" onclick="loadHistoryItem('${item.id}')">
                        <i class="bi bi-eye"></i> Xem
                    </button>
                    <button class="btn btn-sm btn-success" onclick="exportHistoryJSON('${item.id}')">
                        <i class="bi bi-download"></i> Export JSON
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteHistoryItem('${item.id}')">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function loadHistoryItem(id) {
    const item = StorageManager.getHistory().find(h => h.id === id);
    
    if (!item) {
        alert('Không tìm thấy lịch sử!');
        return;
    }
    
    // Load vào generator
    currentScoreData = item.scoreData;
    currentConfig = item.config;
    
    // Navigate to generator
    navigateTo('generator');
    
    // Fill form
    document.getElementById('select-template').value = item.templateId;
    document.getElementById('input-course').value = item.courseName;
    document.getElementById('input-class').value = item.className;
    document.getElementById('input-group').value = item.groupName || '';
    document.getElementById('select-algorithm').value = item.algorithm;
    
    // Set student data
    ExcelHandler.setStudentData(item.config.students);
    
    // Render preview
    renderPreview(item.scoreData, item.config.template, item.config.criteria);
    
    // Enable buttons
    document.getElementById('btn-export-excel').disabled = false;
    document.getElementById('btn-export-sheets').disabled = false;
    document.getElementById('btn-save-history').disabled = false;
    
    showToast('Đã tải lịch sử thành công!', 'success');
}

function exportHistoryJSON(id) {
    const item = StorageManager.getHistory().find(h => h.id === id);
    
    if (!item) {
        alert('Không tìm thấy lịch sử!');
        return;
    }
    
    const filename = `CLO_${item.className}_${item.id}.json`;
    ExcelHandler.exportToJSON(item, filename);
    
    showToast('Đã xuất JSON thành công!', 'success');
}

function deleteHistoryItem(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch sử này?')) {
        return;
    }
    
    StorageManager.deleteHistory(id);
    loadHistoryList();
    updateStats();
    loadRecentActivities();
    
    showToast('Đã xóa lịch sử!', 'warning');
}

function clearHistory() {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
        return;
    }
    
    StorageManager.clearHistory();
    loadHistoryList();
    updateStats();
    loadRecentActivities();
    
    showToast('Đã xóa toàn bộ lịch sử!', 'warning');
}

function importHistoryJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            ExcelHandler.importFromJSON(file, (data) => {
                // Save to history
                StorageManager.saveHistory(data);
                
                loadHistoryList();
                updateStats();
                loadRecentActivities();
                
                showToast('Đã import JSON thành công!', 'success');
            });
        }
    };
    
    input.click();
}

// Load history when navigating to history section
document.addEventListener('DOMContentLoaded', () => {
    const historyNav = document.querySelector('.nav-link[data-section="history"]');
    if (historyNav) {
        historyNav.addEventListener('click', () => {
            setTimeout(() => loadHistoryList(), 100);
        });
    }
});
