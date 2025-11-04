/**
 * Storage Manager - Quản lý LocalStorage
 * Xử lý việc lưu/đọc dữ liệu từ LocalStorage
 */

const StorageManager = {
    // Storage keys
    KEYS: {
        TEMPLATES: 'clo_templates',
        CRITERIA: 'clo_criteria',
        CATEGORIES: 'clo_categories',
        COURSES: 'clo_courses',
        HISTORY: 'clo_history',
        CONFIG: 'clo_config'
    },

    /**
     * Lưu dữ liệu vào LocalStorage
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Đọc dữ liệu từ LocalStorage
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Xóa dữ liệu khỏi LocalStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },

    /**
     * Xóa toàn bộ dữ liệu
     */
    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    // ==================== TEMPLATES ====================
    
    /**
     * Lấy tất cả templates
     */
    getTemplates() {
        return this.load(this.KEYS.TEMPLATES, []);
    },

    /**
     * Lấy template theo ID
     */
    getTemplate(id) {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id);
    },

    /**
     * Lưu template mới
     */
    saveTemplate(template) {
        const templates = this.getTemplates();
        
        if (template.id) {
            // Update existing
            const index = templates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                templates[index] = { ...template, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new
            template.id = this.generateId();
            template.createdAt = new Date().toISOString();
            template.updatedAt = new Date().toISOString();
            templates.push(template);
        }
        
        return this.save(this.KEYS.TEMPLATES, templates);
    },

    /**
     * Xóa template
     */
    deleteTemplate(id) {
        let templates = this.getTemplates();
        templates = templates.filter(t => t.id !== id);
        return this.save(this.KEYS.TEMPLATES, templates);
    },

    // ==================== CATEGORIES ====================
    
    /**
     * Lấy tất cả categories
     */
    getCategories() {
        return this.load(this.KEYS.CATEGORIES, []);
    },

    /**
     * Lấy category theo ID
     */
    getCategory(id) {
        const categories = this.getCategories();
        return categories.find(c => c.id === id);
    },

    /**
     * Lưu category mới
     */
    saveCategory(category) {
        const categories = this.getCategories();
        
        if (category.id) {
            // Update existing
            const index = categories.findIndex(c => c.id === category.id);
            if (index !== -1) {
                categories[index] = { ...category, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new
            category.id = this.generateId();
            category.createdAt = new Date().toISOString();
            category.updatedAt = new Date().toISOString();
            categories.push(category);
        }
        
        return this.save(this.KEYS.CATEGORIES, categories);
    },

    /**
     * Xóa category
     */
    deleteCategory(id) {
        let categories = this.getCategories();
        categories = categories.filter(c => c.id !== id);
        
        // Xóa các tiêu chí thuộc category này
        let criteria = this.getCriteria();
        criteria = criteria.filter(cr => cr.categoryId !== id);
        this.save(this.KEYS.CRITERIA, criteria);
        
        return this.save(this.KEYS.CATEGORIES, categories);
    },

    // ==================== CRITERIA ====================
    
    /**
     * Lấy tất cả tiêu chí
     */
    getCriteria() {
        return this.load(this.KEYS.CRITERIA, []);
    },

    /**
     * Lấy tiêu chí theo category
     */
    getCriteriaByCategory(categoryId) {
        const criteria = this.getCriteria();
        return criteria.filter(c => c.categoryId === categoryId);
    },

    /**
     * Lấy tiêu chí theo ID
     */
    getCriterion(id) {
        const criteria = this.getCriteria();
        return criteria.find(c => c.id === id);
    },

    /**
     * Lưu tiêu chí mới
     */
    saveCriterion(criterion) {
        const criteria = this.getCriteria();
        
        if (criterion.id) {
            // Update existing
            const index = criteria.findIndex(c => c.id === criterion.id);
            if (index !== -1) {
                criteria[index] = { ...criterion, updatedAt: new Date().toISOString() };
            }
        } else {
            // Add new
            criterion.id = this.generateId();
            criterion.createdAt = new Date().toISOString();
            criterion.updatedAt = new Date().toISOString();
            criteria.push(criterion);
        }
        
        return this.save(this.KEYS.CRITERIA, criteria);
    },

    /**
     * Xóa tiêu chí
     */
    deleteCriterion(id) {
        let criteria = this.getCriteria();
        criteria = criteria.filter(c => c.id !== id);
        return this.save(this.KEYS.CRITERIA, criteria);
    },

    // ==================== COURSES ====================
    
    /**
     * Lấy danh sách học phần
     */
    getCourses() {
        return this.load(this.KEYS.COURSES, []);
    },

    /**
     * Lưu học phần
     */
    saveCourse(course) {
        const courses = this.getCourses();
        
        // Kiểm tra đã tồn tại chưa
        const exists = courses.find(c => 
            c.name === course.name && 
            c.class === course.class
        );
        
        if (!exists) {
            courses.unshift({
                name: course.name,
                class: course.class,
                group: course.group,
                lastUsed: new Date().toISOString()
            });
            
            // Giữ tối đa 20 học phần gần nhất
            if (courses.length > 20) {
                courses.pop();
            }
            
            return this.save(this.KEYS.COURSES, courses);
        }
        
        return true;
    },

    // ==================== HISTORY ====================
    
    /**
     * Lấy lịch sử
     */
    getHistory() {
        return this.load(this.KEYS.HISTORY, []);
    },

    /**
     * Lưu vào lịch sử
     */
    saveHistory(historyItem) {
        const history = this.getHistory();
        
        historyItem.id = this.generateId();
        historyItem.createdAt = new Date().toISOString();
        
        history.unshift(historyItem);
        
        // Giữ tối đa 50 lịch sử gần nhất
        if (history.length > 50) {
            history.pop();
        }
        
        return this.save(this.KEYS.HISTORY, history);
    },

    /**
     * Xóa lịch sử
     */
    deleteHistory(id) {
        let history = this.getHistory();
        history = history.filter(h => h.id !== id);
        return this.save(this.KEYS.HISTORY, history);
    },

    /**
     * Xóa toàn bộ lịch sử
     */
    clearHistory() {
        return this.save(this.KEYS.HISTORY, []);
    },

    // ==================== UTILITIES ====================
    
    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Export toàn bộ dữ liệu ra JSON
     */
    exportAll() {
        return {
            templates: this.getTemplates(),
            criteria: this.getCriteria(),
            courses: this.getCourses(),
            history: this.getHistory(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    },

    /**
     * Import dữ liệu từ JSON
     */
    importAll(data) {
        try {
            if (data.templates) {
                this.save(this.KEYS.TEMPLATES, data.templates);
            }
            if (data.criteria) {
                this.save(this.KEYS.CRITERIA, data.criteria);
            }
            if (data.courses) {
                this.save(this.KEYS.COURSES, data.courses);
            }
            if (data.history) {
                this.save(this.KEYS.HISTORY, data.history);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    /**
     * Khởi tạo dữ liệu mẫu (nếu chưa có)
     */
    initDefaultData() {
        // Tạo category mẫu nếu chưa có
        if (this.getCategories().length === 0) {
            const defaultCategory = {
                name: 'Chấm điểm Đồ án mặc định',
                description: 'Bộ tiêu chí mặc định cho chấm đồ án'
            };
            this.saveCategory(defaultCategory);
        }

        // Tạo template mẫu nếu chưa có
        if (this.getTemplates().length === 0) {
            const categories = this.getCategories();
            const defaultCategoryId = categories.length > 0 ? categories[0].id : null;
            
            const defaultTemplate = {
                name: 'Mẫu chấm điểm Đồ án - Mặc định',
                description: 'Mẫu cơ bản cho bảng điểm chấm đồ án',
                title1: 'TRƯỜNG ĐẠI HỌC CÔNG NGHỆ TP.HCM',
                title2: '        KHOA CÔNG NGHỆ THÔNG TIN',
                columns: ['STT', 'MÃ SV', 'Họ và tên'],
                categoryId: defaultCategoryId
            };
            this.saveTemplate(defaultTemplate);
        }

        // Tạo tiêu chí mẫu nếu chưa có
        if (this.getCriteria().length === 0) {
            const categories = this.getCategories();
            const defaultCategoryId = categories.length > 0 ? categories[0].id : null;
            
            const defaultCriteria = [
                {
                    name: 'Nội dung bài trình bày',
                    percentage: 50,
                    clo: 'CLO2',
                    description: 'Đánh giá nội dung và chất lượng bài trình bày',
                    categoryId: defaultCategoryId
                },
                {
                    name: 'Đánh giá kỹ năng trình bày',
                    percentage: 10,
                    clo: 'CLO3',
                    description: 'Đánh giá kỹ năng thuyết trình và giao tiếp',
                    categoryId: defaultCategoryId
                },
                {
                    name: 'Trả lời câu hỏi và trao đổi trong phần thảo luận',
                    percentage: 20,
                    clo: 'CLO2',
                    description: 'Đánh giá khả năng trả lời câu hỏi và thảo luận',
                    categoryId: defaultCategoryId
                },
                {
                    name: 'Làm việc theo nhóm',
                    percentage: 20,
                    clo: 'CLO3',
                    description: 'Đánh giá kỹ năng làm việc nhóm và phối hợp',
                    categoryId: defaultCategoryId
                }
            ];
            
            defaultCriteria.forEach(criterion => {
                this.saveCriterion(criterion);
            });
        }
    },

    /**
     * Lấy thống kê
     */
    getStats() {
        return {
            templates: this.getTemplates().length,
            categories: this.getCategories().length,
            criteria: this.getCriteria().length,
            courses: this.getCourses().length,
            history: this.getHistory().length
        };
    }
};

// Khởi tạo dữ liệu mẫu khi load trang
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.initDefaultData();
});
