/**
 * This widget displays swimlanes for events
 * @param {object} config - configuration object
 * @param {Date} config.start - start Date to display
 * @param {Date} config.end - end Date to display
 * @param {Array} config.events - Array of events to display
 * @param {Array} config.categories - Array of field names that are used for grouping into swimlanes
 */
function WidgetSwimLanes(config) {
    // If we have user-defined parameters, override the defaults.
    var p = {
        start: null,
        end: null,
        events: null,
        categories: null,
        side_margin: 0,
        chart_div: "#divTarget",
        circle_color: "#007ACC",
        circle_color2: "#72afcc",
        lanes_color: "#333",
        master_lane_color: "#333",
        lane_opacity: 1,
        lane_selected_opacity: 1,
        lane_height: 30,
        left_padding: 30,
        circle_radius: 8,
        circle_over_radius: 10,
        ticks: 10,
        show_now: false,
        start_hover_callback: function () { },
        end_hover_callback: function () { }
    };

    // If we have user-defined parameters, override the defaults
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    this._p = p;
    this._eventTypes = [];
    this._eventTypesDict = {};
    this.analyzeEventTypes();
}

WidgetSwimLanes.prototype.getTimeString = function (d) {
    if (!d) {
        d = new Date();
    }
    return moment(d).format('YYYY-MM-DD hh:mm:ss');
}

WidgetSwimLanes.prototype.getEventType = function (event) {
    var p = this._p;
    var event_type = "";
    for (var j = 0; j < p.categories.length; j++) {
        var cat = p.categories[j];
        event_type += "[" + event[cat] + "] ";
    }
    return event_type.trim();
}

WidgetSwimLanes.prototype.analyzeEventTypes = function () {
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
        return a.type.localeCompare(b.type);
    });
    for (var i = 0; i < eventTypes.length; i++) {
        eventTypesDict[eventTypes[i].type] = i;
    }
    events.sort(function (a, b) {
        if (a.ts > b.ts) return -1;
        return 1;
    });
}

WidgetSwimLanes.prototype.draw = function () {
    var self = this;
    var p = this._p;
    var width = $(p.chart_div).width();
    var timeline_height = 20;
    var events = p.events;
    var start = p.start || events[0].ts;
    var end = p.end || events[events.length - 1].ts;
    var span = end - start;
    start -= span * 0.05;
    end += span * 0.05;

    $(p.chart_div)
        .empty()
        .css("padding", p.side_margin)
        .css("font-size", 10)
        .css("background-color", p.lanes_color);

    // x axis scaler
    var target_range = [2 * p.side_margin + p.left_padding, width - 2 * p.side_margin];
    console.log(target_range);
    var scaleX = d3.scale.linear()
        .domain([start, end])
        .range(target_range);

    var eventTypes = this._eventTypes;
    var eventTypesDict = this._eventTypesDict;

    // define event type associated lanes
    var svg = d3.select(p.chart_div)
        .append("svg")
        .attr("width", width)
        .attr("height", p.lane_height * eventTypes.length + 2 * timeline_height);

    // time scaler
    var scaleTime = d3.time.scale()
        .domain([new Date(start), new Date(end)])
        //.nice(d3.time.hour)
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
    lanes.append('rect')
        .attr("class", "timeline-lane")
        .attr('x', 0)
        .attr('y', 0) //function (d, i) { return i * p.lane_height; })
        .attr('width', width)
        .attr('height', p.lane_height)
        .on("click", function (d, i) {
            //alert("-" + d + "-" + i); 
        });

    lanes.append("text")
        .attr("class", "timeline-lane-title")
        .attr('x', 5)
        .attr("dy", "1.5em")
        .text(function (d, i) {
            return (d.type || "");
        });

    // if (p.show_now) {
    //     var now_d = new Date();
    //     var now = now_d.getTime();
    //     var today_d = new Date();
    //     today_d.setHours(0, 0, 0, 0);

    //     svg.append("line")
    //         .attr("x1", scaleX(now))
    //         .attr("y1", timeline_height)
    //         .attr("x2", scaleX(now))
    //         .attr("y2", timeline_height + eventTypes.length * p.lane_height)
    //         .style("stroke", "gold")
    //         .style("stroke-dasharray", "3,2")
    //         .style("opacity", 0.3)
    //         .style("stroke-width", 1);
    //     var day_in_msec = 24 * 60 * 60 * 1000;
    //     while (today_d > start) {
    //         svg.append("line")
    //             .attr("x1", scaleX(today_d))
    //             .attr("y1", timeline_height)
    //             .attr("x2", scaleX(today_d))
    //             .attr("y2", timeline_height + eventTypes.length * p.lane_height)
    //             .style("stroke", "white")
    //             .style("stroke-dasharray", "2,2")
    //             .style("opacity", 0.3)
    //             .style("stroke-width", 1);
    //         today_d -= day_in_msec
    //     }
    // }
    svg.append('g').selectAll('line')
        .data(eventTypes)
        .enter().append('line')
        .attr("x1", function (d) { return scaleX(d.min); })
        .attr("y1", function (d, i) { return timeline_height + (0.5 + i) * p.lane_height; })
        .attr("x2", function (d) { return scaleX(d.max); })
        .attr("y2", function (d, i) { return timeline_height + (0.5 + i) * p.lane_height; })
        .style("stroke", p.circle_color)
        .style("stroke-width", 1);

    svg.selectAll("circle")
        .data(events)
        .enter().append("circle")
        .attr("cy", function (d) { return timeline_height + (0.5 + eventTypesDict[self.getEventType(d)]) * p.lane_height; })
        .attr("cx", function (d) { return scaleX(d.ts); })
        .attr("r", p.circle_radius)
        .attr("fill", p.circle_color)
        .on("mouseover", function (d) {
            d3.select(this).transition().duration(100).attr("r", p.circle_over_radius).attr("fill", p.circle_color2);
            p.start_hover_callback(d);
        })
        .on("mouseout", function (d) {
            d3.select(this).transition().duration(100).attr("r", p.circle_radius).attr("fill", p.circle_color);
            p.end_hover_callback(d);
        })
        .append("svg:title")
        .text(function (d) {
            //return d.type; 
            return self.getTimeString(d.ts) + " " + self.getEventType(d);
        });

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
}

