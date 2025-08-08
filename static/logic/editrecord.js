/*document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector("table");

    table.addEventListener("click", function (e) {
        if (e.target.classList.contains("edit-btn")) {
            const btn = e.target;
            const row = btn.closest("tr");

            if (btn.textContent === "Edit") {
                // Zamiana komórek na inputy
                row.querySelectorAll("td").forEach((cell, index) => {
                    // pomijamy ostatnią kolumnę (przyciski)
                    if (index < row.cells.length - 1) {
                        const value = cell.textContent.trim();
                        cell.innerHTML = `<input type="text" value="${value}" />`;
                    }
                });
                btn.textContent = "Save";
                btn.classList.add("save-btn");
            } 
            else if (btn.textContent === "Save") {
                // Zapis wartości z inputów do tekstu
                row.querySelectorAll("td").forEach((cell, index) => {
                    if (index < row.cells.length - 1) {
                        const input = cell.querySelector("input");
                        if (input) {
                            cell.textContent = input.value;
                        }
                    }
                });
                btn.textContent = "Edit";
                btn.classList.remove("save-btn");
            }
        }
    });
});
*/
//ten kod poniżej działa w sensie zmienia rzeczy w tabeli ale nie działa przycisk edytuj tak jakbym chciał, bo miały się dwa pojawiać a się pojawia tylko save
/*
let changed = false;
let originalData =[];
document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector("table");
    
    table.addEventListener("click", function (e) {
        const btn = e.target;
        if (btn.classList.contains("edit-btn") && !changed){
            const row = btn.closest("tr");
            row.querySelectorAll("td").forEach((cell, index) =>{
                // pomijamy ostatnią kolumnę (przyciski)
                if (index < row.cells.length - 1) {
                    const value = cell.textContent.trim();
                    originalData.push(value);
                    cell.innerHTML = `<input type="text" value="${value}" />`;
                }
            })
            const cell = row.querySelector("td:last-child");
            cell.innerHTML="";

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Save";
            saveBtn.classList.add("save-btn");
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.classList.add("edit-btn");

            cell.appendChild(editBtn);
            cell.appendChild(saveBtn);

            changed = true;
        }else if (btn.classList.contains("save-btn") && changed){
            const row = btn.closest("tr");

            row.querySelectorAll("td").forEach((cell, index) =>{
                if( index < row.cells.length - 1){
                    const input = cell.querySelector("input").value.trim();
                    cell.textContent = input;
                }
            });

            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const newEditBtn = document.createElement("button");
            newEditBtn.textContent = "Edit";
            newEditBtn.classList.add("edit-btn");
            cell.appendChild(newEditBtn);

            changed = false;
            originalData = [];
        }else if( e.target.classList.contains("edit-btn")&& changed){
            const row = btn.closest("tr");
            
            row.querySelectorAll("td").forEach((cell, index) =>{
                if (index < row.cells.length -1 ){
                    cell.textContent = originalData[index];
                }
            });
            const cell = row.querySelector("td:last-child");
            cell.innerHTML ="";

            const newEditBtn = document.createElement("button");
            newEditBtn.classList.add("edit-btn");
            newEditBtn.textContent = "edit";
            cell.appendChild(newEditBtn);
            changed = false;
            originalData = [];
         
           }
    });
});
*/
//robie aby po nacisnięciu przyisku "edytuj" pojawiał się formularz do zmiany wartości w tabeli
let editingRow = null;
let originalData = [];
const columnTypes = {
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

document.addEventListener("DOMContentLoaded", function () {
    const table = document.querySelector("table");

    table.addEventListener("click", function (e) {
        const btn = e.target;

        //Click Edit button
        if (btn.classList.contains("edit-btn") && !editingRow) {
            const row = btn.closest("tr");
            editingRow = row;
            originalData = [];

            row.classList.add("editing");

            const firstVal = row.querySelector("td:first-child").textContent.trim();
            originalData.push(firstVal);

            row.querySelectorAll("td").forEach((cell, index) => {
                if (index < row.cells.length - 1 && index !==0 ) {
                    const value = cell.textContent.trim();
                    originalData.push(value);
                    const inputType = columnTypes[index] || "text";
                    cell.innerHTML = `<input type="${inputType}" data-type="${inputType}" value="${value}" />`;
                }
            });

            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel";
            cancelBtn.classList.add("cancel-btn");

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Save";
            saveBtn.classList.add("save-btn");

            cell.appendChild(cancelBtn);
            cell.appendChild(saveBtn);

        }
        //Click Save button
        else if (btn.classList.contains("save-btn") && editingRow) {
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

            const naglowki =[];
            const wartosci =[];


            inputs.forEach((input, i) => {
                const headerText = document.querySelectorAll("thead th")[i+1].textContent.trim();
                if(headerText.startsWith("Suma roczna")) return;

                naglowki.push(headerText);
                wartosci.push(input.value.trim());
            });
            if(naglowki.some(n => n === "")){
                alert("Naglowki nie mogą być puste!");
            }
            /*if(wartosci.some(value => value === "")){
                alert("Wszystkie wartości muszą być wypełnione!");
                return;
            }*/

            row.querySelectorAll("td").forEach((cell, index) => {
                if (index>0 && index < row.cells.length - 1) {
                    const input = cell.querySelector("input");
                    if(input){
                        const value = input.value.trim();
                        cell.textContent =  value;
                    }
                }
            });



            row.classList.remove("editing");

            const cell = row.querySelector("td:last-child");
            cell.innerHTML = "";

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.classList.add("edit-btn");
            cell.appendChild(editBtn);

            //Send data to serwer
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

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.classList.add("edit-btn");
            cell.appendChild(editBtn);

            editingRow = null;
            originalData = [];
        }
    });
});
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
            if (value !== "" && isNaN(Date.parse(value))) {
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


/*
function saveRow(row) {
    const kontrahent = row.dataset.kontrahent;
    const typ = document.querySelector('[name="typ"]').value;
    const branch = document.querySelector('[name="branch"]').value;

    const inputs = row.querySelectorAll('input[data-miesiac]');
    const miesiace = [];
    const wartosci = [];

    inputs.forEach(input => {
        miesiace.push(input.dataset.miesiac);
        wartosci.push(input.value);
    });

    const formData = new FormData();
    formData.append('typ', typ);
    formData.append('branch', branch);
    formData.append('kontrahent', kontrahent);
    miesiace.forEach(m => formData.append('miesiace[]', m));
    wartosci.forEach(v => formData.append('wartosci[]', v));

    fetch('/zapisz', {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error('Błąd zapisu');
        alert('Zapisano zmiany!');
        location.reload();  // lub odśwież dane w tabeli dynamicznie
    })
    .catch(err => alert(err.message));
}
*/