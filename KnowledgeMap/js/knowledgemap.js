function demoGraph() {
    d3.json('data/data.json', function (error, data) {
        if (error) throw error;

        var content = "<div id='knowledgemap'></div>";
        d3.select("#container").html(content);
        drawBubbleGraph(handleData(data));
    });
}

function handleData(data) {
    var root = d3.hierarchy(data)
        .sum(function (d) {
            return d.rank;
        })
        .sort(function (a, b) {
            return b.data.rank - a.data.rank;
        });
    return root; 
}

function drawBubbleGraph(root) {
    var diameter = 600, margin = 20;

    var pack = d3.pack()
        .padding(2)
        .size([diameter - margin, diameter - margin]);

    var svg = d3.select('#knowledgemap')
        .append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .append("g")
        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    var nodes = pack(root).descendants();
    var focus = root, view;

    var maxWeight = d3.max(nodes, function (d) {
        return +d.data.weight;
    });
    
    var minWeight = d3.min(nodes, function (d) {
        return +d.data.weight;
    });

    var color = d3.scaleLinear()
        .domain([minWeight, 0, maxWeight])
        .interpolate(d3.interpolateRgb)
        .range(["black", "gray", "white"]);

    var circle = svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", function (d) {
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })
        .style("fill", function (d) {
            return color(d.data.weight);
        })
        .on("click", function (d) {
            if (focus !== d) {
                zoom(d);
                d3.event.stopPropagation();
            }
        });

    var text = svg.selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .style("fill-opacity", function (d) {
            return d.parent === root ? 1 : 0;
        })
        .style("display", function (d) {
            return d.parent === root ? "inline" : "none";
        })
        .text(function (d) {
            return d.data.name;
        });

    var node = svg.selectAll("circle, text");

    d3.select('#knowledgemap')
        .on("click", function () {
            zoom(root);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus0 = focus;
        focus = d;

        var transition = d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });

        transition.selectAll("text")
            .filter(function (d) {
                return d.parent === focus || this.style.display === "inline";
            })
            .style("fill-opacity", function (d) {
                return d.parent === focus ? 1 : 0;
            })
            .on("start", function (d) {
                if (d.parent === focus)
                    this.style.display = "inline";
            })
            .on("end", function (d) {
                if (d.parent !== focus)
                    this.style.display = "none";
            });
    }

    function zoomTo(v) {
        var k = diameter / v[2];
        view = v;
        node.attr("transform", function (d) {
            return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d) {
            return d.r * k;
        });
    }
}