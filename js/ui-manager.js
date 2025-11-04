/**
 * UI Functions - Các hàm hiển thị giao diện
 */

const UIManager = {
    /**
     * Show loading overlay
     */
    showLoading() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'spinner-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },
    
    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        const colors = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        };
        
        const icons = {
            success: 'bi-check-circle',
            error: 'bi-x-circle',
            warning: 'bi-exclamation-triangle',
            info: 'bi-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification position-fixed top-0 end-0 m-3 p-3 ${colors[type]} text-white rounded shadow`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${icons[type]} me-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    /**
     * Update student count display
     */
    updateStudentCountDisplay(count) {
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
    },
    
    /**
     * Create result modal
     */
    createResultModal() {
        const modalHTML = `
            <div class="modal fade" id="resultModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-table"></i> Bảng điểm CLO</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4" id="result-modal-body" style="overflow-y: auto; padding-bottom: 100px !important;">
                            <!-- Content will be rendered here -->
                        </div>
                        <div class="modal-footer" style="position: sticky; bottom: 0; background: white; z-index: 10; box-shadow: 0 -2px 10px rgba(0,0,0,0.1);">
                            <button type="button" class="btn btn-success" onclick="ResultManager.exportToExcel()">
                                <i class="bi bi-file-earmark-excel"></i> Xuất Excel
                            </button>
                            <button type="button" class="btn btn-danger" onclick="ResultManager.exportToPDF()">
                                <i class="bi bi-file-earmark-pdf"></i> Xuất PDF
                            </button>
                            <button type="button" class="btn btn-info" onclick="ResultManager.exportToGoogleSheets()">
                                <i class="bi bi-google"></i> Google Sheets
                            </button>
                            <button type="button" class="btn btn-primary" onclick="ResultManager.saveToHistory()">
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
    },
    
    /**
     * Render result table in modal
     */
    renderResultTable(results, template, criteria, config) {
        const stats = ScoreCalculator.calculateStatistics(results) || {
            totalStudents: 0,
            absentStudents: 0,
            averageScore: '0.0',
            perfectMatches: 0
        };
        
        let html = `
            <div class="container-fluid">
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <h4 class="mb-3">${template.name || 'Mẫu chấm'}</h4>
                                <div class="row">
                                    <div class="col-md-3">
                                        <strong>Học phần:</strong> ${config.courseName || 'N/A'}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Lớp:</strong> ${config.className || 'N/A'}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Nhóm:</strong> ${config.groupName || 'N/A'}
                                    </div>
                                    <div class="col-md-3">
                                        <strong>Thuật toán:</strong> ${this.getAlgorithmName(config.algorithm || 'even')}
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
                                <h3 class="mb-0">${stats.totalStudents || 0}</h3>
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
                                <h3 class="mb-0">${stats.averageScore || '0.0'}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm bg-info bg-opacity-10">
                            <div class="card-body text-center">
                                <h6 class="text-muted small mb-1">Khớp chính xác</h6>
                                <h3 class="mb-0">${stats.perfectMatches || 0}/${(stats.totalStudents || 0) - (stats.absentStudents || 0)}</h3>
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
                                    ${this.renderScoreTable(results, criteria)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    },
    
    /**
     * Render score table only
     */
    renderScoreTable(results, criteria) {
        let html = '<table class="table table-hover table-sm mb-0" style="font-size: 0.875rem;">';
        
        // Table header - sticky
        html += '<thead class="table-light" style="position: sticky; top: 0; z-index: 10;">';
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
    },
    
    /**
     * Get algorithm display name
     */
    getAlgorithmName(algorithm) {
        const names = {
            'even': 'Phân bổ đều',
            'random': 'Ngẫu nhiên',
            'weighted': 'Theo trọng số'
        };
        return names[algorithm] || algorithm;
    }
};

// Export for global use
window.UIManager = UIManager;
