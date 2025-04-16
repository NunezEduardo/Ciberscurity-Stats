// Datos globales
let globalData = [];
let map = null;
let markers = L.layerGroup();
let attackTrendChart = null;
let industryDistChart = null;

// Coordenadas aproximadas de países
const countryCoordinates = {
    'USA': [37.0902, -95.7129],
    'China': [35.8617, 104.1954],
    'India': [20.5937, 78.9629],
    'UK': [55.3781, -3.4360],
    'Germany': [51.1657, 10.4515],
    'France': [46.2276, 2.2137],
    'Japan': [36.2048, 138.2529],
    'Brazil': [-14.2350, -51.9253],
    'Russia': [61.5240, 105.3188],
    'Australia': [-25.2744, 133.7751]
};

// Inicializar el mapa
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Cargar y procesar datos CSV
async function loadData() {
    try {
        const response = await fetch('Global_Cybersecurity_Threats_2015-2024.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1);
        globalData = rows.map(row => {
            const columns = row.split(',');
            return {
                country: columns[0],
                year: parseInt(columns[1]),
                attackType: columns[2],
                industry: columns[3],
                financialLoss: parseFloat(columns[4]),
                affectedUsers: parseInt(columns[5]),
                attackSource: columns[6],
                vulnerability: columns[7],
                defense: columns[8],
                resolutionTime: parseInt(columns[9])
            };
        }).filter(item => item.country && !isNaN(item.year));

        populateFilters();
        updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Poblar filtros con opciones únicas
function populateFilters() {
    const countries = [...new Set(globalData.map(item => item.country))];
    const years = [...new Set(globalData.map(item => item.year))];
    const attackTypes = [...new Set(globalData.map(item => item.attackType))];

    const countryFilter = document.getElementById('countryFilter');
    const yearFilter = document.getElementById('yearFilter');
    const attackTypeFilter = document.getElementById('attackTypeFilter');

    // Agregar opción "Todos"
    [countryFilter, yearFilter, attackTypeFilter].forEach(filter => {
        filter.innerHTML = '<option value="">Todos</option>';
    });

    // Poblar opciones
    countries.sort().forEach(country => {
        countryFilter.innerHTML += `<option value="${country}">${country}</option>`;
    });

    years.sort().forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });

    attackTypes.sort().forEach(type => {
        attackTypeFilter.innerHTML += `<option value="${type}">${type}</option>`;
    });
}

// Actualizar el dashboard con datos filtrados
function updateDashboard() {
    const country = document.getElementById('countryFilter').value;
    const year = document.getElementById('yearFilter').value;
    const attackType = document.getElementById('attackTypeFilter').value;

    // Aplicar filtros
    let filteredData = globalData;
    if (country) filteredData = filteredData.filter(item => item.country === country);
    if (year) filteredData = filteredData.filter(item => item.year === parseInt(year));
    if (attackType) filteredData = filteredData.filter(item => item.attackType === attackType);

    updateStatistics(filteredData);
    updateMap(filteredData);
    updateCharts(filteredData);
    updateTable(filteredData);
}

// Actualizar estadísticas generales
function updateStatistics(data) {
    const totalAttacks = data.length;
    const totalLosses = data.reduce((sum, item) => sum + item.financialLoss, 0);
    const totalUsers = data.reduce((sum, item) => sum + item.affectedUsers, 0);

    document.getElementById('totalAttacks').textContent = totalAttacks.toLocaleString();
    document.getElementById('totalLosses').textContent = `$${totalLosses.toLocaleString()} M`;
    document.getElementById('totalUsers').textContent = totalUsers.toLocaleString();
}

// Actualizar marcadores en el mapa
function updateMap(data) {
    markers.clearLayers();

    const attacksByCountry = {};
    data.forEach(item => {
        if (!attacksByCountry[item.country]) {
            attacksByCountry[item.country] = {
                count: 0,
                totalLoss: 0,
                affectedUsers: 0
            };
        }
        attacksByCountry[item.country].count++;
        attacksByCountry[item.country].totalLoss += item.financialLoss;
        attacksByCountry[item.country].affectedUsers += item.affectedUsers;
    });

    Object.entries(attacksByCountry).forEach(([country, stats]) => {
        const coords = countryCoordinates[country];
        if (coords) {
            const marker = L.marker(coords)
                .bindPopup(`
                    <strong>${country}</strong><br>
                    Ataques: ${stats.count}<br>
                    Pérdidas: $${stats.totalLoss.toLocaleString()} M<br>
                    Usuarios afectados: ${stats.affectedUsers.toLocaleString()}
                `);
            markers.addLayer(marker);
        }
    });

    markers.addTo(map);
}

// Actualizar tabla de datos
function updateTable(data) {
    const tbody = document.querySelector('#threatsTable tbody');
    tbody.innerHTML = '';

    data.slice(0, 100).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.country}</td>
            <td>${item.year}</td>
            <td>${item.attackType}</td>
            <td>${item.industry}</td>
            <td>$${item.financialLoss.toLocaleString()}</td>
            <td>${item.affectedUsers.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// Event Listeners
document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    updateDashboard();
});

// Actualizar gráficas
function updateCharts(data) {
    // Gráfica de tendencia de ataques por año
    const attacksByYear = {};
    data.forEach(item => {
        attacksByYear[item.year] = (attacksByYear[item.year] || 0) + 1;
    });

    const years = Object.keys(attacksByYear).sort();
    const attackCounts = years.map(year => attacksByYear[year]);

    if (attackTrendChart) attackTrendChart.destroy();
    attackTrendChart = new Chart(document.getElementById('attackTrend'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Número de Ataques',
                data: attackCounts,
                borderColor: '#1e88e5',
                backgroundColor: 'rgba(30, 136, 229, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });

    // Gráfica de distribución por industria
    const attacksByIndustry = {};
    data.forEach(item => {
        attacksByIndustry[item.industry] = (attacksByIndustry[item.industry] || 0) + 1;
    });

    const industries = Object.keys(attacksByIndustry);
    const industryCounts = industries.map(industry => attacksByIndustry[industry]);

    if (industryDistChart) industryDistChart.destroy();
    industryDistChart = new Chart(document.getElementById('industryDistribution'), {
        type: 'doughnut',
        data: {
            labels: industries,
            datasets: [{
                data: industryCounts,
                backgroundColor: [
                    '#1e88e5',
                    '#4caf50',
                    '#f44336',
                    '#ff9800',
                    '#9c27b0',
                    '#00acc1',
                    '#5c6bc0',
                    '#8d6e63'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadData();
});

// Efecto Matrix en el fondo
const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '-1';
canvas.style.opacity = '0.05';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const cols = Math.floor(width / 20);
const ypos = Array(cols).fill(0);

function matrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#0F0';
    ctx.font = '15pt monospace';

    ypos.forEach((y, ind) => {
        const text = String.fromCharCode(Math.random() * 128);
        const x = ind * 20;
        ctx.fillText(text, x, y);
        if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
        else ypos[ind] = y + 20;
    });
}

setInterval(matrix, 50);
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});