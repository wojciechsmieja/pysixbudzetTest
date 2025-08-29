document.addEventListener("DOMContentLoaded", function () {
    const yearFromSpan = document.querySelector(".current-year").textContent;
    const year = parseInt(yearFromSpan);
    const lastYear = year - 1;
    const monthsOrder = JSON.parse(document.body.dataset.monthsOrder);

    // Helper function to generate modern colors
    const generateModernColors = (numColors) => {
        const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
        ];
        let result = [];
        for (let i = 0; i < numColors; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    };
    
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
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.5)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

        const datasets = [{
            label: year,
            data: chartData.values,
            borderColor: "#2563eb",
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: '#fff',
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2,
        }];

        if (chartDataLastYear) {
            datasets.push({
                label: lastYear,
                data: chartDataLastYear.values,
                borderColor: "#9ca3af",
                fill: false,
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: "#9ca3af",
                pointBorderColor: '#fff',
                pointHoverRadius: 7,
                pointHoverBorderWidth: 2,
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
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: { size: 18, weight: 'bold' }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#fff',
                        titleColor: '#333',
                        bodyColor: '#666',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.formattedValue} zł`;
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
                        },
                        grid: {
                            drawBorder: false,
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Miesiąc"
                        },
                        grid: {
                            display: false,
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

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

    const rawIncomeBranchSums = document.getElementById("income-branch-chart-scr").textContent;
    const incomeBranchSums = JSON.parse(rawIncomeBranchSums);
    const incomeBranchChartCtx = document.getElementById("income-branch-chart").getContext('2d');
    
    const prepareChartData = (data) => {
        const labels = Object.keys(data);
        const values = Object.values(data);
        return { labels, values }
    };

    const incomeBranchChartData = prepareChartData(incomeBranchSums);
    const incomeColors = generateModernColors(incomeBranchChartData.labels.length);

    new Chart(incomeBranchChartCtx, {
        type: "bar",
        data: {
            labels: incomeBranchChartData.labels,
            datasets: [{
                label: "Suma roczna",
                data: incomeBranchChartData.values,
                backgroundColor: incomeColors.map(color => `${color}B3`), // Add alpha for transparency
                borderColor: incomeColors,
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Roczne sumy przychodów z poszczególnych gałęzi",
                    font: { size: 18, weight: 'bold' }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Suma (zł)"
                    },
                    grid: {
                        drawBorder: false,
                    }
                },
                x: {
                    grid: {
                        display: false,
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    const rawExpenseBranchSums = document.getElementById("expense-branch-chart-scr").textContent;
    const expenseBranchSums = JSON.parse(rawExpenseBranchSums);
    const expenseBranchChartCtx = document.getElementById("expense-branch-chart").getContext('2d');
    
    const expenseBranchChartData = prepareChartData(expenseBranchSums);
    const expenseColors = generateModernColors(expenseBranchChartData.labels.length);

    new Chart(expenseBranchChartCtx, {
        type: "bar",
        data: {
            labels: expenseBranchChartData.labels,
            datasets: [{
                label: "Suma roczna",
                data: expenseBranchChartData.values,
                backgroundColor: expenseColors.map(color => `${color}B3`),
                borderColor: expenseColors,
                borderWidth: 1,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Roczne sumy wydatków na poszczególne gałęzie",
                    font: { size: 18, weight: 'bold' }
                },
                 tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Suma (zł)"
                    },
                    grid: {
                        drawBorder: false,
                    }
                },
                x: {
                    grid: {
                        display: false,
                    }
                }
            },
             animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
});
