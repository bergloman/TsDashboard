function TsDashboardDemoDriver() {
    this.view_definition = null;
    this.view_object = null;
    this.prepareViewDefinition();
}

TsDashboardDemoDriver.prototype.onParamChange = function (name) {
    if (name == "param1") {
        this.view_object.setParamValue(
            "param2",
            this.view_object.getParamValue("param1")
        );
    }
}

TsDashboardDemoDriver.prototype.registerView = function (view) {
    this.view_object = view;
}

TsDashboardDemoDriver.prototype.getViewDefinition = function (callback) {
    callback(this.view_definition);
}

TsDashboardDemoDriver.prototype.getParamValues = function (name, search, callback) {
    if (name === "param3" || name === "param3x") {
        callback([
            { value: "v1", caption: "Value 1" },
            { value: "v2", caption: "Value 2" },
            { value: "v3", caption: "Value 3" }
        ]);
    } else if (name === "param2") {
        if (!search) return callback([]);
        serach = search.trim().toLowerCase();
        var options = this.countries
            .filter(function (x) { return x.lcname.indexOf(search) >= 0; });
        callback(options.map(function (x) { return x.name; }));
    }
}

// prepare some toy data
TsDashboardDemoDriver.prototype.getDrawData = function (options, callback) {
    var length_in_days = 145;
    var ts = new Date();
    ts = new Date(ts.getTime() - length_in_days * 24 * 60 * 60 * 1000);

    var res = {
        timeseries: [],
        timepoints: [],
        scatterseries: [],
        dataseries: []
    };

    var ts1 = [];
    var ts2 = [];
    var ts3 = [];
    var d = ts.getTime();
    var ts1_curr = 1;
    var ts2_curr = 2;
    var ts3_curr = 3;
    for (var i = 0; i <= length_in_days; i++) {
        //d += 24 * 60 * 60 * 1000; // advance single day 
        d += 15 * 60 * 1000; // advance 15 min
        ts1.push({ epoch: d, val: ts1_curr });
        ts2.push({ epoch: d, val: ts2_curr });
        ts3.push({ epoch: d, val: ts3_curr });
        ts1_curr += 0.5 * (Math.random() - 0.5);
        ts2_curr += 0.2 * (Math.random() - 0.5);
        ts3_curr += 0.1 * (Math.random() - 0.5);
        ts1_curr = Math.max(ts1_curr, 0);
        ts2_curr = Math.max(ts2_curr, 0);
        ts3_curr = Math.max(ts3_curr, 0);
    }

    res.timeseries.push({ name: "s1", values: ts1 });
    res.timeseries.push({ name: "s2", values: ts2 });
    res.timeseries.push({ name: "s3", values: ts3 });

    callback(res);
}

//////////////////////////////////////////////////////////////////////////////////////

TsDashboardDemoDriver.prototype.prepareViewDefinition = function (callback) {
    var res = {
        title: "Demo dashboard",
        sidebar_width: 250,
        parameters: [
            {
                name: "ts_from",
                title: "From",
                type: "date",
                default: "$today"
            },
            {
                name: "ts_to",
                title: "To",
                type: "datetime",
                default: "$today"
            },
            {
                name: "param1",
                title: "First parameter",
                type: "string",
                optional: false
            },
            {
                name: "param2",
                title: "Second parameter - autocomplete",
                type: "filter",
                optional: true,
                search_min_len: 0
            },
            {
                name: "param3",
                title: "Third parameter",
                type: "enum",
                default: "v2"
            },
            {
                name: "param3x",
                title: "Third parameter again",
                type: "enum",
                default: "v3"
            },
            {
                name: "param4",
                title: "Fourth parameter",
                type: "boolean",
                default: true
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
                                title: "Table 1",
                                timeseries: ["s1"],
                                options: {
                                    height: 200,
                                    y_axis_label: "Some label"
                                }
                            },
                            {
                                title: "Table 2",
                                timeseries: ["s2"],
                                options: {
                                    height: 100
                                }
                            },
                            {
                                type: "table",
                                title: "Table 3",
                                timeseries: ["s2"],
                                options: {
                                    height: 100
                                }
                            }    
                        ]
                    },
                ]
            }
        ]
    };
    this.view_definition = res;
}
