// Action Track - Subscription & Spending Tracker
class ActionTracker {
    constructor() {
        this.subscriptions = this.loadData();
        this.monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 0;
        this.selectedFrequency = 'monthly';
        this.selectedPriority = 'Medium';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.calculateTotals();
        this.populateTable();

        // Set initial monthly income if saved
        if (this.monthlyIncome > 0) {
            document.getElementById('monthly-income').value = this.monthlyIncome;
        }
    }

    bindEvents() {
        // Monthly income input
        const monthlyIncomeInput = document.getElementById('monthly-income');
        monthlyIncomeInput.addEventListener('input', (e) => {
            this.monthlyIncome = parseFloat(e.target.value) || 0;
            localStorage.setItem('monthlyIncome', this.monthlyIncome);
            this.calculateTotals();
        });

        // Frequency buttons (radio-like behavior)
        document.getElementById('option-monthly').addEventListener('click', () => {
            this.selectFrequency('monthly');
        });
        document.getElementById('option-one-time').addEventListener('click', () => {
            this.selectFrequency('one-time');
        });

        // Priority buttons (radio-like behavior)
        document.getElementById('option-High').addEventListener('click', () => {
            this.selectPriority('High');
        });
        document.getElementById('option-Medium').addEventListener('click', () => {
            this.selectPriority('Medium');
        });
        document.getElementById('option-Low').addEventListener('click', () => {
            this.selectPriority('Low');
        });

        // Add subscription button
        const addButtons = document.querySelectorAll('.button');
        addButtons.forEach(button => {
            if (button.querySelector('.text-block')?.textContent.includes('Add Subscription')) {
                button.addEventListener('click', () => {
                    this.toggleAddForm();
                });
            }
        });

        // Confirm button - find the specific confirm button
        const confirmButtons = document.querySelectorAll('.button');
        confirmButtons.forEach(button => {
            if (button.querySelector('.text-block')?.textContent.includes('Confirm')) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.addSubscription();
                });
            }
        });
    }

    selectFrequency(frequency) {
        this.selectedFrequency = frequency;

        // Reset all frequency buttons to inactive
        document.getElementById('option-monthly').className = 'button in-active';
        document.getElementById('option-one-time').className = 'button in-active';

        // Activate selected frequency button
        if (frequency === 'monthly') {
            document.getElementById('option-monthly').className = 'button';
        } else if (frequency === 'one-time') {
            document.getElementById('option-one-time').className = 'button';
        }
    }

    selectPriority(priority) {
        this.selectedPriority = priority;

        // Reset all priority buttons to inactive
        document.getElementById('option-High').className = 'button in-active';
        document.getElementById('option-Medium').className = 'button in-active';
        document.getElementById('option-Low').className = 'button in-active';

        // Activate selected priority button
        if (priority === 'High') {
            document.getElementById('option-High').className = 'button';
        } else if (priority === 'Medium') {
            document.getElementById('option-Medium').className = 'button';
        } else if (priority === 'Low') {
            document.getElementById('option-Low').className = 'button';
        }
    }

    toggleAddForm() {
        const inputsDiv = document.querySelector('.inputs');
        const isHidden = inputsDiv.style.display === 'none';
        inputsDiv.style.display = isHidden ? 'block' : 'none';

        // Clear form when opening
        if (isHidden) {
            this.clearForm();
        }
    }

    clearForm() {
        document.getElementById('cost-name').value = '';
        document.getElementById('day').value = '';
        document.getElementById('cost').value = '';
        document.querySelector('#InputX input[type="text"]').value = '';
        this.selectFrequency('monthly');
        this.selectPriority('Medium');
    }

    addSubscription() {
        const name = document.getElementById('cost-name').value.trim();
        const day = parseInt(document.getElementById('day').value) || 1;
        const cost = parseFloat(document.getElementById('cost').value);
        const note = document.querySelector('#InputX input[type="text"]').value.trim();

        // Validation
        if (!name || !cost || cost <= 0) {
            alert('Please fill in name and cost fields');
            return;
        }

        if (day < 1 || day > 31) {
            alert('Please enter a valid day (1-31)');
            return;
        }

        // Create subscription object
        const subscription = {
            id: Date.now(),
            name,
            cost,
            frequency: this.selectedFrequency,
            day,
            note,
            priority: this.selectedPriority,
            dateAdded: new Date().toISOString()
        };

        // Add to subscriptions array
        this.subscriptions.push(subscription);
        this.saveData();

        // Update UI
        this.populateTable();
        this.calculateTotals();
        this.clearForm();

        // Hide form
        document.querySelector('.inputs').style.display = 'none';
    }

    removeSubscription(id) {
        this.subscriptions = this.subscriptions.filter(sub => sub.id !== id);
        this.saveData();
        this.populateTable();
        this.calculateTotals();
    }

    populateTable() {
        const tbody = document.querySelector('.fs-table_body');
        tbody.innerHTML = '';

        if (this.subscriptions.length === 0) {
            // Show placeholder row
            tbody.innerHTML = `
                <tr class="fs-table_row">
                    <td class="fs-table_cell">No subscriptions yet</td>
                    <td class="fs-table_cell">-</td>
                    <td class="fs-table_cell">-</td>
                    <td class="fs-table_cell">-</td>
                    <td class="fs-table_cell">-</td>
                    <td class="fs-table_cell">-</td>
                </tr>
            `;
            return;
        }

        this.subscriptions.forEach(sub => {
            const row = document.createElement('tr');
            row.className = 'fs-table_row';
            row.innerHTML = `
                <td class="fs-table_cell">${sub.name}</td>
                <td class="fs-table_cell">£${sub.cost.toFixed(2)}</td>
                <td class="fs-table_cell">${sub.frequency}</td>
                <td class="fs-table_cell">${sub.note || '-'}</td>
                <td class="fs-table_cell">${sub.priority}</td>
                <td class="fs-table_cell">
                    <button onclick="tracker.removeSubscription(${sub.id})" style="background: none; border: none; color: #ff4444; cursor: pointer; padding: 4px 8px;">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    calculateTotals() {
        let monthlyTotal = 0;
        let oneTimeTotal = 0;

        this.subscriptions.forEach(sub => {
            if (sub.frequency === 'monthly') {
                monthlyTotal += sub.cost;
            } else {
                oneTimeTotal += sub.cost;
            }
        });

        const totalCost = monthlyTotal + oneTimeTotal;
        const remaining = this.monthlyIncome - monthlyTotal;
        const remainingPercent = this.monthlyIncome > 0 ? (remaining / this.monthlyIncome) * 100 : 0;

        // Update UI
        document.getElementById('total').textContent = `£${totalCost.toFixed(2)}`;
        document.getElementById('remaining-number').textContent = `£${remaining.toFixed(2)}`;
        document.getElementById('remaining-percent').textContent = `${remainingPercent.toFixed(1)}%`;

        // Color coding for remaining amount
        const remainingElement = document.getElementById('remaining-number');
        if (remaining < 0) {
            remainingElement.style.color = '#ff4444';
        } else if (remaining < this.monthlyIncome * 0.1) {
            remainingElement.style.color = '#ffa500';
        } else {
            remainingElement.style.color = '#44ff44';
        }
    }

    updateUI() {
        // Initialize form as hidden
        document.querySelector('.inputs').style.display = 'none';

        // Set default button states - start with all inactive except defaults
        this.selectFrequency('monthly');
        this.selectPriority('Medium');
    }

    saveData() {
        localStorage.setItem('actionTrackSubscriptions', JSON.stringify(this.subscriptions));
    }

    loadData() {
        const saved = localStorage.getItem('actionTrackSubscriptions');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tracker = new ActionTracker();
});