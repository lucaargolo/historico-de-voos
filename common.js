function getRandomColor() {
    return "hsl(" + 360 * Math.random() + ',' +
        (60 + 40 * Math.random()) + '%,' +
        (60 + 5 * Math.random()) + '%)'
}

function getMostCommon(object) {
    let mostCommon = "", mostCommonQnt = 0;
    for(let o in object) {
        if(!object.hasOwnProperty(o)) continue;
        if(object[o] > mostCommonQnt) {
            mostCommonQnt = object[o]
            mostCommon = o
        }
    }
    return [mostCommon, mostCommonQnt]
}

function createPie(elementId, data, color, labels) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: data,
                backgroundColor: color,
                borderColor: color,
                label: 'Dados'
            }],
            labels: labels
        },
        options: {
            legend: {
                labels: {
                    fontColor: "#BBBBBB"
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    })
}

function createFlightGraph(elementId, xs, mean_ys, day_ys) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        responsive: true,
        data: {
            labels: xs,
            datasets: [
            {
                label: 'Média de voos por 7 dias',
                data: mean_ys,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgb(219, 130, 75)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                pointHitRadius: 3
            },
            {
                label: 'Voos por dia',
                data: day_ys,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgb(75, 183, 219)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                pointHitRadius: 3
            }
        ]
        },
        options: {
            legend: {
                labels: {
                    fontColor: "#BBBBBB"
                }
            },
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dddd, MMMM Do YYYY'
                    },
                    gridLines: {
                        color: "#BBBBBB"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Período',
                        fontColor: "#BBBBBB"
                    },
                    ticks: {
                        fontColor: "#BBBBBB",
                    }
                }],
                yAxes: [{
                    gridLines: {
                        color: "#BBBBBB"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Quantidade de Voos',
                        fontColor: "#BBBBBB"
                    },
                    ticks: {
                        fontColor: "#BBBBBB"
                    }
                }]
            }
        }
    });
}

function collapseTopNav() {
    var x = document.getElementById("topnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
}