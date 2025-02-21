const http = require("http");
const fs = require("fs");

const DB_FILE = "employees.json";
const IMAGE_SERBAL = "serbal.jpeg";
const IMAGE_ASTRONOMY = "astronomy.jpg";
const CSS_FILE = "styles.css";

const server = http.createServer((req, res) => {
  if (req.url === "/") return serveHomePage(res);
  if (req.url === "/add-employee") return serveAddEmployeePage(res);
  if (req.url === "/astronomy") return serveAstronomyPage(res);
  if (req.url === "/serbal") return serveSerbalPage(res);
  if (req.url === "/employee" && req.method === "POST")
    return handleAddEmployee(req, res);
  if (req.url === "/astronomy/download")
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
  let employeeData = "";
  const stream = fs.createReadStream(DB_FILE, "utf8");

  stream.on("data", (chunk) => {
    employeeData += chunk;
  });

  stream.on("end", () => {
    try {
      const employees = JSON.parse(employeeData);
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
    } catch (error) {
      console.error("Error parsing employee data:", error);
      serve500Page(res); 
    }
  });

  stream.on("error", (err) => {
    console.error("Error reading employee data:", err);
    serve500Page(res); 
  });
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
  const stream = fs.createReadStream(fileName);
  stream.on("error", (err) => {
    console.error("Error serving static file:", err);
    serve404Page(res); 
    return;
  });
  res.writeHead(200, { "Content-Type": contentType });
  stream.pipe(res);
}

function handleAddEmployee(req, res) {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const employee = JSON.parse(body);
      if (!employee.name || !employee.email) return res.end("Invalid Data");

      let employeeData = "";
      const readStream = fs.createReadStream(DB_FILE, "utf8");

      readStream.on("data", (chunk) => {
        employeeData += chunk;
      });

      readStream.on("end", () => {
        try {
          const employees = JSON.parse(employeeData);
          employees.push(employee);
          fs.writeFile(DB_FILE, JSON.stringify(employees, null, 2), (err) => {
            if (err) {
              console.error("Error writing to DB_FILE:", err);
              serve500Page(res);
              return;
            }
            res.writeHead(201).end("Success");
          });
        } catch (parseError) {
          console.error("Error parsing employee data:", parseError);
          serve500Page(res);
        }
      });

      readStream.on("error", (readError) => {
        console.error("Error reading employee data:", readError);
        serve500Page(res);
      });
    } catch (error) {
      console.error("Error parsing request body:", error);
      res.writeHead(400).end("Invalid request body"); 
    }
  });
}

function serveImageDownload(res, filename) {
  res.writeHead(200, {
    "Content-Disposition": `attachment; filename=${filename}`,
  });
  const stream = fs.createReadStream(filename);
  stream.on("error", (err) => {
    console.error("Error serving image download:", err);
    serve404Page(res);
  });
  stream.pipe(res);
}

function serve404Page(res) {
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end("<h1>404 - Page Not Found</h1>");
}

function serve500Page(res) {
  res.writeHead(500, { "Content-Type": "text/html" });
  res.end("<h1>500 - Internal Server Error</h1>");
}

server.listen(3000, () =>
  console.log("Server running at http://localhost:3000/")
);
