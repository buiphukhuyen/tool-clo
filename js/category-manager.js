/**
 * Category Manager - Quản lý Nhóm tiêu chí
 * CRUD operations cho categories
 */

const CategoryManager = {
    currentEditingId: null,

    /**
     * Khởi tạo Category Manager
     */
    init() {
        this.loadCategoryList();
        this.loadCategoryOptions();
    },

    /**
     * Load danh sách categories
     */
    loadCategoryList() {
        const categories = StorageManager.getCategories();
        const container = document.getElementById('category-list');
        
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p class="mt-2 small">Chưa có nhóm tiêu chí nào. Hãy tạo nhóm đầu tiên!</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="table table-hover table-sm">
                <thead>
                    <tr>
                        <th width="5%">#</th>
                        <th width="25%">Tên Nhóm</th>
                        <th width="30%">Mô tả</th>
                        <th width="10%" class="text-center">Số tiêu chí</th>
                        <th width="10%" class="text-center">Tổng %</th>
                        <th width="10%" class="text-center">Ngày tạo</th>
                        <th width="10%" class="text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;

        categories.forEach((category, index) => {
            const criteria = StorageManager.getCriteriaByCategory(category.id);
            const totalPercentage = criteria.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0);
            const isValid = totalPercentage === 100;
            const createdDate = new Date(category.createdAt).toLocaleDateString('vi-VN');
            
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${category.name}</strong></td>
                    <td><small>${category.description || '<em class="text-muted">Không có mô tả</em>'}</small></td>
                    <td class="text-center"><span class="badge bg-secondary">${criteria.length}</span></td>
                    <td class="text-center">
                        <span class="badge bg-${isValid ? 'success' : 'warning'}">${totalPercentage}%</span>
                    </td>
                    <td class="text-center"><small>${createdDate}</small></td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="CategoryManager.editCategory('${category.id}')" title="Chỉnh sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="CategoryManager.deleteCategory('${category.id}')" title="Xóa">
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
     * Load category options cho dropdown
     */
    loadCategoryOptions() {
        const categories = StorageManager.getCategories();
        
        // Update template category select
        const templateSelect = document.getElementById('template-category');
        if (templateSelect) {
            templateSelect.innerHTML = '<option value="">-- Chọn nhóm tiêu chí --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                templateSelect.appendChild(option);
            });
        }

        // Update criteria category select
        const criteriaSelect = document.getElementById('criteria-category');
        if (criteriaSelect) {
            criteriaSelect.innerHTML = '<option value="">-- Chọn nhóm tiêu chí --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                criteriaSelect.appendChild(option);
            });
        }

        // Update filter category select
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            const currentValue = filterSelect.value;
            filterSelect.innerHTML = '<option value="">-- Tất cả nhóm --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                filterSelect.appendChild(option);
            });
            filterSelect.value = currentValue;
        }
    },

    /**
     * Mở modal tạo/sửa category
     */
    openModal(categoryId = null) {
        this.currentEditingId = categoryId;

        // Reset form
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';

        if (categoryId) {
            // Load dữ liệu để edit
            const category = StorageManager.getCategory(categoryId);
            if (category) {
                document.getElementById('category-id').value = category.id;
                document.getElementById('category-name').value = category.name;
                document.getElementById('category-description').value = category.description || '';
            }
        }
    },

    /**
     * Lưu category
     */
    save() {
        const form = document.getElementById('category-form');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('category-id').value;
        const name = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();

        const category = {
            id: id || undefined,
            name,
            description
        };

        const success = StorageManager.saveCategory(category);

        if (success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
            modal.hide();

            // Reload list
            this.loadCategoryList();
            this.loadCategoryOptions();

            // Update stats
            if (window.updateStats) {
                window.updateStats();
            }

            // Show success message
            this.showMessage('Nhóm tiêu chí đã được lưu thành công!', 'success');
        } else {
            alert('Có lỗi khi lưu nhóm tiêu chí!');
        }
    },

    /**
     * Chỉnh sửa category
     */
    editCategory(id) {
        this.openModal(id);
        const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
        modal.show();
    },

    /**
     * Xóa category
     */
    deleteCategory(id) {
        const criteria = StorageManager.getCriteriaByCategory(id);
        
        if (criteria.length > 0) {
            if (!confirm(`Nhóm này có ${criteria.length} tiêu chí. Xóa nhóm sẽ xóa tất cả tiêu chí bên trong.\n\nBạn có chắc chắn muốn xóa?`)) {
                return;
            }
        } else {
            if (!confirm('Bạn có chắc chắn muốn xóa nhóm tiêu chí này?')) {
                return;
            }
        }

        const success = StorageManager.deleteCategory(id);

        if (success) {
            this.loadCategoryList();
            this.loadCategoryOptions();

            if (window.updateStats) {
                window.updateStats();
            }

            // Reload criteria list nếu đang hiển thị
            if (typeof CriteriaManager !== 'undefined') {
                CriteriaManager.loadCriteriaList();
            }

            this.showMessage('Nhóm tiêu chí đã được xóa!', 'warning');
        } else {
            alert('Có lỗi khi xóa nhóm tiêu chí!');
        }
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
function openCategoryModal(id = null) {
    CategoryManager.openModal(id);
}

function saveCategory() {
    CategoryManager.save();
}

// Khởi tạo khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    CategoryManager.init();
});
