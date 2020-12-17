let app;
let map;
var incident_from_part;
var neighborhood_from_number;
var redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: 1},
    {location: [44.977413, -93.025156], marker: 2},
    {location: [44.931244, -93.079578], marker: 3},
    {location: [44.956192, -93.060189], marker: 4},
    {location: [44.978883, -93.068163], marker: 5},
    {location: [44.975766, -93.113887], marker: 6},
    {location: [44.959639, -93.121271], marker: 7},
    {location: [44.947700, -93.128505], marker: 8},
    {location: [44.930276, -93.119911], marker: 9},
    {location: [44.982752, -93.147910], marker: 10},
    {location: [44.963631, -93.167548], marker: 11},
    {location: [44.973971, -93.197965], marker: 12},
    {location: [44.949043, -93.178261], marker: 13},
    {location: [44.934848, -93.176736], marker: 14},
    {location: [44.913106, -93.170779], marker: 15},
    {location: [44.937705, -93.136997], marker: 16},
    {location: [44.949203, -93.093739], marker: 17}
];

function init() {
    let crime_url = 'http://localhost:8000';

    app = new Vue({
        el: '#app',
        data: {
            map: {
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: {lat: 45.008206, lng: -93.217977},
                    se: {lat: 44.883658, lng: -92.993787}
                }
            }
        }
    });

    map = L.map('leafletmap').setView([app.map.center.lat, app.map.center.lng], app.map.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 11,
        maxZoom: 18
    }).addTo(map);
    map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
    
    let district_boundary = new L.geoJson();
    district_boundary.addTo(map);

    getJSON('data/StPaulDistrictCouncil.geojson').then((result) => {
        // St. Paul GeoJSON
        $(result.features).each(function(key, value) {
            district_boundary.addData(value);
        });
    }).catch((error) => {
        console.log('Error:', error);
    });

    new Vue({
        el:'#search',
        methods: {
            enterPressed () {
                searchLocation();
                console.log(map.getBounds());
                console.log(map.getBounds().getNorthEast().toString());
            }
        }
    });

    var table = new Vue({
        el: '#table',
        data: {
          rows: []
        },
        methods: {
            color: function(type){
                if((type >= 110 & type <= 220) ||
                (type >= 400 && type <= 453) ||
                (type >= 810 && type <= 982)){
                    return "background: lightcoral";
                }
                else if((type >= 300 && type <= 374) ||
                (type >= 500 && type <= 546) ||
                (type >= 600 && type <= 613) ||
                (type >= 621 && type <= 712) ||
                (type >= 1400 && type <= 1436)){
                    return "background: lightblue";
                }
                else if((type >= 550 && type <= 566) ||
                (type >= 720 && type <= 722)){
                    return "background: lightgoldenrodyellow";
                }
                else if(type >= 1800 && type <= 1885){
                    return "background: lightgreen";
                }
                else if(type == 614 || type == 2619 || type == 9954 || type == 9959){
                    return "background: lightsalmon";
                }
            },
            clear: function(){
                this.rows = [];
            }
        }
    });

    var filters = new Vue({
        el: '#tableFilters',

        data: {
            personalCrimes: '',
            propertyCrimes: '',
            inchoateCrimes: '',
            statutoryCrimes: '',
            otherCrimes: '',
            hood1: '',
            hood2: '',
            hood3: '',
            hood4: '',
            hood5: '',
            hood6: '',
            hood7: '',
            hood8: '',
            hood9: '',
            hood10: '',
            hood11: '',
            hood12: '',
            hood13: '',
            hood14: '',
            hood15: '',
            hood16: '',
            hood17: '',
            startDate: '',
            endDate: '',
            maxIncidents: ''
        },
        methods: {
            processForm: function(){
                table.clear();
                let filterURL = "http://localhost:8000/incidents";
                let changed = 0;
                var params = "";
                if(this.personalCrimes != "" || this.propertyCrimes != "" || this.inchoateCrimes != "" || this.statutoryCrimes != "" || this.otherCrimes != ""){
                    changed = 1;
                    params = params + "?code="
                    if(personalCrimes != ""){
                        params = params + "110,120,210,220,400,410,411,412,420,421,422,430,431,432,440,441,442,450,451,452,453,810,861,862,863,900,901,903,905,911,915,921,923,931,933,941,942,951,961,971,972,981,982";
                        if(this.propertyCrimes != "" || this.inchoateCrimes != "" || this.statutoryCrimes != "" || this.otherCrimes != ""){
                            params = params + ","
                        }
                    }
                    if(this.propertyCrimes != ""){
                        params = params + "500,510,511,513,515,516,520,521,523,525,526,530,531,533,535,536,540,541,543,546,600,603,611,612,613,621,622,623,630,633,640,641,642,643,651,652,653,661,662,663,671,672,673,681,682,683,691,692,693,700,710,711,712,1400,1401,1410,1415,1416,1420,1425,1426,1430,1435,1436";
                        if(this.inchoateCrimes != "" || this.statutoryCrimes != "" || this.otherCrimes != ""){
                            params = params + ","
                        }
                    }
                    if(this.inchoateCrimes != ""){
                        params = params + "550,551,553,555,556,560,561,563,565,566,720,721,722";
                        if(this.statutoryCrimes != "" || this.otherCrimes != ""){
                            params = params + ","
                        }
                    }
                    if(this.statutoryCrimes != ""){
                        params = params + "1800,1810,1811,1812,1813,1814,1815,1820,1822,1823,1824,1825,1830,1835,1840,1841,1842,1843,1844,1845,1850,1855,1860,1865,1870,1880,1885";
                        if(this.otherCrimes != ""){
                            params = params + ","
                        }
                    }
                    if(this.otherCrimes != ""){
                        params = params + "614,2619,9954,9959";
                    }
                }
                if(this.hood1 != "" || this.hood2 != "" || this.hood3 != "" || this.hood4 != "" || this.hood5 != "" || this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                    if(changed != 0){
                        params = params + "&";
                    }
                    else{
                        params = params + "?";
                        changed = 1;
                    }
                    params = params + "neighborhood=";
                    if(this.hood1 != ""){
                        params = params + "1";
                        if(this.hood2 != "" || this.hood3 != "" || this.hood4 != "" || this.hood5 != "" || this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood2 != ""){
                        params = params + "2";
                        if(this.hood3 != "" || this.hood4 != "" || this.hood5 != "" || this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood3 != ""){
                        params = params + "3";
                        if(this.hood4 != "" || this.hood5 != "" || this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood4 != ""){
                        params = params + "4";
                        if(this.hood5 != "" || this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood5 != ""){
                        params = params + "5";
                        if(this.hood6 != "" || this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood6 != ""){
                        params = params + "6";
                        if(this.hood7 != "" || this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood7 != ""){
                        params = params + "7";
                        if(this.hood8 != "" || this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood8 != ""){
                        params = params + "8";
                        if(this.hood9 != "" || this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood9 != ""){
                        params = params + "9";
                        if(this.hood10 != "" || this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood10 != ""){
                        params = params + "10";
                        if(this.hood11 != "" || this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood11 != ""){
                        params = params + "11";
                        if(this.hood12 != "" || this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood12 != ""){
                        params = params + "12";
                        if(this.hood13 != "" || this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood13 != ""){
                        params = params + "13";
                        if(this.hood14 != "" || this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood14 != ""){
                        params = params + "14";
                        if(this.hood15 != "" || this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood15 != ""){
                        params = params + "15";
                        if(this.hood16 != "" || this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood16 != ""){
                        params = params + "16";
                        if(this.hood17 != ""){
                            params = params + ",";
                        }
                    }
                    if(this.hood17 != ""){
                        params = params + "17";
                    }
                }
                if(startDate.value != ""){
                    if(changed != 0){
                        params = params + "&";
                    }
                    else{
                        params = params + "?";
                        changed = 1;
                    }

                    params = params + "start_date=" + startDate.value;
                }
                if(endDate.value != ""){
                    if(changed != 0){
                        params = params + "&";
                    }
                    else{
                        params = params + "?";
                        changed = 1;
                    }
                    params = params + "end_date=" + endDate.value;
                }
                if(maxIncidents.value != ""){
                    if(changed != 0){
                        params = params + "&";
                    }
                    else{
                        params = params + "?";
                        changed = 1;
                    }
                    params = params + "limit=" + maxIncidents.value;
                }

                filterURL = filterURL + params;
                getJSON(filterURL).then((data) => {
                    pushTableData(data, table);
                });
            }
        }
    });

    getJSON('http://localhost:8000/incidents')
    .then((data) => {
        pushTableData(data, table)
        getJSON('http://localhost:8000/neighborhoods').then((values) => {
            for(i in neighborhood_markers){
                L.marker([neighborhood_markers[i].location[0], neighborhood_markers[i].location[1]]).addTo(map)
                .bindPopup(getHoodName(neighborhood_markers[i].marker, values) + "<br>Crimes: " + getCrimes(neighborhood_markers[i].marker, data));
            }
        })
    });
}

function myScript(argument, date, time, incident) {
    let argumentArray = argument.split("");
    for (var x = 0; x < argument.length; x++) {
        if (parseInt(argument.charAt(x-1)) != NaN && argument.charAt(x) == "X" && argument.charAt(x+1) == " ") {
            argumentArray[x] = "0";
        }
    }
    let newArgument = argumentArray.join("");
    newArgument = newArgument.replace(/ /g, "%20");
    getJSON("https://nominatim.openstreetmap.org/search?q=" + newArgument + "&viewbox=-93.217977,44.883658,-92.993787,45.008206&bounded=1&format=json&accept-language=en")
    .then((data) => {
        currMarker = L.marker([data[0].lat, data[0].lon], {icon: redIcon}).addTo(map)
        .bindPopup("Date: " + date + "</br>Time: " + time + "</br>Incident: " + incident + "</br><input type='button' value='Delete this marker' class='marker-delete-button'/>");
        currMarker.on("popupopen", onPopupOpen);
    });
}

function onPopupOpen() {

    var tempMarker = this;

    // To remove marker on click of delete button in the popup of marker
    $(".marker-delete-button:visible").click(function () {
        map.removeLayer(tempMarker);
    });
}

function getCrimes(hoodNumber, data){
    answer = 0;
    for(i in data){
        if(data[i].neighborhood_number == hoodNumber){
            answer++;
        }
    }
    return answer;
}

function getHoodName(hoodNumber, values){
    answer = "Name not found";
    for(i in values){
        if(values[i].neighborhood_number == hoodNumber){
            answer = values[i].neighborhood_name;
            break;
        }  
    }
    return answer;
}

function setNeighborhood(neighborPair) {
    window.neighborhood_from_number = neighborPair[0].neighborhood_name;
}

function setIncidentType(codePair) {
    window.incident_from_part = codePair[0].incident_type;
}

function condenseAndPush(thisData, date_part, time_part, table, codes, neighborhoods) {

    for(line in codes){
        if(codes[line].code == thisData.code){
            window.incident_from_part = codes[line].incident_type;
            break;
        }
    }

    for(line in neighborhoods){
        if(neighborhoods[line].neighborhood_number == thisData.neighborhood_number){
            window.neighborhood_from_number = neighborhoods[line].neighborhood_name;
            break;
        }
    }
    
    let argument = thisData.block;
    let argumentArray = argument.split("");
    for (var x = 0; x < argument.length; x++) {
        if (parseInt(argument.charAt(x-1)) != NaN && argument.charAt(x) == "X" && argument.charAt(x+1) == " ") {
            argumentArray[x] = "0";
        }
    }
    let newArgument = argumentArray.join("");

    var newData = {
        case_number: thisData.case_number,
        date: date_part,
        time: time_part,
        incident_type: window.incident_from_part,
        incident: thisData.incident,
        police_grid: thisData.police_grid,
        neighborhood: window.neighborhood_from_number,
        block: newArgument,
        code: thisData.code
    }

    table.rows.push(newData);
}

function pushTableData(currentData, table) {

    Promise.all([getJSON('http://localhost:8000/codes'), getJSON('http://localhost:8000/neighborhoods')]).then((values) => {

        var codes = values[0];
        var neighborhoods = values[1];
        var thisData;

        for (var i = 0; i < currentData.length; i++) {
            thisData = currentData[i];
            var date_time_string = JSON.stringify(thisData.date_time);
            var date_part = date_time_string.split('T')[0];
            date_part = date_part.substr(1, date_part.length);
            var time_part = date_time_string.split('T')[1];
            time_part = time_part.substr(0, time_part.length-1);

            condenseAndPush(thisData, date_part, time_part, table, codes, neighborhoods);
        }
    });
}

function getJSON(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                resolve(data);
            },
            error: function(status, message) {
                reject({status: status.status, message: status.statusText});
            }
        });
    });
}

function searchLocation(event) {
    var loc = document.getElementById("location");
    var url = "https://nominatim.openstreetmap.org/search?q=" + loc.value + "&viewbox=-93.217977,44.883658,-92.993787,45.008206&bounded=1&format=json&accept-language=en";
    Promise.all([getJSON(url)]).then((results) => {
        map.setView([results[0][0].lat, results[0][0].lon], 16);
        var names = results[0][0].display_name.split(",");
        loc.value = names[0] + "," + names[2];
    }).catch((error) => {
        console.log(error);
    });
}
