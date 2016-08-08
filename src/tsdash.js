function TsDashboard(div_id, driver) {
    this.driver = driver;
    this.div_id = div_id;
    this.init();

    this.regex_date = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/;
    this.regex_datetime = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31)) (0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/;
}

TsDashboard.prototype.init = function () {
    var self = this;
    self.driver.getViewDefinition(function (conf) {
        self.conf = conf;
        self.conf.parameters = self.conf.parameters || [];

        self.top = $("#" + self.div_id);

        self.top.append("<div class='tsd-header'></div>");
        self.top.append("<div class='tsd-sidebar dark-matter'></div>");
        self.top.append("<div class='tsd-main' id='tsd_main'></div>");

        $(".tsd-header").append("<h1>" + conf.title + "</h1>");

        self.initParams();
    });
}

TsDashboard.prototype.getTimeString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD hh:mm:ss');
}

TsDashboard.prototype.getDateString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD');
}

TsDashboard.prototype.initParams = function () {
    var self = this;
    var sidebar = $(".tsd-sidebar");
    for (var ii in self.conf.parameters) (function (i) {
        var par = self.conf.parameters[i];

        var label = $(document.createElement("div"));
        label.appendTo(sidebar);
        label.append("<span>" + par.title + "</span>");

        if (par.type === "string") {
            label.append("<input id='in" + par.name + "'></input>");
            if (par.default) {
                $("#in" + par.name).val(par.default);
            }

        } else if (par.type === "datetime") {
            label.append("<input id='in" + par.name + "' placeholder='yyyy-mm-dd hh:MM:ss'></input>");
            label
                .append("<a id='hin_now_" + par.name + "'>Now</a>")
                .click(function () { $("#in" + par.name).val(self.getNowString()); });
            label
                .append("<a id='hin_today_" + par.name + "'>Today</a>")
                .click(function () { alert(par.name); });
            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name).val(self.getTimeString(par.default));
                } else {
                    $("#in" + par.name).val(par.default);
                }
            }

        } else if (par.type === "date") {
            label.append("<input id='in" + par.name + "' placeholder='yyyy-mm-dd'></input>");
            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name).val(self.getDateString(par.default));
                } else {
                    $("#in" + par.name).val(par.default);
                }
            }

        } else if (par.type === "filter") {
            label.append("<input id='in" + par.name + "'></input>");
            label.append("<div id='opt" + par.name + "' class='tsd-match-options'></div>");
            $("#in" + par.name).keyup(function () {
                var val = $("#in" + par.name).val();
                if (val.length < 3) return;
                self.driver.getParamValues(par.name, val, function (options) {
                    $("#opt" + par.name).empty();
                    $("#opt" + par.name).show();
                    for (var ii in options) (function (i) {
                        var option = $(document.createElement("div"));
                        option.text(options[i]);
                        option.click(function () {
                            $("#in" + par.name).val(options[i]);
                            $("#opt" + par.name).empty();
                            $("#opt" + par.name).hide();
                        })
                        $("#opt" + par.name).append(option);
                    })(ii);
                });
            });
            if (par.default) {
                $("#in" + par.name).val(par.default);
            }

        } else if (par.type === "enum") {
            label.append("<select id='sel" + par.name + "'></select >");
            self.driver.getParamValues(par.name, null, function (options) {
                for (var i in options) {
                    var option = options[i];
                    $("#sel" + par.name).append("<option value='" + option.value + "'>" + option.caption + "</option>");
                }
                if (par.default) {
                    $("#sel" + par.name).val(par.default);
                }
            });

        } else if (par.type === "boolean") {
            label.append("<input type='checkbox' id='cb" + par.name + "'></input>");
                if (par.default) {
                    $("#cb" + par.name).attr('checked', "true");
        }
        }
    })(ii);

    var btn = $(document.createElement("button"));
    btn.text("Run");
    btn.click(function () { self.run(); });
    btn.appendTo(sidebar);
}

TsDashboard.prototype.collectParameterValues = function () {
    var self = this;
    var param_values = [];
    for (var i in self.conf.parameters) {
        var par = self.conf.parameters[i];
        var par_value = { name: par.name };
        if (par.type === "string") {
            par_value.value = $("#in" + par.name).val()

        } else if (par.type === "datetime") {
            par_value.value = $("#in" + par.name).val();
            if (!self.regex_datetime.test(par_value.value)) {
                alert("Invalid date format or value: " + par.title);
                return null;
            }
            par_value.value = new Date($("#in" + par.name).val());

        } else if (par.type === "date") {
            par_value.value = $("#in" + par.name).val();
            if (!self.regex_date.test(par_value.value)) {
                alert("Invalid date format or value: " + par.title);
                return null;
            }
            par_value.value = new Date($("#in" + par.name).val());

        } else if (par.type === "filter") {
            par_value.value = $("#in" + par.name).val();

        } else if (par.type === "enum") {
            par_value.value = $("#sel" + par.name).val();

        } else if (par.type === "boolean") {
            par_value.value = false;
            if ($("#cb" + par.name).attr('checked')) {
                par_value.value = true;
            }
        }
        param_values.push(par_value);
    };
    return param_values;
}

TsDashboard.prototype.run = function () {
    var self = this;
    var params = self.collectParameterValues();
    if (!params) {
        return;
    }
    var options = {
        conf: self.conf,
        params: params
    }
    self.driver.getDrawData(options, function (data) {
        var main = $("#tsd_main");
        main.empty();
        var widget_counter = 1;
        for (var i in self.conf.blocks) {
            var block = self.conf.blocks[i];
            var block_div = $(document.createElement("div"));
            main.append(block_div);

            block_div.addClass("tds-block");
            if (block.title && block.title.length > 0) {
                block_div.append($(document.createElement("h2")).text(block.title));
            }

            var block_div2 = $(document.createElement("div"));
            block_div2.addClass("tds-block-inner");
            block_div.append(block_div2);

            var col_class = "tds-col-1-" + block.panels.length; 

            for (var j in block.panels) {
                var panel = block.panels[j];
                var panel_div = $(document.createElement("div"));
                block_div2.append(panel_div);
                panel_div.addClass("tds-panel");
                panel_div.addClass(col_class);
                if (panel.title && panel.title.length > 0) {
                    panel_div.append($(document.createElement("h3")).text(panel.title));
                }

                for (var k in panel.widgets) {
                    var widget = panel.widgets[k];
                    var widget_div = $(document.createElement("div"));
                    panel_div.append(widget_div);
                    widget_div.addClass("tds-widget");
                    if (widget.title && widget.title.length > 0) {
                        widget_div.append($(document.createElement("h3")).text(widget.title));
                    }
                    var widget_id = "tsd_widget_" + widget_counter;
                    widget_div.append(
                        $(document.createElement("div"))
                        .attr("id", widget_id)
                        .attr("class", "tsd-widget-sub"));

                    var data_series = [];
                    data_series = widget.timeseries
                        .map(function (x) {
                            for (var series_i in data.timeseries) {
                                var series = data.timeseries[series_i];
                                if (series.name === x) {
                                    return series.values;
                                }
                            }
                            return null;
                        })
                        .filter(function (x) { return x !== null; });

                    var options = {
                        chart_div: "#" + widget_id,
                        data: data_series,
                        height: widget.height,
                        handle_clicks: true
                    }
                    if (widget.options) {
                        Object.assign(options, widget.options);
                    }
                    self.drawTimeSeriesMulti(options);
                    widget_counter++;
                }
            }
        };
    });
}

TsDashboard.prototype.toNiceDateTime = function (s) {
    if (!s) return "-";
    return moment(s).format("YYYY-MM-DD HH:mm:ss");
}

TsDashboard.prototype.drawTimeSeriesMulti = function (config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        data: null,
        height: 100,
        xaccessor: function (x) { return x.epoch; },
        yaccessor: function (x) { return x.val; },
        xdomain: null,
        xdomain_min: null,
        xdomain_max: null,
        ydomain: null,
        ydomain_min: null,
        ydomain_max: null,
        xcaption: null,
        ycaptions: null,
        series_style_indices: null,
        handle_clicks: false,
        show_grid: true,
        x_axis_label: null,
        y_axis_label: null,
        graph_css: 'area',
        xAxisFontSize: '14px',
        yAxisFontSize: '14px',
        xAxisTicks: 7,
        yFormatValue: "s",
        tickNumber: function (height, yDomainMax) {
            return Math.min(height < 100 ? 3 : 8, yDomainMax);
        },
        markerStroke: 1,
        markerOpacity: 0.4,
        markerOpacityHover: 0.6,
        markerColor: "#ff0000",
        click_callback: null,
        timepoints: null,
        timepoint_callback: null
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }
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
    var margin = { top: 18, right: 35, bottom: 20, left: 50 };
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
        ["%I:%M", function (d) { return d.getMinutes(); }],
        ["%I:%M", function (d) { return d.getHours(); }],
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

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(ticks)
        .tickFormat(function (d) { return formatValue(d); });
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

    // Add the svg canvas
    var svg = d3.select(p.chart_div)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    for (var i = 0; i < p.data.length; i++) {
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

    // Add a text label for the X axis
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
    var tooltip = d3.select(p.chart_div).append("div")
        .attr("class", "line-chart-tooltip")
        .attr("id", p.chart_div + "_tooltip")
        .style("opacity", 0);

    if (p.handle_clicks) {
        var getNearbyRecord = function (_func) {
            var mouse = d3.mouse(_func);
            var mouseDate = x.invert(mouse[0]);

            var bisect = d3.bisector(p.xaccessor).left;
            var i = bisect(p.data[0], mouseDate); // returns the index to the current data item

            var d0 = p.data[0][i - 1];
            var d1 = p.data[0][i];
            if (i == 0) { d0 = d1; }
            if (i >= p.data[0].length) { d1 = d0; }

            // work out which date value is closest to the mouse
            return mouseDate.getTime() - p.xaccessor(d0) > p.xaccessor(d1) - mouseDate.getTime() ? d1 : d0;

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
            .attr('id', 'focusLineX')
            .attr('class', 'focusLine')
            .style("stroke-dasharray", ("5, 3"));
        focus.append('line')
            .attr('id', 'focusLineY')
            .attr('class', 'focusLine')
            .style("stroke-dasharray", ("5, 3"));
        focus.append('circle')
            .attr('id', 'focusCircle')
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

                var xx = x(new Date(p.xaccessor(d)));
                var yy = y(p.yaccessor(d));

                focus.style('display', null);
                tooltip.style('opacity', 0.8);
                tooltip.html(p.yaccessor(d).toFixed(4) + "<br/>" + self.toNiceDateTime(p.xaccessor(d)))
                    .style("left", xx - 10 + "px")
                    .style("top", yy + 40 + "px");

                focus.select('#focusCircle')
                    .attr('cx', xx)
                    .attr('cy', yy);
                focus.select('#focusLineX')
                    .attr('x1', xx)
                    .attr('y1', y(y.domain()[0]))
                    .attr('x2', xx)
                    .attr('y2', y(y.domain()[1]));
                focus.select('#focusLineY')
                    .attr('x1', x(x.domain()[0]))
                    .attr('y1', yy)
                    .attr('x2', x(x.domain()[1]))
                    .attr('y2', yy);
            });
    }// if handle clicks

    // timepoint markers
    if (p.timepoints) {
        for (var i = 0; i < p.timepoints.length; i++) {
            var alertUrl = p.timepoints[i].url;
            var alertTitle = p.timepoints[i].title;
            var ms = new Date(p.timepoints[i].ts).getTime();
            var ts = new Date(p.timepoints[i].ts).toString();
            var xx = x(ms);
            var color = p.markerColor; // TODO could be determined with clalback
            if (!isNaN(xx) && xx > 0) {
                svg.append("a")
                    .attr("xlink:href", alertUrl)
                    .append("line")
                    .attr("id", xx)
                    .attr("data:ts", ts)
                    .attr("data:tt-title", alertTitle)
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
                        d3.select(this).style("opacity", 1)
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

    if (records_num <= 0) {
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('dy', '1em')
            .attr('text-anchor', 'end')
            .text("NO DATA!")
            .attr('class', 'zerolinetext');
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////
// Polyfills
/////////////////////////////////////////////////////////////////////////////////////////////

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callback, thisArg) {
        var T, k;
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        // 1. Let O be the result of calling ToObject passing the |this| value
        // as the argument.
        var O = Object(this);
        // 2. Let lenValue be the result of calling the Get internal method of O
        // with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;
        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }
        // 5. If thisArg was supplied, let T be thisArg; else let T be
        // undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }
        // 6. Let k be 0
        k = 0;
        // 7. Repeat, while k < len
        while (k < len) {
            var kValue;
            // a. Let Pk be ToString(k).
            // This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal
            // method of O with argument Pk.
            // This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {
                // i. Let kValue be the result of calling the Get internal
                // method of O with argument Pk.
                kValue = O[k];
                // ii. Call the Call internal method of callback with T as the
                // this value and
                // argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined
    };
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function (fun/* , thisArg */) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];

                // NOTE: Technically this should Object.defineProperty at
                // the next index, as push can be affected by
                // properties on Object.prototype and Array.prototype.
                // But that method's new, and collisions should be
                // rare, so use the more-compatible alternative.
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}