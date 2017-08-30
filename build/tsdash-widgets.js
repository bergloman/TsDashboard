
var TsDashboard = TsDashboard || {};
TsDashboard.Widgets = TsDashboard.Widgets || {};

/**
 * This widget displays swimlanes for events
 * @param {object} config - configuration object
 * @param {Date} config.start - start date to display
 * @param {Date} config.end - end date to display
 * @param {Array} config.events - Array of events to display. Event must contains two field - "ts" and "type"
 * @param {string} config.target_div - ID of HTML element where this widget is to be drawn
 */
TsDashboard.Widgets.WidgetSwimLanes = function(config) {
    var self = this;
    // If we have user-defined parameters, override the defaults.
    var p = {
        start: null,
        end: null,
        events: null,
        target_div: "#divTarget",
        type_field: "type",
        side_margin: 0,
        left_padding: 30,
        circle_color: "#007ACC",
        circle_color_cb: null,
        circle_color2: null,
        circle_color2_cb: null,
        lanes_color: "#333",
        lane_color: "#000",
        lane_color2: "#070707",
        lane_opacity: 1,
        lane_selected_opacity: 1,
        lane_height: 30,
        circle_radius: 8,
        circle_over_radius: 10,
        ticks: 10,
        click_cb: function () { },
        title_cb: function (d) { return self.getTimeString(d.ts); }
    };

    // If we have user-defined parameters, override the defaults
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }
    p.circle_color = p.circle_color_cb || p.circle_color;
    p.circle_color2 = p.circle_color2_cb || p.circle_color2 || p.circle_color;

    if (!p.target_div.startsWith("#")) {
        p.target_div = "#" + p.target_div;
    }

    this._p = p;
    this._sort_type = "d";
    this.clear();
}

TsDashboard.Widgets.WidgetSwimLanes.prototype.clear = function (d) {
    this._eventTypes = [];
    this._eventTypesDict = {};
    this.analyzeEventTypes();
}
TsDashboard.Widgets.WidgetSwimLanes.prototype.redraw = function (d) {
    this.clear();
    this.draw();
}
TsDashboard.Widgets.WidgetSwimLanes.prototype.getTimeString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD hh:mm:ss');
}

TsDashboard.Widgets.WidgetSwimLanes.prototype.getEventType = function (event) {
    return event[this._p.type_field];
}

TsDashboard.Widgets.WidgetSwimLanes.prototype.analyzeEventTypes = function () {
    var self = this;
    var p = this._p;
    var events = this._p.events;
    var eventTypes = this._eventTypes;
    var eventTypesDict = this._eventTypesDict;
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var event_type = this.getEventType(event);
        if (event_type in eventTypesDict) {
            var ii = eventTypesDict[event_type];
            eventTypes[ii].max = event.ts;
            eventTypes[ii].cnt++;
        } else {
            eventTypesDict[event_type] = eventTypes.length;
            eventTypes.push({
                type: event_type,
                min: event.ts,
                max: event.ts,
                cnt: 1
            });
        }
    }
    eventTypes.sort(function (a, b) {
        if (self._sort_type == "d") {
            return (a.min < b.min ? -1 : 1);
        } else if (self._sort_type == "c") {
            return (a.cnt < b.cnt ? 1 : -1); // sort descending
        } else {
            return a.type.localeCompare(b.type);
        }
    });
    for (var i = 0; i < eventTypes.length; i++) {
        eventTypesDict[eventTypes[i].type] = i;
    }
}

TsDashboard.Widgets.WidgetSwimLanes.prototype.draw = function () {
    var self = this;
    var p = this._p;
    var width = $(p.target_div).width();
    var timeline_height = 20;
    var events = p.events;
    var start = p.start || events[0].ts;
    var end = p.end || events[events.length - 1].ts;
    var span = end - start;
    start -= span * 0.05;
    end += span * 0.05;

    $(p.target_div)
        .empty()
        .css("padding", p.side_margin)
        .css("font-size", 10)
        .css("background-color", p.lanes_color);

    // x axis scaler
    var target_range = [2 * p.side_margin + p.left_padding, width - 2 * p.side_margin];
    var scaleX = d3.scale.linear()
        .domain([start, end])
        .range(target_range);

    var eventTypes = this._eventTypes;
    var eventTypesDict = this._eventTypesDict;

    // define event type associated lanes
    var svg = d3.select(p.target_div)
        .append("svg")
        .attr("width", width)
        .attr("height", p.lane_height * eventTypes.length + 2 * timeline_height);

    // time scaler
    var scaleTime = d3.time.scale()
        .domain([new Date(start), new Date(end)])
        .range(target_range);

    // append top time axis
    svg.append("g")
        .attr('transform', 'translate(0,' + (timeline_height) + ')')
        .attr("class", "axis")
        .call(d3.svg.axis().scale(scaleTime).orient("top").ticks(p.ticks)
            .innerTickSize(5)
            .outerTickSize(1))
        .style("fill", p.circle_color)
        .style("stroke", "none");

    var lanes = svg.append('g').selectAll('.timeline-lane')
        .data(eventTypes)
        .enter().append("g")
        .attr('transform', function (d, i) {
            return 'translate(0,' + (timeline_height + i * p.lane_height) + ')'
        });
    var line_counter = 0;
    lanes.append('rect')
        .attr("class", "timeline-lane")
        .attr('x', 0)
        .attr('y', 0) //function (d, i) { return i * p.lane_height; })
        .attr('width', width)
        .attr('height', p.lane_height)
        .attr('fill', function() { return (line_counter++ % 2 == 0 ? p.lane_color : p.lane_color2); });

    lanes.append("text")
        .attr("class", "timeline-lane-title")
        .attr('x', 5)
        .attr("dy", "1.5em")
        .text(function (d, i) {
            return (d.type || "");
        });

    svg.selectAll("circle")
        .data(events)
        .enter().append("circle")
        .attr("cy", function (d) { return timeline_height + (0.5 + eventTypesDict[self.getEventType(d)]) * p.lane_height; })
        .attr("cx", function (d) { return scaleX(d.ts); })
        .attr("r", p.circle_radius_cb || p.circle_radius)
        .attr("fill", p.circle_color)
        .attr("fill-opacity", p.circle_opacity_cb || 1)
        .on("click", p.click_cb)
        .on("mouseover", function (d) { d3.select(this).transition().duration(50).attr("r", p.circle_over_radius).attr("fill", p.circle_color2) })
        .on("mouseout", function (d) { d3.select(this).transition().duration(50).attr("r", p.circle_radius).attr("fill", p.circle_color) })
        .append("svg:title")
        .text(p.title_cb);

    // show timescale again at bottom
    // time scale
    scaleTime = d3.time.scale()
        .domain([new Date(start), new Date(end)])
        .range(target_range);

    // append time axis
    svg.append("g")
        .attr('transform', 'translate(0,' + (timeline_height + p.lane_height * eventTypes.length) + ')')
        .attr("class", "axis")
        .call(d3.svg.axis().scale(scaleTime).orient("bottom").ticks(p.ticks)
            .innerTickSize(5)
            .outerTickSize(1))
        .style("fill", p.circle_color)
        .style("stroke", "none");

    // append buttons for switching sort
    var btn1 = svg.append("text")
        .attr('x', 5)
        .attr("y", 12)
        .text("Type /");
    btn1.on('click', function () {
        self._sort_type = "t";
        self.redraw();
    });
    btn1.style("cursor", "pointer");

    var btn2 = svg.append("text")
        .attr('x', 32)
        .attr("y", 12)
        .text("Date /");
    btn2.on('click', function () {
        self._sort_type = "d";
        self.redraw();
    });
    btn2.style("cursor", "pointer");

    var btn3 = svg.append("text")
        .attr('x', 62)
        .attr("y", 12)
        .text("Count");
    btn3.on('click', function () {
        self._sort_type = "c";
        self.redraw();
    });
    btn3.style("cursor", "pointer");
}

;TsDashboard = TsDashboard || {};
TsDashboard.Widgets = TsDashboard.Widgets || {};

TsDashboard.Widgets.getDateTimeString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD hh:mm:ss');
}

TsDashboard.Widgets.SparklineTable = function (config) {
    var self = this;

    var p = {
        target_div: "#someChart",
        data: null,
        spark_height: 15,
        columns: 3,
        title_clip_prefix: null,
        title_clip_after: null,
        col_names: null,
        first_col_width: 150
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }
    if (p.col_names == null) {
        p.col_names = [];
        for (var i = 0; i < p.columns; i++) {
            p.col_names.push("");
        }
    }


    if (!p.target_div.startsWith("#")) {
        p.target_div = "#" + p.target_div;
    }

    this._p = p;
    this._sort_type = "d";
    this.clear();
}

TsDashboard.Widgets.SparklineTable.prototype.clear = function (d) {
}
TsDashboard.Widgets.SparklineTable.prototype.redraw = function (d) {
    this.clear();
    this.draw();
}

TsDashboard.Widgets.SparklineTable.prototype.draw = function () {
    var self = this;
    var p = this._p;
    // create a line function that can convert data[] into x and y points
    var sparkline = d3.svg.line()
        .interpolate("linear")
        .x(function (d) { return xscale(d.epoch); })
        .y(function (d) { return yscale(d.val); });
    // Bands area
    var bandsarea = d3.svg.area()
        .x(function (d) { return xscale(d.epoch); })
        .y0(function (d) { return yscale(d.val); })
        .y1(function (d) { return yscale(0); });

    // remove the previous drawing
    $(p.target_div).empty();

    var data = p.data;
    var colNo = p.columns;
    var rowNo = Math.floor((p.data.length - 1) / colNo) + 1;

    // create headers
    var thead = $("<thead></thead>");
    var theadtr = $("<tr></tr>");
    for (var i = 0; i < p.col_names.length; i++) {
        var csswidth = i == 0 ? " style='white-space:nowrap' " : "";
        theadtr.append("<th" + csswidth + ">" + p.col_names[i] + "</th>");
    }
    thead.append(theadtr);

    // create body
    var tbody = $("<tbody></tbody>");

    // combine into a table
    var table = $("<table class=\"table\"></table>");
    table.append(thead);
    table.append(tbody);
    $(p.target_div).append(table);

    // style
    $(p.target_div).css('overflow', 'auto');
    $(p.target_div).css('height', p.height);
    $(p.target_div).css('margin-bottom', p.margin_bottom);

    var col_width = ((table.width() - p.first_col_width) / colNo).toFixed();
    console.log("col_width", col_width)

    for (var i = 0; i <= rowNo; i++) {
        // create row
        var row = $("<tr></tr>");
        tbody.append(row);
        // add columns
        for (var j = 0; j < colNo; j++) {
            var dataIdx = i * colNo + j;
            if (dataIdx >= p.data.length) continue;
            var datum = data[dataIdx].values;
            var title = data[dataIdx].title;

            if (j == 0) {
                var ctitle = title;
                if (p.title_clip_after != null) {
                    p.title_clip_after.forEach(function (val) {
                        if (ctitle.indexOf(val) >= 0) {
                            ctitle = ctitle.substring(0, ctitle.indexOf(val));
                        }
                    });
                }
                if (p.title_clip_prefix != null) {
                    if (ctitle.startsWith(p.title_clip_prefix) >= 0) {
                        ctitle = ctitle.substr(p.title_clip_prefix.length);
                    }
                }
                var titleTd = $("<td style='background-color:black !important; width:" + p.first_col_width
                    + "px; word-break:break-all;'>" + ctitle + "</td>");
                row.append(titleTd);
            }

            var imgTd = $("<td style='background-color:black !important; border-left: thin solid #282828; width:"
                + col_width + "px;'></td>");
            var imgDiv = document.createElement("div");
            imgTd.append(imgDiv);
            row.append(imgTd);

            datum.forEach(function (d) {
                d.date = TsDashboard.Widgets.getDateTimeString(d.epoch);
            });
            // xscale will fit all values from data.date within pixels 0-width
            var xscale = d3.time.scale()
                .domain([d3.min(datum, function (d) { return d.epoch; }),
                d3.max(datum, function (d) { return d.epoch; })])
                .range([0, +col_width]);
            // yscale will fit all walues from data.val within pixels 0-width
            var yscale = d3.scale.linear()
                .domain([d3.min(datum, function (d) { return d.val; }),
                d3.max(datum, function (d) { return d.val; })])
                .range([p.spark_height, 0]);


            var svg = d3.select(imgDiv)
                .append("svg")
                .attr("width", +col_width)
                .attr("height", p.spark_height);
            svg.append("path")
                .attr("d", sparkline(datum))
                .attr("stroke", "#147BB1")
                .style("stroke-width", 1.0)
            svg.append("path")
                .style("fill", "#147BB1")
                .style("fill-opacity", 0.8)
                .style("stroke", "none")
                .attr("fill", "#147BB1")
                .attr("d", bandsarea(datum));
        }
    }
}
