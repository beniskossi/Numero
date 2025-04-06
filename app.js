class NumeroApp {
    constructor() {
        this.currentCategory = 'GH18';
        this.db = null;
        this.data = null; // Les données seront chargées depuis IndexedDB
        this.initDB().then(() => this.loadData());
    }

    // Initialiser la base de données IndexedDB
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('numeroDB', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                console.error('Erreur lors de l\'ouverture de IndexedDB :', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Charger les données depuis IndexedDB
    loadData() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de données non initialisée'));
                return;
            }

            const transaction = this.db.transaction(['data'], 'readonly');
            const store = transaction.objectStore('data');
            const request = store.get('numeroData');

            request.onsuccess = (event) => {
                this.data = event.target.result?.value || {
                    GH18: {}, CIV10: {}, CIV13: {}, CIV16: {}
                };
                resolve(this.data);
            };

            request.onerror = (event) => {
                console.error('Erreur lors du chargement des données :', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Sauvegarder les données dans IndexedDB
    saveData() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de données non initialisée'));
                return;
            }

            const transaction = this.db.transaction(['data'], 'readwrite');
            const store = transaction.objectStore('data');
            const request = store.put({ key: 'numeroData', value: this.data });

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                console.error('Erreur lors de la sauvegarde des données :', event.target.error);
                reject(event.target.error);
            };
        });
    }

    initEventListeners() {
        const saveEntryBtn = document.getElementById('saveEntry');
        const searchNumberInput = document.getElementById('searchNumber');
        const resetDataBtn = document.getElementById('resetData');
        const installBtn = document.getElementById('installBtn');
        const exportDataBtn = document.getElementById('exportData');
        const importDataBtn = document.getElementById('importData');
        const importFileInput = document.getElementById('importFile');

        if (!saveEntryBtn || !searchNumberInput || !resetDataBtn || !installBtn || !exportDataBtn || !importDataBtn || !importFileInput) {
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
        exportDataBtn.addEventListener('click', () => this.exportData());
        importDataBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (event) => this.importData(event));

        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('Événement beforeinstallprompt déclenché');
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('Résultat de l\'installation :', outcome);
                deferredPrompt = null;
            } else {
                alert('L\'installation automatique n\'est pas disponible. Sur iOS, utilisez "Ajouter à l\'écran d\'accueil" depuis le menu de partage de votre navigateur.');
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

    async saveEntry() {
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

        try {
            await this.saveData();
            this.updateDisplay();
            alert('Donnée enregistrée avec succès !');
        } catch (err) {
            alert('Erreur lors de la sauvegarde : ' + err.message);
        }
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
        const confirmFirst = confirm(`Voulez-vous vraiment réinitialiser ${this.currentCategory} ?`);
        if (confirmFirst) {
            const confirmSecond = confirm('Attention : Cette action est irréversible. Confirmez-vous la réinitialisation ?');
            if (confirmSecond) {
                this.data[this.currentCategory] = {};
                this.saveData().then(() => {
                    this.updateDisplay();
                    alert('Données réinitialisées avec succès.');
                }).catch(err => {
                    alert('Erreur lors de la réinitialisation : ' + err.message);
                });
            }
        }
    }

    exportData() {
        const dataStr = JSON.stringify(this.data);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'numero-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Données exportées avec succès !');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Vérifier que les données importées ont la structure correcte
                if (importedData && typeof importedData === 'object' &&
                    ['GH18', 'CIV10', 'CIV13', 'CIV16'].every(cat => cat in importedData)) {
                    this.data = importedData;
                    this.saveData().then(() => {
                        this.updateDisplay();
                        alert('Données importées avec succès !');
                    }).catch(err => {
                        alert('Erreur lors de l\'importation : ' + err.message);
                    });
                } else {
                    alert('Erreur : Le fichier importé n\'a pas la structure attendue.');
                }
            } catch (err) {
                alert('Erreur lors de l\'importation : ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const app = new NumeroApp();
    // Attendre que la base de données soit initialisée avant d'ajouter les écouteurs d'événements
    await app.initDB();
    await app.loadData();
    app.initEventListeners();
});
