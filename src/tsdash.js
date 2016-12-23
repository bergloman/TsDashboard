function TsDashboard(div_id, driver) {
    var self = this;
    this.driver = driver;
    this.div_id = div_id;
    this.init();

    this.regex_date = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/;
    this.regex_datetime = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31)) (0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/;

    if (this.driver.registerView) {
        this.driver.registerView(this);
    }
}

TsDashboard.prototype.onParamChange = function (name) {
    if (self.driver.onParamChange) {
        self.driver.onParamChange(name);
    }
};

TsDashboard.prototype.init = function () {
    var self = this;
    self.driver.getViewDefinition(function (conf) {
        self.conf = conf;
        self.conf.parameters = self.conf.parameters || [];

        self.top = $("#" + self.div_id);
        self.top.addClass("tsd");

        if (self.conf.hide_sidebar) {
            self.top.append("<div class='tsd-main' id='tsd_main'></div>");
        } else {
            self.top.append("<div class='tsd-sidebar dark-matter'></div>");
            self.top.append("<div class='tsd-main' id='tsd_main'></div>");
            self.conf.sidebar_width = self.conf.sidebar_width || 190;
            $(".tsd-sidebar").width(self.conf.sidebar_width);
            $(".tsd-main").css("margin-left", (+self.conf.sidebar_width) + "px");

            if (conf.title) {
                $(".tsd-sidebar").append("<h1>" + conf.title + "</h1>");
            }

            self.initParams();
        }

        $(".tsd-main").append("<div role='alert'' class='tsd-error alert alert-danger'>...</div>");
        $(".tsd-main").append("<div class='tsd-main-content' id='tsd_main_content'></div>");
        $(".tsd-main").append(
            "<div class='modal' id='divModal' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>\
                <div class='modal-dialog'>\
                    <div class='modal-content'>\
                        <div class='modal-header'>\
                            <button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>\
                            <h4 class='modal-title' id='myModalLabel'>\
                            <span data-bind='text: modal_title'></span>\
                            </h4>\
                        </div>\
                        <div class='modal-body'>\
                            <div id='divModalChart'></div>\
                        </div>\
                    </div>\
                </div>\
            </div>");

        if (self.conf.hide_sidebar) {
            self.run();
        }
    });
}

TsDashboard.prototype.getParamValue = function (name) {
    return $("#in" + name).val();
}

TsDashboard.prototype.setParamValue = function (name, value) {
    var self = this;
    for (var ii in self.conf.parameters) (function (i) {
        var par = self.conf.parameters[i];

        if (par.name != name) {
            return;
        }

        if (par.type === "boolean") {
            label.append("<input type='checkbox' id='cb" + par.name + "'></input>");
            if (par.default) {
                $("#cb" + par.name).attr('checked', "true");
            }
        } else {
            $("#in" + par.name).val(value);
        }
    })(ii);
}

TsDashboard.prototype.resetErrorMsg = function () {
    $(".tsd-error").removeClass("tsd-error-visible");
}

TsDashboard.prototype.showErrorMsg = function (msg) {
    $(".tsd-error").text(msg);
    $(".tsd-error").addClass("tsd-error-visible");
}

TsDashboard.prototype.showError = function (e) {
    var self = this;

    var message = e.message;

    self.showErrorMsg(message);
}

TsDashboard.prototype.getToday = function () {
    return moment({ hour: 0 }).toDate();
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
    for (var ii = 0; ii < self.conf.parameters.length; ii++) (function (i) {
        var par = self.conf.parameters[i];

        var label = $(document.createElement("div"));
        label.appendTo(sidebar);
        label.addClass("tsd-sidebar-param");
        label.append("<span>" + par.title + "</span>");

        if (par.type === "string") {
            label.append("<input id='in" + par.name + "'></input>");
            if (par.default) {
                $("#in" + par.name).val(par.default);
            }

        } else if (par.type === "datetime") {
            label.append("<input id='in" + par.name + "' placeholder='yyyy-mm-dd hh:MM:ss'></input>");
            $("#in" + par.name).blur(function () {
                var val = $("#in" + par.name).val();
                if (self.regex_date.test(val)) {
                    $("#in" + par.name).val(val + " 00:00:00");
                }
            });
            label.append("<a id='hin_now_" + par.name + "' class='tsd-input-help'>Now</a> ");
            $("#hin_now_" + par.name).click(function () {
                $("#in" + par.name).val(self.getTimeString());
            });
            label.append("<a id='hin_today_" + par.name + "' class='tsd-input-help'>Today</a> ");
            $("#hin_today_" + par.name).click(function () {
                $("#in" + par.name).val(self.getDateString() + " 00:00:00");
            });

            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name).val(self.getTimeString(par.default));
                } else {
                    if (par.default == "$now") {
                        $("#in" + par.name).val(self.getTimeString());
                    } else if (par.default == "$today") {
                        $("#in" + par.name).val(self.getDateString() + " 00:00:00");
                    } else {
                        $("#in" + par.name).val(par.default);
                    }
                }
            }

        } else if (par.type === "date") {
            label.append("<input id='in" + par.name + "' placeholder='yyyy-mm-dd'></input>");
            label.append("<a id='hin_today_" + par.name + "' class='tsd-input-help'>Today</a> ");
            $("#hin_today_" + par.name).click(function () {
                $("#in" + par.name).val(self.getDateString());
            });
            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name).val(self.getDateString(par.default));
                } else {
                    if (par.default == "$now") {
                        $("#in" + par.name).val(self.getDateString());
                    } else if (par.default == "$today") {
                        $("#in" + par.name).val(self.getDateString());
                    } else {
                        $("#in" + par.name).val(par.default);
                    }
                }
            }

        } else if (par.type === "filter") {
            label.append("<input id='in" + par.name + "'></input>");
            label.append("<div id='opt" + par.name + "' class='tsd-match-options'></div>");
            $("#in" + par.name).keyup(function () {
                var val = $("#in" + par.name).val();
                var skip_search =
                    (par.search_min_len === undefined && val.length < 3) ||
                    (par.search_min_len !== undefined && val.length < par.search_min_len)
                if (skip_search) return;
                self.driver.getParamValues(par.name, val, function (options) {
                    $("#opt" + par.name).empty();
                    $("#opt" + par.name).show();
                    for (var iii = 0; iii < options.length; iii++) (function (i) {
                        var option = $(document.createElement("div"));
                        option.text(options[i]);
                        option.click(function () {
                            $("#in" + par.name).val(options[i]);
                            $("#opt" + par.name).empty();
                            $("#opt" + par.name).hide();
                        })
                        $("#opt" + par.name).append(option);
                    })(iii);
                });
            });
            if (par.default) {
                $("#in" + par.name).val(par.default);
            }

        } else if (par.type === "enum" || par.type === "dropdown") {
            label.append("<select id='in" + par.name + "'></select >");
            self.driver.getParamValues(par.name, null, function (options) {
                for (var i = 0; i < options.length; i++) {
                    var option = options[i];

                    var value, name;
                    if (par.type == "enum") {
                        value = option.value;
                        name = option.caption;
                    } else {
                        value = option.name;
                        name = option.name;
                    }

                    $("#in" + par.name).append("<option value='" + value + "'>" + name + "</option>");
                }
                if (par.default) {
                    $("#in" + par.name).val(par.default);
                }
            });

        } else if (par.type === "boolean") {
            label.append("<input type='checkbox' id='in" + par.name + "'></input>");
            if (par.default) {
                $("#in" + par.name).attr('checked', "true");
            }
        }

        // set up callback for value change
        $("#in" + par.name).change(function () {
            self.onParamChange(par.name);
        });
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
            par_value.value = $("#in" + par.name).val().trim();
            if (!par.optional && par_value.value === "") {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "datetime") {
            par_value.value = $("#in" + par.name).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }
            if (!self.regex_datetime.test(par_value.value)) {
                if (!self.regex_date.test(par_value.value)) {
                    self.showErrorMsg("Invalid date format or value: " + par.title);
                    return null;
                } else {
                    par_value.value += " 00:00:00";
                }
            }
            // parse string into local time-zone
            par_value.value = moment(par_value.value, "YYYY-MM-DD HH:mm:ss").toDate();

        } else if (par.type === "date") {
            par_value.value = $("#in" + par.name).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }
            if (!self.regex_date.test(par_value.value)) {
                self.showErrorMsg("Invalid date format or value: " + par.title);
                return null;
            }
            // parse string into local time-zone
            par_value.value = moment(par_value.value, "YYYY-MM-DD").toDate();

        } else if (par.type === "filter") {
            par_value.value = $("#in" + par.name).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "enum") {
            par_value.value = $("#sel" + par.name).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "dropdown") {
            par_value.value = $("#in" + par.name).val();
            if (par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }
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

function getFriendlyTimeSlotLabel(slot_length) {
    if (slot_length != null) {
        var ylab_i = 0;
        var units = [
            { n: 1000, t: "sec" },
            { n: 60 * 1000, t: "min" },
            { n: 60 * 60 * 1000, t: "h" },
            { n: 24 * 60 * 60 * 1000, t: "day" },
        ];
        while (ylab_i < units.length && slot_length / units[ylab_i].n >= 1) {
            ylab_i++;
        }
        ylab_i--;
        ylab_i = Math.max(0, ylab_i);
        y_label = "per " + (slot_length / units[ylab_i].n) + " " + units[ylab_i].t;
        return y_label;
    } else { return null }
}

TsDashboard.prototype.run = function () {
    var self = this;

    var main = $("#tsd_main_content");
    main.empty();
    self.resetErrorMsg();

    var params = self.collectParameterValues();
    if (!params) {
        return;
    }
    var options = {
        conf: self.conf,
        params: params
    }
    self.driver.getDrawData(options, function (err, data) {
        if (err != null) {
            self.showError(err);
        }
        if (data == undefined) {
            self.showErrorMsg("No data available.");
            return;
        }

        var widget_counter = 1;
        for (var i = 0; i < self.conf.blocks.length; i++) {
            var block = self.conf.blocks[i];
            var block_div = $(document.createElement("div"));
            main.append(block_div);

            block_div.addClass("tsd-block");
            if (block.title && block.title.length > 0) {
                block_div.append($(document.createElement("h2")).text(block.title));
            }

            var block_div2 = $(document.createElement("div"));
            block_div2.addClass("tsd-block-inner");
            block_div.append(block_div2);

            var col_class = "tsd-col-1-" + block.panels.length;

            for (var j = 0; j < block.panels.length; j++) {
                var panel = block.panels[j];
                var panel_div = $(document.createElement("div"));
                block_div2.append(panel_div);
                panel_div.addClass("tsd-panel");
                panel_div.addClass(col_class);
                if (panel.title && panel.title.length > 0) {
                    panel_div.append($(document.createElement("h3")).text(panel.title));
                }

                for (var k = 0; k < panel.widgets.length; k++) {
                    var widget = panel.widgets[k];
                    widget.type = widget.type || "timeseries"; //- this causes strane behaviour - unexisting timeseries widget wants to be drawn
                    widget.timepoints = widget.timepoints || [];
                    var widget_div = $(document.createElement("div"));
                    panel_div.append(widget_div);
                    widget_div.addClass("tsd-widget");
                    if (widget.title && widget.title.length > 0) {
                        widget_div.append($(document.createElement("h3")).text(widget.title));
                    }
                    var widget_id = "tsd_widget_" + widget_counter;
                    widget_div.append(
                        $(document.createElement("div"))
                            .attr("id", widget_id)
                            .attr("class", "tsd-widget-sub"));
                    widget_counter++;
                    if (widget.type == "timeseries") {
                        if (data == undefined || data.timeseries == undefined || data.timeseries.length == 0) {
                            self.showErrorMsg("Time series data not available.");
                            continue;
                        }
                        var data_series = [];
                        var mapped = widget.timeseries.map(function (x) {
                            for (var series_i = 0; series_i < data.timeseries.length; series_i++) {
                                var series = data.timeseries[series_i];
                                if (series.name === x) {
                                    return series.values;
                                }
                            }
                            return null;
                        }
                        );
                        data_series = mapped.filter(function (x) {
                            return x !== null;
                        });
                        var point_series = [];
                        point_series = widget.timepoints
                            .map(function (x) {
                                for (var points_i = 0; points_i < data.timepoints.length; points_i++) {
                                    var points = data.timepoints[points_i];
                                    if (points.name === x) {
                                        return points.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });

                        var options = {
                            chart_div: "#" + widget_id,
                            data: data_series,
                            timepoints: point_series,
                            xdomain: data.timeseries[0].xdomain,
                            height: widget.height,
                            handle_clicks: true,
                            y_axis_label: getFriendlyTimeSlotLabel(data.timeseries[0].slot_length)
                        }
                        options.click_callback = (function (xoptions) {
                            return function () { self.showModal(xoptions); }
                        })(options);
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawTimeSeriesMulti(options);

                    } else if (widget.type == "histogram") {
                        if (data == undefined || data.dataseries == undefined || data.dataseries.length == 0) {
                            self.showErrorMsg("Histogram data not available.");
                            continue;
                        }
                        var data_series = [];
                        data_series = widget.dataseries
                            .map(function (x) {
                                for (var series_i = 0; series_i < data.dataseries.length; series_i++) {
                                    var series = data.dataseries[series_i];
                                    if (series.name === x) {
                                        return series.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });
                        var options = {
                            chart_div: "#" + widget_id,
                            data: data_series[0],
                            xdomain: data.dataseries[0].xdomain,
                            height: widget.height,
                            handle_clicks: true
                        }
                        options.click_callback = (function (xoptions) {
                            return function () { self.showModalColumnChart(xoptions); }
                        })(options);
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawColumnChart(options);

                    } else if (widget.type == "scatterplot") {
                        var data_series = [];
                        if (data == undefined || data.scatterseries == undefined || data.scatterseries.length == 0) {
                            self.showErrorMsg("Scatter plot data not available.");
                            continue;
                        }
                        data_series = widget.scatterseries
                            .map(function (x) {
                                for (var series_i = 0; series_i < data.scatterseries.length; series_i++) {
                                    var series = data.scatterseries[series_i];
                                    if (series.name === x) {
                                        return series.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });
                        var options = {
                            chart_div: "#" + widget_id,
                            data: data_series[0],
                            height: widget.height,
                            handle_clicks: true
                        }
                        options.click_callback = (function (xoptions) {
                            return function () { self.showModalScatterPlot(xoptions); }
                        })(options);
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawScatterPlot(options);

                    } else if (widget.type == "table") {
                        var data_series = [];
                        var data_type = "dataseries";
                        if (widget.timeseries) {
                            data_type = "timeseries";
                        }

                        if (data == undefined || data[data_type] == undefined || data[data_type].length == 0) {
                            self.showErrorMsg("Table data not available.");
                            continue;
                        }
                        data_series = widget[data_type]
                            .map(function (x) {
                                for (var series_i = 0; series_i < data[data_type].length; series_i++) {
                                    var series = data[data_type][series_i];
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
                            handle_clicks: false
                        }
                        options.click_callback = (function (xoptions) {
                            return function () { self.showModal(xoptions); }
                        })(options);
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawTable(options);

                    } else if (widget.type == "kpi") {
                        var data_series = widget.dataseries
                            .map(function (x) {
                                for (var series_i in data.dataseries) {
                                    var series = data.dataseries[series_i];
                                    if (series.name === x) {
                                        return series.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });
                        var options = {
                            kpi_div: "#" + widget_id,
                            data: data_series[0],
                            height: widget.height,
                            handle_clicks: false
                        }
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawKpi(options);

                    } else if (widget.type == "graph") {
                        var graph = {};
                        var data_type = "graphs";
                        graph = widget[data_type]
                            .map(function (x) {
                                for (var series_i in data[data_type]) {
                                    var series = data[data_type][series_i];
                                    if (series.name === x) {
                                        return series.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });
                        if (data == undefined || data[data_type] == undefined || data[data_type].length == 0) {
                            self.showErrorMsg("Graph data not available.");
                            continue;
                        }
                        var alerts = [];
                        data_type = "dataseries";
                        if (widget[data_type]) {
                            alerts = widget[data_type]
                                .map(function (x) {
                                    for (var series_i in data[data_type]) {
                                        var series = data[data_type][series_i];
                                        if (series.name === x) {
                                            return series.values;
                                        }
                                    }
                                    return null;
                                })
                                .filter(function (x) { return x !== null; });
                        }
                        var nodes = graph[0].nodes;
                        var options = {
                            chart_div: "#" + widget_id,
                            pred: alerts,
                            graph: graph,
                            alerts: alerts,
                            start: data["graphs"][0].d1,
                            end: data["graphs"][0].d2,
                            handle_clicks: false
                        }
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawTemporalGraph(options);
                    } else if (widget.type == "swimlane") {
                        var data_type = "dataseries";
                        dataseries = widget[data_type]
                            .map(function (x) {
                                for (var series_i in data[data_type]) {
                                    var series = data[data_type][series_i];
                                    if (series.name === x) {
                                        return series.values;
                                    }
                                }
                                return null;
                            })
                            .filter(function (x) { return x !== null; });

                        if (data == undefined || data[data_type] == undefined || data[data_type].length == 0) {
                            self.showErrorMsg("Swimlane data not available.");
                            continue;
                        }
                        var options = {
                            chart_div: "#" + widget_id,
                            data: dataseries,
                            start: data[data_type][0].d1,
                            end: data[data_type][0].d2,
                            handle_clicks: false
                        }
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawSwimlaneChart(options);

                    } else if (widget.type == "sparkline") {
                        if (data == undefined || data.timeseries == undefined || data.timeseries.length == 0) {
                            self.showErrorMsg("Sparkline data not available.");
                            continue;
                        }

                        var data_series = [];
                        for (var sparkline_i = 0; sparkline_i < widget.sparklines.length; sparkline_i++) {
                            for (var series_i = 0; series_i < data.timeseries.length; series_i++) {
                                var series = data.timeseries[series_i];
                                if (series.name === widget.sparklines[sparkline_i]) {
                                    data_series.push(series);
                                }
                            }
                        }

                        data_series.sort(function (x, y) { return x.idx > y.idx; });

                        var options = {
                            chart_div: "#" + widget_id,
                            data: data_series,
                            handle_clicks: true
                        }
                        options.click_callback = (function (xoptions) {
                            return function () { self.showModal(xoptions); }
                        })(options);
                        if (widget.options) {
                            Object.assign(options, widget.options);
                        }
                        self.drawSparklineTable(options);
                    } else {
                        self.showErrorMsg("Widget type is not defined: " + widget.type);
                        console.log("Widget type is not defined: " + widget.type);
                    }
                }
            }
        }
    });
}

TsDashboard.prototype.showModal = function (options) {
    var self = this;
    $('#divModal').on('shown.bs.modal', function (e) {
        options.chart_div = "#divModalChart";
        options.height = 800;
        options.handle_clicks = true;
        options.click_callback = function () { };
        self.drawTimeSeriesMulti(options);
    });
    $('#divModal').modal();
}

TsDashboard.prototype.showModalColumnChart = function (options) {
    var self = this;
    $('#divModal').on('shown.bs.modal', function (e) {
        options.chart_div = "#divModalChart";
        options.height = 500;
        options.handle_clicks = false;
        options.click_callback = function () { };
        self.drawColumnChart(options);
    });
    $('#divModal').modal();
}

TsDashboard.prototype.showModalScatterPlot = function (options) {
    var self = this;
    $('#divModal').on('shown.bs.modal', function (e) {
        options.chart_div = "#divModalChart";
        options.height = 500;
        options.handle_clicks = false;
        options.click_callback = function () { };
        self.drawScatterPlot(options);
    });
    $('#divModal').modal();
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
        timepoints: null,
        timepoint_callback: null,
        margin_top: 18,
        margin_right: 35,
        margin_bottom: 20,
        margin_left: 50
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
    var svg = d3.select(p.chart_div)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add error bands
    if (p.bands) {
        for (var i = 0; i < p.bands.length; i++) {
            var band = [];
            var series = p.data[p.bands[i].ref]
            var series0 = p.data[p.bands[i].lower];
            var series1 = p.data[p.bands[i].upper];
            var bandColor = p.series_style_indices[p.bands[i].ref];
            for (var j = 0; j < series0.length; j++) {
                band.push({ val0: series0[j].val, val1: series1[j].val, epoch: series0[j].epoch });
            }
            // Add band area
            svg.append("path")
                .style("fill", "white")
                .style("fill-opacity", 0.2)
                .style("stroke", "none")
                .attr("fill", "white")
                .attr("d", bandsarea(band));
        };
    }

    // Add value lines
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
    var tooltip = d3.select(p.chart_div).append("div")
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

                if (d == null) return;

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
    if (p.timepoints && p.timepoints.length > 0) {
        for (var j = 0; j < p.timepoints.length; j++) {
            var timepoint_1 = p.timepoints[j];
            for (var i = 0; i < timepoint_1.length; i++) {
                var timepoint = timepoint_1[i];
                //var alertUrl = timepoint.url;
                var alertTitle = timepoint.title;
                var ms = timepoint.epoch;
                var ts = self.toNiceDateTime(timepoint.epoch);
                var xx = x(ms);
                var color = p.markerColor; // TODO could be determined with callback
                if (!isNaN(xx) && xx > 0) {
                    svg.append("a")
                        //.attr("xlink:href", alertUrl)
                        .append("line")
                        .attr("id", xx)
                        .attr("data:ts", ts)
                        .attr("data:tt-title", alertTitle)
                        .attr("x1", xx)
                        .attr("x2", xx)
                        .attr("y1", 0)
                        .attr("y2", p.height - margin.top - margin.bottom)
                        .attr("class", "series" + j)
                        //.style("stroke", color)
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

TsDashboard.prototype.drawTable = function (config) {

    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        data: null,
        header: null,
        height: 400,
        margin_bottom: 60,
        column_widths: null,
        column_order: null,
        columns: null,
        sort_by_column: null,
        sort_asc: true
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    // remove the previous drawing
    $(p.chart_div).empty();

    var data = p.data[0];
    var columns = p.columns;
    if (!columns) {
        columns = [];
        for (var d in data[0]) {
            columns.push({ source: d });
        }
    }

    // create header
    var thead = $("<thead></thead>");
    var theadtr = $("<tr></tr>");
    for (var i = 0; i < columns.length; i++) {
        if (columns[i].caption) {
            theadtr.append("<th>" + columns[i].caption + "</th>");
        }
        else {
            theadtr.append("<th>" + columns[i].source + "</th>");
        }
    }
    if (p.sort_by_column !== null) {
        if (!(p.sort_by_column in data[0])) {
            self.showErrorMsg("Cannot sort tabel by column: " + p.sort_by_column);
        } else {
            data.sort(function (x, y) {
                return p.sort_asc ? x[p.sort_by_column] > y[p.sort_by_column] : x[p.sort_by_column] < y[p.sort_by_column];
            });
        }
    }
    // create body
    var tbody = $("<tbody></tbody>");
    for (var i = 0; i < data.length; i++) {
        // create row
        var row = $("<tr></tr>");
        // add columns
        for (var j = 0; j < columns.length; j++) {
            var td = $("<td>" + data[i][columns[j].source] + "</td>");
            if (columns[j].width) {
                td.css('width', columns[j].width);
            }
            row.append(td);
        }
        tbody.append(row);
    }

    // combine into a table
    var table = $("<table class=\"table\"></div>");
    thead.append(theadtr);
    table.append(thead);
    table.append(tbody);
    $(p.chart_div).append(table);

    // style
    $(p.chart_div).css('overflow', 'auto');
    $(p.chart_div).css('height', p.height);
    $(p.chart_div).css('margin-bottom', p.margin_bottom);

}

TsDashboard.prototype.drawKpi = function (config) {

    var self = this;
    // Default parameters.
    var p = {
        kpi_div: "#someKpi",
        data: null,
        header: null,
        height: 100,
        margin_bottom: 0,
        column_widths: null,
        column_order: null,
        filter: null
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    // remove the previous drawing
    $(p.kpi_div).empty();
    var data = p.data;

    // create body
    var tbody = $("<tbody></tbody>");
    var row = $("<tr></tr>");
    for (var i = 0; i < data.length; i++) {
        var dd = data[i];
        var td = $("<td class='tsd-kpi-tile tsd-kpi-tile-ok' />");
        switch (dd.status) {
            case "ok": td.addClass("tsd-kpi-tile-ok"); break;
            case "error": td.addClass("tsd-kpi-tile-error"); break;
            case "warning": td.addClass("tsd-kpi-tile-warning"); break;
            default: td.addClass("tsd-kpi-tile-inactive"); break;
        }
        td.append("<div class='tsd-kpi-tile-title'></div>").text(dd.name);
        td.append("<div class='tsd-kpi-tile-value'></div>").text(dd.value);
        row.append(td);
    }
    tbody.append(row);

    var table = $("<table></table>");
    table.append(tbody);
    $(p.kpi_div).append(table);
}

TsDashboard.prototype.drawTemporalGraph = function (config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        graph: null,
        alerts: null,
        start: null,
        end: null,
        height: 400,
        min_node_size: 5,
        max_node_size: 5,
        min_edge_size: 20,
        max_edge_size: 20,
        node_color: "black",
        edge_color: "white",
        edge_off_color: "white",
        edge_opacity: 0.4,
        edge_off_opacity: 0.1,
        edge_selected_opacity: 0.8,
        node_opacity: 0.8,
        node_alert_opacity: 1.0,
        node_off_opacity: 0.1,
        node_stroke: "white",
        default_node_size: 5,
        default_edge_size: 3,
        side_margin: 20,
        duration: 10000,
        step_duration: 200,
        unselected_opacity: 0.1,
        x_pos_att: "epoch",
        alert_node_opacity: 1.0,
        alert_node_color: "red"
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    // remove the previous drawing
    $(p.chart_div).empty();
    $(p.chart_div).css("height", p.height);
    var svg = d3.select(p.chart_div)
        .append("svg").attr("x", 0).attr("y", 0)
        .attr("width", $(p.chart_div).width())
        .attr("height", p.height);

    // data
    var data = p.graph.length > 0 ? p.graph[0] : [];
    var alertsAll = p.alerts.length > 0 ? p.alerts[0] : [];

    var nodes = data.nodes;
    var edges = data.edges;
    var x_pos_att = p.x_pos_att;
    // timepoints - inserted into arrays so d3.min and d3.max can be used
    var xpoints = [];
    var ypoints = [];
    var timepoints = [];
    var nodes_arr = [];
    var node_sizes = [];
    var edge_sizes = [];

    // itterate alerts and change colors of nodes
    for (var node in nodes) {
        nodes[node].color = p.node_color;
        nodes[node].color = p.node_opacity;
    }

    var alerts = [];
    var pred = [];

    // iterate alerts and change colors of nodes
    for (var i = 0; i < alertsAll.length; i++) {
        if (alertsAll[i].src == "event_prediction" || alertsAll[i].src == "event_predictionalert") {
            alertsAll[i].ts = Date.parse(alertsAll[i].ts);
            pred.push(alertsAll[i]);
        }
        else {
            alerts.push(alertsAll[i]);
        }
    }

    // iterate alerts and change colors of nodes
    for (var i = 0; i < alerts.length; i++) {
        if (alerts[i].src == "event") {
            var eventName = alerts[i]["title"].split(' ')[0];
            if (eventName in nodes) {
                nodes[eventName].color = p.alert_node_color;
                nodes[eventName].opacity = p.node_alert_opacity;
            }
        }
    }

    for (var node in nodes) {
        xpoints.push(nodes[node][x_pos_att]);
        ypoints.push(nodes[node].y);
        timepoints.push(nodes[node].epoch);
        node_sizes.push(nodes[node].size);
        nodes_arr.push({ id: node, options: nodes[node] });
    }
    for (var i = 0; i < edges.length; i++) {
        edge_sizes.push(edges[i].size);
    }

    // scales
    var scaleX = d3.scale.linear().domain([d3.min(xpoints), d3.max(xpoints)]).range([p.side_margin, $(p.chart_div).width() - p.side_margin]);
    if (p.start != null && p.end != null) {
        scaleX = d3.scale.linear().domain([p.start, p.end]).range([p.side_margin, $(p.chart_div).width() - p.side_margin]);
    }
    var scaleY = d3.scale.linear().domain([d3.min(ypoints), d3.max(ypoints)]).range([p.side_margin, $(p.chart_div).height() - p.side_margin]);
    var scaleNode = d3.scale.linear().domain([d3.min(node_sizes), d3.max(node_sizes)]).range([p.min_node_size, p.max_node_size]);
    var scaleEdge = d3.scale.linear().domain([d3.min(edge_sizes), d3.max(edge_sizes)]).range([p.min_edge_size, p.max_edge_size]);
    var scaleTime = d3.scale.linear().domain([p.start, p.end]).range([0, p.duration]);

    // Draw edges
    var lines = svg.selectAll("lines")
        .data(edges)

    // edge helper structs
    var lineIdArr = [];
    var lineCoordinates = {}

    lines.enter()
        .append("path")
        .attr("id", function (d, i) { lineIdArr.push('edge-' + d.n1 + '-' + d.n2); return 'edge-' + d.n1 + '-' + d.n2; })
        .attr("class", "edge")
        .attr("d", function (d) {
            var t1x = 0; // starting position is 0 not scaleX(nodes[d.n1][x_pos_att]);
            var t2x = 0; // starting positions is 0 not scaleX(nodes[d.n2][x_pos_att]);
            var t1y = scaleY(nodes[d.n1].y);
            var t2y = scaleY(nodes[d.n2].y);
            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
            lineCoordinates['edge-' + d.n1 + '-' + d.n2] = { x1: t1x, x2: t2x, y1: t1y, y2: t2y };
            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;

        })
        .style("fill", "none")
        .style("stroke-opacity", 0.1)
        .style("stroke", p.edge_off_color)
        .style("stroke-width", p.default_edge_size)
        .transition()
        .delay(function (d) { return scaleTime(nodes[d.n2].epoch) })
        .attr("d", function (d) {
            var t1x = scaleX(nodes[d.n1][x_pos_att]);
            var t2x = scaleX(nodes[d.n2][x_pos_att]);
            var t1y = scaleY(nodes[d.n1].y);
            var t2y = scaleY(nodes[d.n2].y);
            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
        })

    svg.selectAll(".edge")
        .append("svg:title")
        .text(function (d) { return d.n1 + "-" + d.n2 })

    // Draw nodes
    var circles = svg.selectAll("circles")
        .data(nodes_arr);

    circles.enter()
        .append("circle")
        .attr("id", function (d, i) { return 'node-' + d.id; })
        .attr("r", p.default_node_size)
        .attr("cx", 0)
        .attr("cy", function (d) { return scaleY(d.options.y); })
        .attr("fill", function (d) { return p.node_off_color })
        .attr("fill-opacity", function (d) { return p.node_off_opacity; })
        .attr("stroke-width", 2)
        .attr("stroke-opacity", p.node_off_opacity)
        .attr("stroke", p.node_stroke)
        .transition()
        .delay(function (d) { return scaleTime(d.options.epoch); })
        .attr("cx", function (d) { return scaleX(d.options[x_pos_att]); })
        .attr("fill-opacity", p.node_opacity)

    svg.selectAll("circle")
        .append("svg:title")
        .text(function (d) { return d.id + "\n" + new Date(d.options.epoch); });

    // node mouse events
    svg.selectAll("circle")
        .on("mouseover", function (e, i) {
            svg.selectAll(".edge").style("stroke-opacity", function (d) { if (e.id != d.n1 && e.id != d.n2) { return p.edge_off_opacity; } else { return p.edge_selected_opacity; } })
        })
        .on("mouseout", function (e, i) {
            svg.selectAll(".edge").style("stroke-opacity", p.edge_opacity)
        })
        .on("click", function (e, i) {
            window.open("/alerts#filter=&d1=" + p.start + "&fd2=" + p.end, "_blank");
        })

    // edge mouse events
    svg.selectAll(".edge")
        .on("mouseover", function (e, i) {
            svg.selectAll(".edge").style("stroke-opacity", function (d) { if ((e.n1 == d.n1 && e.n2 == d.n2) || (e.n1 == d.n1 && e.n1 == d.n2)) { return p.edge_selected_opacity; } else { return p.edge_off_opacity; } })
        })
        .on("mouseout", function (e, i) {
            svg.selectAll(".edge").style("stroke-opacity", p.edge_opacity)
        })

    // set animations based on predictions
    for (var i = pred.length - 1; i >= 0; i--) {
        var predictions = JSON.parse(pred[i].extra_data).predictions;
        for (var name in predictions) {
            // move node
            d3.select("#node-" + name).transition().delay(scaleTime(pred[i].ts)).attr("cx", scaleX(predictions[name])).duration(p.step_duration).ease("linear");
            // move edge
            for (var j = 0; j < lineIdArr.length; j++) {
                if (lineIdArr[j].split('-')[1] == name) {
                    var edge = d3.select("#" + lineIdArr[j]);
                    edge.transition().delay(scaleTime(pred[i].ts))
                        .attr("d", function (d) {
                            var prev = lineCoordinates[lineIdArr[j]];
                            var t1x = scaleX(predictions[name]);
                            var t2x = prev.x2;
                            var t1y = prev.y1;
                            var t2y = prev.y2;
                            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
                            lineCoordinates[lineIdArr[j]] = { x1: t1x, x2: t2x, y1: t1y, y2: t2y };
                            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
                        })
                        .duration(p.step_duration).ease("linear")
                }
                if (lineIdArr[j].split('-')[2] == name) {
                    var edge = d3.select("#" + lineIdArr[j])
                    edge.transition().delay(scaleTime(pred[i].ts))
                        .attr("d", function (d) {
                            var prev = lineCoordinates[lineIdArr[j]];
                            var t1x = prev.x1;
                            var t2x = scaleX(predictions[name]);
                            var t1y = prev.y1;
                            var t2y = prev.y2;
                            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
                            lineCoordinates[lineIdArr[j]] = { x1: t1x, x2: t2x, y1: t1y, y2: t2y };
                            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
                        }).duration(p.step_duration).ease("linear")
                }
            }
        }
    }

    // finall state edge
    for (var i = 0; i < edges.length; i++) {
        d3.select("#edge-" + edges[i].n1 + "-" + edges[i].n2)
            .transition()
            .delay(scaleTime(nodes[edges[i].n2].epoch) + p.step_duration + 1)
            .style("stroke-opacity", p.edge_opacity)
            .style("stroke", p.edge_color)
            //.style("stroke", "red")
            .attr("d", function (d) {
                var t1x = scaleX(nodes[edges[i].n1][x_pos_att]);
                var t2x = scaleX(nodes[edges[i].n2][x_pos_att]);
                var t1y = scaleY(nodes[edges[i].n1].y);
                var t2y = scaleY(nodes[edges[i].n2].y);
                var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
                return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
            })
    }

    // finnal state node
    for (var i = 0; i < nodes_arr.length; i++) {
        var time = scaleTime(nodes_arr[i].options.epoch) + p.step_duration + 1;
        d3.select("#node-" + nodes_arr[i].id)
            .transition()
            .delay(time)
            .attr("stroke-opacity", p.node_opacity)
            .attr("fill", nodes_arr[i].options.color)
            .attr("fill-opacity", nodes_arr[i].options.opacity)
            .attr("cx", scaleX(nodes_arr[i].options.epoch))
    }

    // time traveling bar
    var timeTraveler = svg.append("path")
        .attr("id", "timeTraveler")
        .attr("d", function (d) {
            var t1x = scaleX(p.start);
            var t2x = scaleX(p.start);
            var t1y = scaleY(d3.min(ypoints));
            var t2y = scaleY(d3.max(ypoints));
            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;

        })
        .style("stroke", "white")
        .transition()
        .attr("d", function (d) {
            var t1x = scaleX(p.end);
            var t2x = scaleX(p.end);
            var t1y = scaleY(d3.min(ypoints));
            var t2y = scaleY(d3.max(ypoints));
            var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
            return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
        }).duration(p.duration).ease("linear")

}

TsDashboard.prototype.drawSwimlaneChart = function (config) {
    var self = this;

    // If we have user-defined parameters, override the defaults.
    var p = {
        "start": null,
        "end": null,
        "side_margin": 10,
        "chart_div": "#divTarget",
        "alert_color": "white",
        "alert_opacity": 0.99,
        "alert_stroke": "black",
        "lanes_color": "#444",
        "master_lane_color": "#444",
        "lane_opacity": 0.4,
        "lane_selected_opacity": 0.5,
        "lane_height": 20,
        "alert_radius": 3,
        "alert_over_radius": 10,
        "ticks": 10
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    // remove the previous drawing
    $(p.chart_div).empty();

    // x axis scaler
    var scaleX = d3.scale.linear().domain([p.start, p.end]).range([p.side_margin, $(p.chart_div).width() - p.side_margin]);

    var alerts1 = p.data[0];


    // transform attr names
    var alerts = [];
    for (var i = 0; i < alerts1.length; i++) {
        if (alerts1[i].src != "event_prediction" && alerts1[i].src != "event_prediction_alert") {
            alerts.push({
                "type": alerts1[i].src,
                "ts": new Date(alerts1[i].ts),
                "ts_str": alerts1[i].ts,
                "title": alerts1[i].title
            });
        }
    }

    // find out how many different alert types is there
    var alertTypes = [];
    var alertTypesDict = {};
    for (var i = 0; i < alerts.length; i++) {
        if (alerts[i].type in alertTypesDict) {
            alertTypesDict[alerts[i].type] += 1;
        }
        else {
            alertTypesDict[alerts[i].type] = 1;
        }
    }

    for (var type in alertTypesDict) {
        alertTypes.push(type);
    }

    // define click action
    function clickAction() {
        for (var i = 0; i < alertTypes.length; i++) {
            if (toggle) {
                lanes[alertTypes[i]].attr("display", "none");
            }
            else {
                lanes[alertTypes[i]].attr("display", "inline");
            }
        }
        if (toggle) {
            toggle = false;
        }
        else {
            toggle = true;
        }
        $(p.chart_div).css("width", "100%");
    }

    // define the master lane
    /*
    var masterSvd = d3.select(p.chart_div)
        .append("svg")
        .attr("width", $(p.chart_div)
        .width())
        .attr("height", p.lane_height);

    var masterLane = masterSvd.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", $(p.chart_div)
        .width())
        .attr("height", p.lane_height)
        .attr("fill", p.master_lane_color)
        .attr("fill-opacity", p.lane_opacity)
        .on("mouseover", function(d){d3.select(this).attr("fill-opacity", p.lane_selected_opacity)})
        .on("mouseout", function(d){d3.select(this).attr("fill-opacity", p.lane_opacity)});

    masterSvd.selectAll("circle")
        .data(alerts)
        .enter()
        .append("circle")
        .attr("cy", p.lane_height / 2)
        .attr("cx", function(d) { return scaleX(d.ts); })
        .attr("r", p.alert_radius)
        .attr("fill", p.alert_color)
        .attr("fill-opacity", p.alert_opacity)
        .style("stroke", p.alert_stroke)
        .on("mouseover", function(d){ d3.select(this).attr( "r", p.alert_over_radius ) })
        .on("mouseout", function(d){ d3.select(this).attr( "r", p.alert_radius ) })
        .on("click", function(e, i) { window.open("/alerts#filter=&d1="+p.start+"&fd2="+p.end, "_blank"); })
        .append("svg:title").text( function(d, i) { return "source: " + d.type + "\n" + d.title + "\n" + d.ts; });

    masterLane.on("click", function() {
        clickAction();
        d3.event.stopPropagation();
    });
    */

    // define alert type associated lanes
    var toggle = true;
    var lanes = {};
    for (var i = 0; i < alertTypes.length; i++) {

        // generate svg element for each lane
        lanes[alertTypes[i]] = d3.select(p.chart_div)
            .append("svg")
            .attr("width", $(p.chart_div)
                .width())
            .attr("height", p.lane_height);

        // draw rectangle for each lane
        lanes[alertTypes[i]].append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", $(p.chart_div).width())
            .attr("height", p.lane_height)
            .attr("fill", p.lanes_color)
            .attr("fill-opacity", p.lane_opacity)
            .on("mouseover", function (d) { d3.select(this).attr("fill-opacity", p.lane_selected_opacity) })
            .on("mouseout", function (d) { d3.select(this).attr("fill-opacity", p.lane_opacity) })
            .append("svg:title")
            .text(function (d) { return alertTypes[i]; });
    }

    for (var i = 0; i < alertTypes.length; i++) {

        // draw alert markers filtered by alert type
        lanes[alertTypes[i]].selectAll("circle")
            .data(alerts.filter(function (d) { return d.type == alertTypes[i] }))
            .enter().append("circle").attr("cy", p.lane_height / 2)
            .style("stroke", p.alert_stroke)
            .attr("fill-opacity", p.alert_opacity)
            .attr("cx", function (d) { return scaleX(d.ts); }).attr("r", p.alert_radius).attr("fill", p.alert_color)
            .on("mouseover", function (d) { d3.select(this).attr("r", p.alert_over_radius) })
            .on("mouseout", function (d) { d3.select(this).attr("r", p.alert_radius) })
            .on("click", function (e, i) { window.open("/alerts#filter=&d1=" + p.start + "&fd2=" + p.end, "_blank"); })
            .append("svg:title")
            .text(function (d, i) { return "source: " + d.type + "\n" + d.title + "\n" + d.ts; });
    }

    // time scaler
    var scaleTime = d3.time.scale().domain([new Date(p.start), new Date(p.start)]).nice(d3.time.hour).range([0, $(p.chart_div).width()]);

    // append svd for time axis
    var timeSvd = d3.select(p.chart_div).append("svg").attr("width", $(p.chart_div).width()).attr("height", p.lane_height);
}

TsDashboard.prototype.drawColumnChart = function (config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        data: null,
        height: 400,
        margin_bottom: 60,
        xaccessor: function (x) { return x.name; },
        yaccessor: function (x) { return x.val; },
        ydomain_min: null,
        ydomain_max: null,
        handle_clicks: false,
        x_axis_label: null,
        y_axis_label: null,
        xAxisLabelFormat: ',.1f',
        yFormatValue: ".2s",
        yAxisTicks: null,
        tickNumber: function (height, yDomainMax) {
            return Math.min(height < 100 ? 3 : 8, yDomainMax);
        },
        click_callback: null
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }
    // gets max and min values of x and y values over all given data series

    if (!p.ydomain) {
        p.ydomain = d3.extent(p.data, p.yaccessor);
    }
    if (p.ydomain_min !== null) {
        p.ydomain[0] = p.ydomain_min;
    }
    if (p.ydomain_max !== null) {
        p.ydomain[1] = p.ydomain_max;
    }
    // remove the previous drawing
    $(p.chart_div).empty();

    var margin = { top: 18, right: 35, bottom: p.margin_bottom, left: 50 };
    if (p.x_axis_label) {
        margin.bottom += 20;
    }

    var width = $(p.chart_div).width() - margin.left - margin.right;
    var height = p.height - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.format(p.xAxisLabelFormat));

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
        .orient("left");

    var chart = d3.select(p.chart_div)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var data = p.data;
    x.domain(data.map(p.xaccessor));
    y.domain([0, d3.max(data, p.yaccessor)]);

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    chart.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "tsd-bar")
        .attr("x", function (d) { return x(p.xaccessor(d)); })
        .attr("y", function (d) { return y(p.yaccessor(d)); })
        .attr("height", function (d) { return height - y(p.yaccessor(d)); })
        .attr("width", x.rangeBand())
        .on("mouseover", function () {
            d3.select(this).classed("tsd-bar-highlight", true);
            tooltip.style("display", null);
        })
        .on("mouseout", function () {
            d3.select(this).classed("tsd-bar-highlight", false);
            tooltip.style("display", "none");
        })
        .on("mousemove", function (d) {
            var xPosition = d3.mouse(this)[0] - 15;
            var yPosition = d3.mouse(this)[1] - 25;
            tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
            tooltip.select("text").text(p.yaccessor(d));
        });

    // Add a text label for the X axis
    if (p.x_axis_label != null) {
        chart.append("text")
            .attr("class", "axislabel label")
            .attr("text-anchor", "end")
            .attr("font-size", "14px")
            .attr("x", width / 2)
            .attr("y", height + margin.top + 32)
            .text(p.x_axis_label);
    }

    // Add a text label for the Y axis
    if (p.y_axis_label != null) {
        chart.append("text")
            .attr("class", "axislabel label")
            .attr("text-anchor", "end")
            .attr("font-size", "14px")
            .attr("x", 0)
            .attr("y", 15)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(p.y_axis_label);
    }


    // Prep the tooltip bits, initial display is hidden
    var tooltip = chart.append("g")
        .attr("class", "tsd-tooltip")
        .style("display", "none");

    tooltip.append("rect")
        .attr("width", 30)
        .attr("height", 20);

    tooltip.append("text")
        .attr("x", 15)
        .attr("dy", "1.2em")
        .style("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold");

    if (p.handle_clicks) {
        chart.on('click', function () {
            if (p.click_callback) {
                p.click_callback();
            }
        });
    }

    if (data.length <= 0) {
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('dy', '1em')
            .attr('text-anchor', 'end')
            .text("NO DATA!")
            .attr('class', 'zerolinetext');
    }
}

TsDashboard.prototype.drawScatterPlot = function (config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart",
        data: null,
        height: 400,
        xaccessor: function (x) { return x.x; },
        yaccessor: function (x) { return x.y; },
        caccessor: function (x) { return x.c || ""; },
        xdomain: null,
        xdomain_min: null,
        xdomain_max: null,
        ydomain: null,
        ydomain_min: null,
        ydomain_max: null,
        ycaptions: null,
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
        markerStroke: 3,
        markerOpacity: 0.4,
        markerOpacityHover: 0.8,
        markerColor: "#ff0000",
        click_callback: null
    };

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    // remove the previous drawing
    $(p.chart_div).empty();

    var margin = { top: 18, right: 35, bottom: 30, left: 50 };

    var width = $(p.chart_div).width() - margin.left - margin.right;
    var height = p.height - margin.top - margin.bottom;

    /*
     * value accessor - returns the value to encode for a given data object.
     * scale - maps value to a visual display encoding, such as a pixel position.
     * map function - maps from data value to display value
     * axis - sets up axis
     */

    // setup x
    var xValue = p.xaccessor, // data -> value
        xScale = d3.scale.linear().range([0, width]), // value -> display
        xMap = function (d) { return xScale(xValue(d)); }, // data -> display
        xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    // setup y
    var yValue = p.yaccessor, // data -> value
        yScale = d3.scale.linear().range([height, 0]), // value -> display
        yMap = function (d) { return yScale(yValue(d)); }, // data -> display
        yAxis = d3.svg.axis().scale(yScale).orient("left");

    // setup fill color
    var cValue = p.caccessor,
        color = d3.scale.category10();

    // add the graph canvas to the body of the webpage
    var svg = d3.select(p.chart_div).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // add the tooltip area to the webpage
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var data = p.data;

    // don't want dots overlapping axis, so add in buffer to data domain
    //xScale.domain([d3.min(data, xValue) - 1, d3.max(data, xValue) + 1]);
    //yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);
    xScale.domain([
        d3.min(data, xValue),
        d3.max(data, xValue)
    ]);
    yScale.domain([
        d3.min(data, yValue),
        d3.max(data, yValue)
    ]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(p.x_axis_label);

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(p.y_axis_label);

    // draw dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .style("fill", function (d) { return color(cValue(d)); })
        .on("mouseover", function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(cValue(d) + "<br/> (" + xValue(d)
                + ", " + yValue(d) + ")")
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // draw legend
    if (color.domain.length > 1) {
        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        // draw legend colored rectangles
        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        // draw legend text
        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function (d) { return d; })
    }
    if (data.length <= 0) {
        g.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('dy', '1em')
            .attr('text-anchor', 'end')
            .text("NO DATA!")
            .attr('class', 'zerolinetext');
    }
}

TsDashboard.prototype.drawSparklineTable = function (config) {
    var self = this;
    var p = {
        chart_div: "#someChart",
        data: null,
        spark_height: 15,
        columns: 2,
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

    // Parse the date / time
    var parseDate = d3.time.format("%d-%b-%y").parse;
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
    $(p.chart_div).empty();

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
    $(p.chart_div).append(table);

    // style
    $(p.chart_div).css('overflow', 'auto');
    $(p.chart_div).css('height', p.height);
    $(p.chart_div).css('margin-bottom', p.margin_bottom);

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
                    if (ctitle.indexOf(p.title_clip_after)) {
                        ctitle = ctitle.substring(0, ctitle.indexOf(p.title_clip_after));
                    }
                }
                if (p.title_clip_prefix != null) {
                    if (ctitle.startsWith(p.title_clip_prefix)) {
                        ctitle = ctitle.substr(p.title_clip_prefix.length);
                    }
                }
                var titleTd = $("<td style='background-color:black !important; width:" + p.first_col_width + "px; word-break:break-all;'>" + ctitle + "</td>");
                row.append(titleTd);
            }
            var imgTd = $("<td style='background-color:black !important; border-left: thin solid #282828; width:" + ((table.width() - p.first_col_width) / colNo).toFixed() + "px;'></td>");
            var imgDiv = document.createElement("div");
            imgTd.append(imgDiv);
            row.append(imgTd);

            var width = imgTd.width();

            datum.forEach(function (d) {
                d.date = self.toNiceDateTime(d.epoch);
            });
            // xscale will fit all values from data.date within pixels 0-width
            var xscale = d3.time.scale()
                .domain([d3.min(datum, function (d) { return d.epoch; }),
                d3.max(datum, function (d) { return d.epoch; })])
                .range([0, width]);
            // yscale will fit all walues from data.val within pixels 0-width
            var yscale = d3.scale.linear()
                .domain([d3.min(datum, function (d) { return d.val; }),
                d3.max(datum, function (d) { return d.val; })])
                .range([p.spark_height, 0]);


            var svg = d3.select(imgDiv)
                .append("svg")
                .attr("width", width)
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
            // TODO svg onclick to GTS page
        }
    }

}


/////////////////////////////////////////////////////////////////////////////////////////////
// Simple dummy driver that is already given all data and definitions
function TsDashboardDummyDriver(view_definition, data) {
    this.view_definition = view_definition;
    this.data = data;
    this.view_object = null;
}
TsDashboardDummyDriver.prototype.getParamValues = function (name, search, callback) { }
TsDashboardDummyDriver.prototype.onParamChange = function (name) { }
TsDashboardDummyDriver.prototype.registerView = function (view) {
    this.view_object = view;
}
TsDashboardDummyDriver.prototype.getViewDefinition = function (callback) {
    callback(this.view_definition);
}
TsDashboardDummyDriver.prototype.getDrawData = function (options, callback) {
    callback(null, this.data);
}
