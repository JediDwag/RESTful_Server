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
            console.log(value);
            district_boundary.addData(value);
        });
    }).catch((error) => {
        console.log('Error:', error);
    });

    var search = document.getElementById("searchbtn");
    search.addEventListener("click", searchLocation, false);

    new Vue({
        el:'#search',
        methods: {
            enterPressed () {
                searchLocation();
                console.log(map.getBounds());
            }
        }
    });

    getJSON('http://localhost:8000/incidents')
    .then((data) => {
        pushTableData(data)
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
    for (var x = 0; x < argument.length; x++)
    {
        var c = argument.charAt(x);
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

    var newData = {
        case_number: thisData.case_number,
        date: date_part,
        time: time_part,
        incident_type: window.incident_from_part,
        incident: thisData.incident,
        police_grid: thisData.police_grid,
        neighborhood: window.neighborhood_from_number,
        block: thisData.block,
        code: thisData.code
    }

    table.rows.push(newData);
}

function pushTableData(currentData) {

    var table = new Vue({
        el: '#table',
        data: {
          rows: []
        },
        methods: {
            color: function(type){
                console.log(type);
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
            }
        }
    });

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
    console.log("location value: " + loc.value);
    var url = "https://nominatim.openstreetmap.org/search?q=" + loc.value + "&viewbox=-93.217977,44.883658,-92.993787,45.008206&bounded=1&format=json&accept-language=en";
    console.log("URL: " + url);
    Promise.all([getJSON(url)]).then((results) => {
        console.log(results[0][0]);
        map.setView([results[0][0].lat, results[0][0].lon], 16);
        var names = results[0][0].display_name.split(",");
        loc.value = names[0] + "," + names[2];
    }).catch((error) => {
        console.log(error);
    });
}
