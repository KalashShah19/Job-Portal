const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/registration.html') {
        // Serve the registration form
        const filePath = path.join(__dirname, 'registration.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else if (req.method === 'POST' && req.url === '/register') {
        // Handle form submission
        let formData = '';
        req.on('data', (chunk) => {
            formData += chunk;
        });
        req.on('end', () => {
            const parsedData = new URLSearchParams(formData);

            const username = parsedData.get('username');
            const email = parsedData.get('email');
            const password = parsedData.get('password');

            // Establish a connection to the MySQL database
            const db = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: 'root',
                database: 'jobPortal'
            });

            // Insert user registration data into the database
            db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [username, email, password],
                (err) => {
                    if (err) {
                        console.error('Error inserting data into the database:', err.message);
                        res.writeHead(500);
                        res.end('Registration failed');
                    } else {
                        console.log('Registration successful');
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Registration successful');
                    }

                    // Close the database connection
                    db.end();
                }
            );
        });
    } else {
        // Handle other requests (e.g., serve other static files)
        res.writeHead(404);
        res.end('Not Found');
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
