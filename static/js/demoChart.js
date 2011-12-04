
Highcharts.setOptions({
    global: {
        useUTC: false
    }
});

var initChart = function(chartContainer) {
    var chart = new Highcharts.Chart({
        chart: {
            renderTo: chartContainer,
            defaultSeriesType: 'spline',
            marginRight: 10,
            events: {
                load: function() {

                    // set up the updating of the chart each second
                    var series = this.series[0];
                    setInterval(function() {
                        var x = (new Date()).getTime(), // current time
                                y = Math.random();
                        series.addPoint([x, y], true, true);
                    }, 1000);
                }
            }
        },
        title: {
            text: ''
        },
        xAxis: {
            labels: [],
            type: 'datetime',
            tickPixelInterval: 150
        },
        credits: {
            enabled: false
        },
        yAxis: {
            labels: [],
            title: {
                text: ''
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            formatter: function() {
                return '<b>Power (Watts)</b><br/>'+ Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+ Highcharts.numberFormat(this.y, 2);
            }
        },
        legend: {
            enabled: false
        },
        exporting: {
            enabled: false
        },
        series: [{
            name: 'Power (Watts)',
            data: (function() {
                // generate an array of random data
                var data = [],
                        time = (new Date()).getTime(),
                        i;

                for (i = -19; i <= 0; i++) {
                    data.push({
                        x: time + i * 1000,
                        y: Math.random()
                    });
                }
                return data;
            })()
        }]
    });


}
