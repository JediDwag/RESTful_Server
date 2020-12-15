let app;
let map;
var incident_from_part;
var neighborhood_from_number;
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: null},
    {location: [44.977413, -93.025156], marker: null},
    {location: [44.931244, -93.079578], marker: null},
    {location: [44.956192, -93.060189], marker: null},
    {location: [44.978883, -93.068163], marker: null},
    {location: [44.975766, -93.113887], marker: null},
    {location: [44.959639, -93.121271], marker: null},
    {location: [44.947700, -93.128505], marker: null},
    {location: [44.930276, -93.119911], marker: null},
    {location: [44.982752, -93.147910], marker: null},
    {location: [44.963631, -93.167548], marker: null},
    {location: [44.973971, -93.197965], marker: null},
    {location: [44.949043, -93.178261], marker: null},
    {location: [44.934848, -93.176736], marker: null},
    {location: [44.913106, -93.170779], marker: null},
    {location: [44.937705, -93.136997], marker: null},
    {location: [44.949203, -93.093739], marker: null}
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

    var search = document.getElementById("searchbtn");
    search.addEventListener("click", searchLocation, false);

    getJSON('http://localhost:8000/incidents')
    //.then(response => response.json())
    //.then(data => console.log(data))
    .then(data => pushTableData(data))
    //console.log(tableData);

}

function setNeighborhood(neighborPair) {
    window.neighborhood_from_number = neighborPair[0].neighborhood_name;
}

function setIncidentType(codePair) {
    window.incident_from_part = codePair[0].incident_type;
}

function condenseAndPush(thisData, date_part, time_part, table) {
    //console.log('http://localhost:8000/codes?code=' + thisData.code);
    getJSON('http://localhost:8000/codes?code=' + thisData.code)
    //.then(response => response.json())
    //.then(data => console.log(data))
    .then(data => setIncidentType(data))
    getJSON('http://localhost:8000/neighborhoods?id=' + thisData.neighborhood_number)
    //.then(response => response.json())
    //.then(data => console.log(data))
    .then(data => setNeighborhood(data))
    .then(function() {
        var newData = {
            case_number: thisData.case_number,
            date: date_part,
            time: time_part,
            incident_type: window.incident_from_part,
            incident: thisData.incident,
            police_grid: thisData.police_grid,
            neighborhood: window.neighborhood_from_number,
            block: thisData.block
        }
        //console.log(thisData);
        table.rows.push(newData);
    })
}

function pushTableData(currentData) {

    var table = new Vue({
        el: '#table',
        data: {
          rows: [
            { case_number: 1, date: "2014-08-14", time: "00:00:00", incident_type: "Murder", incident: "Murder", police_grid: 33, neighborhood: "Payne/Phalen", block: "132X WESTMINSTER ST"},
            { case_number: 2, date: "2014-08-16", time: "00:00:00", incident_type: "Murder", incident: "Murder", police_grid: 33, neighborhood: "Payne/Phalen", block: "132X WESTMINSTER ST"}
          ]
        }
    });
    var thisData;
    for (var i = 0; i < currentData.length; i++) {
        thisData = currentData[i];
        var date_time_string = JSON.stringify(thisData.date_time);
        var date_part = date_time_string.split('T')[0];
        date_part = date_part.substr(1, date_part.length);
        var time_part = date_time_string.split('T')[1];
        time_part = time_part.substr(0, time_part.length-1);

        condenseAndPush(thisData, date_part, time_part, table);
    }
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
    console.log(url);
    Promise.all([getJSON(url)]).then((results) => {
        console.log(results[0][0]);
        map.setView([results[0][0].lat, results[0][0].lon], 16);
        var names = results[0][0].display_name.split(",");
        loc.placeholder = names[0] + "," + names[2];
    }).catch((error) => {
        console.log(error);
    });
}
