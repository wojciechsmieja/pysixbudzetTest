import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BarChart = ({ title, labels, data }) => {
    const textColor = '#F9FAFB';

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Suma (zł)',
                data: data,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.8)');
                    gradient.addColorStop(1, 'rgba(75, 192, 192, 0.2)');
                    return gradient;
                },
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                borderRadius: 5,
                hoverBackgroundColor: 'rgba(75, 192, 192, 1)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: textColor,
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                },
                color: textColor,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    size: 14,
                },
                bodyFont: {
                    size: 12,
                },
                footerFont: {
                    size: 10,
                },
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                },
                title: {
                    display: true,
                    text: 'Suma (zł)',
                    color: textColor,
                },
                ticks: {
                    color: textColor,
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: textColor,
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart',
        },
    };

    return <Bar options={options} data={chartData} />;
};

export default BarChart;
