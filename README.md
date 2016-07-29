# TsDashboard

Light-weight javascript libarry for creating time-series dashboards. 
Geared primarily towards wide-screens, work also on tables, but not specially optimized for phones.

Dependencies:

- `jquery`
- `d3.js`

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

    getViewDefinition(callback)

Parameter `callback` must accept single parameter - an object that describes the view. For details see special section below.

    getParamValues(name, search, callback)

This method is used to populate dropdowns (parameters type `enum`) 
and dynamic search results (parameters type `filter`). Given parameter name 
and current search string the callback receives the list of matches or allowed values.

    getDrawData(options, callback)

This method fetches required data to draw. The `options` parameter must contain the following fields:

- **conf** - configuration 
- **params** - values of parameters tat we input by the user
- **ts_from** - Date object representing starting timepoint of observed period.
- **ts_to** - Date object representing end timepoint of observed period.

## Parameter types

- **string** - simple string, no validation
- **enum** - string from a fixed list of available values
- **filter** - string from a dynamic list of available values (callback is performed)
- **boolean** - simple checkbox