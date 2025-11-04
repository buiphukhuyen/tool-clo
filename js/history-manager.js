/**
 * History Manager - Quản lý lịch sử tạo bảng điểm
 */

const HistoryManager = {
    /**
     * Initialize history manager
     */
    init() {
        this.loadHistoryList();
    },
    
    /**
     * Load history list
     */
    loadHistoryList() {
        const history = StorageManager.getHistory();
        const container = document.getElementById('history-list');
        
        if (!container) return;
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-clock-history fs-1"></i>
                    <p class="mt-3">Chưa có lịch sử nào</p>
                </div>
            `;
            return;
        }
        
        // Sort by timestamp descending
        const sortedHistory = [...history].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        let html = '<div class="row">';
        
        sortedHistory.forEach(item => {
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('vi-VN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 shadow-sm hover-card">
                        <div class="card-body">
                            <h6 class="card-title">${item.courseName}</h6>
                            <p class="card-text small text-muted mb-2">
                                <i class="bi bi-calendar3"></i> ${dateStr}
                            </p>
                            <p class="card-text small mb-1">
                                <strong>Lớp:</strong> ${item.className}
                                ${item.groupName ? ` | <strong>Nhóm:</strong> ${item.groupName}` : ''}
                            </p>
                            <p class="card-text small mb-1">
                                <strong>Mẫu:</strong> ${item.templateName}
                            </p>
                            <p class="card-text small mb-3">
                                <strong>Sinh viên:</strong> ${item.studentCount}
                            </p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary btn-sm" onclick="HistoryManager.viewHistory('${item.id}')">
                                    <i class="bi bi-eye"></i> Xem chi tiết
                                </button>
                                <button class="btn btn-warning btn-sm" onclick="HistoryManager.editHistory('${item.id}')">
                                    <i class="bi bi-pencil"></i> Chỉnh sửa
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="HistoryManager.deleteHistory('${item.id}')">
                                    <i class="bi bi-trash"></i> Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
    },
    
    /**
     * View history item
     */
    viewHistory(id) {
        const history = StorageManager.getHistory();
        const item = history.find(h => h.id === id);
        
        if (!item) {
            alert('Không tìm thấy lịch sử này!');
            return;
        }
        
        // Rebuild template object from saved data
        const template = item.config && item.config.template ? item.config.template : {
            name: item.templateName || 'Mẫu chấm',
            categoryId: item.categoryId,
            schoolName: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM',
            departmentName: 'KHOA CÔNG NGHỆ THÔNG TIN'
        };
        
        // Rebuild config object
        const config = {
            courseName: item.courseName || item.config?.courseName || '',
            className: item.className || item.config?.className || '',
            groupName: item.groupName || item.config?.groupName || '',
            algorithm: item.algorithm || item.config?.algorithm || 'even',
            template: template,
            criteria: item.criteria || []
        };
        
        // Open result modal with saved data
        ResultManager.openResultModal(
            item.results || [],
            template,
            item.criteria || [],
            config
        );
    },
    
    /**
     * Delete history item
     */
    deleteHistory(id) {
        if (!confirm('Bạn có chắc muốn xóa lịch sử này?')) {
            return;
        }
        
        StorageManager.deleteHistory(id);
        this.loadHistoryList();
        
        // Update stats
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        UIManager.showToast('Đã xóa lịch sử thành công!', 'success');
    },
    
    /**
     * Edit history item - load into generator
     */
    editHistory(id) {
        const history = StorageManager.getHistory();
        const item = history.find(h => h.id === id);
        
        if (!item) {
            alert('Không tìm thấy lịch sử này!');
            return;
        }
        
        // Navigate to generator section
        if (typeof navigateTo === 'function') {
            navigateTo('generator');
        }
        
        // Load template
        const templateSelect = document.getElementById('select-template');
        if (templateSelect && item.config && item.config.templateId) {
            templateSelect.value = item.config.templateId;
        }
        
        // Load course info
        const courseInput = document.getElementById('input-course');
        if (courseInput) {
            courseInput.value = item.courseName || '';
        }
        
        const classInput = document.getElementById('input-class');
        if (classInput) {
            classInput.value = item.className || '';
        }
        
        const groupInput = document.getElementById('input-group');
        if (groupInput) {
            groupInput.value = item.groupName || '';
        }
        
        // Load algorithm
        const algorithmSelect = document.getElementById('select-algorithm');
        if (algorithmSelect && item.algorithm) {
            algorithmSelect.value = item.algorithm;
        }
        
        // Load student data
        if (item.config && item.config.students) {
            ExcelHandler.setStudentData(item.config.students);
            UIManager.updateStudentCountDisplay(item.config.students.length);
        }
        
        // Update preview
        if (typeof updateRealtimePreview === 'function') {
            setTimeout(() => updateRealtimePreview(), 100);
        }
        
        UIManager.showToast('Đã tải dữ liệu để chỉnh sửa!', 'info');
    },
    
    /**
     * Clear all history
     */
    clearAllHistory() {
        if (!confirm('Bạn có chắc muốn xóa TẤT CẢ lịch sử? Hành động này không thể hoàn tác!')) {
            return;
        }
        
        StorageManager.clearHistory();
        this.loadHistoryList();
        
        // Update stats
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        UIManager.showToast('Đã xóa tất cả lịch sử!', 'success');
    }
};

// Export for global use
window.HistoryManager = HistoryManager;
