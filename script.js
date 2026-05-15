class WaterTracker {
    constructor() {
        this.dailyGoal = 2000;
        this.currentAmount = 0;
        this.drinkCount = 0;
        this.lastDrinkTime = null;
        this.reminderInterval = null;
        this.drinkHistory = [];
        
        this.init();
        this.loadData();
        this.updateDisplay();
    }

    init() {
        this.setupEventListeners();
        this.checkNewDay();
    }

    setupEventListeners() {
        // Quick add buttons
        document.querySelectorAll('.add-water-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.addWater(amount);
            });
        });

        // Custom amount
        document.getElementById('addCustom').addEventListener('click', () => {
            const customAmount = document.getElementById('customAmount');
            const amount = parseInt(customAmount.value);
            if (amount && amount > 0) {
                this.addWater(amount);
                customAmount.value = '';
            }
        });

        // Enter key for custom input
        document.getElementById('customAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('addCustom').click();
            }
        });

        // Reminder toggle
        document.getElementById('reminderToggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.requestNotificationPermission();
                this.startReminder();
            } else {
                this.stopReminder();
            }
        });

        // Reminder interval change
        document.getElementById('intervalSelect').addEventListener('change', (e) => {
            if (document.getElementById('reminderToggle').checked) {
                this.stopReminder();
                this.startReminder();
            }
        });

        // Reset button
        document.getElementById('resetDay').addEventListener('click', () => {
            if (confirm('确定要重置今日数据吗？')) {
                this.resetDay();
            }
        });
    }

    addWater(amount) {
        this.currentAmount += amount;
        this.drinkCount++;
        this.lastDrinkTime = new Date();
        this.drinkHistory.push({
            amount: amount,
            time: this.lastDrinkTime
        });

        this.saveData();
        this.updateDisplay();
        this.showAddAnimation();

        if (this.currentAmount >= this.dailyGoal) {
            this.showGoalReached();
        }
    }

    updateDisplay() {
        // Update water amount
        document.getElementById('waterAmount').textContent = `${this.currentAmount} ml`;
        
        // Update progress
        const progress = Math.min((this.currentAmount / this.dailyGoal) * 100, 100);
        document.getElementById('progressBar').style.width = `${progress}%`;
        
        // Update water level in bottle
        const waterLevel = Math.min((this.currentAmount / this.dailyGoal) * 180, 180);
        document.getElementById('waterLevel').style.height = `${waterLevel}px`;
        
        // Update stats
        document.getElementById('drinkCount').textContent = this.drinkCount;
        document.getElementById('lastDrink').textContent = this.lastDrinkTime 
            ? this.formatTime(this.lastDrinkTime) 
            : '--:--';
        document.getElementById('avgIntake').textContent = this.drinkCount > 0 
            ? Math.round(this.currentAmount / this.drinkCount) 
            : 0;
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showAddAnimation() {
        const waterLevel = document.getElementById('waterLevel');
        waterLevel.style.animation = 'none';
        setTimeout(() => {
            waterLevel.style.animation = 'wave 3s linear infinite';
        }, 10);
    }

    showGoalReached() {
        const notification = document.getElementById('notification');
        const notificationText = notification.querySelector('.notification-text');
        notificationText.textContent = '恭喜！您已达到今日饮水目标！🎉';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    startReminder() {
        const interval = parseInt(document.getElementById('intervalSelect').value) * 60 * 1000;
        
        this.reminderInterval = setInterval(() => {
            this.showReminder();
        }, interval);
        
        // Save reminder state
        localStorage.setItem('reminderEnabled', 'true');
    }

    stopReminder() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
        localStorage.setItem('reminderEnabled', 'false');
    }

    showReminder() {
        const notification = document.getElementById('notification');
        const notificationText = notification.querySelector('.notification-text');
        notificationText.textContent = '该喝水啦！保持水分很重要哦～';
        notification.classList.add('show');
        
        // Also show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('健康喝水提醒', {
                body: '该喝水啦！记得保持水分～',
                icon: '💧'
            });
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    saveData() {
        const data = {
            currentAmount: this.currentAmount,
            drinkCount: this.drinkCount,
            lastDrinkTime: this.lastDrinkTime,
            drinkHistory: this.drinkHistory,
            date: new Date().toDateString()
        };
        localStorage.setItem('waterTrackerData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('waterTrackerData');
        if (savedData) {
            let data;
            try {
                data = JSON.parse(savedData);
            } catch {
                localStorage.removeItem('waterTrackerData');
                return;
            }
            
            // Check if it's a new day
            if (data.date === new Date().toDateString()) {
                this.currentAmount = data.currentAmount || 0;
                this.drinkCount = data.drinkCount || 0;
                this.lastDrinkTime = data.lastDrinkTime ? new Date(data.lastDrinkTime) : null;
                this.drinkHistory = data.drinkHistory || [];
            }
        }

        // Load reminder state
        const reminderEnabled = localStorage.getItem('reminderEnabled') === 'true';
        document.getElementById('reminderToggle').checked = reminderEnabled;
        if (reminderEnabled) {
            this.startReminder();
        }
    }

    checkNewDay() {
        // Check every hour if it's a new day
        setInterval(() => {
            const savedData = localStorage.getItem('waterTrackerData');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.date !== new Date().toDateString()) {
                    this.resetDay();
                }
            }
        }, 3600000); // 1 hour
    }

    resetDay() {
        this.currentAmount = 0;
        this.drinkCount = 0;
        this.lastDrinkTime = null;
        this.drinkHistory = [];
        this.saveData();
        this.updateDisplay();
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WaterTracker();
});
