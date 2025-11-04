/**
 * Score Calculator - Tính toán và phân bổ điểm
 * Các thuật toán phân bổ điểm cho tiêu chí
 */

const ScoreCalculator = {
    /**
     * Làm tròn điểm về bội số của 0.5
     */
    roundToHalf(score) {
        return Math.round(score * 2) / 2;
    },

    /**
     * Thuật toán phân bổ đều
     * Tất cả các tiêu chí được điểm đều nhau
     */
    evenDistribution(totalScore, criteria) {
        const scores = {};
        
        criteria.forEach(criterion => {
            // Điểm thô = điểm tổng
            // Luôn hiển thị 0.0 nếu là 0 (không để trống để tránh gian lận thêm số 1 thành 10.0)
            scores[criterion.id] = this.roundToHalf(totalScore);
        });

        return scores;
    },

    /**
     * Thuật toán ngẫu nhiên có biên độ
     * Điểm các tiêu chí dao động ngẫu nhiên nhưng vẫn đảm bảo tổng đúng
     */
    randomDistribution(totalScore, criteria) {
        const scores = {};
        const variation = 1.0; // Biên độ dao động ±1.0 điểm
        
        // Tạo điểm ngẫu nhiên cho mỗi tiêu chí
        criteria.forEach(criterion => {
            const random = (Math.random() - 0.5) * 2 * variation; // -variation đến +variation
            let score = totalScore + random;
            
            // Giới hạn trong khoảng [0, 10]
            score = Math.max(0, Math.min(10, score));
            
            scores[criterion.id] = this.roundToHalf(score);
        });

        return scores;
    },

    /**
     * Thuật toán theo trọng số ưu tiên
     * Điểm cao hơn cho tiêu chí có % cao hơn
     */
    weightedDistribution(totalScore, criteria) {
        const scores = {};
        
        // Sắp xếp tiêu chí theo % giảm dần
        const sortedCriteria = [...criteria].sort((a, b) => b.percentage - a.percentage);
        
        // Tính điểm cho từng tiêu chí
        sortedCriteria.forEach((criterion, index) => {
            // Tiêu chí có % cao hơn được điểm cao hơn một chút
            const bonus = (sortedCriteria.length - index - 1) * 0.3;
            let score = totalScore + bonus;
            
            // Giới hạn trong khoảng [0, 10]
            score = Math.max(0, Math.min(10, score));
            
            scores[criterion.id] = this.roundToHalf(score);
        });

        return scores;
    },

    /**
     * Tính điểm cho từng sinh viên theo thuật toán
     */
    calculateScores(students, criteria, algorithm) {
        const results = [];

        students.forEach(student => {
            // Check if student is absent
            if (student.isAbsent) {
                // All criteria scores are 'V' (Vắng)
                const criteriaScores = {};
                const weightedScores = {};
                
                criteria.forEach(criterion => {
                    criteriaScores[criterion.id] = 'V';
                    weightedScores[criterion.id] = 'V';
                });
                
                results.push({
                    studentId: student.id,
                    mssv: student.mssv,
                    name: student.name,
                    originalScore: 'V',
                    criteriaScores: criteriaScores,
                    weightedScores: weightedScores,
                    calculatedTotal: 'V',
                    difference: 0,
                    isAbsent: true
                });
                return;
            }
            
            const totalScore = parseFloat(student.score) || 0;
            
            let criteriaScores;
            switch (algorithm) {
                case 'random':
                    criteriaScores = this.randomDistribution(totalScore, criteria);
                    break;
                case 'weighted':
                    criteriaScores = this.weightedDistribution(totalScore, criteria);
                    break;
                case 'even':
                default:
                    criteriaScores = this.evenDistribution(totalScore, criteria);
                    break;
            }

            // Tính điểm sau khi nhân hệ số
            const weightedScores = {};
            let calculatedTotal = 0;

            criteria.forEach(criterion => {
                const score = criteriaScores[criterion.id];
                const weightedScore = score * (criterion.percentage / 100);
                weightedScores[criterion.id] = weightedScore;
                calculatedTotal += weightedScore;
            });

            // Làm tròn tổng điểm tính được
            calculatedTotal = this.roundToHalf(calculatedTotal);

            // Tính chênh lệch
            const difference = this.roundToHalf(calculatedTotal - totalScore);

            results.push({
                studentId: student.id,
                mssv: student.mssv,
                name: student.name,
                originalScore: totalScore,
                criteriaScores: criteriaScores,
                weightedScores: weightedScores,
                calculatedTotal: calculatedTotal,
                difference: difference,
                isAbsent: false
            });
        });

        return results;
    },

    /**
     * Tối ưu hóa điểm để giảm thiểu chênh lệch
     * Điều chỉnh điểm các tiêu chí để tổng sau khi nhân % gần với điểm gốc nhất
     */
    optimizeScores(students, criteria, maxIterations = 100) {
        const results = [];

        students.forEach(student => {
            // Check if student is absent
            if (student.isAbsent) {
                // All criteria scores are 'V' (Vắng)
                const criteriaScores = {};
                const weightedScores = {};
                
                criteria.forEach(criterion => {
                    criteriaScores[criterion.id] = 'V';
                    weightedScores[criterion.id] = 'V';
                });
                
                results.push({
                    studentId: student.id,
                    mssv: student.mssv,
                    name: student.name,
                    originalScore: 'V',
                    criteriaScores: criteriaScores,
                    weightedScores: weightedScores,
                    calculatedTotal: 'V',
                    difference: 0,
                    isAbsent: true
                });
                return;
            }
            
            const targetScore = parseFloat(student.score) || 0;
            
            // Khởi tạo điểm ban đầu (tất cả bằng target)
            let bestScores = {};
            criteria.forEach(criterion => {
                bestScores[criterion.id] = targetScore;
            });

            let bestDiff = Infinity;

            // Thử nhiều lần để tìm bộ điểm tốt nhất
            for (let iter = 0; iter < maxIterations; iter++) {
                const currentScores = {};
                
                criteria.forEach(criterion => {
                    // Tạo điểm ngẫu nhiên trong khoảng hợp lý
                    const min = Math.max(0, targetScore - 2);
                    const max = Math.min(10, targetScore + 2);
                    const randomScore = min + Math.random() * (max - min);
                    currentScores[criterion.id] = this.roundToHalf(randomScore);
                });

                // Tính tổng sau khi nhân %
                let total = 0;
                criteria.forEach(criterion => {
                    total += currentScores[criterion.id] * (criterion.percentage / 100);
                });
                total = this.roundToHalf(total);

                const diff = Math.abs(total - targetScore);

                // Nếu tìm được bộ điểm tốt hơn
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestScores = { ...currentScores };
                }

                // Nếu đã đạt điểm chính xác thì dừng
                if (diff === 0) {
                    break;
                }
            }

            // Tính điểm sau khi nhân hệ số
            const weightedScores = {};
            let calculatedTotal = 0;

            criteria.forEach(criterion => {
                const score = bestScores[criterion.id];
                const weightedScore = score * (criterion.percentage / 100);
                weightedScores[criterion.id] = weightedScore;
                calculatedTotal += weightedScore;
            });

            calculatedTotal = this.roundToHalf(calculatedTotal);
            const difference = this.roundToHalf(calculatedTotal - targetScore);

            results.push({
                studentId: student.id,
                mssv: student.mssv,
                name: student.name,
                originalScore: targetScore,
                criteriaScores: bestScores,
                weightedScores: weightedScores,
                calculatedTotal: calculatedTotal,
                difference: difference
            });
        });

        return results;
    },

    /**
     * Format điểm hiển thị
     * Điểm 0 hiển thị là 00.0 để tránh gian lận thêm số 1 thành 10.0
     */
    formatScore(score) {
        if (score === null || score === undefined) return '-';
        if (score === 'V' || score === 'VẮNG') return 'V';
        if (typeof score === 'string') return score;
        
        const numScore = parseFloat(score);
        if (numScore === 0) {
            return '00.0';
        }
        return numScore.toFixed(1);
    },

    /**
     * Kiểm tra điểm hợp lệ
     */
    isValidScore(score) {
        const num = parseFloat(score);
        return !isNaN(num) && num >= 0 && num <= 10;
    },

    /**
     * Generate màu cho chênh lệch
     */
    getDifferenceColor(diff) {
        if (diff === 0) return 'success';
        if (Math.abs(diff) <= 0.5) return 'warning';
        return 'danger';
    },

    /**
     * Tính thống kê
     */
    calculateStatistics(results) {
        if (!results || results.length === 0) {
            return null;
        }

        // Filter out absent students for statistics
        const presentResults = results.filter(r => !r.isAbsent);
        const absentCount = results.filter(r => r.isAbsent).length;
        
        if (presentResults.length === 0) {
            return {
                totalStudents: results.length,
                absentStudents: absentCount,
                averageScore: '-',
                maxScore: '-',
                minScore: '-',
                averageDifference: '-',
                maxDifference: '-',
                perfectMatches: 0
            };
        }

        const scores = presentResults.map(r => r.originalScore);
        const differences = presentResults.map(r => Math.abs(r.difference));

        return {
            totalStudents: results.length,
            absentStudents: absentCount,
            averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores),
            averageDifference: (differences.reduce((a, b) => a + b, 0) / differences.length).toFixed(2),
            maxDifference: Math.max(...differences),
            perfectMatches: differences.filter(d => d === 0).length
        };
    }
};

// Export cho sử dụng global
window.ScoreCalculator = ScoreCalculator;
