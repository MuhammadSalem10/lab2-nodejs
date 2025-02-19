const http = require("http");
const fs = require("fs");
const path = require("path");

const DB_FILE = "employees.json";
const IMAGE_SERBAL = "serbal.jpeg";
const IMAGE_ASTRONOMY = "astronomy.jpg";
const CSS_FILE = "styles.css";


const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") return serveHomePage(res);
  if (req.url === "/add-employee" && req.method === "GET")
    return serveAddEmployeePage(res);
  if (req.url === "/astronomy" && req.method === "GET")
    return serveAstronomyPage(res);
  if (req.url === "/serbal" && req.method === "GET")
    return serveSerbalPage(res);
  if (req.url === "/employee" && req.method === "POST")
    return handleAddEmployee(req, res);
  if (req.url === "/astronomy/download" && req.method === "GET")
    return serveImageDownload(res, IMAGE_ASTRONOMY);
  if (req.url === `/${IMAGE_SERBAL}`)
    return serveStaticFile(res, IMAGE_SERBAL, "image/jpeg");
  if (req.url === `/${IMAGE_ASTRONOMY}`)
    return serveStaticFile(res, IMAGE_ASTRONOMY, "image/jpeg");
  if (req.url === `/${CSS_FILE}`)
    return serveStaticFile(res, CSS_FILE, "text/css");

  serve404Page(res);
});

function serveHomePage(res) {
  const employees = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  const employeeRows = employees
    .map(
      (emp) => `
    <tr>
      <td>${emp.name}</td>
      <td>${emp.email}</td>
      <td>${emp.salary}</td>
      <td>${emp.department}</td>
      <td>${emp.level}</td>
      <td>${emp.yearsOfExperience}</td>
    </tr>
  `
    )
    .join("");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <html>
    <head><link rel="stylesheet" href="/${CSS_FILE}"></head>
    <body>
      <nav><a href="/">Home</a> | <a href="/add-employee">Add Employee</a> | <a href="/astronomy">Astronomy</a> | <a href="/serbal">Serbal</a></nav>
      <h1>Employees</h1>
       <table>
          <tr>
            <th>Name</th><th>Email</th><th>Salary</th><th>Department</th><th>Level</th><th>Experience</th>
          </tr>
          ${employeeRows}
        </table>
    </body>
    </html>
  `);
}

function serveAddEmployeePage(res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <html>
    <head><link rel="stylesheet" href="/${CSS_FILE}"></head>
    <body>
      <nav><a href="/">Home</a> | <a href="/add-employee">Add Employee</a></nav>
      <h1>Add Employee</h1>
      <form action="/employee" method="POST" onsubmit="submitForm(event)">
            <label>Name: <input type="text" name="name" required></label><br>
            <label>Email: <input type="email" name="email" required></label><br>
            <label>Salary: <input type="number" name="salary" step="any" required></label><br>
            <label>Level:
              <select name="level">
                <option value="Jr">Jr</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Sr">Sr</option>
                <option value="Lead">Lead</option>
              </select>
            </label><br>
            <label>Years of Experience: <input type="number" name="yearsOfExperience" min="0" value="0"></label><br>
            <label>Department: <input type="text" name="department" required></label><br>
            <button type="submit">Add Employee</button>
      </form>
      <script>
        function submitForm(event) {
          event.preventDefault();
          const formData = new FormData(event.target);
          fetch("/employee", { method: "POST", body: JSON.stringify(Object.fromEntries(formData)), headers: { "Content-Type": "application/json" } })
            .then(() => window.location = "/");
        }
      </script>
    </body>
    </html>
  `);
}

function serveAstronomyPage(res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    `<html><head><link rel="stylesheet" href="/${CSS_FILE}"></head><body><nav><a href="/">Home</a></nav><h1>Astronomy</h1><img src="/${IMAGE_ASTRONOMY}"><br><a href="/astronomy/download">Download Image</a></body></html>`
  );
}

function serveSerbalPage(res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    `<html><head><link rel="stylesheet" href="/${CSS_FILE}"></head><body><nav><a href="/">Home</a></nav><h1>Serbal</h1><img src="/${IMAGE_SERBAL}"></body></html>`
  );
}

function serveStaticFile(res, fileName, contentType) {
  fs.readFile(fileName, (err, data) => {
    if (err) return serve404Page(res);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function handleAddEmployee(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const employee = JSON.parse(body);
    if (!employee.name || !employee.email) return res.end("Invalid Data");
    const employees = JSON.parse(fs.readFileSync(DB_FILE));
    employees.push(employee);
    fs.writeFileSync(DB_FILE, JSON.stringify(employees, null, 2));
    res.writeHead(201).end("Success");
  });
}

function serveImageDownload(res, filename) {
  res.writeHead(200, {
    "Content-Disposition": `attachment; filename=${filename}`,
  });
  fs.createReadStream(filename).pipe(res);
}

function serve404Page(res) {
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end("<h1>404 - Page Not Found</h1>");
}

server.listen(3000, () =>
  console.log("Server running at http://localhost:3000/")
);
