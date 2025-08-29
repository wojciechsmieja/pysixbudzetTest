document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('.table-container tbody');
    if (!tableBody) {
        console.error("Nie znaleziono ciała tabeli (tbody).");
        return;
    }

    // Pobierz bieżący typ dokumentu z adresu URL
    const typ = new URLSearchParams(window.location.search).get('typ') || 'Przychody';

    // Przechowuje oryginalny stan wiersza podczas edycji
    let originalRowHTML = {};

    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const row = target.closest('tr');
        if (!row) return;

        const id = row.dataset.id;

        // --- Obsługa przycisku "Edytuj" ---
        if (target.classList.contains('edit')) {
            const currentlyEditing = document.querySelector('.edit-mode');
            if (currentlyEditing) {
                const oldId = currentlyEditing.dataset.id;
                currentlyEditing.innerHTML = originalRowHTML[oldId];
                currentlyEditing.classList.remove('edit-mode');
                delete originalRowHTML[oldId];
            }

            originalRowHTML[id] = row.innerHTML;
            row.classList.add('edit-mode');

            const cells = Array.from(row.querySelectorAll('td'));
            const headers = Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());

            cells.forEach((cell, index) => {
                const columnName = headers[index];
                if (columnName === 'lp.' || columnName === 'Akcje') return;
                const originalValue = cell.textContent.trim();
                cell.innerHTML = `<input type="text" value="${originalValue}">`;
            });

            const actionsCell = row.querySelector('.actions');
            if (actionsCell) {
                actionsCell.innerHTML = `
                    <button class="save">Zapisz</button>
                    <button class="cancel">Anuluj</button>
                `;
            }
        }

        // --- Obsługa przycisku "Anuluj" ---
        if (target.classList.contains('cancel')) {
            row.innerHTML = originalRowHTML[id];
            row.classList.remove('edit-mode');
            delete originalRowHTML[id];
        }

        // --- Obsługa przycisku "Zapisz" ---
        if (target.classList.contains('save')) {
            const inputs = Array.from(row.querySelectorAll('input'));
            const headers = Array.from(document.querySelectorAll('th')).map(th => th.textContent.trim());
            const updatedData = {};

            let inputIndex = 0;
            headers.forEach(columnName => {
                if (columnName !== 'lp.' && columnName !== 'Akcje') {
                    if (inputs[inputIndex]) {
                        updatedData[columnName] = inputs[inputIndex].value;
                    }
                    inputIndex++;
                }
            });

            try {
                const response = await fetch(`/api/documents/${id}?typ=${typ}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Błąd serwera bez dodatkowych informacji.' }));
                    throw new Error(errorData.message || 'Błąd podczas zapisywania zmian.');
                }

                const cells = Array.from(row.querySelectorAll('td'));
                inputIndex = 0;
                cells.forEach((cell, cellIndex) => {
                    const columnName = headers[cellIndex];
                    if (columnName !== 'lp.' && columnName !== 'Akcje') {
                        cell.innerHTML = '';
                        cell.textContent = inputs[inputIndex].value;
                        inputIndex++;
                    }
                });

                const actionsCell = row.querySelector('.actions');
                if (actionsCell) {
                    actionsCell.innerHTML = `
                        <button class="edit">Edytuj</button>
                        <button class="delete">Usuń</button>
                    `;
                }

                row.classList.remove('edit-mode');
                delete originalRowHTML[id];

            } catch (error) {
                console.error('Błąd zapisu:', error);
                alert(`Nie udało się zapisać zmian: ${error.message}`);
                row.innerHTML = originalRowHTML[id];
                row.classList.remove('edit-mode');
                delete originalRowHTML[id];
            }
        }

        // --- Obsługa przycisku "Usuń" ---
        if (target.classList.contains('delete')) {
            if (confirm(`Czy na pewno chcesz usunąć wiersz o lp. ${id}?`)) {
                try {
                    const response = await fetch(`/api/documents/${id}?typ=${typ}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'Błąd serwera bez dodatkowych informacji.' }));
                        throw new Error(errorData.message || 'Błąd podczas usuwania wiersza.');
                    }
                    
                    row.remove();

                } catch (error) {
                    console.error('Błąd usuwania:', error);
                    alert(`Nie udało się usunąć wiersza: ${error.message}`);
                }
            }
        }
    });
});