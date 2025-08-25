document.addEventListener("DOMContentLoaded", function () {
    const yearFromSpan = document.querySelector(".current-year").textContent;
    const year = parseInt(yearFromSpan);
    const lastYear = year - 1;
    const monthsOrder = JSON.parse(document.body.dataset.monthsOrder);

    // Pobierz dane z ukrytego <script>
    const rawData = document.getElementById("chart-data").textContent;
    const data = JSON.parse(rawData);
    const filteredDataIncome = data;

    const rawDataExpense = document.getElementById("chart-data-expense").textContent;
    const dataExpense = JSON.parse(rawDataExpense);
    const filteredDataExpense = dataExpense;

    const rawDataExpenseLastYear = document.getElementById("chart-data-expense-last-year").textContent;
    const DataExpenseLastYear = JSON.parse(rawDataExpenseLastYear);
    const filteredDataExpenseLastYear = DataExpenseLastYear;

    const rawDataIncomeLastYear = document.getElementById("chart-data-last-year").textContent;
    const DataIncomeLastYear = JSON.parse(rawDataIncomeLastYear);
    const filteredDataIncomeLastYear = DataIncomeLastYear;

    function getChartData(data, branch) {
        const monthlyData = {};
        monthsOrder.forEach(month => {
            monthlyData[month] = 0;
        });
        if (data) {
            data.forEach(item => {
                if (branch === 'all' || item["Etykiety"] === branch) {
                    const month = item['Miesiąc'];
                    const value = parseFloat(item["Kwota netto"]) || 0;
                    if (monthlyData.hasOwnProperty(month)) {
                        monthlyData[month] += value;
                    }
                }
            });
        }
        const labels = monthsOrder;
        const values = labels.map(m => monthlyData[m]);
        return { labels, values };
    }

    const ctx = document.getElementById("income-trend-chart").getContext("2d");
    const ctxExpense = document.getElementById("expense-trend-chart").getContext("2d");

    function createChart(ctx, chartData, chartDataLastYear, year, lastYear, title) {
        const datasets = [{
            label: year,
            data: chartData.values,
            borderColor: "rgba(37, 99, 235, 1)",
            backgroundColor: "rgba(37, 99, 235, 0.2)",
            fill: true,
            tension: 0.2,
            pointRadius: 6,
            pointBackgroundColor: "rgba(37, 99, 235, 1)"
        }];

        if (chartDataLastYear) {
            datasets.push({
                label: lastYear,
                data: chartDataLastYear.values,
                borderColor: "rgba(87, 86, 86, 1)",
                fill: false,
                borderDash: [10, 5],
                tension: 0.2,
                pointRadius: 4,
                pointBackgroundColor: "rgba(175, 175, 175, 1)"
            });
        }

        return new Chart(ctx, {
            type: "line",
            data: {
                labels: chartData.labels,
                datasets: datasets
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
                                return context.formattedValue + "";
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
    const incomeChartDataLastYear = filteredDataIncomeLastYear.length > 0 ? getChartData(filteredDataIncomeLastYear, 'all') : null;
    const incomeChart = createChart(ctx, incomeChartData, incomeChartDataLastYear, year, lastYear, "Trend przychodów w roku (zł)");

    const expenseChartData = getChartData(filteredDataExpense, 'all');
    const expenseChartDataLastYear = filteredDataExpenseLastYear.length > 0 ? getChartData(filteredDataExpenseLastYear, 'all') : null;
    const expenseChart = createChart(ctxExpense, expenseChartData, expenseChartDataLastYear, year, lastYear, "Trend wydatków w roku (zł)");

    const incomeSelect = document.getElementById("income-chart-select");
    incomeSelect.addEventListener('change', (e) => {
        const selectedBranch = e.target.value;
        const newChartData = getChartData(filteredDataIncome, selectedBranch);
        incomeChart.data.labels = newChartData.labels;
        incomeChart.data.datasets[0].data = newChartData.values;
        if (incomeChart.data.datasets[1]) {
            const newIncomeChartDataLastYear = getChartData(filteredDataIncomeLastYear, selectedBranch);
            incomeChart.data.datasets[1].data = newIncomeChartDataLastYear.values;
        }
        incomeChart.update();
    });

    const expenseSelect = document.getElementById("expense-chart-select");
    expenseSelect.addEventListener('change', (e) => {
        const selectedBranch = e.target.value;
        const newChartData = getChartData(filteredDataExpense, selectedBranch);
        expenseChart.data.labels = newChartData.labels;
        expenseChart.data.datasets[0].data = newChartData.values;
        if (expenseChart.data.datasets[1]) {
            const newChartDataLastYear = getChartData(filteredDataExpenseLastYear, selectedBranch);
            expenseChart.data.datasets[1].data = newChartDataLastYear.values;
        }
        expenseChart.update();
    });

    //SECOND LINE OF CHARTS
    // chart - branches
    const rawIncomeBranchSums = document.getElementById("income-branch-chart-scr").textContent;
    const incomeBranchSums = JSON.parse(rawIncomeBranchSums);
    const incomeBranchChart = document.getElementById("income-branch-chart").getContext('2d');
    
    const prepareChartData = (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        return { labels, values }
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
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
                    ticks: {
                        maxRotation: 15
                    }
                }
            }
        }
    });
});