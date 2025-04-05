// app.js
class NumeroApp {
    constructor() {
        this.currentCategory = 'GH18';
        this.data = this.loadData();
    }

    loadData() {
        return JSON.parse(localStorage.getItem('numeroData')) || {
            GH18: {}, CIV10: {}, CIV13: {}, CIV16: {}
        };
    }

    saveData() {
        localStorage.setItem('numeroData', JSON.stringify(this.data));
    }

    initEventListeners() {
        const saveEntryBtn = document.getElementById('saveEntry');
        const searchNumberInput = document.getElementById('searchNumber');
        const resetDataBtn = document.getElementById('resetData');
        const installBtn = document.getElementById('installBtn');

        if (!saveEntryBtn || !searchNumberInput || !resetDataBtn || !installBtn) {
            console.error('Un ou plusieurs éléments du DOM sont introuvables');
            return;
        }

        document.querySelectorAll('.category-nav button').forEach(btn => {
            btn.addEventListener('click', () => this.switchCategory(btn.dataset.cat));
        });

        document.querySelectorAll('.submenu button').forEach(btn => {
            btn.addEventListener('click', () => this.switchMenu(btn.dataset.menu));
        });

        saveEntryBtn.addEventListener('click', () => this.saveEntry());
        searchNumberInput.addEventListener('input', () => this.showConsult());
        resetDataBtn.addEventListener('click', () => this.resetCategory());

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
            }
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-nav button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === category);
        });
        this.updateDisplay();
    }

    switchMenu(menu) {
        document.querySelectorAll('.submenu button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.menu === menu);
        });
        document.querySelectorAll('.content').forEach(section => {
            section.classList.toggle('active', section.id === menu);
        });
        this.updateDisplay();
    }
saveEntry() {
    const numberInput = document.getElementById('numberInput');
    const criterionSelect = document.getElementById('criterionSelect');
    const dataInput = document.getElementById('dataInput');

    const numberValue = parseInt(numberInput.value);
    const criterion = criterionSelect.value;
    const value = parseInt(dataInput.value);

    if (isNaN(numberValue) || numberValue < 0 || numberValue > 999) {
        alert('Veuillez entrer un nombre valide (000-999).');
        return;
    }
    if (isNaN(value) || value < 0 || value > 9) {
        alert('Veuillez entrer une donnée valide (0-9).');
        return;
    }

    const number = numberValue.toString().padStart(3, '0');

    if (!this.data[this.currentCategory][number]) {
        this.data[this.currentCategory][number] = {};
    }

    if (!this.data[this.currentCategory][number][criterion]) {
        this.data[this.currentCategory][number][criterion] = [];
    }

    this.data[this.currentCategory][number][criterion].push(value);

    // Réinitialiser les champs après l'enregistrement
    numberInput.value = '';
    criterionSelect.value = 'P1';
    dataInput.value = '';

    this.saveData();
    this.updateDisplay();

    // Message de confirmation
    alert('Donnée enregistrée avec succès !');
}

    showConsult() {
        const number = document.getElementById('searchNumber').value.padStart(3, '0');
        const results = document.getElementById('consultResults');
        results.innerHTML = '';

        if (this.data[this.currentCategory][number]) {
            const data = this.data[this.currentCategory][number];
            results.innerHTML = Object.entries(data)
                .map(([crit, values]) => `<p>${crit}: ${values.join(', ')}</p>`)
                .join('');
        }
    }

    updateDisplay() {
        const stats = document.getElementById('statsDisplay');
        stats.innerHTML = '';
        const categoryData = this.data[this.currentCategory];
        Object.entries(categoryData).forEach(([number, criteria]) => {
            stats.innerHTML += `<div>
                <h3>${number}</h3>
                ${Object.entries(criteria).map(([c, v]) => `<p>${c}: ${v.length} entrées</p>`).join('')}
            </div>`;
        });
    }

    resetCategory() {
        if (confirm(`Voulez-vous vraiment réinitialiser ${this.currentCategory} ?`)) {
            this.data[this.currentCategory] = {};
            this.saveData();
            this.updateDisplay();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new NumeroApp();
    app.initEventListeners();
});