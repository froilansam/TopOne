let express = require("express");
let router = express.Router();
let applyRouter = express.Router();
let authMiddleware = require("../auth/middleware");
let db = require("../../lib/database")();
let multer = require("multer");
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/assets/uploads");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".pdf");
  }
});
var upload = multer({ storage: storage });

applyRouter.use(authMiddleware.noAuthed);

//Technician Log-in Page
applyRouter
  .get("/", (req, res) => {
    console.log("Log In Router");
    res.render("main/views/index");
  })
  .post("/", upload.single("resumeLetter"), (req, res) => {
    console.log("---Technician Information---");
    console.log(req.body);
    let technicianInformation = req.body;
    console.log("---Technician Information---");

    console.log("---Technician Resume---");
    console.log(req.file);
    console.log("---Technician Resume---");

    let technicianQuery = `INSERT INTO tbl_technician (strTechnicianFirstName, strTechnicianLastName, strTechnicianEmail, strTechnicianGender, strTechnicianCoverLetter, datTechnicianBirthday, strTechnicianResume, strHiredStatus) VALUES (?, ?, ?, ?, ?, ?, ? ,?)`;
    db.query(technicianQuery, [technicianInformation.firstName, technicianInformation.lastName, technicianInformation.emailAddress, technicianInformation.gender, technicianInformation.coverLetter, new Date(technicianInformation.birthDate), req.file.filename, "Evaluation"], (err, results, field) => {
        if (err) {
          if(err.errno === 1062){
            console.log(err);
            res.send({ message: "Duplicate" });
            res.end();
          }
          else{
            console.log(err);
            res.send({ message: "Error" });
            res.end();
          }
        } else {
          res.send({ message: "Success" });
          res.end();
        }
      }
    );
  });

exports.index = router;
exports.apply = applyRouter;
