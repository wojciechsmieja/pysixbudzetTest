//robie aby po nacisnięciu przyisku "edytuj" pojawiał się formularz do zmiany wartości w tabeli
let editingRow = null;
let originalData = [];
let closeFormOutsideClickerListener = null;
const columnTypesIncome = {
    1: "text", // nr dokumentu
    2: "text", // kontrahent
    3: "text",//rodzaj
    4: "date", //data wystawienia
    5: "date",//termin płatności
    6: "number",//zaplacono
    7: "number",//pozostalo
    8: "number",//razem
    9: "number",//kwota netto
    10: "text",//metoda plATNOSCI
    11: "text",//etykiety
}
const columnTypesOutcome = {
    1: "text", // nr dokumentu
    2: "text", // kontrahent
    3: "date",//data wystawienia
    4: "date", //termin platnosci
    5: "number",//zaplacono
    6: "number",//pozostalo
    7: "number",//razem
    8: "number",//kwota netto
    9: "number",//kwota vat
    10: "text",//etykiety
}

document.addEventListener("DOMContentLoaded", function () {
    //truncate file
    const truncateBtn = document.getElementById('truncate_table');
    if (truncateBtn){
        truncateBtn.addEventListener('click', truncate);
    }
    //download button
    const downloadBtn = document.getElementById("download_table");
    if(downloadBtn){
        downloadBtn.addEventListener('click', downloadTable);
    }
    //DODawanie rekordu
    const guzikExpense = document.querySelector(".submit-add-expense-record-btn");
    const guzikIncome = document.querySelector(".submit-add-income-record-btn");
    if(guzikExpense){
        guzikExpense.addEventListener('click', (event)=>{AddRecord(event);closeForm();});
    }
    if(guzikIncome){
        guzikIncome.addEventListener('click', (event)=>{AddRecord(event);closeForm();});
    }
    const cancelButtons = document.querySelectorAll(".cancel-add-record-btn");
    cancelButtons.forEach(btn => {
        btn.addEventListener('click',closeForm);
    })
    //odwolanie do tabeli
    const table = document.querySelector("table");
    //odwolanie do th
    const headers = table.querySelectorAll("th.sortable");


    let currentSortColumn = -1;
    let currentSortOrder = 'asc';

    headers.forEach(header => {
        header.addEventListener('click', function(){
            const columnIndex = parseInt(this.dataset.columnIndex);
            if(currentSortColumn === columnIndex){
                currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
            }else{
                currentSortColumn = columnIndex;
                currentSortOrder = 'asc';
            }
            headers.forEach(h =>{
                h.classList.remove('asc','desc');
            });
            this.classList.add(currentSortOrder);
            sortTable(columnIndex, currentSortOrder);
        });
    });
    
    table.addEventListener("click", function (e) {
        const btn = e.target;

        //Click Edit button
        if (btn.classList.contains("edit-btn") && !editingRow) {
            const row = btn.closest("tr");
            editingRow = row;
            originalData = [];
            row.classList.add("editing");

            const type = document.querySelector("input[name='typ']").value;
            const columnTypes = type === "Przychody" ? columnTypesIncome : columnTypesOutcome;

            row.querySelectorAll("td").forEach((cell, index) => {
                if (index < row.cells.length - 1) {
                    const value = cell.textContent.trim();
                    originalData.push(value);
                    const inputType = columnTypes[index + 1] || "text";
                    cell.innerHTML = `<input type="${inputType}" data-type="${inputType}" value="${value}" />`;
                }
            });

            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Anuluj";
            cancelBtn.classList.add("cancel-btn");

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Zapisz";
            saveBtn.classList.add("save-btn");

            cell.appendChild(cancelBtn);
            cell.appendChild(saveBtn);
        }
        //Click Save button
        else if (btn.classList.contains("save-btn") && editingRow) {
            //odwolanie do wiersza, pobranie wartosci z inputow i walidacja
            const row = editingRow;
            const inputs = row.querySelectorAll("input");
            const kontrahent = row.dataset.kontrahent;
            const index = row.dataset.index;
            if (!kontrahent) {
                alert("Kontrahent nie może być pusty!");
                return;
            }
            if (!index){
                alert("Indeks nie może być pusty!");
                return;
            }

            if(!validateRow()){
                return;
            }
            //pobranie naglowkow i wartosci z inputow
            const naglowki =[];
            const wartosci =[];


            inputs.forEach((input, i) => {
                const headerText = document.querySelectorAll("thead th")[i].textContent.trim();
                if(headerText.startsWith("Suma roczna")) return;

                naglowki.push(headerText);
                wartosci.push(input.value.trim());
            });
            //sprawdzenie czy naglowki sa puste
            if(naglowki.some(n => n === "")){
                alert("Naglowki nie mogą być puste!");
            }
            /*if(wartosci.some(value => value === "")){
                alert("Wszystkie wartości muszą być wypełnione!");
                return;
            }*/
            //zapisanie wartosci z inputow do komorek
            row.querySelectorAll("td").forEach((cell, index) => {
                if (index < row.cells.length - 1) {
                    const input = cell.querySelector("input");
                    if(input){
                        const value = input.value.trim();
                        cell.textContent =  value;
                    }
                }
            });
            //usuniecie klasy 
            row.classList.remove("editing");
            //czyszczenie ostatniej komorki wiersza i dodanie przycisku edytuj
            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = 'Usuń';
            deleteBtn.classList.add("delete-btn");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edytuj";
            editBtn.classList.add("edit-btn");
            cell.appendChild(editBtn);
            cell.appendChild(deleteBtn);

            //Zebranie danyych do wyslania na backend
            const formData = new FormData();
            formData.append("kontrahent", kontrahent);
            const typInput = document.querySelector("input[name='typ']");
            const branchInput = document.querySelector('input[name="branch"]');
            if (!typInput || !branchInput) {
                console.error("Typ or branch input not found");
                return;
            }
            const typ = typInput.value;
            const branch = branchInput.value;
            formData.append("typ", typ);
            formData.append("branch", branch);
            formData.append("index", index);
            naglowki.forEach((m)=>formData.append("naglowki[]",m));
            wartosci.forEach((w)=>formData.append("wartosci[]",w));

            //debug
            console.log('Sending data:', {
                kontrahent,
                typ,
                branch,
                index,
                naglowki,
                wartosci
            });
            //debug formData
            console.log('FormData:', Array.from(formData.entries()));
            //wysalnie
            fetch('/zapisz',{
                method: 'POST',
                body:formData,
            })
            .then(res => {
                if(!res.ok) throw new Error('Błąd zapisu'+ res.status+ ' ' + res.statusText);
                return res.text();
            })
            .then(response => {
                console.log('Zapisano: ', response);
                alert('Zapisano zmiany!');
            })
            .then(data=>{
                console.log('Odpowiedź serwera:', data);
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas zapisu: '+error.message);
            });
            editingRow = null;
            originalData = [];
        }
        //Click Cancel button
        else if (btn.classList.contains("cancel-btn") && editingRow) {
            const row = editingRow
            row.querySelectorAll("td").forEach((cell, index) => {
                if (index < row.cells.length - 1) {
                    cell.textContent = originalData[index];
                }
            });

            row.classList.remove("editing");

            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = 'Usuń';
            deleteBtn.classList.add("delete-btn");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edytuj";
            editBtn.classList.add("edit-btn");
            cell.appendChild(editBtn);
            cell.appendChild(deleteBtn);

            editingRow = null;
            originalData = [];
        }
    });
});
document.querySelector("table").addEventListener('click', function(e){
    if(e.target.classList.contains("delete-btn")){
        const btn = e.target;
        const row = btn.closest("tr");
        const lp = row.dataset.index;
        const typ = document.querySelector("input[name='typ']").value;
        if(!lp){
            alert("Błąd: Brak identyfikatora rekordu lp. do usunięcia");
        }
        if(confirm(`Czy na pewno chcesz usunąć rekord o Lp: ${lp}?`)){
            fetch('/deleteRecord',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body:JSON.stringify({
                    typ: typ,
                    lp:lp
                })
            })
            .then(response => {
                return response.json().then(data =>{
                    if(!response.ok)
                        throw new Error(data.message || `Błąd serwera: ${response.status}`);
                    return data;
                });
            })
            .then(data=>{
                if(data.status ==='ok'){
                    row.remove();
                    alert('Rekord został usunnięty');
                    console.log('Odpowiedź serwera(usuwanie):', data);
                }else{
                    throw new Error(data.message || 'Nieznany błąd');
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas usuwania: '+error.message);
            });
        }
    }
})


function validateRow() {
    let isValid = true;
    let errors = [];

    document.querySelectorAll("input[data-type]").forEach(input => {
        const type = input.dataset.type;
        const value = input.value.trim();
        const colName = document.querySelectorAll("thead th")[input.closest('td').cellIndex].textContent.trim();

        if (type === "number") {
            if (value !== "" && isNaN(value.replace(",", "."))) {
                isValid = false;
                errors.push(`Pole "${colName}" musi być liczbą.`);
            }else if(value !== "" && !/^\d+(\.\d{1,2})?$/.test(value.replace(",", "."))) {
                isValid = false;
                errors.push(`Pole "${colName}" musi być liczbą z maksymalnie dwoma miejscami po przecinku.`);
            }
        }

        if (type === "date") {
            if (value == "" && isNaN(Date.parse(value))) {
                isValid = false;
                errors.push(`Pole "${colName}" musi być poprawną datą (YYYY-MM-DD).`);
            }
        }
    });

    if (!isValid) {
        alert(errors.join("\n"));
    }
    return isValid;
}
function sortTable(columnIndex, sortOrder){
    const table =document.querySelector(".data-table");
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((rowA, rowB) => {
        const cellA = rowA.children[columnIndex].textContent.trim();
        const cellB = rowB.children[columnIndex].textContent.trim();
        let comparasion = 0;
        if (!isNaN(cellA) && !isNaN(cellB) && cellA !== '' && cellB !== '') {
            comparasion = parseFloat(cellA)-parseFloat(cellB);
        }else{
            comparasion = cellA.localeCompare(cellB);
        }
        return sortOrder === 'asc' ? comparasion : -comparasion;
    });
    rows.forEach(row=>tbody.appendChild(row));
}
function closeForm(){
    const activeDiv = document.querySelector(".active");
    const active = activeDiv.querySelector('form');
    if(active){
        activeDiv.classList.remove("active");
    }
}
//obsluga dodawania rekordu
function openForm(){
    if(document.querySelector("form.active")){
        return;
    }
    const typInput = document.querySelector("input[name='typ']");
    const branchInput = document.querySelector('input[name="branch"]');
    const type = typInput.value;
    const branch = branchInput.value;
    const formExpense = document.querySelector(".add-record-form-expense")
    const formIncome = document.querySelector(".add-record-form-income")
    const formToShow = type === "Przychody" ? formIncome : formExpense;
    if(formToShow){
        formToShow.classList.add('active');
        const dateInputs = formToShow.querySelectorAll("input[type='date']");
        let now = new Date();
        let day = ("0"+now.getDate()).slice(-2);
        let month = ("0"+(now.getMonth() + 1)).slice(-2);
        let today = now.getFullYear()+"-"+month+"-"+day;
        dateInputs.forEach(input => input.value = today);
        const etykietyInput = formToShow.querySelector("input[name='Etykiety']");
        if(etykietyInput){
            etykietyInput.value = 'ADS';
        }
    }
}

/*document.addEventListener('click', function(e) {
    const activediv = document.querySelector(".active");
    if(activediv){
        const form = activediv.querySelector("form");
        if(form && !form.contains(e.target) && !e.target.closest(".submit-add-expense-record-btn") && !e.target.closest(".submit-add-income-record-btn")){
            closeForm();
        }
    }
});
  */ 
function AddRecord(event){
    event.preventDefault();
    const activeDiv = document.querySelector(".active");
    const activeForm = activeDiv.querySelector('form');
    if(!activeForm){
        console.error("Nie znaleziono aktywnego formularza.");
        return;
    }
    const typInput = document.querySelector("input[name='typ']");
    const branchInput = document.querySelector('input[name="branch"]');
    const formData = new FormData();
    formData.append("branch", branchInput.value);
    formData.append("typ",typInput.value);
    
    const inputs = activeForm.querySelectorAll("input");
    inputs.forEach(input =>{
        if(input.name){
            if (input["type"]==='number' && parseFloat(input.value) < 0){
                alert("Wartości nie mogą być mniejsze od zera!");
                inputs.forEach(i=>{
                    if (i["type"]==='number')
                    i.value=0;
                });
                throw new Error("Wartość ujemna");
            }
            formData.append(input.name,input.value);

        }
    })
    for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }

    fetch('/addRecord',{
        method: 'POST',
        body:formData,
    })
    .then(res => {
        if(!res.ok) throw new Error('Błąd zapisu'+ res.status+ ' ' + res.statusText);
        return res.json();
    })
    .then(response => {
        const columnsI = ['Lp.','Nr dokumentu','Kontrahent','Rodzaj','Data wystawienia','Termin płatności','Zapłacono','Pozostało','Razem','Kwota netto','Metoda','Etykiety'];
        const columnsE = ['Lp.','Nr dokumentu','Kontrahent','Data wystawienia','Termin płatności','Zapłacono','Pozostało','Razem','Kwota netto','Kwota VAT','Etykiety'];
        activeForm.classList.remove("active");
        const newRecord = response.added;
        const table = document.querySelector(".data-table tbody");
        const row = document.createElement("tr");
        row.dataset.index=newRecord['Lp.'];
        row.dataset.kontrahent = newRecord['Kontrahent'];
        console.log(newRecord);
        if(typInput.value==="Przychody"){
            columnsI.forEach(col =>{
                if(col !== 'Lp.'){
                    const cell = document.createElement("td");
                    cell.textContent = newRecord[col] !== undefined ? newRecord[col] : "";
                    row.appendChild(cell);
                }
            });
        }else{
            columnsE.forEach(col =>{
                if(col !== 'Lp.'){                
                    const cell = document.createElement("td");
                    cell.textContent = newRecord[col] !== undefined ? newRecord[col] : "";
                    row.appendChild(cell);
                }
            });
        }
        const cell = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edytuj";
        editBtn.classList.add("edit-btn");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Usuń";
        deleteBtn.classList.add("delete-btn");
        cell.appendChild(editBtn);
        cell.appendChild(deleteBtn);
        row.append(cell);
        table.appendChild(row);
        alert('Zapisano zmiany!');
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas zapisu: '+error.message);
    });
}

function truncate(){
    const typInput = document.querySelector("input[name='typ']");
    const type = typInput.value;
    if(confirm('Jestes absolutnie pewnien, że chcesz usunąc zawartość arkusza? Tej operacji nie można cofnąć!')){
        const confirmationText = "USUŃ";
        const userInput = prompt(`Aby potwierdzić usuwanie zawartości arkusza wpisz słowo: ${confirmationText} w ponizszym polu:`);
        if (userInput === confirmationText){
            fetch('/truncateTable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({typ: type})
            })
            .then(response=> response.json().then(data=>{
                if(!response.ok){
                    throw new Error(data.message || 'Błąd serwera przy usuwaniu arkusza');
                }
                return data;
            }))
            .then(data=>{
                if(data.status === "ok"){
                    const tableBody = document.querySelector(".data-table tbody");
                    if (tableBody){
                        tableBody.innerHTML = '<tr><td colspan="12" style="test-align:center;color:#888;">Tabela została wyczyszczona.</td></tr>';
                    }
                    alert(`Tabela "${type}" została pomyślnie wyczyszczona.`);
                }else{
                    throw new Error(data.message || 'Wystąpił nieznany błąd.');
                }
            })
            .catch(error=>{
                console.error('Błąd:',error);
                alert('Wystapił błąd: '+ error.message);
            });
        }else{
            alert("Anulowano. Wpisany tekst nie zgadzał się");
        }
    }

}
function downloadTable(){
    window.location.href = "/downloadExcel";
}