function TsDashboard(div_id, driver) {
    this.driver = driver;
    this.div_id = div_id;
    this.init();
}

TsDashboard.prototype.init = function () {
    var self = this;
    self.driver.getViewDefinition(function (conf) {
        self.conf = conf;
        self.conf.parameters = self.conf.parameters || [];

        self.top = $("#" + self.div_id);

        self.top.append("<div class='tsd-header'></div>");
        self.top.append("<div class='tsd-sidebar dark-matter'></div>");
        self.top.append("<div class='tsd-main'></div>");

        $(".tsd-header").append("<h1>" + conf.title + "</h1>");

        self.initParams();
    });
}

TsDashboard.prototype.initParams = function () {
    var self = this;
    var sidebar = $(".tsd-sidebar");
    $(".tsd-sidebar").append("<h2>Time period</h2>");
    $(".tsd-sidebar").append("From <input id='sinFrom' placeholder='yyyy-mm-dd hh:MM:ss'></input>");
    $(".tsd-sidebar").append("To <input id='sinTo' placeholder='yyyy-mm-dd hh:MM:ss'></input>");


    $(".tsd-sidebar").append("<h2>Parameters</h2>");
    for (var ii in self.conf.parameters) (function (i) {
        var par = self.conf.parameters[i];

        var label = $(document.createElement("label"));
        label.appendTo(sidebar);
        label.append("<span>" + par.title + "</span>");

        if (par.type === "string") {
            label.append("<input id='in" + par.name + "'></input>");

        } else if (par.type === "filter") {
            label.append("<input id='in" + par.name + "'></input>");
            label.append("<div id='opt" + par.name + "' class='match-options'></div>");
            $("#in" + par.name).keyup(function () {
                var val = $("#in" + par.name).val();
                if (val.length < 3) return;
                self.driver.getParamValues(par.name, val, function (options) {
                    $("#opt" + par.name).empty();
                    for (var ii in options) (function (i) {
                        var option = $(document.createElement("div"));
                        option.text(options[i]);
                        option.click(function () {
                            $("#in" + par.name).val(options[i]);
                        })
                        $("#opt" + par.name)
                            .append(option);
                    })(ii);
                });
            });
        } else if (par.type === "enum") {
            label.append("<select id='sel" + par.name + "'></select >");
            self.driver.getParamValues(par.name, null, function (options) {
                for (var i in options) {
                    var option = options[i];
                    $("#sel" + par.name).append("<option value='" + option.value + "'>" + option.caption + "</option>");
                }
            });

        } else if (par.type === "boolean") {
            label.append("<input type='checkbox'' id='cb" + par.name + "'></input>");
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
    for (var ii in self.conf.parameters) (function (i) {
        var par = self.conf.parameters[i];
        var par_value = { name: par.name };
        if (par.type === "string") {
            par_value.value = $("#in" + par.name).val()

        } else if (par.type === "filter") {
            par_value.value = $("#in" + par.name).val()

        } else if (par.type === "enum") {
            par_value.value = $("#sel" + par.name).val()

        } else if (par.type === "boolean") {
            par_value.value = false;
            if ($("#cb" + par.name).attr('checked')) {
                par_value.value = true;
            }
        }
        param_values.push(par_value);
    })(ii);
    return param_values;
}

TsDashboard.prototype.run = function () {
    // collect parameter values 
    var param_values = this.collectParameterValues();
    console.log(param_values);
}