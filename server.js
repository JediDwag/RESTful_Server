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
    console.log("/codes: request");

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
            res.status(200).type('json').send(rows);
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
            res.status(200).type('json').send(rows);
        }
    })
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let case_number = url.searchParams.get('case_number');
    let date = url.searchParams.get('date');
    let time = url.searchParams.get('time');
    let code = url.searchParams.get('code');
    let incident = url.searchParams.get('incident');
    let police_grid = url.searchParams.get('police_grid');
    let neighborhood_number = url.searchParams.get('neighborhood_number');
    let block = url.searchParams.get('block');
    
    if(case_number == null || date == null || time == null || code == null || incident == null || police_grid == null || neighborhood_number == null || block == null){
        res.status(500).type('txt').send('Error: Malformed request - must include all parameters: case_number, date, time, code, incident, police_grid, neighborhood_number, block');
        console.log('Failure: /new-incident: Malformed request');
    }
    else{
        console.log('/new-incident: ' + case_number + ', ' + date + ', ' + time + ', ' + code + ', ' + incident + ', ' + police_grid + ', ' + neighborhood_number + ', ' + block);
        query = "SELECT case_number FROM incidents WHERE case_number = ?;";
        db.all(query, case_number, (err, rows) => {
            if(err){
                res.status(500).send('Database access error');
                console.log("Error ", err.message);   
            }
            else{
                if(rows.length > 0){
                    res.status(500).type('txt').send('Error: Case number already exists in database: ' + case_number);
                    console.log('Failure: /new-incident: Case number already exists - case_number: ' + case_number);
                    res.end();
                }
                else{
                    // Begin to add to db
                    let date_time = date + "T" + time;
                    let query = "INSERT INTO incidents(case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)";
                    let params = [case_number, date_time, code, incident, police_grid, neighborhood_number, block];
                    let promise = databaseInsert(query, params);
                    promise.then(() => {
                        res.status(200).type('txt').send('success');
                        console.log("/new-incident: Added successfully");
                    }).catch((err) => {
                        res.status(500).type('txt').send('Database access error');
                        console.log("Error: /new-incident not successful: " + err.message);
                    })
                }
            }
        })
    }
});

// For testing purposes. Not part of the assignment, but we can probably leave it here.
app.delete('/remove-incident', (req, res) => {
    let url = new URL(req.protocol + "://" + req.get('host') + req.originalUrl);
    let case_number = url.searchParams.get('case_number');
  
    if(case_number == null){
      res.status(500).type('txt').send('Error: Malformed request - must specify case_number');
      console.log('Failure: /remove-user: Malformed request');
    }
    else{
  
      console.log("Attempting to remove case_number " + case_number);
      let query = "DELETE FROM incidents WHERE case_number = ?;"
      let params = case_number;
      db.all(query, params, (err) => {
        if(err){
            res.status(500).send('Database access error');
            console.log("Error ", err.message);   
        }
        else{
            res.status(200).type('txt').send('success');
            console.log("/remove-incident: Successfully removed case_number: " + case_number);
        }
      })
    }
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
