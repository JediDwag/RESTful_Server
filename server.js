// Built-in Node.js modules
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let app = express();
let port = 8000;

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
// data source: https://information.stpaul.gov/Public-Safety/Crime-Incident-Report-Dataset/gppb-g9cg
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// REST API: GET /codes
// Respond with list of codes and their corresponding incident type
app.get('/codes', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let query = "SELECT * FROM codes ORDER BY code;";
    db.all(query, [], (err, rows) => {
        if(err){
            res.status(500).send('Database access error');
            console.log("Error ", err.message);   
        }
        else{
            res.status(200).type('json').send({rows});
        }
    })
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let query = "SELECT * FROM neighborhoods ORDER BY neighborhood_number;";
    db.all(query, [], (err, rows) => {
        if(err){
            res.status(500).send('Database access error');
            console.log("Error ", err.message);   
        }
        else{
            res.status(200).type('json').send({rows});
        }
    })
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let query = "SELECT * FROM incidents ORDER BY date_time LIMIT 1000;";
    db.all(query, [], (err, rows) => {
        if(err){
            res.status(500).send('Database access error');
            console.log("Error ", err.message);   
        }
        else{
            res.status(200).type('json').send({rows});
        }
    })
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let newJSON = {
        "case_number" : "19245020",
        "date_time" : "2019-10-30T23:57:08",
        "code": 9954,
        "incident": "Proactive Police Visit",
        "police_grid": 87,
        "neighborhood_number": 7,
        "block": "THOMAS AV & VICTORIA"
    }

    newJSON.case_number = url.searchParams.get('case_number');
    newJSON.date_time = url.searchParams.get('date') + "T" + url.searchParams.get('time');
    newJSON.code = parseInt(url.searchParams.get('code'));
    newJSON.incident = url.searchParams.get('incident');
    newJSON.police_grid = parseInt(url.searchParams.get('police_grid'));
    newJSON.neighborhood_number = parseInt(url.searchParams.get('neighborhood_number'));
    newJSON.block = url.searchParams.get('block');
    
    db.run("INSERT INTO incidents(case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [url.searchParams.get('case_number'), url.searchParams.get('date') + "T" + url.searchParams.get('time'), parseInt(url.searchParams.get('code')), url.searchParams.get('incident'), parseInt(url.searchParams.get('police_grid')), parseInt(url.searchParams.get('neighborhood_number')), url.searchParams.get('block')], (err) => {
            if (err) {
                console.log(err);
            }
        }
    )
    //console.log(query);
    //db.run(query);
    console.log(newJSON);

    res.status(200).type('txt').send('success');
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT query
function databaseInsert(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
