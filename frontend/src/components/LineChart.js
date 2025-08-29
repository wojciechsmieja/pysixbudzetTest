import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const LineChart = ({ title, labels, currentYearData, prevYearData }) => {
    const textColor = '#F9FAFB';

    const datasets = [
        {
            label: 'Bieżący Rok',
            data: currentYearData,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: (context) => {
                const ctx = context.chart.ctx;
                const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(53, 162, 235, 0.5)');
                gradient.addColorStop(1, 'rgba(53, 162, 235, 0)');
                return gradient;
            },
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: 'rgb(53, 162, 235)',
        },
    ];

    const hasPrevYearData = prevYearData && prevYearData.some(d => d > 0);

    if (hasPrevYearData) {
        datasets.push({
            label: 'Poprzedni Rok',
            data: prevYearData,
            borderColor: 'rgb(150, 150, 150)',
            backgroundColor: 'rgba(150, 150, 150, 0.5)',
            tension: 0.4,
            borderDash: [5, 5],
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgb(150, 150, 150)',
        });
    }

    const data = {
        labels,
        datasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'rectRounded',
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
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
                },
                title: {
                    display: true,
                    text: 'Kwota netto (zł)',
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
        interaction: {
            intersect: false,
            mode: 'index',
        }
    };

    return <Line options={options} data={data} />;
};

export default LineChart;
