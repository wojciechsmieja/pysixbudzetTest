document.addEventListener("DOMContentLoaded", function () {
    const monthsOrder = JSON.parse(document.body.dataset.monthsOrder);
    // Pobierz dane z ukrytego <script> dla przychodow
    const rawData = document.getElementById("chart-data").textContent;
    const data = JSON.parse(rawData);
    const filteredDataIncome = data
        .filter(i => i['Kwota netto'] !== '' && i['Kwota netto'] !==0 && i['Kwota netto'] !== null && !isNaN(i['Kwota netto']));
    //console.table(filteredDataIncome);
    //dla wydatków
    const rawDataExpense = document.getElementById("chart-data-expense").textContent;
    const dataExpense = JSON.parse(rawDataExpense);
    const filteredDataExpense = dataExpense
        .filter(i => i['Kwota netto'] !== '' && i['Kwota netto'] !== null && i['Kwota netto'] !==0 && !isNaN(i['Kwota netto']));
    // Wyciągnij miesiące i wartości dla przychodów

    function getChartData(data, branch){
        const monthlyData = {};
        data.forEach(item=>{
            if(branch==='all' || item ["Etykiety"]===branch){
                const month = item['Miesiąc'];
                const value = parseFloat(item["Kwota netto"]) || 0;
                monthlyData[month]=(monthlyData[month] ||0)+value;
            }
        });
        const labels = Object.keys(monthlyData).sort((a, b) => {
            return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
        });
        const values = labels.map(m=>monthlyData[m]);
        return{labels, values};
    }

    const ctx = document.getElementById("income-trend-chart").getContext("2d");
    const ctxExpense = document.getElementById("expense-trend-chart").getContext("2d");
    
    function createChart(ctx, chartData, label, title) {
        return new Chart(ctx, {
            type: "line",
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: label,
                    data: chartData.values,
                    borderColor: "rgba(37, 99, 235, 1)",
                    backgroundColor: "rgba(37, 99, 235, 0.2)",
                    fill: true,
                    tension: 0.2,
                    pointRadius: 4,
                    pointBackgroundColor: "rgba(37, 99, 235, 1)"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: title
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.formattedValue + " zł";
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Kwota netto (zł)"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Miesiąc"
                        }
                    }
                }
            }
        });
    }
    
    //initialize charts
    const incomeChartData = getChartData(filteredDataIncome, 'all');
    const incomeChart = createChart(ctx, incomeChartData, "Przychody (zł)", "Trend przychodów w roku");

    const expenseChartData = getChartData(filteredDataExpense, 'all');
    const expenseChart = createChart(ctxExpense, expenseChartData, "Wydatki (zł)", "Trend wydatków w roku");
    const incomeSelect = document.getElementById("income-chart-select");
    incomeSelect.addEventListener('change', (e)=>{
        const selectedBranch = e.target.value;
        const newChartData = getChartData(filteredDataIncome, selectedBranch);
        incomeChart.data.labels = newChartData.labels;
        incomeChart.data.datasets[0].data = newChartData.values;
        incomeChart.update();
    });
    const expenseSelect = document.getElementById("expense-chart-select");
    expenseSelect.addEventListener('change', (e)=>{
        const selectedBranch = e.target.value;
        const newChartData = getChartData(filteredDataExpense, selectedBranch);
        expenseChart.data.labels = newChartData.labels;
        expenseChart.data.datasets[0].data = newChartData.values;
        expenseChart.update();
    });
    //SECOND LINE OF CHARTS
    // chart - branches
    const rawIncomeBranchSums = document.getElementById("income-branch-chart-scr").textContent;
    const incomeBranchSums = JSON.parse(rawIncomeBranchSums);
    const incomeBranchChart = document.getElementById("income-branch-chart").getContext('2d');
    //console.table(incomeBranchSums);
    //przetworzenie jsona
    const prepareChartData = (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        return {labels, values}
    };
    const incomeBranchChartData = prepareChartData(incomeBranchSums);
    new Chart(incomeBranchChart, {
        type: "bar",
        data: {
            labels: incomeBranchChartData.labels,
            datasets: [{
                label: "Suma roczna",
                data: incomeBranchChartData.values,
                borderColor: "rgba(37, 99, 235, 1)",
                backgroundColor: "rgba(37, 99, 235, 0.2)",
                borderWidth:1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend:{
                    position: 'top',
                },
                title: {
                    display: true,
                    text: "Roczne sumy przychodów z poszczególnych gałęzi"
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Suma (zł)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Gałęzie"
                    }
                }
            }
        }
    });
    const rawExpenseBranchSums = document.getElementById("expense-branch-chart-scr").textContent;
    const expenseBranchSums = JSON.parse(rawExpenseBranchSums);
    const expenseBranchChart = document.getElementById("expense-branch-chart").getContext('2d');
    //console.table(expenseBranchSums);
    //przetworzenie jsona
    const expenseBranchChartData = prepareChartData(expenseBranchSums);
    new Chart(expenseBranchChart, {
        type: "bar",
        data: {
            labels: expenseBranchChartData.labels,
            datasets: [{
                label: "Suma roczna",
                data: expenseBranchChartData.values,
                borderColor: "rgba(37, 99, 235, 1)",
                backgroundColor: "rgba(37, 99, 235, 0.2)",
                borderWidth:1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend:{
                    position: 'top',
                },
                title: {
                    display: true,
                    text: "Roczne sumy wydatków na poszczególne gałęzie"
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Suma (zł)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Gałęzie"
                    },
                    ticks:{
                        /*callback: function(value) {
                            let label = this.getLabelForValue(value);
                            return label.length > 8 ? label.substring(0, 8) + "…" : label;
                        },*/
                        maxRotation:15
                    }
                }
            }
        }
    });
    //Years charts for specific branch   


});


