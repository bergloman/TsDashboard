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

## Required interface for driver object

The driver object must provide the following methods:

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

Here, epoch should be valid `Javascript` epoch

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