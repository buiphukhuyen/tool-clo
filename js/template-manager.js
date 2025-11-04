/**
 * Template Manager - Quản lý Templates
 * CRUD operations cho templates
 */

const TemplateManager = {
    currentEditingId: null,

    /**
     * Khởi tạo Template Manager
     */
    init() {
        this.loadTemplateList();
        this.loadTemplateOptions();
    },

    /**
     * Load danh sách templates
     */
    loadTemplateList() {
        const templates = StorageManager.getTemplates();
        const container = document.getElementById('template-list');
        
        if (!container) return;

        if (templates.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p class="mt-2">Chưa có template nào. Hãy tạo template đầu tiên!</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th width="5%">#</th>
                        <th width="25%">Tên Template</th>
                        <th width="30%">Mô tả</th>
                        <th width="15%">Ngày tạo</th>
                        <th width="15%">Cập nhật</th>
                        <th width="10%" class="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        templates.forEach((template, index) => {
            const createdDate = new Date(template.createdAt).toLocaleDateString('vi-VN');
            const updatedDate = new Date(template.updatedAt).toLocaleDateString('vi-VN');
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${template.name}</strong></td>
                    <td>${template.description || '<em class="text-muted">Không có mô tả</em>'}</td>
                    <td><small>${createdDate}</small></td>
                    <td><small>${updatedDate}</small></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-primary" onclick="TemplateManager.editTemplate('${template.id}')" title="Chỉnh sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="TemplateManager.deleteTemplate('${template.id}')" title="Xóa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        container.innerHTML = html;
    },

    /**
     * Load template options cho dropdown
     */
    loadTemplateOptions() {
        const templates = StorageManager.getTemplates();
        const select = document.getElementById('select-template');
        
        if (!select) return;

        // Clear existing options except first one
        select.innerHTML = '<option value="">-- Chọn template --</option>';

        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            select.appendChild(option);
        });
    },

    /**
     * Mở modal tạo/sửa template
     */
    openModal(templateId = null) {
        this.currentEditingId = templateId;

        // Load category options first
        CategoryManager.loadCategoryOptions();

        // Reset form
        document.getElementById('template-form').reset();
        document.getElementById('template-id').value = '';

        if (templateId) {
            // Load dữ liệu để edit
            const template = StorageManager.getTemplate(templateId);
            if (template) {
                document.getElementById('template-id').value = template.id;
                document.getElementById('template-name').value = template.name;
                document.getElementById('template-category').value = template.categoryId || '';
                document.getElementById('template-description').value = template.description || '';
                document.getElementById('template-title-1').value = template.title1 || '';
                document.getElementById('template-title-2').value = template.title2 || '';
                
                // Convert columns array to JSON string
                if (template.columns) {
                    document.getElementById('template-columns').value = JSON.stringify(template.columns, null, 2);
                }
            }
        } else {
            // Set default values for new template
            document.getElementById('template-columns').value = JSON.stringify(['STT', 'MÃ SV', 'Họ và tên'], null, 2);
        }

        // Update preview
        setTimeout(() => this.updatePreview(), 100);
    },

    /**
     * Update preview template
     */
    updatePreview() {
        const name = document.getElementById('template-name').value.trim();
        const categoryId = document.getElementById('template-category').value;
        const title1 = document.getElementById('template-title-1').value.trim();
        const title2 = document.getElementById('template-title-2').value.trim();
        const columnsJson = document.getElementById('template-columns').value.trim();
        
        const previewContainer = document.getElementById('template-preview');
        if (!previewContainer) return;

        // Parse columns
        let columns = ['STT', 'MÃ SV', 'Họ và tên'];
        try {
            if (columnsJson) {
                const parsed = JSON.parse(columnsJson);
                if (Array.isArray(parsed)) {
                    columns = parsed;
                }
            }
        } catch (error) {
            previewContainer.innerHTML = '<p class="text-danger small">JSON cột không hợp lệ!</p>';
            return;
        }

        // Get criteria for selected category
        let criteria = [];
        if (categoryId) {
            criteria = StorageManager.getCriteriaByCategory(categoryId);
        }

        // Build preview HTML
        let html = '<table class="table table-bordered table-sm small">';
        
        // Title rows
        if (title1) {
            const colspan = columns.length + criteria.length + 1;
            html += `<thead><tr><th colspan="${colspan}" class="text-center bg-light">${title1}</th></tr>`;
        }
        if (title2) {
            const colspan = columns.length + criteria.length + 1;
            html += `<tr><th colspan="${colspan}" class="text-center bg-light">${title2}</th></tr>`;
        }
        
        // Main title
        const colspan = columns.length + criteria.length + 1;
        html += `<tr><th colspan="${colspan}" class="text-center bg-primary text-white">BẢNG ĐIỂM CHẤM ĐỒ ÁN</th></tr>`;
        
        // Headers
        html += '<tr class="table-secondary">';
        columns.forEach(col => {
            html += `<th class="text-center">${col}</th>`;
        });
        criteria.forEach(criterion => {
            html += `<th class="text-center">${criterion.name}<br><small>(${criterion.percentage}%)</small></th>`;
        });
        html += '<th class="text-center">Tổng</th>';
        html += '</tr></thead>';
        
        // Sample data row
        html += '<tbody><tr>';
        html += '<td class="text-center">1</td>';
        html += '<td>2280618256</td>';
        html += '<td>Nguyễn Văn A</td>';
        for (let i = 0; i < criteria.length; i++) {
            html += '<td class="text-center">8.0</td>';
        }
        html += '<td class="text-center"><strong>8.0</strong></td>';
        html += '</tr></tbody>';
        
        html += '</table>';

        if (!categoryId) {
            html += '<p class="text-warning small mt-2"><i class="bi bi-exclamation-triangle"></i> Chọn nhóm tiêu chí để xem các cột điểm</p>';
        }

        previewContainer.innerHTML = html;
    },

    /**
     * Lưu template
     */
    save() {
        const form = document.getElementById('template-form');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('template-id').value;
        const name = document.getElementById('template-name').value.trim();
        const categoryId = document.getElementById('template-category').value;
        const description = document.getElementById('template-description').value.trim();
        const title1 = document.getElementById('template-title-1').value.trim();
        const title2 = document.getElementById('template-title-2').value.trim();
        const columnsJson = document.getElementById('template-columns').value.trim();

        if (!categoryId) {
            alert('Vui lòng chọn nhóm tiêu chí!');
            return;
        }

        // Parse columns JSON
        let columns = ['STT', 'MÃ SV', 'Họ và tên'];
        try {
            if (columnsJson) {
                columns = JSON.parse(columnsJson);
                if (!Array.isArray(columns)) {
                    alert('Cấu trúc cột phải là một mảng JSON!');
                    return;
                }
            }
        } catch (error) {
            alert('JSON cột không hợp lệ! Vui lòng kiểm tra lại.');
            return;
        }

        const template = {
            id: id || undefined,
            name,
            categoryId,
            description,
            title1,
            title2,
            columns
        };

        const success = StorageManager.saveTemplate(template);

        if (success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
            modal.hide();

            // Reload list
            this.loadTemplateList();
            this.loadTemplateOptions();

            // Update stats
            if (window.updateStats) {
                window.updateStats();
            }

            // Show success message
            this.showMessage('Mẫu chấm đã được lưu thành công!', 'success');
        } else {
            alert('Có lỗi khi lưu mẫu!');
        }
    },

    /**
     * Chỉnh sửa template
     */
    editTemplate(id) {
        this.openModal(id);
        const modal = new bootstrap.Modal(document.getElementById('templateModal'));
        modal.show();
    },

    /**
     * Xóa template
     */
    deleteTemplate(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa template này?')) {
            return;
        }

        const success = StorageManager.deleteTemplate(id);

        if (success) {
            this.loadTemplateList();
            this.loadTemplateOptions();

            if (window.updateStats) {
                window.updateStats();
            }

            this.showMessage('Template đã được xóa!', 'warning');
        } else {
            alert('Có lỗi khi xóa template!');
        }
    },

    /**
     * Hiển thị thông báo
     */
    showMessage(message, type = 'info') {
        // Create toast notification
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
        
        // Remove after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastContainer.remove();
        });
    }
};

// Global functions để gọi từ HTML
function openTemplateModal(id = null) {
    TemplateManager.openModal(id);
}

function saveTemplate() {
    TemplateManager.save();
}

// Khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    TemplateManager.init();
});
