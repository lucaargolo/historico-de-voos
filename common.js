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
                        labelString: 'Periodo',
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