/**
 * Result Manager - Quản lý kết quả tạo bảng điểm
 */

const ResultManager = {
    currentScoreData: null,
    currentConfig: null,
    
    /**
     * Set current result data
     */
    setCurrentResult(scoreData, config) {
        this.currentScoreData = scoreData;
        this.currentConfig = config;
    },
    
    /**
     * Get current result data
     */
    getCurrentResult() {
        return {
            scoreData: this.currentScoreData,
            config: this.currentConfig
        };
    },
    
    /**
     * Open result modal
     */
    openResultModal(results, template, criteria, config) {
        // Store data
        this.setCurrentResult(results, config);
        
        // Create modal if not exists
        let modal = document.getElementById('resultModal');
        if (!modal) {
            modal = UIManager.createResultModal();
        }
        
        // Render content
        const container = document.getElementById('result-modal-body');
        if (container) {
            container.innerHTML = UIManager.renderResultTable(results, template, criteria, config);
        }
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    },
    
    /**
     * Export to Excel
     */
    exportToExcel() {
        if (!this.currentScoreData || !this.currentConfig) {
            alert('Chưa có dữ liệu để xuất!');
            return;
        }
        
        try {
            const filename = ExcelExporter.exportScoreTable(this.currentScoreData, {
                results: this.currentScoreData,
                template: this.currentConfig.template,
                criteria: this.currentConfig.criteria,
                courseName: this.currentConfig.courseName,
                className: this.currentConfig.className,
                groupName: this.currentConfig.groupName
            });
            
            UIManager.showToast(`Đã xuất file ${filename} thành công!`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            alert('Có lỗi khi xuất file Excel: ' + error.message);
        }
    },
    
    /**
     * Export to Google Sheets directly
     */
    async exportToGoogleSheets() {
        if (!this.currentScoreData || !this.currentConfig) {
            alert('Chưa có dữ liệu để xuất!');
            return;
        }
        
        try {
            UIManager.showLoading();
            
            await ExcelExporter.exportToGoogleSheets(this.currentScoreData, {
                results: this.currentScoreData,
                template: this.currentConfig.template,
                criteria: this.currentConfig.criteria,
                courseName: this.currentConfig.courseName,
                className: this.currentConfig.className,
                groupName: this.currentConfig.groupName
            });
            
            UIManager.hideLoading();
            UIManager.showToast('Đã tạo file Excel. Làm theo hướng dẫn để import lên Google Sheets!', 'success');
        } catch (error) {
            UIManager.hideLoading();
            console.error('Export error:', error);
            alert('Có lỗi khi xuất: ' + error.message);
        }
    },
    
    /**
     * Export to PDF
     */
    exportToPDF() {
        if (!this.currentScoreData || !this.currentConfig) {
            alert('Chưa có dữ liệu để xuất!');
            return;
        }
        
        try {
            const filename = ExcelExporter.exportToPDF(this.currentScoreData, {
                results: this.currentScoreData,
                template: this.currentConfig.template,
                criteria: this.currentConfig.criteria,
                courseName: this.currentConfig.courseName,
                className: this.currentConfig.className,
                groupName: this.currentConfig.groupName
            });
            
            UIManager.showToast(`Đã xuất file ${filename} thành công!`, 'success');
        } catch (error) {
            console.error('Export error:', error);
            alert('Có lỗi khi xuất file PDF: ' + error.message);
        }
    },
    
    /**
     * Save to history
     */
    saveToHistory() {
        if (!this.currentScoreData || !this.currentConfig) {
            alert('Chưa có dữ liệu để lưu!');
            return;
        }
        
        const historyItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            courseName: this.currentConfig.courseName,
            className: this.currentConfig.className,
            groupName: this.currentConfig.groupName,
            templateName: this.currentConfig.template.name,
            templateId: this.currentConfig.templateId,
            categoryId: this.currentConfig.template.categoryId,
            algorithm: this.currentConfig.algorithm,
            studentCount: this.currentScoreData.length,
            criteria: this.currentConfig.criteria,
            results: this.currentScoreData,
            config: this.currentConfig
        };
        
        StorageManager.saveHistory(historyItem);
        
        UIManager.showToast('Đã lưu vào lịch sử thành công!', 'success');
        
        // Update history list if on history page
        if (document.getElementById('history')?.classList.contains('active')) {
            HistoryManager.loadHistoryList();
        }
    },
    
    /**
     * Clear current result
     */
    clearResult() {
        this.currentScoreData = null;
        this.currentConfig = null;
    }
};

// Export for global use
window.ResultManager = ResultManager;
