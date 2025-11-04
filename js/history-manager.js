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
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="HistoryManager.toggleSelectAll()">
                        <i class="bi bi-check-square"></i> Chọn tất cả
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="HistoryManager.shareSelected()" id="btn-share-selected">
                        <i class="bi bi-share"></i> Chia sẻ đã chọn (<span id="selected-count">0</span>)
                    </button>
                </div>
            </div>
            <div class="row">
        `;
        
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
                            <div class="form-check mb-2">
                                <input class="form-check-input history-checkbox" type="checkbox" value="${item.id}" 
                                       id="check-${item.id}" onchange="HistoryManager.updateSelectedCount()">
                                <label class="form-check-label fw-bold" for="check-${item.id}">
                                    ${item.courseName}
                                </label>
                            </div>
                            <p class="card-text small text-muted mb-1">
                                <i class="bi bi-calendar3"></i> ${dateStr}
                            </p>
                            <p class="card-text small mb-1">
                                <strong>Lớp:</strong> ${item.className}
                                ${item.groupName ? ` | <strong>Nhóm:</strong> ${item.groupName}` : ''}
                            </p>
                            <p class="card-text small mb-1">
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
            departmentName: '        KHOA CÔNG NGHỆ THÔNG TIN'
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
    },
    
    /**
     * Toggle select all checkboxes
     */
    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.history-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
        
        this.updateSelectedCount();
    },
    
    /**
     * Update selected count
     */
    updateSelectedCount() {
        const checkboxes = document.querySelectorAll('.history-checkbox:checked');
        const count = checkboxes.length;
        
        const countSpan = document.getElementById('selected-count');
        if (countSpan) {
            countSpan.textContent = count;
        }
        
        const shareBtn = document.getElementById('btn-share-selected');
        if (shareBtn) {
            shareBtn.disabled = count === 0;
        }
    },
    
    /**
     * Share selected history items
     */
    async shareSelected() {
        const checkboxes = document.querySelectorAll('.history-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 bảng điểm để chia sẻ!');
            return;
        }
        
        // Show loading
        UIManager.showLoading();
        
        try {
            // Generate share data
            const history = StorageManager.getHistory();
            const selectedItems = selectedIds.map(id => history.find(h => h.id === id)).filter(Boolean);
            
            // Create share token (upload to cloud)
            const shareToken = await this.createShareToken(selectedItems);
            
            // Generate share URL pointing to share.html
            const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
            const shareUrl = `${baseUrl}/share.html?share=${shareToken}`;
            
            // Hide loading
            UIManager.hideLoading();
            
            // Show share modal
            this.showShareModal(shareUrl, selectedItems.length);
            
        } catch (error) {
            UIManager.hideLoading();
            console.error('Error creating share link:', error);
            alert('Lỗi khi tạo link chia sẻ. Vui lòng thử lại!');
        }
    },
    
    /**
     * Create share token from selected items (upload to dpaste.com - no API key needed)
     */
    async createShareToken(items) {
        // Minimize data size - only keep essential fields
        const minimalData = items.map(item => ({
            id: item.id,
            courseName: item.courseName,
            className: item.className,
            groupName: item.groupName,
            results: item.results,
            criteria: item.criteria,
            config: {
                template: item.config?.template || {
                    schoolName: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM',
                    departmentName: '        KHOA CÔNG NGHỆ THÔNG TIN'
                }
            }
        }));
        
        const shareData = {
            timestamp: Date.now(),
            items: minimalData
        };
        
        try {
            // Upload to dpaste.com (free, no API key needed)
            const formData = new FormData();
            formData.append('content', JSON.stringify(shareData));
            formData.append('syntax', 'json');
            formData.append('expiry_days', 365); // 1 year expiry
            
            const response = await fetch('https://dpaste.com/api/v2/', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload data');
            }
            
            const pasteUrl = await response.text();
            // Extract paste ID from URL: https://dpaste.com/XXXXX
            const pasteId = pasteUrl.trim().split('/').pop();
            
            return pasteId;
            
        } catch (error) {
            console.error('Error uploading to dpaste:', error);
            
            // Fallback: encode to base64 in URL (works for small data)
            const jsonStr = JSON.stringify(shareData);
            const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
            return 'local_' + base64;
        }
    },
    
    /**
     * Show share modal with URL
     */
    showShareModal(url, count) {
        const modalHTML = `
            <div class="modal fade" id="shareModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-share"></i> Chia sẻ Bảng điểm</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-success">
                                <i class="bi bi-check-circle"></i> Đã tạo link chia sẻ cho <strong>${count} bảng điểm</strong>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">Link chia sẻ:</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="share-url-input" value="${url}" readonly>
                                    <button class="btn btn-outline-primary" onclick="HistoryManager.copyShareUrl()">
                                        <i class="bi bi-clipboard"></i> Copy
                                    </button>
                                </div>
                            </div>
                            
                            <div class="alert alert-info small">
                                <i class="bi bi-info-circle"></i> 
                                <strong>Hướng dẫn:</strong> Gửi link này cho người khác. Khi họ nhấn vào link, trang web sẽ mở và tự động in PDF các bảng điểm đã chọn.
                            </div>
                            <div class="alert alert-success small">
                                <i class="bi bi-cloud-check"></i> 
                                Dữ liệu được lưu trữ an toàn trên cloud (dpaste.com). Link có hiệu lực 1 năm.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="HistoryManager.copyShareUrl()">
                                <i class="bi bi-clipboard"></i> Copy Link
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove old modal if exists
        const oldModal = document.getElementById('shareModal');
        if (oldModal) oldModal.remove();
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('shareModal'));
        modal.show();
    },
    
    /**
     * Copy share URL to clipboard
     */
    copyShareUrl() {
        const input = document.getElementById('share-url-input');
        if (input) {
            input.select();
            document.execCommand('copy');
            UIManager.showToast('Đã copy link chia sẻ!', 'success');
        }
    },
    
    /**
     * Load shared data from URL and print PDF
     */
    async loadSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareToken = urlParams.get('share');
        
        if (!shareToken) return;
        
        // Show loading
        UIManager.showLoading();
        
        try {
            let shareData;
            
            // Check if it's a local base64 token (fallback)
            if (shareToken.startsWith('local_')) {
                const base64 = shareToken.replace('local_', '');
                const jsonStr = decodeURIComponent(escape(atob(base64)));
                shareData = JSON.parse(jsonStr);
            } else {
                // Fetch from dpaste.com
                const response = await fetch(`https://dpaste.com/${shareToken}.txt`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch shared data');
                }
                
                const jsonText = await response.text();
                shareData = JSON.parse(jsonText);
            }
            
            const items = shareData.items;
            
            if (!items || items.length === 0) {
                UIManager.hideLoading();
                alert('Không có dữ liệu để hiển thị!');
                return;
            }
            
            // Hide loading
            UIManager.hideLoading();
            
            // Check if we're on index.html - redirect to share.html
            if (!window.location.pathname.includes('share.html')) {
                window.location.href = `share.html?share=${shareToken}`;
                return;
            }
            
            // If already on share.html, the page will handle display
            // (This code runs on index.html, share.html has its own logic)
            
        } catch (error) {
            UIManager.hideLoading();
            console.error('Error loading shared data:', error);
            alert('Link chia sẻ không hợp lệ hoặc đã hết hạn!');
        }
    },
    
    /**
     * Print PDF for shared items
     */
    printSharedPDF(items) {
        let combinedHTML = '';
        
        items.forEach((item, index) => {
            // Rebuild config for each item
            const template = item.config && item.config.template ? item.config.template : {
                schoolName: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM',
                departmentName: '        KHOA CÔNG NGHỆ THÔNG TIN'
            };
            
            const html = ExcelExporter.generatePDFHTML(
                item.results,
                template,
                item.criteria,
                item.courseName,
                item.className,
                item.groupName
            );
            
            combinedHTML += html;
            
            // Add page break between items (except last)
            if (index < items.length - 1) {
                combinedHTML += '<div style="page-break-after: always;"></div>';
            }
        });
        
        // Create print window
        const printWindow = window.open('', '_blank');
        
        // Check if popup was blocked
        if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
            alert('Popup bị chặn! Vui lòng cho phép popup trên trình duyệt và thử lại.\n\nHoặc nhấn Ctrl+Click vào link để mở trong tab mới.');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Bảng Điểm Chia Sẻ - ${items.length} bảng</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none; }
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        margin: 0;
                        padding: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                    <strong>Đã tải ${items.length} bảng điểm!</strong> 
                    Nhấn Ctrl+P (Windows) hoặc Cmd+P (Mac), chọn "Save as PDF" và nhấn "Save"
                    <button onclick="window.print()" style="margin-left: 10px; padding: 5px 15px;">In ngay</button>
                </div>
                ${combinedHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Auto print after load
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    }
};

// Export for global use
window.HistoryManager = HistoryManager;

// Auto-load shared data on page load
document.addEventListener('DOMContentLoaded', () => {
    HistoryManager.loadSharedData();
});
