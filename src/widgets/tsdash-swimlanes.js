
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
TsDashboard.Widgets.WidgetSwimLanes = function (config) {
    var self = this;
    // If we have user-defined parameters, override the defaults.
    var p = {
        start: null,
        end: null,
        events: null,
        target_div: "#divTarget",
        type_field: "type",
        side_margin: 0,
        left_margin: 0,
        right_margin: 0,
        prcnt_margin: true,
        left_padding: 30,
        hide_types: false,
        circle_color: "#007ACC",
        circle_color_cb: null,
        circle_color2: null,
        circle_color2_cb: null,
        lanes_color: "#303030",
        lane_color: "#000000",
        lane_color2: "#111",
        lane_opacity: 1,
        lane_selected_opacity: 1,
        lane_height: 30,
        circle_radius: 8,
        circle_over_radius: 10,
        ticks: 10,
        type_text_opacity: 0.3,
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
    if (p.hide_types) {
        p.left_padding = 0;
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
    if (self.prcnt_margin) {
        var span = end - start;
        start -= span * 0.05;
        end += span * 0.05;
    }

    $(p.target_div)
        .empty()
        .css("padding", p.side_margin)
        .css("font-size", 10)
        .css("background-color", p.lanes_color);

    // x axis scaler
    var target_range = [2 * p.side_margin + p.left_padding + p.left_margin, -p.right_margin + width - 2 * p.side_margin];
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
        .attr('y', 0)
        .attr('width', width)
        .attr('height', p.lane_height)
        .attr('fill', function () { return (line_counter++ % 2 == 0 ? p.lane_color : p.lane_color2); });

    lanes.append("text")
        .attr("class", "timeline-lane-title")
        .attr('x', 5)
        .attr("dy", "1.5em")
        .attr("opacity", p.type_text_opacity)
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
        .style("cursor", "pointer")
        .on("click", p.click_cb)
        .on("mouseover", function (d) { d3.select(this).transition().duration(50).attr("r", p.circle_over_radius).attr("fill", p.circle_color2).attr("fill-opacity", 1) })
        .on("mouseout", function (d) { d3.select(this).transition().duration(50).attr("r", p.circle_radius).attr("fill", p.circle_color).attr("fill-opacity", p.circle_opacity_cb || 1) })
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
    if (!p.hide_types) {
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
}
