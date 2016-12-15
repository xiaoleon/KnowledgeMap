function draw() {
    var DURATION = 1500;
    var DELAY = 500;

    function drawLineChart(elementId, data) {
        // parse helper functions on top
        var parse = d3.timeFormat('%Y-%m-%d');
        // data manipulation first
        data = data.map(function (datum) {
            datum.date = parse(new Date(datum.date));
            return datum;
        });

        // TODO code duplication check how you can avoid that
        var containerEl = document.getElementById(elementId),
            width = containerEl.clientWidth,
            height = width * 0.4,
            margin = {
                top: 30,
                right: 10,
                left: 10
            },

            detailWidth = 98,
            detailHeight = 55,
            detailMargin = 10,

            container = d3.select(containerEl),
            svg = container.select('svg')
                .attr('width', width)
                .attr('height', height + margin.top),

            x = d3.scaleTime()
                .range([0, width - detailWidth]),
            xAxis = d3.axisBottom()
                .scale(x)
                .ticks(8)
                .tickSize(-height),
            xAxisTicks = d3.axisBottom()
                .scale(x)
                .ticks(16)
                .tickSize(-height)
                .tickFormat(''),
            y = d3.scaleLinear()
                .range([height, 0]),
            yAxisTicks = d3.axisRight()
                .scale(y)
                .ticks(12)
                .tickSize(width)
                .tickFormat(''),

            area = d3.area()
                .x(function (d) {
                    return x(new Date(d.date)) + detailWidth / 2;
                })
                .y0(height)
                .y1(function (d) {
                    return y(d.value);
                }),

            line = d3.line()
                .x(function (d) {
                    return x(new Date(d.date)) + detailWidth / 2;
                })
                .y(function (d) {
                    return y(d.value);
                }),

            startData = data.map(function (datum) {
                return {
                    date: datum.date,
                    value: 0
                };
            }),

            circleContainer;

        // Compute the minimum and maximum date, and the maximum price.
        x.domain([new Date(data[0].date), new Date(data[data.length - 1].date)]);
        // hacky hacky hacky :(
        y.domain([0, d3.max(data, function (d) { return d.value; }) + 700]);

        svg.append('g')
            .attr('class', 'lineChart--xAxis')
            .attr('transform', 'translate(' + detailWidth / 2 + ',' + (height + 7) + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'lineChart--xAxisTicks')
            .attr('transform', 'translate(' + detailWidth / 2 + ',' + height + ')')
            .call(xAxisTicks);

        svg.append('g')
            .attr('class', 'lineChart--yAxisTicks')
            .call(yAxisTicks);

        // Add the line path.
        svg.append('path')
            .datum(startData)
            .attr('class', 'lineChart--areaLine')
            .attr('d', line)
            .transition()
            .duration(DURATION)
            .delay(DURATION / 2)
            .attrTween('d', tween(data, line))
            .on('end', function () {
                drawCircles(data);
            });


        // Add the area path.
        svg.append('path')
            .datum(startData)
            .attr('class', 'lineChart--area')
            .attr('d', area)
            .transition()
            .duration(DURATION)
            .attrTween('d', tween(data, area));

        // Helper functions!!!
        function drawCircle(datum, index) {
            circleContainer.datum(datum)
                .append('circle')
                .attr('class', 'lineChart--circle')
                .attr('r', 0)
                .attr('cx', function (d) {
                    return x(new Date(d.date)) + detailWidth / 2;
                })
                .attr('cy', function (d) {
                    return y(d.value);
                })
                .on('mouseenter', function (d) {
                    d3.select(this)
                        .attr('class', 'lineChart--circle lineChart--circle__highlighted')
                        .attr('r', 7);

                    d.active = true;
                    showCircleDetail(d);
                })
                .on('mouseout', function (d) {
                    d3.select(this)
                        .attr('class', 'lineChart--circle')
                        .attr('r', 6);

                    if (d.active) {
                        hideCircleDetails();
                        d.active = false;
                    }
                })
                .on('click touch', function (d) {
                    if (d.active) {
                        showCircleDetail(d)
                    } else {
                        hideCircleDetails();
                    }
                })
                .transition()
                .delay(DURATION / 10 * index)
                .attr('r', 6);
        }

        function drawCircles(data) {
            circleContainer = svg.append('g');

            data.forEach(function (datum, index) {
                drawCircle(datum, index);
            });
        }

        function hideCircleDetails() {
            circleContainer.selectAll('.lineChart--bubble')
                .remove();
        }

        function showCircleDetail(data) {
            var details = circleContainer.append('g')
                .attr('class', 'lineChart--bubble')
                .attr('transform', function () {
                    var result = 'translate(';

                    result += x(new Date(data.date));
                    result += ', ';
                    result += y(data.value) - detailHeight - detailMargin;
                    result += ')';

                    return result;
                });

            details.append('path')
                .attr('d', 'M2.99990186,0 C1.34310181,0 0,1.34216977 0,2.99898218 L0,47.6680579 C0,49.32435 1.34136094,50.6670401 3.00074875,50.6670401 L44.4095996,50.6670401 C48.9775098,54.3898926 44.4672607,50.6057129 49,54.46875 C53.4190918,50.6962891 49.0050244,54.4362793 53.501875,50.6670401 L94.9943116,50.6670401 C96.6543075,50.6670401 98,49.3248703 98,47.6680579 L98,2.99898218 C98,1.34269006 96.651936,0 95.0000981,0 L2.99990186,0 Z M2.99990186,0')
                .attr('width', detailWidth)
                .attr('height', detailHeight);

            var text = details.append('text')
                .attr('class', 'lineChart--bubble--text');

            text.append('tspan')
                .attr('class', 'lineChart--bubble--label')
                .attr('x', detailWidth / 2)
                .attr('y', detailHeight / 3)
                .attr('text-anchor', 'middle')
                .text(data.label);

            text.append('tspan')
                .attr('class', 'lineChart--bubble--value')
                .attr('x', detailWidth / 2)
                .attr('y', detailHeight / 4 * 3)
                .attr('text-anchor', 'middle')
                .text(data.value);
        }

        function tween(b, callback) {
            return function (a) {
                var i = d3.interpolateArray(a, b);

                return function (t) {
                    return callback(i(t));
                };
            };
        }
    }

    /**
     * draw the fancy pie chart
     *
     * @param {String} elementId elementId
     * @param {Array}  data      data
     */
    function drawPieChart(elementId, data) {
        // TODO code duplication check how you can avoid that
        var containerEl = document.getElementById(elementId),
            width = containerEl.clientWidth,
            height = width * 0.4,
            radius = Math.min(width, height) / 2,
            container = d3.select(containerEl),
            svg = container.select('svg')
                .attr('width', width)
                .attr('height', height);
        var pie = svg.append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        var detailedInfo = svg.append('g')
            .attr('class', 'pieChart--detailedInformation');

        var twoPi = 2 * Math.PI;
        var pieData = d3.pie()
            .value(function (d) {
                return d.value;
            });

        var arc = d3.arc()
            .outerRadius(radius - 20)
            .innerRadius(0);

        var pieChartPieces = pie.datum(data)
            .selectAll('path')
            .data(pieData)
            .enter()
            .append('path')
            .attr('class', function (d) {
                return 'pieChart__' + d.data.color;
            })
            .attr('filter', 'url(#pieChartInsetShadow)')
            .attr('d', arc)
            .each(function () {
                this._current = { startAngle: 0, endAngle: 0 };
            })
            .transition()
            .duration(DURATION)
            .attrTween('d', function (d) {
                var interpolate = d3.interpolate(this._current, d);
                this._current = interpolate(0);

                return function (t) {
                    return arc(interpolate(t));
                };
            })
            .on('end', function (d) {
                drawDetailedInformation(d.data, this);
            });

        drawChartCenter();

        function drawChartCenter() {
            var centerContainer = pie.append('g')
                .attr('class', 'pieChart--center');

            centerContainer.append('circle')
                .attr('class', 'pieChart--center--outerCircle')
                .attr('r', 0)
                .attr('filter', 'url(#pieChartDropShadow)')
                .transition()
                .duration(DURATION)
                .delay(DELAY)
                .attr('r', radius * 0.3);

            centerContainer.append('circle')
                .attr('id', 'pieChart-clippy')
                .attr('class', 'pieChart--center--innerCircle')
                .attr('r', 0)
                .transition()
                .delay(DELAY)
                .duration(DURATION)
                .attr('r', radius * 0.3 - 5)
                .attr('fill', '#fff');
        }

        function drawDetailedInformation(data, element) {
            var bBox = element.getBBox(),
                infoWidth = width * 0.3,
                anchor,
                infoContainer,
                position;
                
            if ((bBox.x + bBox.width / 2) > 0) {
                infoContainer = detailedInfo.append('g')
                    .attr('width', infoWidth)
                    .attr('transform', 'translate(' + (width - infoWidth) + ',' + (bBox.height + bBox.y) + ')');
                anchor = 'end';
                position = 'right';
            } else {
                infoContainer = detailedInfo.append('g')
                    .attr('width', infoWidth)
                    .attr('transform', 'translate(' + 0 + ',' + (bBox.height + bBox.y + 50) + ')');
                anchor = 'start';
                position = 'left';
            }
            
            infoContainer.data([data.value * 100])
                .append('text')
                .text('0 %')
                .attr('class', 'pieChart--detail--percentage')
                .attr('x', (position === 'left' ? 0 : infoWidth))
                .attr('y', -10)
                .attr('text-anchor', anchor)
                .transition()
                .duration(DURATION)
                .tween('text', function (d) {
                    var self = d3.select(this);
                    var i = d3.interpolateRound(+self.text().replace(/\s%/ig, ''), d);
                    return function (t) {
                        self.text(i(t) + ' %');
                    };
                });

            infoContainer.append('line')
                .attr('class', 'pieChart--detail--divider')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', 0)
                .transition()
                .duration(DURATION)
                .attr('x2', infoWidth);

            infoContainer.data([data.description])
                .append('foreignObject')
                .attr('width', infoWidth)
                .attr('height', 100)
                .append('xhtml:body')
                .attr('class', 'pieChart--detail--textContainer ' + 'pieChart--detail__' + position)
                .html(data.description);
        }
    }

    function drawChart() {
        d3.json('data/data.json', function (error, data) {
            if (error) throw error;

            drawPieChart('pieChart', data.pieChart);
            drawLineChart('lineChart', data.lineChart);
        })
    }

    drawChart();
};