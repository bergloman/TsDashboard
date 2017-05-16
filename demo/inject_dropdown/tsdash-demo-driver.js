function TsDashboardDemoDriver() {
    this.countries = null;
    this.view_definition = null;
    this.view_object = null;
    this.prepareViewDefinition();
}

TsDashboardDemoDriver.prototype.onParamChange = function (name) {
    if (name == "param1") {
        var p1_value = this.view_object.getParamValue("param1");
        if (p1_value == "v1") {
            this.view_object.setDropdownOptions(
                "param2",
                [{ value: "a", caption: "Home" }, { value: "b", caption: "Work" }],
                "a"
            );
        } else {
            this.view_object.setDropdownOptions(
                "param2",
                [{ value: "m", caption: "Male" }, { value: "f", caption: "Female" }],
                "m"
            );

        }
    }
}

TsDashboardDemoDriver.prototype.registerView = function (view) {
    this.view_object = view;
}

TsDashboardDemoDriver.prototype.getViewDefinition = function (callback) {
    callback(this.view_definition);
}

TsDashboardDemoDriver.prototype.getParamValues = function (name, search, callback) {
    if (name === "param1") {
        callback([
            { value: "v1", caption: "Value 1" },
            { value: "v2", caption: "Value 2" },
            { value: "v3", caption: "Value 3" }
        ]);
    } else if (name === "param2") {
        // by default don't return anything
        return callback([]);
    }
}

TsDashboardDemoDriver.prototype.getDrawData = function (options, callback) {
    var length_in_days = 145;
    var ts = new Date();
    ts = new Date(ts.getTime() - length_in_days * 24 * 60 * 60 * 1000);

    var res = {
        timeseries: [],
        timepoints: [],
        scatterseries: [],
        dataseries: [],
        graphs: []
    };

    var ts1 = [];
    var d = ts.getTime();
    for (var i = 0; i <= length_in_days; i++) {
        d += 15 * 60 * 1000; // advance 15 min
        ts1.push({ epoch: d, val: 5 + 4*Math.random() });
    }

    res.timeseries.push({ name: "s1", values: ts1 });
    callback(null, res);
}

//////////////////////////////////////////////////////////////////////////////////////

TsDashboardDemoDriver.prototype.prepareViewDefinition = function (callback) {
    var res = {
        title: "Dropdown dynamic inject",
        sidebar_width: 250,
        parameters: [
            {
                name: "param1",
                title: "Parent dropdown",
                type: "enum",
                default: "v2"
            },
            {
                name: "param2",
                title: "Child parameter",
                type: "enum",
                default: "v2"
            }
        ],
        blocks: [
            {
                title: "Main block",
                panels: [
                    {
                        title: "First panel",
                        widgets: [
                            {
                                title: "Widget 1",
                                timeseries: ["s1"],
                                options: {
                                    height: 200,
                                    y_axis_label: "Some label"
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    };
    this.view_definition = res;
}

