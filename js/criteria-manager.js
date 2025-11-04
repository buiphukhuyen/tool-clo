/**
 * Criteria Manager - Quản lý Tiêu chí đánh giá
 * CRUD operations cho criteria
 */

const CriteriaManager = {
    currentEditingId: null,

    /**
     * Khởi tạo Criteria Manager
     */
    init() {
        this.loadCriteriaList();
    },

    /**
     * Filter by category
     */
    filterByCategory() {
        this.loadCriteriaList();
    },

    /**
     * Normalize percentage (hỗ trợ dấu phẩy)
     */
    normalizePercentage(value) {
        if (typeof value === 'string') {
            value = value.replace(',', '.');
        }
        return parseFloat(value) || 0;
    },

    /**
     * Load danh sách tiêu chí
     */
    loadCriteriaList() {
        const filterCategoryId = document.getElementById('filter-category')?.value || '';
        let criteria = StorageManager.getCriteria();
        
        // Filter by category if selected
        if (filterCategoryId) {
            criteria = criteria.filter(c => c.categoryId === filterCategoryId);
        }
        
        const container = document.getElementById('criteria-list');
        
        if (!container) return;

        if (criteria.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-2"></i>
                    <p class="mt-2 small">Chưa có tiêu chí nào. Hãy thêm tiêu chí đầu tiên!</p>
                </div>
            `;
            return;
        }

        // Group by category
        const categories = StorageManager.getCategories();
        const grouped = {};
        
        criteria.forEach(criterion => {
            const categoryId = criterion.categoryId || 'uncategorized';
            if (!grouped[categoryId]) {
                grouped[categoryId] = [];
            }
            grouped[categoryId].push(criterion);
        });

        let html = '';

        // Render each category group
        Object.keys(grouped).forEach(categoryId => {
            const criteriaInCategory = grouped[categoryId];
            const category = categories.find(c => c.id === categoryId);
            const categoryName = category ? category.name : 'Chưa phân loại';
            
            // Tính tổng % cho category này
            const totalPercentage = criteriaInCategory.reduce((sum, c) => sum + this.normalizePercentage(c.percentage), 0).toFixed(1);
            const isValidTotal = Math.abs(parseFloat(totalPercentage) - 100) < 0.1;

            html += `
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="bi bi-folder"></i> ${categoryName}</h6>
                            <span class="badge bg-${isValidTotal ? 'success' : 'warning'}">${totalPercentage}%</span>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <table class="table table-hover table-sm mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th width="5%">#</th>
                                    <th width="35%">Tiêu chí</th>
                                    <th width="10%" class="text-center">Tỷ lệ (%)</th>
                                    <th width="10%" class="text-center">CLO</th>
                                    <th width="25%">Mô tả</th>
                                    <th width="15%" class="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            criteriaInCategory.forEach((criterion, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong class="small">${criterion.name}</strong></td>
                        <td class="text-center">
                            <span class="badge bg-primary">${criterion.percentage}%</span>
                        </td>
                        <td class="text-center">
                            <span class="badge bg-info">${criterion.clo}</span>
                        </td>
                        <td><small>${criterion.description || '<em class="text-muted">Không có mô tả</em>'}</small></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary" onclick="CriteriaManager.editCriterion('${criterion.id}')" title="Chỉnh sửa">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="CriteriaManager.deleteCriterion('${criterion.id}')" title="Xóa">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Mở modal tạo/sửa tiêu chí
     */
    openModal(criterionId = null) {
        this.currentEditingId = criterionId;

        // Reset form
        document.getElementById('criteria-form').reset();
        document.getElementById('criteria-id').value = '';

        if (criterionId) {
            // Load dữ liệu để edit
            const criterion = StorageManager.getCriterion(criterionId);
            if (criterion) {
                document.getElementById('criteria-id').value = criterion.id;
                document.getElementById('criteria-category').value = criterion.categoryId || '';
                document.getElementById('criteria-name').value = criterion.name;
                document.getElementById('criteria-percentage').value = criterion.percentage;
                document.getElementById('criteria-clo').value = criterion.clo;
                document.getElementById('criteria-description').value = criterion.description || '';
            }
        }
    },

    /**
     * Lưu tiêu chí
     */
    save() {
        const form = document.getElementById('criteria-form');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('criteria-id').value;
        const categoryId = document.getElementById('criteria-category').value;
        const name = document.getElementById('criteria-name').value.trim();
        const percentageStr = document.getElementById('criteria-percentage').value.trim();
        const clo = document.getElementById('criteria-clo').value.trim().toUpperCase();
        const description = document.getElementById('criteria-description').value.trim();

        if (!categoryId) {
            alert('Vui lòng chọn nhóm tiêu chí!');
            return;
        }

        // Normalize percentage (hỗ trợ dấu phẩy)
        const percentage = this.normalizePercentage(percentageStr);

        // Validation
        if (percentage <= 0 || percentage > 100) {
            alert('Tỷ lệ % phải từ 1 đến 100!');
            return;
        }

        const criterion = {
            id: id || undefined,
            categoryId,
            name,
            percentage,
            clo,
            description
        };

        const success = StorageManager.saveCriterion(criterion);

        if (success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('criteriaModal'));
            modal.hide();

            // Reload list
            this.loadCriteriaList();

            // Update stats
            if (window.updateStats) {
                window.updateStats();
            }

            // Show success message
            this.showMessage('Tiêu chí đã được lưu thành công!', 'success');
        } else {
            alert('Có lỗi khi lưu tiêu chí!');
        }
    },

    /**
     * Chỉnh sửa tiêu chí
     */
    editCriterion(id) {
        this.openModal(id);
        const modal = new bootstrap.Modal(document.getElementById('criteriaModal'));
        modal.show();
    },

    /**
     * Xóa tiêu chí
     */
    deleteCriterion(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) {
            return;
        }

        const success = StorageManager.deleteCriterion(id);

        if (success) {
            this.loadCriteriaList();

            if (window.updateStats) {
                window.updateStats();
            }

            this.showMessage('Tiêu chí đã được xóa!', 'warning');
        } else {
            alert('Có lỗi khi xóa tiêu chí!');
        }
    },

    /**
     * Lấy danh sách tiêu chí active
     */
    getActiveCriteria() {
        return StorageManager.getCriteria();
    },

    /**
     * Validate tổng % = 100 cho một category
     */
    validateTotalPercentage(categoryId) {
        const criteria = StorageManager.getCriteriaByCategory(categoryId);
        const total = criteria.reduce((sum, c) => sum + this.normalizePercentage(c.percentage), 0);
        return Math.abs(total - 100) < 0.1;
    },

    /**
     * Hiển thị thông báo
     */
    showMessage(message, type = 'info') {
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
};

// Global functions để gọi từ HTML
function openCriteriaModal(id = null) {
    CriteriaManager.openModal(id);
}

function saveCriteria() {
    CriteriaManager.save();
}

// Khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    CriteriaManager.init();
});
