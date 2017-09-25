
var TsDashboard = TsDashboard || {};
TsDashboard.Widgets = TsDashboard.Widgets || {};

/**
 * This widget displays timeseries data
 * @param {object} config - configuration object
 * @param {Date} config.start - start date to display
 * @param {Date} config.end - end date to display
 * @param {string} config.target_div - ID of HTML element where this widget is to be drawn
 */
TsDashboard.Widgets.TimeSeries = function (config) {

    var self = this;
    self.sufix = "" + Math.floor(1000000 * Math.random());
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        data: null,
        bands: null,
        height: 100,
        xaccessor: function (x) {
            if (x == null) return null;
            return x.epoch;
        },
        yaccessor: function (x) {
            if (x == null) return null;
            return x.val;
        },
        xdomain: null,
        xdomain_min: null,
        xdomain_max: null,
        ydomain: null,
        ydomain_min: null,
        ydomain_max: null,
        // xcaption: null,
        // ycaptions: null,
        series_style_indices: null,
        handle_clicks: false,
        show_grid: true,
        x_axis_label: null,
        y_axis_label: null,
        //graph_css: 'area',
        xAxisFontSize: '14px',
        yAxisFontSize: '14px',
        xAxisTicks: 7,
        yFormatValue: ".2s",
        yAxisTicks: null,
        tickNumber: function (height, yDomainMax) {
            return Math.min(height < 100 ? 3 : 8, yDomainMax);
        },
        markerStroke: 3,
        markerOpacity: 0.4,
        markerOpacityHover: 0.8,
        markerColor: "#ff0000",
        click_callback: null,
        timepoints: null, // double array (each timeseries can have multiple timepoints) of timepoints { epoch: x, title: y }
        // timepoint_callback: null, // NOT USED CURRENTLY
        margin_top: 18,
        margin_right: 35,
        margin_bottom: 20,
        margin_left: 50,
        labels: null,
        backgroundSegments: null, // array where each element is { epoch_start: num, epoch_end: num, color: string }
        backgroundSegmentAxis: "x", // are segments defined for x or y axis
        backgroundSegmentOpacity: 0.3,
        exportable: false
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    this._p = p;
}

TsDashboard.Widgets.TimeSeries.prototype.draw = function () {
    var p = this._p;
    var self = this;

    // gets max and min values of x and y values over all given data series
    if (!p.xdomain) {
        var extents = p.data.map(function (x) { return d3.extent(x, p.xaccessor); });
        var extents2 = [];
        extents.forEach(function (x) { extents2 = extents2.concat(x); });
        p.xdomain = d3.extent(extents2);
    }
    if (!p.ydomain) {
        var extents = p.data.map(function (x) { return d3.extent(x, p.yaccessor); });
        var extents2 = [];
        extents.forEach(function (x) { extents2 = extents2.concat(x); });
        p.ydomain = d3.extent(extents2);
    }
    if (p.xdomain_min !== null) {
        p.xdomain[0] = p.xdomain_min;
    }
    if (p.xdomain_max !== null) {
        p.xdomain[1] = p.xdomain_max;
    }
    if (p.ydomain_min !== null) {
        p.ydomain[0] = p.ydomain_min;
    }
    if (p.ydomain_max !== null) {
        p.ydomain[1] = p.ydomain_max;
    }

    var records_num = 0;
    p.data.forEach(function (x) {
        records_num += x.length;
    });
    if (!p.series_style_indices) {
        p.series_style_indices = [];
        for (var i = 0; i < p.data.length; i++) {
            p.series_style_indices.push(i);
        }
    }

    // remove the previous drawing
    $(p.chart_div).empty();

    // Set the dimensions of the canvas / graph
    var margin = { top: p.margin_top, right: p.margin_right, bottom: p.margin_bottom, left: p.margin_left };
    if (p.x_axis_label) {
        margin.bottom += 20;
    }
    var width = $(p.chart_div).width() - margin.left - margin.right;
    var height = p.height - margin.top - margin.bottom;

    // Parse the date / time
    var parseDate = d3.time.format("%d-%b-%y").parse;

    // Set the ranges
    var x = d3.time.scale().domain(p.xdomain).range([0, width]);
    var y = d3.scale.linear().domain(p.ydomain).range([height, 0]);

    var span = (x.domain()[1].getTime() - x.domain()[0].getTime()) / 1000 / 60;

    // define custom time format
    var customTimeFormat = d3.time.format.multi([
        [".%L", function (d) { return d.getMilliseconds(); }],
        [":%S", function (d) { return d.getSeconds(); }],
        ["%H:%M", function (d) { return d.getMinutes(); }],
        ["%H:%M", function (d) { return d.getHours(); }],
        ["%d %b", function (d) { return d.getDay() && d.getDate() != 1; }],
        ["%d %b", function (d) { return d.getDate() != 1; }],
        ["%d %b", function (d) { return d.getMonth(); }],
        ["%d %b %Y", function () { return true; }]
    ]);

    // Define the axes
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(p.xAxisTicks)
        .tickFormat(customTimeFormat);
    if (p.show_grid) {
        xAxis
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickPadding(10);
    }

    var formatValue = d3.format(p.yFormatValue);
    var ticks = p.tickNumber(height, p.ydomain[1]);
    if (p.yAxisTicks != null) { ticks = p.yAxisTicks; }

    var tickArr = [];
    for (var i = 1; i <= ticks; i++) {
        tickArr.push(p.ydomain[0] + (i * (p.ydomain[1] - p.ydomain[0]) / (ticks + 1)));
    }

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickValues(tickArr)
        .tickFormat(function (d) { return formatValue(d); })
        .orient("left")
    if (p.show_grid) {
        yAxis
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickPadding(10);
    }

    // Define the line
    var valueline = d3.svg.line()
        .x(function (d) { return x(p.xaccessor(d)); })
        .y(function (d) { return y(p.yaccessor(d)); });

    // Bands area
    var bandsarea = d3.svg.area()
        .x(function (d) { return x(p.xaccessor(d)); })
        .y0(function (d) { return y(d.val0); })
        .y1(function (d) { return y(d.val1); });

    // Add the svg canvas
    var inner_div_id = "TimeSeriesInnerDiv" + self.sufix;
    var inner_div = d3.select(p.chart_div)
        .append("div")
        .attr("id", inner_div_id)
        .attr("style", "position: relative");
    var svg = inner_div
        .append("div")
        .attr("style", "position: relative")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add error bands
    var bandIndices = [];
    if (p.bands) {
        for (var i = 0; i < p.bands.length; i++) {
            var band = [];
            var series = p.data[p.bands[i].ref]
            var series0 = p.data[p.bands[i].lower];
            var series1 = p.data[p.bands[i].upper];
            var bandColor = p.series_style_indices[p.bands[i].ref];
            bandIndices.push(p.bands[i].lower);
            bandIndices.push(p.bands[i].upper);
            for (var j = 0; j < series0.length; j++) {
                band.push({ val0: series0[j].val, val1: series1[j].val, epoch: series0[j].epoch });
            }
            // Add band area
            svg.append("path")
                .style("fill", "white")
                .style("fill-opacity", 0.25)
                .style("stroke", "none")
                .attr("d", bandsarea(band));
        }
    }

    // Add value lines
    for (var i = 0; i < p.data.length; i++) {
        if (bandIndices.indexOf(i) != -1) { continue; } // do not plot band edges
        var series = p.data[i];
        // Add the valueline path.
        svg.append("path")
            .attr("class", "series series" + p.series_style_indices[i])
            .attr("d", valueline(series));
    };

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .style("font-size", p.xAxisFontSize)
        .call(xAxis);

    // Add the Y Axis
    g = svg.append("g")
        .attr("class", "y axis")
        .style("font-size", p.yAxisFontSize)
        .call(yAxis);

    // Add a text label for the X axis
    if (p.x_axis_label != null) {
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", width - 10)
            .attr("y", height + margin.top + 16)
            .text(p.x_axis_label);
    }

    // Add a text label for the Y axis
    if (p.y_axis_label != null) {
        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(p.y_axis_label);
    }

    // Insert tooltip div
    var tooltip = inner_div
        .append("div")
        .attr("class", "line-chart-tooltip")
        .attr("id", p.chart_div + "_tooltip")
        .style("opacity", 0);

    if (p.handle_clicks) {
        var getNearbyRecord = function (_func) {
            var mouse = d3.mouse(_func);
            var mouseDate = x.invert(mouse[0]);
            var mouseY = y.invert(mouse[1]);
            var result = null;
            var result_y_best = null;

            for (var ii = 0; ii < p.data.length; ii++) {
                var bisect = d3.bisector(p.xaccessor).left;
                var i = bisect(p.data[ii], mouseDate); // returns the index to the current data item

                var d0;
                var d1 = p.data[ii][i];

                if (i == 0 || p.data[ii].length == 1 || i >= p.data[ii].length) {
                    d0 = d1;
                } else {
                    d0 = p.data[ii][i - 1];
                }

                var xaccessor0;
                var xaccessor1;

                if (d0 != null) { xaccessor0 = p.xaccessor(d0); }
                if (d1 != null) { xaccessor1 = p.xaccessor(d1); }

                // work out which date value is closest to the mouse
                var result_x = mouseDate.getTime() - xaccessor0 > xaccessor1 - mouseDate.getTime() ? d1 : d0;
                var result_y = p.yaccessor(result_x);
                if (!result_y_best || Math.abs(result_y_best - mouseY) > Math.abs(result_y - mouseY)) {
                    result_y_best = result_y;
                    result = result_x;
                }
            }
            return result;
        };

        g.on('click', function () {
            if (p.click_callback) {
                var record = getNearbyRecord(this);
                p.click_callback(record.epoch);
            }
        });

        // focus tracking
        var focus = g.append('g').style('display', 'none');

        focus.append('line')
            .attr('id', 'focusLineX' + self.sufix)
            .attr('class', 'focusLine')
            .style("stroke-dasharray", ("5, 3"));
        focus.append('line')
            .attr('id', 'focusLineY' + self.sufix)
            .attr('class', 'focusLine')
            .style("stroke-dasharray", ("5, 3"));
        focus.append('circle')
            .attr('id', 'focusCircle' + self.sufix)
            .attr('r', 5)
            .attr('class', 'circle focusCircle');

        g.append('rect')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', function () {
                focus.style('display', null);
            })
            .on('mouseout', function () {
                focus.style('display', 'none');
                tooltip.style('opacity', 0);
            })
            .on('mousemove', function () {
                var d = getNearbyRecord(this);

                if (d == null) return;

                var xx = x(new Date(p.xaccessor(d)));
                var yy = y(p.yaccessor(d));

                focus.style('display', null);
                tooltip.style('opacity', 0.8);
                tooltip.html(p.yaccessor(d).toFixed(4) + "<br/>" + self.getTimeString(p.xaccessor(d)))
                    .style("left", xx - 10 + "px")
                    .style("top", yy + 40 + "px");

                focus.select('#focusCircle' + self.sufix)
                    .attr('cx', xx)
                    .attr('cy', yy);
                focus.select('#focusLineX' + self.sufix)
                    .attr('x1', xx)
                    .attr('y1', y(y.domain()[0]))
                    .attr('x2', xx)
                    .attr('y2', y(y.domain()[1]));
                focus.select('#focusLineY' + self.sufix)
                    .attr('x1', x(x.domain()[0]))
                    .attr('y1', yy)
                    .attr('x2', x(x.domain()[1]))
                    .attr('y2', yy);
            });
    }// if handle clicks

    if (p.backgroundSegments) {
        for (var bs_idx = 0; bs_idx < p.backgroundSegments.length; bs_idx++) {
            var bSegment = p.backgroundSegments[bs_idx];
            var epoch_start = bSegment.epoch_start;
            var epoch_end = bSegment.epoch_end;
            var seg_col = bSegment.color;
            if ((epoch_start == undefined) || (epoch_end == undefined) ||
                (seg_col == undefined)) { continue; }
            if (p.backgroundSegmentAxis == "x") {
                var seg_x = Math.max(x(epoch_start), 0);
                svg.append("rect")
                    .attr("x", seg_x)
                    .attr("y", 0)
                    .attr("width", x(epoch_end) - seg_x)
                    .attr("height", p.height - margin.top - margin.bottom)
                    .style("fill", seg_col)
                    .style("fill-opacity", p.backgroundSegmentOpacity);
            } else {
                var seg_y = Math.max(y(epoch_end), 0);
                var seg_height = y(epoch_start) - seg_y;
                svg.append("rect")
                    .attr("x", 0)
                    .attr("y", seg_y)
                    .attr("width", width)
                    .attr("height", seg_height)
                    .style("fill", seg_col)
                    .style("fill-opacity", p.backgroundSegmentOpacity);
            }
        }
    }
    // timepoint markers
    if (p.timepoints && p.timepoints.length > 0) {
        for (var j = 0; j < p.timepoints.length; j++) {
            var timepoint_1 = p.timepoints[j];
            for (var i = 0; i < timepoint_1.length; i++) {
                var timepoint = timepoint_1[i];
                var title = timepoint.title;
                var ms = timepoint.epoch;
                var ts = self.getTimeString(timepoint.epoch);
                var xx = x(ms);
                var color = p.markerColor; // TODO could be determined with callback
                if (!isNaN(xx) && xx > 0) {
                    svg.append("a")
                        .append("line")
                        .attr("id", xx)
                        .attr("data:ts", ts)
                        .attr("data:tt-title", title)
                        .attr("x1", xx)
                        .attr("x2", xx)
                        .attr("y1", 0)
                        .attr("y2", p.height - margin.top - margin.bottom)
                        .style("stroke", color)
                        .style("stroke-width", p.markerStroke)
                        .style("opacity", p.markerOpacity)
                        .on("mouseover", function (d) {
                            var ttx = d3.select(this)[0][0].id;
                            var tts = d3.select(this)[0][0].attributes[1].value;
                            var title = d3.select(this)[0][0].attributes[2].value;
                            d3.select(this).style("opacity", 0.6)
                            tooltip.style('opacity', p.markerOpacityHover);
                            tooltip.html(title + "<br/>" + tts)
                                .style("left", ttx - 70 + "px")
                                .style("bottom", height + "px");
                        })
                        .on("mouseout", function (d) {
                            d3.select(this).style("opacity", p.markerOpacity)
                            tooltip.style('opacity', 0);
                        })
                }
            }
        }
    }

    if (records_num <= 0) {
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('dy', '1em')
            .attr('text-anchor', 'end')
            .text("NO DATA!")
            .attr('class', 'zerolinetext');
    }

    // Draw legend
    var lpx = 20;
    var lpy = 20;
    var rect_length = 10;
    if (p.labels) {
        for (var i = 0; i < p.labels.length; i++) {
            if (p.labels[i]) {
                var length = p.labels[i].length * 8;
                g.append("rect")
                    .attr("x", lpx)
                    .attr("y", lpy - rect_length)
                    .attr("width", rect_length)
                    .attr("height", rect_length)
                    .attr("class", "series-legend" + i)

                g.append("text")
                    .attr("x", lpx + 12)
                    .attr("y", lpy)
                    .text(p.labels[i])

                if (lpx + (2 * length) > width) {
                    lpx = 20;
                    lpy = lpy + 20;
                }
                else {
                    lpx += length + 10;
                }
            }
        }
    } else {
        p.labels = [];
        for (var i = 0; i < p.data.length; i++) {
            p.labels.push("Series" + i);
        }
    }

    if (p.exportable) {
        var export_btn = $('<div></div>');

        export_btn.addClass('btn-export-data');
        export_btn.css('position', 'absolute');
        export_btn.css('right', margin.right);
        export_btn.css('top', margin.top);

        export_btn.click(function () {
            var fname = 'export.csv';
            var content = '';

            var all_series = p.data;

            if (all_series.length == 0) {
                self.promptDownload(fname, content);
                return;
            }

            // the headers
            content += 'timestamp';
            for (var headerN = 0; headerN < all_series.length; headerN++) {
                content += ',' + p.labels[headerN];
            }
            // count the number of rows in the file
            var row_count = all_series[0].length;

            var rowsDict = {};
            for (var headerN = 0; headerN < all_series.length; headerN++) {
                for (var row = 0; row < all_series[headerN].length; row++) {
                    var epoch = all_series[headerN][row].epoch;
                    var val = all_series[headerN][row].val;
                    if (!(epoch in rowsDict)) {
                        rowsDict[epoch] = [];
                        for (var rn = 0; rn < all_series.length; rn++) {
                            rowsDict[epoch].push(0);
                        }
                    }
                    else {
                        rowsDict[epoch][headerN] = val;
                    }
                }
            }

            for (var headerN = 0; headerN < all_series.length; headerN++) {
                for (var row = 0; row < all_series[headerN].length; row++) {
                    var epoch = all_series[headerN][row].epoch;
                    var val = all_series[headerN][row].val;
                    if (epoch in rowsDict) {
                        rowsDict[epoch][headerN] = val;
                    }
                }
            }

            // put keys (epoch) in an array and sort it
            var keys = [];
            for (var epoch in rowsDict) {
                keys.push(epoch);
            }
            keys.sort();

            // go through all the rows and join the elements
            for (var keyN = 0; keyN < keys.length; keyN++) {
                var row_str = '\n';
                row_str += keys[keyN].toString();
                for (var seriesN = 0; seriesN < all_series.length; seriesN++) {
                    row_str += ',' + rowsDict[keys[keyN]][seriesN].toString();
                }
                content += row_str;
            }

            self.promptDownload(fname, content);
        })
        $("#" + inner_div_id).append(export_btn);
    }
}
TsDashboard.Widgets.TimeSeries.prototype.getTimeString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD hh:mm:ss');
}
TsDashboard.Widgets.TimeSeries.prototype.promptDownload = function (fname, content) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', fname);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
