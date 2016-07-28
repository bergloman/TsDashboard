function TsDashboardDemoDriver() {
    this.countries = null;
    this.view_definition = null;
    this.prepareListOfCountries();
    this.prepareViewDefinition();
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

TsDashboardDemoDriver.prototype.getDrawData = function (options, callback) {
    var length_in_days = 15;
    var ts = new Date();
    ts = new Date(ts.getTime() - length_in_days * 24 * 60 * 60 * 1000);

    var res = {
        timeseries: []
    };

    var ts1 = [];
    var ts2 = [];
    var ts3 = [];
    for (var i = 0; i <= length_in_days; i++) {
        var d = new Date(ts.getTime() + i * 24 * 60 * 60 * 1000);
        ts1.push({ ts: d, val: i % 5 });
        ts2.push({ ts: d, val: Math.random() * 2 + 2 });
        ts3.push({ ts: d, val: Math.random() * 6 });
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
        parameters: [
            {
                name: "param1",
                title: "First parameter",
                type: "string"
            },
            {
                name: "param2",
                title: "Second parameter",
                type: "filter"
            },
            {
                name: "param3",
                title: "Third parameter",
                type: "enum"
            },
            {
                name: "param3x",
                title: "Third parameter again",
                type: "enum"
            },
            {
                name: "param4",
                title: "Fourth parameter",
                type: "boolean"
            }
        ],
        blocks: [
            {
                title: "Main",
                panels: [
                    {
                        title: "",
                        widgets: [
                            {
                                title: "",
                                height: 500,
                                timeseries: ["s1", "s2"]
                            }
                        ]
                    }
                ]
            },
            {
                title: "Sub",
                panels: [
                    {
                        title: "",
                        widgets: [
                            {
                                title: "",
                                height: 200,
                                timeseries: ["s3"]
                            }
                        ]
                    }
                ]
            }
        ]
    };
    this.view_definition = res;
}


TsDashboardDemoDriver.prototype.prepareListOfCountries = function () {

    var countries = [
        "Afghanistan",
        "Albania",
        "Algeria",
        "American Samoa",
        "Andorra",
        "Angola",
        "Anguilla",
        "Antarctica",
        "Antigua And Barbuda",
        "Argentina",
        "Armenia",
        "Aruba",
        "Australia",
        "Austria",
        "Azerbaijan",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belarus",
        "Belgium",
        "Belize",
        "Benin",
        "Bermuda",
        "Bhutan",
        "Bolivia",
        "Bosnia And Herzegovina",
        "Botswana",
        "Bouvet Island",
        "Brazil",
        "British Indian Ocean Territory",
        "Brunei Darussalam",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cambodia",
        "Cameroon",
        "Canada",
        "Cape Verde",
        "Cayman Islands",
        "Central African Republic",
        "Chad",
        "Chile",
        "China",
        "Christmas Island",
        "Cocos (keeling) Islands",
        "Colombia",
        "Comoros",
        "Congo",
        "Congo, The Democratic Republic Of The",
        "Cook Islands",
        "Costa Rica",
        "Cote D'ivoire",
        "Croatia",
        "Cuba",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Djibouti",
        "Dominica",
        "Dominican Republic",
        "East Timor",
        "Ecuador",
        "Egypt",
        "El Salvador",
        "Equatorial Guinea",
        "Eritrea",
        "Estonia",
        "Ethiopia",
        "Falkland Islands (malvinas)",
        "Faroe Islands",
        "Fiji",
        "Finland",
        "France",
        "French Guiana",
        "French Polynesia",
        "French Southern Territories",
        "Gabon",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Gibraltar",
        "Greece",
        "Greenland",
        "Grenada",
        "Guadeloupe",
        "Guam",
        "Guatemala",
        "Guinea",
        "Guinea-bissau",
        "Guyana",
        "Haiti",
        "Heard Island And Mcdonald Islands",
        "Holy See (vatican City State)",
        "Honduras",
        "Hong Kong",
        "Hungary",
        "Iceland",
        "India",
        "Indonesia",
        "Iran, Islamic Republic Of",
        "Iraq",
        "Ireland",
        "Israel",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kazakstan",
        "Kenya",
        "Kiribati",
        "Korea, Democratic People's Republic Of",
        "Korea, Republic Of",
        "Kosovo",
        "Kuwait",
        "Kyrgyzstan",
        "Lao People's Democratic Republic",
        "Latvia",
        "Lebanon",
        "Lesotho",
        "Liberia",
        "Libyan Arab Jamahiriya",
        "Liechtenstein",
        "Lithuania",
        "Luxembourg",
        "Macau",
        "Macedonia, The Former Yugoslav Republic Of",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Maldives",
        "Mali",
        "Malta",
        "Marshall Islands",
        "Martinique",
        "Mauritania",
        "Mauritius",
        "Mayotte",
        "Mexico",
        "Micronesia, Federated States Of",
        "Moldova, Republic Of",
        "Monaco",
        "Mongolia",
        "Montserrat",
        "Montenegro",
        "Morocco",
        "Mozambique",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Nepal",
        "Netherlands",
        "Netherlands Antilles",
        "New Caledonia",
        "New Zealand",
        "Nicaragua",
        "Niger",
        "Nigeria",
        "Niue",
        "Norfolk Island",
        "Northern Mariana Islands",
        "Norway",
        "Oman",
        "Pakistan",
        "Palau",
        "Palestinian Territory, Occupied",
        "Panama",
        "Papua New Guinea",
        "Paraguay",
        "Peru",
        "Philippines",
        "Pitcairn",
        "Poland",
        "Portugal",
        "Puerto Rico",
        "Qatar",
        "Reunion",
        "Romania",
        "Russian Federation",
        "Rwanda",
        "Saint Helena",
        "Saint Kitts And Nevis",
        "Saint Lucia",
        "Saint Pierre And Miquelon",
        "Saint Vincent And The Grenadines",
        "Samoa",
        "San Marino",
        "Sao Tome And Principe",
        "Saudi Arabia",
        "Senegal",
        "Serbia",
        "Seychelles",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Georgia And The South Sandwich Islands",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Suriname",
        "Svalbard And Jan Mayen",
        "Swaziland",
        "Sweden",
        "Switzerland",
        "Syrian Arab Republic",
        "Taiwan, Province Of China",
        "Tajikistan",
        "Tanzania, United Republic Of",
        "Thailand",
        "Togo",
        "Tokelau",
        "Tonga",
        "Trinidad And Tobago",
        "Tunisia",
        "Turkey",
        "Turkmenistan",
        "Turks And Caicos Islands",
        "Tuvalu",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "United States Minor Outlying Islands",
        "Uruguay",
        "Uzbekistan",
        "Vanuatu",
        "Venezuela",
        "Viet Nam",
        "Virgin Islands, British",
        "Virgin Islands, U.s.",
        "Wallis And Futuna",
        "Western Sahara",
        "Yemen",
        "Zambia",
        "Zimbabwe"
    ];
    this.countries = countries.map(function (x) {
        return { name: x, lcname: x.toLowerCase() };
    })
}