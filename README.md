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
    - handles all server-side calls
    - handles clicks by forwarding them to the driver object

## Parameter types

- **string** - simple string, no validation
- **enum** - string from a fixed list of available values
- **filter** - string from a dynamic list of available values (callback is performed)
- **boolean** - simple checkbox