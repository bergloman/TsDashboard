function TsDashboard(div_id, driver, auto_init) {
    if (auto_init == null) { auto_init = true; }    // TODO add comment on github

    this.driver = driver;
    this.div_id = div_id;
    this.sufix = function (len) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < len; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return "_" + text;
    }(10);

    if (auto_init) {
        this.init();
    }

    this._callbacks = {
        memento: function () { }
    }

    this._callbacks = {
        memento: function () { }
    }

    this.regex_date = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/;
    this.regex_datetime = /^(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31)) (0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/;

    if (this.driver.registerView) {
        this.driver.registerView(this);
    }
}

TsDashboard.prototype.onParamChange = function (name) {
    var self = this;
    if (self.driver.onParamChange) {
        self.driver.onParamChange(name);
    }
    // notify memento handler
    self._callbacks.memento(self.getMemento());
};

TsDashboard.prototype.init = function () {
    var self = this;
    self.driver.getViewDefinition(function (conf) {
        self.conf = conf;
        self.conf.parameters = self.conf.parameters || [];

        self.top = $("#" + self.div_id);
        self.top.append("<div class='tsd' id='" + self.div_id + self.sufix + "'></div>");
        self.top = $("#" + self.div_id + self.sufix);
        self.div_id = self.div_id + self.sufix;

        if (self.conf.hide_sidebar) {
            self.top.append("<div class='tsd-main' id='tsd_main" + self.sufix + "'></div>");
        } else {
            self.top.append("<div class='tsd-sidebar dark-matter' id='tsd_sidebar" + self.sufix + "'></div>");
            self.top.append("<div class='tsd-main' id='tsd_main" + self.sufix + "'></div>");
            self.conf.sidebar_width = self.conf.sidebar_width || 190;
            $("#tsd_sidebar" + self.sufix).width(self.conf.sidebar_width);
            $("#tsd_main" + self.sufix).css("margin-left", (+self.conf.sidebar_width) + "px");

            if (conf.title) {
                $("#tsd_sidebar" + self.sufix).append("<h1>" + conf.title + "</h1>");
            }

            self.initParams();
        }

        $("#tsd_main" + self.sufix).append("<div role='alert' class='tsd-error alert alert-danger' id='tsd_error" + self.sufix + "'>...</div>");
        $("#tsd_main" + self.sufix).append("<div class='tsd-main-content' id='tsd_main_content" + self.sufix + "'></div>");
        $("#tsd_main" + self.sufix).append(
            "<div class='modal' id='divModal" + self.sufix + "' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>\
                <div class='modal-dialog'>\
                    <div class='modal-content'>\
                        <div class='modal-header'>\
                            <button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>\
                            <h4 class='modal-title' id='myModalLabel" + self.sufix + "'>\
                            <span data-bind='text: modal_title'></span>\
                            </h4>\
                        </div>\
                        <div class='modal-body'>\
                            <div id='divModalChart" + self.sufix + "'></div>\
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
    var self = this;
    return $("#in" + name + self.sufix).val();
}

TsDashboard.prototype.setParamValue = function (name, value) {
    var self = this;
    for (var ii in self.conf.parameters) (function (i) {
        var par = self.conf.parameters[i];

        if (par.name != name) {
            return;
        }

        if (par.type === "boolean") {
            label.append("<input type='checkbox' id='cb" + par.name + self.sufix + "'></input>");
            if (par.default) {
                $("#cb" + par.name + self.sufix).attr('checked', "true");
            }
        } else {
            $("#in" + par.name + self.sufix).val(value);
        }
    })(ii);
}

TsDashboard.prototype.resetErrorMsg = function () {
    var self = this;
    $("#tsd_error" + self.sufix).removeClass("tsd-error-visible");
}

TsDashboard.prototype.showErrorMsg = function (msg) {
    var self = this;
    $("#tsd_error" + self.sufix).text(msg);
    $("#tsd_error" + self.sufix).addClass("tsd-error-visible");
}

TsDashboard.prototype.showError = function (e) {
    var self = this;
    console.error(e);
    self.showErrorMsg(e.message != null ? e.message : 'Exception while drawing widget!');
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
    var sidebar = $("#tsd_sidebar" + self.sufix);
    for (var ii = 0; ii < self.conf.parameters.length; ii++) (function (i) {
        var par = self.conf.parameters[i];

        var label = $(document.createElement("div"));
        label.appendTo(sidebar);
        label.addClass("tsd-sidebar-param");
        label.append("<span>" + par.title + "</span>");

        if (par.type === "string") {
            label.append("<input id='in" + par.name + self.sufix + "'></input>");
            if (par.default) {
                $("#in" + par.name + self.sufix).val(par.default);
            }

        } else if (par.type === "datetime") {
            label.append("<input id='in" + par.name + self.sufix + "' placeholder='yyyy-mm-dd hh:MM:ss'></input>");
            $("#in" + par.name + self.sufix).blur(function () {
                var val = $("#in" + par.name + self.sufix).val();
                if (self.regex_date.test(val)) {
                    $("#in" + par.name + self.sufix).val(val + " 00:00:00");
                }
            });
            label.append("<a id='hin_now_" + par.name + self.sufix + "' class='tsd-input-help'>Now</a> ");
            $("#hin_now_" + par.name + self.sufix).click(function () {
                $("#in" + par.name + self.sufix).val(self.getTimeString());
            });
            label.append("<a id='hin_today_" + par.name + self.sufix + "' class='tsd-input-help'>Today</a> ");
            $("#hin_today_" + par.name + self.sufix).click(function () {
                $("#in" + par.name + self.sufix).val(self.getDateString() + " 00:00:00");
            });

            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name + self.sufix).val(self.getTimeString(par.default));
                } else {
                    if (par.default == "$now") {
                        $("#in" + par.name + self.sufix).val(self.getTimeString());
                    } else if (par.default == "$today") {
                        $("#in" + par.name + self.sufix).val(self.getDateString() + " 00:00:00");
                    } else {
                        $("#in" + par.name + self.sufix).val(par.default);
                    }
                }
            }

        } else if (par.type === "date") {
            label.append("<input id='in" + par.name + self.sufix + "' placeholder='yyyy-mm-dd'></input>");
            label.append("<a id='hin_today_" + par.name + self.sufix + "' class='tsd-input-help'>Today</a> ");
            $("#hin_today_" + par.name + self.sufix).click(function () {
                $("#in" + par.name + self.sufix).val(self.getDateString());
            });
            if (par.default) {
                if (par.default instanceof Date) {
                    $("#in" + par.name).val(self.getDateString(par.default));
                } else {
                    if (par.default == "$now") {
                        $("#in" + par.name + self.sufix).val(self.getDateString());
                    } else if (par.default == "$today") {
                        $("#in" + par.name + self.sufix).val(self.getDateString());
                    } else {
                        $("#in" + par.name + self.sufix).val(par.default);
                    }
                }
            }

        } else if (par.type === "filter") {
            label.append("<input id='in" + par.name + self.sufix + "'></input>");
            label.append("<div id='opt" + par.name + self.sufix + "' class='tsd-match-options'></div>");
            $("#in" + par.name + self.sufix).keyup(function () {
                var val = $("#in" + par.name + self.sufix).val();
                var skip_search =
                    (par.search_min_len === undefined && val.length < 3) ||
                    (par.search_min_len !== undefined && val.length < par.search_min_len)
                if (skip_search) return;
                self.driver.getParamValues(par.name, val, function (options) {
                    $("#opt" + par.name + self.sufix).empty();
                    $("#opt" + par.name + self.sufix).show();
                    for (var iii = 0; iii < options.length; iii++) (function (i) {
                        var option = $(document.createElement("div"));
                        option.text(options[i]);
                        option.click(function () {
                            $("#in" + par.name + self.sufix).val(options[i]);
                            $("#opt" + par.name + self.sufix).empty();
                            $("#opt" + par.name + self.sufix).hide();
                        })
                        $("#opt" + par.name + self.sufix).append(option);
                    })(iii);
                });
            });
            if (par.default) {
                $("#in" + par.name + self.sufix).val(par.default);
            }

        } else if (par.type === "enum" || par.type === "dropdown") {
            var ctrl_id = "in" + par.name + self.sufix;
            label.append("<select id='" + ctrl_id + "'></select >");
            self.driver.getParamValues(par.name, null, function (options) {
                self.setDropdownOptions(par.name, options, par.default)
            });

        } else if (par.type === "boolean") {
            label.append("<input type='checkbox' id='in" + par.name + self.sufix + "'></input>");
            if (par.default) {
                $("#in" + par.name + self.sufix).attr('checked', "true");
            }
        }

        // set up callback for value change
        $("#in" + par.name + self.sufix).change(function () {
            self.onParamChange(par.name);
        });
    })(ii);

    var btn = $(document.createElement("button"));
    btn.text("Run");
    btn.click(function () { self.run(); });
    btn.appendTo(sidebar);
}

TsDashboard.prototype.setDropdownOptions = function (name, options, default_value) {
    var self = this;
    var par = null;
    for (var xpar of self.conf.parameters){
        if (xpar.name === name) {
            par=xpar;
            break;
        }
    }
    if (!par){
        throw new Error("Parameter with provide name not found: " + name);
    }
    var ctrl_id = "in" + name + self.sufix;
    $("#" + ctrl_id).empty();
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

        $("#" + ctrl_id).append(
            $("<option></option>")
                .attr("value", value)
                .text(name));
    }
    if (default_value) {
        $("#" + ctrl_id).val(default_value);
    }
}

TsDashboard.prototype.collectParameterValues = function () {
    var self = this;
    var param_values = [];
    for (var i = 0; i < self.conf.parameters.length; i++) {
        var par = self.conf.parameters[i];
        var par_value = { name: par.name };
        if (par.type === "string") {
            par_value.value = $("#in" + par.name + self.sufix).val().trim();
            if (!par.optional && par_value.value === "") {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "datetime") {
            par_value.value = $("#in" + par.name + self.sufix).val();
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
            par_value.value = $("#in" + par.name + self.sufix).val();
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
            par_value.value = $("#in" + par.name + self.sufix).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "enum") {
            par_value.value = $("#sel" + par.name + self.sufix).val();
            if (!par.optional && par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }

        } else if (par.type === "dropdown") {
            par_value.value = $("#in" + par.name + self.sufix).val();
            if (par_value.value === null) {
                self.showErrorMsg("Missing non-optional parameter: " + par.title);
                return null;
            }
        } else if (par.type === "boolean") {
            par_value.value = false;
            if ($("#cb" + par.name + self.sufix).attr('checked')) {
                par_value.value = true;
            }
        }
        param_values.push(par_value);
    };
    return param_values;
}

TsDashboard.prototype.getMemento = function () {
    var self = this;
    var params = self.collectParameterValues();
    var result = {};
    for (var i = 0; i < params.length; i++) {
        result[params[i].name] = params[i].value;
    }
    return result;
}

TsDashboard.prototype.loadMemento = function (memento) {
    var self = this;
    var conf = self.conf;

    for (var paramN = 0; paramN < conf.parameters.length; paramN++) {
        var par = conf.parameters[paramN];

        if (!(par.name in memento)) { continue; }

        var value = memento[par.name];
        self.setParamValue(par.name, value);
    }
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

    var main = $("#tsd_main_content" + self.sufix);
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
            return;
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
                    var widget_id = "tsd_widget_" + widget_counter + self.sufix;
                    widget_div.append(
                        $(document.createElement("div"))
                            .attr("id", widget_id)
                            .attr("class", "tsd-widget-sub"));
                    widget_counter++;

                    try {
                        if (widget.type == "timeseries") {
                            if (data == undefined || data.timeseries == undefined || data.timeseries.length == 0) {
                                self.showErrorMsg("Time series data not available.");
                                continue;
                            }
                            var data_series = [];
                            var labels = [];
                            var mapped = widget.timeseries.map(function (x) {
                                for (var series_i = 0; series_i < data.timeseries.length; series_i++) {
                                    var series = data.timeseries[series_i];
                                    if (series.name === x) {
                                        labels.push(data.timeseries[series_i].label);
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
                                labels: labels,
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
                            var graph_opts = self._constructGraph(
                                widget.graphs,
                                data.graphs,
                                widget.dataseries,
                                data.dataseries
                            );

                            if (widget.options) {
                                Object.assign(graph_opts, widget.options);
                            }

                            self.drawTemporalGraph('#' + widget_id, graph_opts);
                        } else if (widget.type == "swimlane") {
                            var swimlane_opts = self._constructSwimlane(
                                widget.dataseries,
                                data.dataseries
                            )

                            if (widget.options) {
                                Object.assign(swimlane_opts, widget.options);
                            }

                            self.drawSwimlaneChart("#" + widget_id, swimlane_opts);
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
                            data_series.sort(function (x, y) { return x.idx - y.idx; });

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
                        }
                        else if (widget.type == 'multi-gantt') {
                            var gantt_opts = self._constructMultiGantt(
                                widget.dataseries,
                                data.dataseries
                            )

                            if (widget.options != null) {
                                Object.assign(gantt_opts, widget.options);
                            }

                            self.drawMultiGantt('#' + widget_id, gantt_opts);
                        }
                        else {
                            self.showErrorMsg("Widget type is not defined: " + widget.type);
                            console.log("Widget type is not defined: " + widget.type);
                        }
                    } catch (e) {
                        self.showError(e);
                    }
                }
            }
        }
    });
}

TsDashboard.prototype._constructGraph = function (graph_widget, graph_data,
    dataseries_widget, dataseries_data) {
    // var data_type = "graphs";
    var graph = graph_widget
        .map(function (x) {
            for (var series_i in graph_data) {
                var series = graph_data[series_i];
                var name = series.name;
                if (name === x) {
                    return series.values;
                }
            }
            return null;
        })
        .filter(function (x) { return x !== null; });
    if (graph_data == undefined || graph_data.length == 0) {
        throw new Error("Graph data not available.");
    }

    var alerts = [];
    // data_type = "dataseries";
    if (dataseries_widget) {
        alerts = dataseries_widget
            .map(function (x) {
                for (var series_i in dataseries_data) {
                    var series = dataseries_data[series_i];
                    if (series.name === x) {
                        return series.values;
                    }
                }
                return null;
            })
            .filter(function (x) { return x !== null; });
    }
    // var nodes = graph[0].nodes;
    var options = {
        pred: alerts,
        graph: graph,
        alerts: alerts,
        start: graph_data[0].d1,
        end: graph_data[0].d2,
        handle_clicks: false
    }

    return options;
}

TsDashboard.prototype._constructSwimlane = function (dataseries_widget, dataseries_data) {
    // var data_type = "dataseries";
    var dataseries = dataseries_widget.map(function (x) {
        for (var series_i in dataseries_data) {
            var series = dataseries_data[series_i];
            if (series.name === x) {
                return series.values;
            }
        }
        return null;
    })
        .filter(function (x) { return x !== null; });

    if (dataseries_data == undefined || dataseries_data.length == 0) {
        throw new Error("Swimlane data not available.")
    }
    var options = {
        data: dataseries,
        start: dataseries_data[0].d1,
        end: dataseries_data[0].d2,
        handle_clicks: false
    }

    return options
}

TsDashboard.prototype._constructMultiGantt = function (dataseries_widget, dataseries_data) {
    var ts_name = dataseries_widget[0];
    var dataseries = (function () {
        for (var i = 0; i < dataseries_data.length; i++) {
            if (dataseries_data[i].name == ts_name) {
                return dataseries_data[i].groups;
            }
        }
        return null;
    })();
    if (dataseries == null || dataseries.length == 0) {
        throw new Error('MultiGantt chart data not available!');
    }
    var opts = {
        data: dataseries
    }
    if (dataseries_widget.start != null) { opts.start = dataseries_widget.start; }
    if (dataseries_widget.end != null) { opts.end = dataseries_widget.end; }
    return opts;
}

TsDashboard.prototype.showModal = function (options) {
    var self = this;
    $('#divModal' + self.sufix).on('shown.bs.modal', function () {
        options.chart_div = "#divModalChart" + self.sufix;
        options.height = 800;
        options.handle_clicks = true;
        options.click_callback = function () { };
        self.drawTimeSeriesMulti(options);
    });
    $('#divModal' + self.sufix).modal();
}

TsDashboard.prototype.showModalColumnChart = function (options) {
    var self = this;
    $('#divModal' + self.sufix).on('shown.bs.modal', function (e) {
        options.chart_div = "#divModalChart" + self.sufix;
        options.height = 500;
        options.handle_clicks = false;
        options.click_callback = function () { };
        self.drawColumnChart(options);
    });
    $('#divModal' + self.sufix).modal();
}

TsDashboard.prototype.showModalScatterPlot = function (options) {
    var self = this;
    $('#divModal' + self.sufix).on('shown.bs.modal', function (e) {
        options.chart_div = "#divModalChart" + self.sufix;
        options.height = 500;
        options.handle_clicks = false;
        options.click_callback = function () { };
        self.drawScatterPlot(options);
    });
    $('#divModal' + self.sufix).modal();
}

TsDashboard.prototype.toNiceDateTime = function (s) {
    if (!s) return "-";
    return moment(s).format("YYYY-MM-DD HH:mm:ss");
}

TsDashboard.prototype.drawTimeSeriesMulti = function (config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart" + self.sufix,
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
        timepoints: null, // double array (each timeseries can have multiple timepoints) of timepoints { epoch: x, title: y }
        // timepoint_callback: null, // NOT USED CURRENTLY
        margin_top: 18,
        margin_right: 35,
        margin_bottom: 20,
        margin_left: 50,
        labels: null,
        backgroundSegments: null, // array where each element is { epoch_start: num, epoch_end: num, color: string }
        backgroundSegmentOpacity: 0.3
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
            var seg_x = Math.max(x(epoch_start), 0);
            svg.append("rect")
                .attr("x", seg_x)
                .attr("y", 0)
                .attr("width", x(epoch_end) - seg_x)
                .attr("height", p.height - margin.top - margin.bottom)
                .style("fill", seg_col)
                .style("fill-opacity", p.backgroundSegmentOpacity);
        }
    }

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
    }
}

TsDashboard.prototype.drawTable = function (config) {

    var self = this;
    // Default parameters.
    var p = {
        chart_div: "#someChart" + self.sufix,
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
    if (p.sort_by_column !== null && data.length > 0) {
        if (!(p.sort_by_column in data[0])) {
            self.showErrorMsg("Cannot sort table by column: " + p.sort_by_column);
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
    // var self = this;
    // Default parameters.
    var p = {
        kpi_div: "#someKpi" + self.sufix,
        data: null,
        header: null,
        height: 100,
        margin_bottom: 0,
        column_widths: null,
        column_order: null,
        filter: null,
        shape: 'square'
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
        var td = $("<td class='tsd-kpi-tile' />");
        var div = $('<div class="tsd-kpi-tile-ok" />');
        switch (dd.status) {
            case "ok": div.addClass("tsd-kpi-tile-ok"); break;
            case "error": div.addClass("tsd-kpi-tile-error"); break;
            case "warning": div.addClass("tsd-kpi-tile-warning"); break;
            default: div.addClass("tsd-kpi-tile-inactive"); break;
        }
        div.append("<div class='tsd-kpi-tile-title'></div>").text(dd.name);
        if (dd.value != null) {
            div.append("<div class='tsd-kpi-tile-value'></div>").text(dd.value);
        }
        if (config.height != null) {
            div.css('height', config.height);
            div.css('min-height', config.height);
        }
        if (config.width != null) {
            div.css('width', config.width);
            div.css('min-width', config.width);
        }
        if (config.shape != null && config.shape != 'square') {
            switch (config.shape) {
                case 'circle': {
                    var height = div.outerHeight();
                    //div.css('border-radius', height / 2);
                    break;
                }
                default: {
                    throw new Error('Unknown shape: ' + config.shape);
                }
            }
        }
        if (config.margin != null) {
            td.css('padding-left', config.margin / 2);
            td.css('padding-right', config.margin / 2);
        }
        td.append(div);
        row.append(td);
    }
    tbody.append(row);

    var table = $("<table></table>");
    table.append(tbody);
    $(p.kpi_div).append(table);
}

TsDashboard.prototype.drawTemporalGraph = function (chart_div, config) {
    var self = this;
    // Default parameters.
    var p = {
        chart_div: chart_div,
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
        node_opacity: 0.2,
        node_alert_opacity: 1.0,
        node_off_opacity: 0.2,
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

    // iterate over alerts and change colors of nodes
    for (var node in nodes) {
        nodes[node].color = p.node_color;
        nodes[node].opacity = p.node_opacity;
    }

    var alerts = [];
    var pred = [];

    // iterate over alerts and change colors of nodes
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
                nodes[eventName].is_alert = true;
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
    // sort nodes so that alert nodes are drawn last, meaning on top (cannot set z-index in svg)
    nodes_arr = nodes_arr.sort(function (a, b) { return (a.options.is_alert ? 1 : 0); });

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
            if (self.driver.openTimeInterval) {
                self.driver.openTimeInterval(p.start, p.end, true);
            }
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

    // final state edge
    for (var i = 0; i < edges.length; i++) {
        d3.select("#edge-" + edges[i].n1 + "-" + edges[i].n2)
            .transition()
            .delay(scaleTime(nodes[edges[i].n2].epoch) + p.step_duration + 1)
            .style("stroke-opacity", p.edge_opacity)
            .style("stroke", p.edge_color)
            .attr("d", function (d) {
                var t1x = scaleX(nodes[edges[i].n1][x_pos_att]);
                var t2x = scaleX(nodes[edges[i].n2][x_pos_att]);
                var t1y = scaleY(nodes[edges[i].n1].y);
                var t2y = scaleY(nodes[edges[i].n2].y);
                var tx = parseInt(t1x) + parseInt((t2x - t1x) / 2);
                return "M" + t1x + "," + t1y + "C" + tx + "," + t1y + " " + tx + "," + t2y + " " + t2x + "," + t2y;
            })
    }

    // final state node
    for (var i = 0; i < nodes_arr.length; i++) {
        var curr_node = nodes_arr[i];
        var time = scaleTime(curr_node.options.epoch) + p.step_duration + 1;
        d3.select("#node-" + curr_node.id)
            .transition()
            .delay(time)
            .attr("stroke-opacity", p.node_opacity)
            .attr("fill", curr_node.options.color)
            .attr("fill-opacity", curr_node.options.opacity)
            .attr("cx", scaleX(curr_node.options.epoch))
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

TsDashboard.prototype.drawSwimlaneChart = function (chart_div, config) {
    var self = this;

    // If we have user-defined parameters, override the defaults.
    var p = {
        "chart_div": chart_div,//"#divTarget",
        "start": null,
        "end": null,
        "side_margin": 10,
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
            .on("click", function (e, i) {
                if (self.driver.openTimeInterval) {
                    self.driver.openTimeInterval(p.start, p.end);
                }
            })
            .append("svg:title")
            .text(function (d, i) { return "source: " + d.type + "\n" + d.title + "\n" + d.ts; });
    }

    // time scaler
    var scaleTime = d3.time.scale().domain([new Date(p.start), new Date(p.start)]).nice(d3.time.hour).range([0, $(p.chart_div).width()]);

    // append svd for time axis
    var timeSvd = d3.select(p.chart_div).append("svg").attr("width", $(p.chart_div).width()).attr("height", p.lane_height);
}

TsDashboard.prototype.drawMultiGantt = function (widget_id, config) {
    var self = this;
    var p = {
        chart_div: widget_id,
        data: [],
        start: null,
        end: null,
        default_color: '#ffffff',

        // shape
        item_h: 20,
        item_margin: 10,
        group_width: 100,
        subgroup_width: 100,

        // paddings
        padding_left: 10,
        padding_right: 10,
        margin_side: 0,

        // font
        font_size: 15,

        click: function () { }
    }

    // If we have user-defined parameters, override the defaults.
    if (config !== "undefined") {
        for (var prop in config) {
            p[prop] = config[prop];
        }
    }

    var container = $(p.chart_div);
    // clear the container
    container.html('');

    var w = container.innerWidth() - p.margin_side;
    var h = container.innerHeight();

    var getTickFormat = function (trange_msecs) {
        if (trange_msecs < 1000 * 60 * 60 * 24) {     // day
            // hour:minute
            return '%H:%M';
        }
        else if (trange_msecs < 1000 * 60 * 60 * 24 * 7) {    // week
            // (week name) (month name) (day of month)
            return '%a %b %e';
        }
        else if (trange_msecs < 1000 * 60 * 60 * 24 * 30) {   // month
            // (month) (day of month)
            return '%b %e';
        }
        else if (trange_msecs < 1000 * 60 * 60 * 24 * 30 * 3) { // 3 months
            // (month) (day of month)
            return '%b %e';
        }
        else if (trange_msecs < 1000 * 60 * 60 * 24 * 356) {  // year
            // month
            return '%b';
        }
        else {
            // only show years
            return '%Y';
        }
    }

    var time_start;
    var time_end;

    var x;
    var y;
    var xAxis;

    var initAxis = function () {
        x = d3.time.scale()
            .domain([time_start, time_end])
            .range([0, chart_utils.width()])
            .clamp(true);
        xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.time.format(getTickFormat(time_end - time_start)))
            .tickSubdivide(true)
            .tickSize(8)
            .tickPadding(8);
    }

    var axis_utils = {
        groupWidth: function () {
            return p.group_width;
        },
        subgroupWidth: function () {
            return p.subgroup_width;
        },
        width: function (d, i) {
            return axis_utils.groupWidth(d, i) + axis_utils.subgroupWidth(d, i);
        }
    }

    var chart_utils = {
        width: function () {
            return w - axis_utils.width() - p.padding_right;
        },
        height: function () {
            var last_group_n = p.data.length - 1;
            var last_group = p.data[last_group_n];
            return group_utils.offsetY(last_group, last_group_n) + group_utils.height(last_group, last_group_n);
            // return h;
        }
    }

    var group_utils = {
        width: chart_utils.width,
        height: function (group, group_n) {
            var n = group.values.length;
            return n * (p.item_h + p.item_margin);
        },
        offsetX: function () {
            return 0;
        },
        offsetY: function (group, group_n) {
            var groups = p.data;
            var offset = 0;
            for (var i = 0; i < group_n; i++) {
                offset += group_utils.height(groups[i], i);
            }
            return offset;
        },
        textOffsetX: function (d, i) {
            return p.padding_left;
        },
        textOffsetY: function (group, group_n) {
            var font_size = p.font_size;
            var group_size = group_utils.height(group, group_n);
            var group_offset = group_utils.offsetY(group, group_n);
            return group_offset + group_size / 2 + p.font_size / 2 - 2;
        },
        transform: function (group, group_n) {
            return 'translate(' + group_utils.offsetX(group, group_n) + ', ' + group_utils.offsetY(group, group_n) + ')';
        },
        label: function (group) {
            return group.name;
        }
    }

    var getSubgroupUtils = function (group, group_n) {
        var group_offset_y = group_utils.offsetY(group, group_n);

        var subgroup_utils = {
            height: function () {
                return p.item_h;
            },
            offsetY: function (item, item_n) {
                return p.item_margin / 2 + item_n * (p.item_h + p.item_margin);
            },
            textOffsetX: function () {
                return axis_utils.subgroupWidth() - 10;
            },
            textOffsetY: function (item, item_n) {
                // var item_offset = subgroup_utils.offsetY(item, item_n);
                var item_h = subgroup_utils.height(item, item_n);
                return item_h - (item_h - p.font_size) / 2 - 2;
            },
            transform: function (item, item_n) {
                return 'translate(0,' + subgroup_utils.offsetY(item, item_n) + ')';
            },
            label: function (item) {
                return item.name;
            },
            getItemUtils: function () {
                var item_utils = {
                    offsetX: function (item, item_n) {
                        return x(item.start);
                    },
                    offsetY: function () {
                        return 0;
                    },
                    width: function (item, item_n) {
                        return Math.max(1, (x(item.end) - x(item.start)));
                    },
                    height: subgroup_utils.height,
                    transform: function (d, i) {
                        return 'translate(' + item_utils.offsetX(d, i) + ',' + item_utils.offsetY(d, i) + ')';
                    },
                    color: function (d) {
                        return d.color != null ? d.color : p.default_color;
                    },
                    clazz: function (item) {
                        return 'bar' + (item.status == null ? '' : ' ' + item.status);
                    }
                }
                return item_utils;
            }
        }
        return subgroup_utils;
    }

    var initTimeDomain = function () {
        time_start = null;
        time_end = null;

        if (p.start != null) { time_start = p.start; }
        if (p.end != null) { time_end = p.end; }

        if (time_start == null || time_end == null) {
            start = Number.POSITIVE_INFINITY;
            end = Number.NEGATIVE_INFINITY;
            for (var i = 0; i < p.data.length; i++) {
                var group = p.data[i];
                for (var j = 0; j < group.values.length; j++) {
                    var subgroup = group.values[j];
                    for (var k = 0; k < subgroup.values.length; k++) {
                        var item = subgroup.values[k];
                        if (item.start < start) start = item.start;
                        if (item.end > end) end = item.end;
                    }
                }
            }
            if (time_start == null) { time_start = start; }
            if (time_end == null) { time_end = end; }
        }
    }

    var draw = function (data) {
        initTimeDomain(data);
        initAxis();

        var svg = d3.select(p.chart_div)
            .append('svg')
            .attr('class', 'gantt')
            .attr('width', w)
            .attr('height', chart_utils.height() + 100)

        // create backgrounds
        var backgrounds = svg.append('g')
            .selectAll('.group-background')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', function (d, i) { return i % 2 == 0 ? 'group-background row-even' : 'group-background row-odd' })
            .attr('width', w)
            .attr('height', group_utils.height)
            .attr('transform', function (d, i) { return 'translate(0, ' + group_utils.offsetY(d, i) + ')' })

        // draw the items
        var chart = svg.append('g')
            .attr('width', axis_utils.width)
            .attr('height', chart_utils.height())
            .attr('transform', 'translate(' + axis_utils.width() + ', 0)');

        var groups = chart.selectAll('.group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'group')
            .attr('width', chart_utils.width)
            .attr('height', group_utils.height)
            .attr('transform', group_utils.transform)

        groups.each(function (group, group_n) {
            var subgroup_utils = getSubgroupUtils(group, group_n);
            // group of items (drawn horizontally)
            var subgroups = d3.select(this)
                .selectAll('.subgroup')
                .data(function (group) { return group.values; })
                .enter()
                .append('g')
                .attr('class', 'subgroup')
                .attr('transform', subgroup_utils.transform)
            // individual items (stacked horizontally)
            subgroups.each(function (subgroup, subgroup_n) {
                var item_utils = subgroup_utils.getItemUtils(subgroup, subgroup_n);

                d3.select(this)
                    .selectAll('.item')
                    .data(function (subgroup) {
                        return subgroup.values
                    })
                    .enter()
                    .append('rect')
                    .attr('class', 'item')
                    .attr('height', item_utils.height)
                    .attr('width', item_utils.width)
                    .attr("transform", item_utils.transform)
                    .attr('fill', item_utils.color)
                    .attr('rx', 5)    // border radius
                    .attr('ry', 5)    // border radius
                    .attr('class', item_utils.clazz)
                    .on("click", p.click)
            })
        })

        // draw the labels
        var y_axis = svg.append('g')
            .attr('width', chart_utils.width())
            .attr('height', chart_utils.height())
            .attr('transform', 'translate(0, 0)');

        var y_groups = y_axis.append('g')
            .attr('width', axis_utils.groupWidth)
            .attr('height', h)
            .attr('transform', 'translate(0,0)')
            .selectAll('.y-group')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'y-group')
            .attr('width', axis_utils.groupWidth)
            .attr('height', group_utils.height)
            .append('text')
            .attr('transform', function (d, i) { return 'translate(' + group_utils.textOffsetX(d, i) + ',' + group_utils.textOffsetY(d, i) + ')'; })
            .text(group_utils.label)

        // y_groups.append('text')
        //     .text(group_utils.label)

        var y_subgroups = y_axis.append('g')
            .attr('width', axis_utils.subgroupWidth)
            .attr('height', h)
            .attr('transform', function (d, i) { return 'translate(' + axis_utils.groupWidth(d, i) + ',0)'; })
            .selectAll('.y-subgroup')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'y-subgroup')
            .attr('width', axis_utils.subgroupWidth)
            .attr('height', group_utils.height)
            .attr('transform', group_utils.transform)
            .each(function (group, group_n) {
                var item_utils = getSubgroupUtils(group, group_n);
                var text = d3.select(this)
                    .selectAll('g')
                    .data(function (group) { return group.values; })
                    .enter()
                    .append('g')
                    .attr('height', item_utils.height)
                    .attr('width', item_utils.width)
                    .attr('transform', function (d, i) { return 'translate(0,' + item_utils.offsetY(d, i) + ')'; })
                    .append('text')
                    .attr('font-size', p.font_size)
                    .attr('text-anchor', 'end')
                    .attr('transform', function (d, i) { return 'translate(' + item_utils.textOffsetX(d, i) + ', ' + item_utils.textOffsetY(d, i) + ')' })
                    .text(item_utils.label);
            })

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(' + axis_utils.width() + ', ' + chart_utils.height() + ')')
            // .attr('width', axis_utils.width)
            .transition()
            .call(xAxis);
    }

    draw(p.data);
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
        markerOpacityHover: 0.5,
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
        chart_div: "#someChart" + self.sufix,
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
            var pipeline = data[dataIdx].pipeline;
            var url = data[dataIdx].url;
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
            var imgTd = $("<td " + url + " style='background-color:black !important; border-left: thin solid #282828; width:"
                + ((table.width() - p.first_col_width) / colNo).toFixed() + "px;'></td>");
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
        }
    }
}

TsDashboard.prototype.on = function (event, callback) {
    var self = this;
    if (!(event in self._callbacks)) throw new Error('Invalid event name: ' + event);
    self._callbacks[event] = callback;
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
