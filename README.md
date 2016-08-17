# TsDashboard

Light-weight javascript library for creating time-series dashboards. 
Geared primarily towards wide-screens, works also on tablets,
but not specially optimized for phones.

Dependencies:

- `jquery`
- `d3.js`
- `moment.js`

## Basic idea

Create a client-side library that:

- is writen in pure `javascript`
- creates nice dashboards, used primarily for time-series data
- receives the data as well as the configuration from a `driver object`, which:
    - is supplied by the developer
    - handles all server-side calls, if needed
    - handles clicks by forwarding them to the driver object

### Dashboard structure

Dashboard consists of the following hierarchy of objects:

- **Blocks** - horizontal bands
    - **Panels** - vertical bands inside blocks
        - **Widgets** - individual charts, stacked vertically

## Required interface for driver object

The driver object must provide the following methods:

### registerView(view_object)

**Optional** method.

This way the view injects itself into driver - driver can call certain methodsinto view to 
set values or force refresh.

### onParamChange(name)

**Optional** method.

This method is called, when the value of any of the parameters change.

### getViewDefinition(callback)

Parameter `callback` must accept single parameter - an object that describes the view. For details see special section below.

### getParamValues(name, search, callback)

This method is used to populate dropdowns (parameters type `enum`) 
and dynamic search results (parameters type `filter`). Given parameter name 
and current search string (valid only for dynamic search)
the callback receives the list of matches or allowed values.

### getDrawData(options, callback)

This method fetches required data to draw. The `options` parameter must contain the following fields:

- **conf** - configuration 
- **params** - values of parameters that were entered by the user

Result should conform to the following schema:

``````
{
    "timeseries" : [
        { 
            "name" : "some name",
            "values: [
                { "epoch": ..., val: ... },
                ...
            ]
        },
        ....
    ]
}
``````

Here, epoch should be valid `Javascript` epoch.

## Configuration structure

Configuration is given in `javascript` object, which looks like the following `JSON`:
```````````json
{
    "title": "......",
    "sidebar_width": 250,
    "parameters": [
        {
            "name: "......",
            "title": "......",
            "type" "......",
            "default: "......",
            "optional": true/false,
            "min_len_search": 3
        },
        ....
    ],
    "blocks": [
        {
            "title": ".........",
            "panels": [
                {
                    "title": ".........",
                    "widgets": [
                        {
                            "title": ".........",
                            "timeseries": ["...", ....],
                            "timepoints": ["...", ....],
                            "options": {
                                "height": 100,
                                ..
                                ..
                            }
                        },
                        ....
                    ]
                },
                .....
                .....
            ]
        }
    ]
}
```````````
- Parameters require `name`, `title` and `type`. Other data is optional.
    - Value `search_min_len` is applicable only to `filter` type. Default is 3.
- All titles (blocks, panels, widgets) are optional.
- All widget options are optional. See below for full list with explanations and default values.


## Parameter types

- `string` - simple string, no validation
- `enum` - string from a fixed list of available values
- `filter` - string from a dynamic list of available values (callback is performed)
- `date` - date value in `YYYY-MM-DD` format
- `datetime` - date and time value in `YYYY-MM-DD HH:MM:SS` format
- `boolean` - simple checkbox

## Time-series chart options

- `height` - height of chart in pixels. Default is 100.
- `xdomain_min` - minimal value of X domain (timeseries) - in `javascript` epochs.
- `xdomain_max` - maximal value of X domain (timeseries) - in `javascript` epochs.
- `ydomain_min` - minimal value of Y domain. If not specified, it is determined dynamicaly.
- `ydomain_max` - maximal value of Y domain. If not specified, it is determined dynamicaly.
- `series_style_indices` - array of indices into CSS styles that are used for series. By default 0-based indices are used.
- `xcaption` - Caption of X axis
- `ycaptions` - Caption of Y axis series (array of captions)

## View interface
This section describe view interface that can be called from driver.

### getParamValue(name)

Gets the value of the parameter named `name`.

### setParamValue(name, value)

Sets the value of parameter named `name` to `value`.