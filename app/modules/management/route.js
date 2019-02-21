let express = require("express");
let router = express.Router();
let managementRouter = express.Router();
let authMiddleware = require("../auth/middleware");
let db = require("../../lib/database")();
let moment = require("moment");
let nodemailer = require("nodemailer");
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

managementRouter.use(authMiddleware.noAuthed);

//Management Technician Evaluation
managementRouter
  .get("/technician/evaluation", (req, res) => {
    console.log("--Technician Evaluation--");

    let evaluationQuery = `SELECT * FROM tbl_technician WHERE strHiredStatus = "Evaluation"`;
    db.query(evaluationQuery, (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else {
        console.log(results);
        res.render("management/views/technicianevaluation", {
          technicians: results
        });
      }
    });
  })

  .post("/technician/information", (req, res) => {
    console.log("--Technician Information--");
    let intTechnicianID = req.body.intTechnicianID;
    let informationQuery = `SELECT * FROM tbl_technician WHERE intTechnicianID = ?`;
    db.query(informationQuery, [intTechnicianID], (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else {
        if (results.length > 0) {
          console.log(results[0]);
          results[0].datTechnicianBirthday = moment(
            results[0].datTechnicianBirthday
          ).format("MMMM Mo, YYYY");
          res.send({ technician: results[0], message: "Success" });
          res.end();
        } else {
          console.log("Error: No Record Found!");
          res.send({ message: "Error" });
          res.end();
        }
      }
    });
  })
  .post("/technician/reject", (req, res) => {
    console.log("--Technician Rejection--");
    let intTechnicianID = req.body.intTechnicianID;
    let rejectionQuery = `UPDATE tbl_technician SET strHiredStatus = "Reject" WHERE intTechnicianID = ?`;
    db.query(rejectionQuery, [intTechnicianID], (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else {
        res.send({ message: "Success" });
        res.end();
      }
    });
  })
  .post("/technician/scheduled", (req, res) => {
    console.log("--Technician Schedule--");
    let intTechnicianID = req.body.intTechnicianID;
    let datScheduleDate = req.body.datScheduleDate;
    let emailScheduleDate = moment(datScheduleDate).format(
      "MMMM DD, YYYY hh:mm a"
    );
    let scheduleQuery = `UPDATE tbl_technician SET strHiredStatus = "Schedule" WHERE intTechnicianID = ?`;
    db.query(scheduleQuery, [intTechnicianID], (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else {
        let setQuery = `INSERT INTO tbl_technicianschedule(intScheduleTechnicianID, datScheduleDate, strScheduleConfirmation) VALUES (?, ?, ?); INSERT INTO tbl_technicianrequirements (intTRTechnicianID) VALUES (?)`;
        db.query(
          setQuery,
          [intTechnicianID, new Date(datScheduleDate), "Waiting", intTechnicianID],
          (err, results, field) => {
            if (err) {
              console.log(err);
              res.send("Database Problem. See problem in the console.");
              res.end();
            } else {
              let mailQuery = `SELECT * FROM tbl_technician WHERE intTechnicianID = ?`;
              db.query(mailQuery, [intTechnicianID], (err, results, field) => {
                if (err) {
                  console.log(err);
                  res.send("Database Problem. See problem in the console.");
                  res.end();
                } else {
                  var requirementHTML = "";
                  let emailAddress = results[0].strTechnicianEmail;
                  let technicianInfo = results[0];
                  // woah
                  let requirementQuery = `SHOW COLUMNS FROM tbl_technicianrequirements;`;
                  db.query(requirementQuery, (err, results, field) => {
                    if (err) {
                      console.log(err);
                      res.send("Database Problem. See problem in the console.");
                      res.end();
                    } else if (results.length > 0) {
                      var requirementFields = results;

                      var c = 0;
                      for (let x = 0; x < requirementFields.length; x++) {
                        c++;

                        let FieldQuery = `SELECT * FROM tbl_requirementdescription WHERE strField = ?`;
                        db.query(
                          FieldQuery,
                          [requirementFields[x].Field],
                          (err, results, field) => {
                            if (err) {
                              console.log(err);
                              res.send(
                                "Database Problem. See problem in the console."
                              );
                              res.end();
                            } else {
                              if (results.length > 0) {
                                requirementHTML =
                                  requirementHTML +
                                  `<p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center"><strong>• ${
                                    results[0].strFieldDescription
                                  }</strong></p>`;
                              }

                              if (x === c - 1) {
                                console.log(requirementFields);

                                console.log(emailAddress);
                                mailOptions = {
                                  from: '"CSMS Team" <contact@csms.com>', // sender address
                                  to: emailAddress,
                                  subject: `You are now scheduled for interview!`, // Subject line
                                  html: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
                                <!--[if gte mso 9]><xml>
                                <o:OfficeDocumentSettings>
                                  <o:AllowPNG/>
                                  <o:PixelsPerInch>96</o:PixelsPerInch>
                                </o:OfficeDocumentSettings>
                                </xml><![endif]-->
                                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                                <meta name="viewport" content="width=device-width">
                                <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
                                <title></title>
                                
                                
                                <style type="text/css" id="media-query">
                                  body {
                              margin: 0;
                              padding: 0; }
                            
                            table, tr, td {
                              vertical-align: top;
                              border-collapse: collapse; }
                            
                            .ie-browser table, .mso-container table {
                              table-layout: fixed; }
                            
                            * {
                              line-height: inherit; }
                            
                            a[x-apple-data-detectors=true] {
                              color: inherit !important;
                              text-decoration: none !important; }
                            
                            [owa] .img-container div, [owa] .img-container button {
                              display: block !important; }
                            
                            [owa] .fullwidth button {
                              width: 100% !important; }
                            
                            [owa] .block-grid .col {
                              display: table-cell;
                              float: none !important;
                              vertical-align: top; }
                            
                            .ie-browser .num12, .ie-browser .block-grid, [owa] .num12, [owa] .block-grid {
                              width: 500px !important; }
                            
                            .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
                              line-height: 100%; }
                            
                            .ie-browser .mixed-two-up .num4, [owa] .mixed-two-up .num4 {
                              width: 164px !important; }
                            
                            .ie-browser .mixed-two-up .num8, [owa] .mixed-two-up .num8 {
                              width: 328px !important; }
                            
                            .ie-browser .block-grid.two-up .col, [owa] .block-grid.two-up .col {
                              width: 250px !important; }
                            
                            .ie-browser .block-grid.three-up .col, [owa] .block-grid.three-up .col {
                              width: 166px !important; }
                            
                            .ie-browser .block-grid.four-up .col, [owa] .block-grid.four-up .col {
                              width: 125px !important; }
                            
                            .ie-browser .block-grid.five-up .col, [owa] .block-grid.five-up .col {
                              width: 100px !important; }
                            
                            .ie-browser .block-grid.six-up .col, [owa] .block-grid.six-up .col {
                              width: 83px !important; }
                            
                            .ie-browser .block-grid.seven-up .col, [owa] .block-grid.seven-up .col {
                              width: 71px !important; }
                            
                            .ie-browser .block-grid.eight-up .col, [owa] .block-grid.eight-up .col {
                              width: 62px !important; }
                            
                            .ie-browser .block-grid.nine-up .col, [owa] .block-grid.nine-up .col {
                              width: 55px !important; }
                            
                            .ie-browser .block-grid.ten-up .col, [owa] .block-grid.ten-up .col {
                              width: 50px !important; }
                            
                            .ie-browser .block-grid.eleven-up .col, [owa] .block-grid.eleven-up .col {
                              width: 45px !important; }
                            
                            .ie-browser .block-grid.twelve-up .col, [owa] .block-grid.twelve-up .col {
                              width: 41px !important; }
                            
                            @media only screen and (min-width: 520px) {
                              .block-grid {
                                width: 500px !important; }
                              .block-grid .col {
                                vertical-align: top; }
                                .block-grid .col.num12 {
                                  width: 500px !important; }
                              .block-grid.mixed-two-up .col.num4 {
                                width: 164px !important; }
                              .block-grid.mixed-two-up .col.num8 {
                                width: 328px !important; }
                              .block-grid.two-up .col {
                                width: 250px !important; }
                              .block-grid.three-up .col {
                                width: 166px !important; }
                              .block-grid.four-up .col {
                                width: 125px !important; }
                              .block-grid.five-up .col {
                                width: 100px !important; }
                              .block-grid.six-up .col {
                                width: 83px !important; }
                              .block-grid.seven-up .col {
                                width: 71px !important; }
                              .block-grid.eight-up .col {
                                width: 62px !important; }
                              .block-grid.nine-up .col {
                                width: 55px !important; }
                              .block-grid.ten-up .col {
                                width: 50px !important; }
                              .block-grid.eleven-up .col {
                                width: 45px !important; }
                              .block-grid.twelve-up .col {
                                width: 41px !important; } }
                            
                            @media (max-width: 520px) {
                              .block-grid, .col {
                                min-width: 320px !important;
                                max-width: 100% !important;
                                display: block !important; }
                              .block-grid {
                                width: calc(100% - 40px) !important; }
                              .col {
                                width: 100% !important; }
                                .col > div {
                                  margin: 0 auto; }
                              img.fullwidth, img.fullwidthOnMobile {
                                max-width: 100% !important; }
                              .no-stack .col {
                                min-width: 0 !important;
                                display: table-cell !important; }
                              .no-stack.two-up .col {
                                width: 50% !important; }
                              .no-stack.mixed-two-up .col.num4 {
                                width: 33% !important; }
                              .no-stack.mixed-two-up .col.num8 {
                                width: 66% !important; }
                              .no-stack.three-up .col.num4 {
                                width: 33% !important; }
                              .no-stack.four-up .col.num3 {
                                width: 25% !important; }
                              .mobile_hide {
                                min-height: 0px;
                                max-height: 0px;
                                max-width: 0px;
                                display: none;
                                overflow: hidden;
                                font-size: 0px; } }
                            
                                </style>
                            </head>
                            <body class="clean-body" style="margin: 0;padding: 0;-webkit-text-size-adjust: 100%;background-color: #FFFFFF">
                              <style type="text/css" id="media-query-bodytag">
                                @media (max-width: 520px) {
                                  .block-grid {
                                    min-width: 320px!important;
                                    max-width: 100%!important;
                                    width: 100%!important;
                                    display: block!important;
                                  }
                            
                                  .col {
                                    min-width: 320px!important;
                                    max-width: 100%!important;
                                    width: 100%!important;
                                    display: block!important;
                                  }
                            
                                    .col > div {
                                      margin: 0 auto;
                                    }
                            
                                  img.fullwidth {
                                    max-width: 100%!important;
                                  }
                                  img.fullwidthOnMobile {
                                    max-width: 100%!important;
                                  }
                                  .no-stack .col {
                                    min-width: 0!important;
                                    display: table-cell!important;
                                  }
                                  .no-stack.two-up .col {
                                    width: 50%!important;
                                  }
                                  .no-stack.mixed-two-up .col.num4 {
                                    width: 33%!important;
                                  }
                                  .no-stack.mixed-two-up .col.num8 {
                                    width: 66%!important;
                                  }
                                  .no-stack.three-up .col.num4 {
                                    width: 33%!important;
                                  }
                                  .no-stack.four-up .col.num3 {
                                    width: 25%!important;
                                  }
                                  .mobile_hide {
                                    min-height: 0px!important;
                                    max-height: 0px!important;
                                    max-width: 0px!important;
                                    display: none!important;
                                    overflow: hidden!important;
                                    font-size: 0px!important;
                                  }
                                }
                              </style>
                              <!--[if IE]><div class="ie-browser"><![endif]-->
                              <!--[if mso]><div class="mso-container"><![endif]-->
                              <table class="nl-container" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #FFFFFF;width: 100%" cellpadding="0" cellspacing="0">
                              <tbody>
                              <tr style="vertical-align: top">
                                <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #FFFFFF;"><![endif]-->
                            
                                <div style="background-color:#2C2D37;">
                                  <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid two-up ">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#2C2D37;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->
                            
                                          <!--[if (mso)|(IE)]><td align="center" width="250" style=" width:250px; padding-right: 0px; padding-left: 0px; padding-top:20px; padding-bottom:5px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="col num6" style="max-width: 320px;min-width: 250px;display: table-cell;vertical-align: top;">
                                          <div style="background-color: transparent; width: 100% !important;">
                                          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:20px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->
                            
                                              
                                                <div align="center" class="img-container center  autowidth  " style="padding-right: 0px;  padding-left: 0px;">
                            <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px;line-height:0px;"><td style="padding-right: 0px; padding-left: 0px;" align="center"><![endif]-->
                              <a href="https://beefree.io" target="_blank">
                                <img class="center  autowidth " align="center" border="0" src="images/new_logo_hackister.png" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;width: 100%;max-width: 191px" width="191">
                              </a>
                            <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                            
                                              
                                          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
                                          </div>
                                        </div>
                                          <!--[if (mso)|(IE)]></td><td align="center" width="250" style=" width:250px; padding-right: 0px; padding-left: 0px; padding-top:20px; padding-bottom:20px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="col num6" style="max-width: 320px;min-width: 250px;display: table-cell;vertical-align: top;">
                                          <div style="background-color: transparent; width: 100% !important;">
                                          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:20px; padding-bottom:20px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->
                            
                                              
                                                <div class="">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 20px;"><![endif]-->
                              <div style="color:#FFFFFF;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 20px;">	
                                <div style="font-size:12px;line-height:18px;color:#FFFFFF;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><div style="text-align: right; line-height:18px; font-size:12px;"><strong><span style="font-size: 16px; line-height: 24px;">TOP ONE COMPUTER SERVICES</span></strong></div></div>	
                              </div>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                                              
                                          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
                                          </div>
                                        </div>
                                      <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                    </div>
                                  </div>
                                </div>
                                <div style="background-color:#323341;">
                                  <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#323341;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->
                            
                                          <!--[if (mso)|(IE)]><td align="center" width="500" style=" width:500px; padding-right: 0px; padding-left: 0px; padding-top:0px; padding-bottom:0px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="col num12" style="min-width: 320px;max-width: 500px;display: table-cell;vertical-align: top;">
                                          <div style="background-color: transparent; width: 100% !important;">
                                          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:0px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->
                            
                                              
                                                
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider " style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <tbody>
                                    <tr style="vertical-align: top">
                                        <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-bottom: 10px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                            <table class="divider_content" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 10px solid transparent;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span></span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                                              
                                              
                                                <div class="">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 30px; padding-bottom: 30px;"><![endif]-->
                              <div style="color:#ffffff;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;line-height:120%; padding-right: 0px; padding-left: 0px; padding-top: 30px; padding-bottom: 30px;">	
                                <div style="font-size:12px;line-height:14px;color:#ffffff;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px;text-align: center"><strong><span style="font-size: 28px; line-height: 33px;">Hello, ${
                                  technicianInfo.strTechnicianFirstName
                                }!</span></strong></p></div>	
                              </div>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                                              
                                              
                                                
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider " style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <tbody>
                                    <tr style="vertical-align: top">
                                        <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-bottom: 10px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                            <table class="divider_content" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 10px solid transparent;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span></span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                                              
                                              
                                                <div align="center" class="img-container center  autowidth  " style="padding-right: 0px;  padding-left: 0px;">
                            <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px;line-height:0px;"><td style="padding-right: 0px; padding-left: 0px;" align="center"><![endif]-->
                              <a href="https://beefree.io" target="_blank">
                                <img class="center  autowidth " align="center" border="0" src="https://ibb.co/2ZPjpDf" alt="Image" title="Image" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;width: 100%;max-width: 402px" width="402">
                              </a>
                            <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                            
                                              
                                          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
                                          </div>
                                        </div>
                                      <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                    </div>
                                  </div>
                                </div>
                                <div style="background-color:#61626F;">
                                  <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#61626F;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->
                            
                                          <!--[if (mso)|(IE)]><td align="center" width="500" style=" width:500px; padding-right: 0px; padding-left: 0px; padding-top:30px; padding-bottom:30px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="col num12" style="min-width: 320px;max-width: 500px;display: table-cell;vertical-align: top;">
                                          <div style="background-color: transparent; width: 100% !important;">
                                          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:30px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->
                            
                                              
                                                <div class="">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 25px; padding-bottom: 10px;"><![endif]-->
                              <div style="color:#ffffff;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;line-height:120%; padding-right: 10px; padding-left: 10px; padding-top: 25px; padding-bottom: 10px;">	
                                <div style="line-height:14px;font-size:12px;color:#ffffff;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;line-height: 14px;text-align: center;font-size: 12px"><span style="font-size: 24px; line-height: 28px;"><strong>${emailScheduleDate}</strong></span></p></div>	
                              </div>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                                              
                                              
                                                <div class="">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 0px; padding-bottom: 10px;"><![endif]-->
                              <div style="color:#B8B8C0;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 0px; padding-bottom: 10px;">	
                              <div style="font-size:12px;line-height:18px;color:#B8B8C0;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Congratulations! Your application has been approved. You are scheduled for an interview. Prepare the ff:</p>${requirementHTML}<p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">Our site is located in <strong>Lot 21 Block 13, 13th Avenue, Suburbia East Subd., Parang, Marikina City.</strong> See you!</p><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">&#160;</p></div>	
                              </div>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                                              
                                              
                                                
                            <div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:15px; padding-bottom:10px;">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top:15px; padding-bottom:10px;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="" style="height:31pt; v-text-anchor:middle; width:94pt;" arcsize="60%" strokecolor="#C7702E" fillcolor="#C7702E"><w:anchorlock/><v:textbox inset="0,0,0,0"><center style="color:#ffffff; font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size:16px;"><![endif]-->
                                <div style="color: #ffffff; background-color: #C7702E; border-radius: 25px; -webkit-border-radius: 25px; -moz-border-radius: 25px; max-width: 460px; width: 25%; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 5px; padding-right: 20px; padding-bottom: 5px; padding-left: 20px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; text-align: center; mso-border-alt: none;">
                                  <span style="font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;font-size:16px;line-height:32px;"><span style="font-size: 14px;">Show more</span></span>
                                </div>
                              <!--[if mso]></center></v:textbox></v:roundrect></td></tr></table><![endif]-->
                            </div>
                            
                                              
                                              
                                                
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="divider " style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 100%;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <tbody>
                                    <tr style="vertical-align: top">
                                        <td class="divider_inner" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;padding-right: 10px;padding-left: 10px;padding-top: 10px;padding-bottom: 10px;min-width: 100%;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                            <table class="divider_content" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 0px solid transparent;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                <tbody>
                                                    <tr style="vertical-align: top">
                                                        <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                                            <span></span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                                              
                                          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
                                          </div>
                                        </div>
                                      <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                    </div>
                                  </div>
                                </div>
                                <div style="background-color:#ffffff;">
                                  <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
                                    <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                                      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#ffffff;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->
                            
                                          <!--[if (mso)|(IE)]><td align="center" width="500" style=" width:500px; padding-right: 0px; padding-left: 0px; padding-top:30px; padding-bottom:30px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
                                        <div class="col num12" style="min-width: 320px;max-width: 500px;display: table-cell;vertical-align: top;">
                                          <div style="background-color: transparent; width: 100% !important;">
                                          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:30px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->
                            
                                              
                                                
                            <div align="center" style="padding-right: 10px; padding-left: 10px; padding-bottom: 10px;" class="">
                              <div style="line-height:10px;font-size:1px">&#160;</div>
                              <div style="display: table; max-width:151px;">
                              <!--[if (mso)|(IE)]><table width="131" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-collapse:collapse; padding-right: 10px; padding-left: 10px; padding-bottom: 10px;"  align="center"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; mso-table-lspace: 0pt;mso-table-rspace: 0pt; width:131px;"><tr><td width="32" style="width:32px; padding-right: 5px;" valign="top"><![endif]-->
                                <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
                                  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                    <a href="https://www.facebook.com/" title="Facebook" target="_blank">
                                      <img src="images/facebook.png" alt="Facebook" title="Facebook" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                    </a>
                                  </td></tr>
                                </tbody></table>
                                  <!--[if (mso)|(IE)]></td><td width="32" style="width:32px; padding-right: 5px;" valign="top"><![endif]-->
                                <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 5px">
                                  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                    <a href="http://twitter.com/" title="Twitter" target="_blank">
                                      <img src="images/twitter.png" alt="Twitter" title="Twitter" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                    </a>
                                  </td></tr>
                                </tbody></table>
                                  <!--[if (mso)|(IE)]></td><td width="32" style="width:32px; padding-right: 0;" valign="top"><![endif]-->
                                <table align="left" border="0" cellspacing="0" cellpadding="0" width="32" height="32" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;Margin-right: 0">
                                  <tbody><tr style="vertical-align: top"><td align="left" valign="middle" style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
                                    <a href="http://plus.google.com/" title="Google+" target="_blank">
                                      <img src="images/googleplus.png" alt="Google+" title="Google+" width="32" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: none;height: auto;float: none;max-width: 32px !important">
                                    </a>
                                  </td></tr>
                                </tbody></table>
                                <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                              </div>
                            </div>
                                              
                                              
                                                <div class="">
                              <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 15px; padding-bottom: 10px;"><![endif]-->
                              <div style="color:#959595;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;line-height:150%; padding-right: 10px; padding-left: 10px; padding-top: 15px; padding-bottom: 10px;">	
                                <div style="font-size:12px;line-height:18px;color:#959595;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px;text-align: center">.TOP ONE COMPUTER SERVICES 2019</p></div>	
                              </div>
                              <!--[if mso]></td></tr></table><![endif]-->
                            </div>
                                              
                                          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
                                          </div>
                                        </div>
                                      <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
                                    </div>
                                  </div>
                                </div>
                              <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
                                </td>
                              </tr>
                              </tbody>
                              </table>
                              <!--[if (mso)|(IE)]></div><![endif]-->
                            
                            
                            </body></html>`
                                };

                                //Nodemailer
                                nodemailer.createTestAccount((err, account) => {
                                  // create reusable transporter object using the default SMTP transport
                                  let transporter = nodemailer.createTransport({
                                    host: "smtp.gmail.com.",
                                    port: 587,
                                    secure: false, // true for 465, false for other ports
                                    auth: {
                                      user: "suyoteam@gmail.com",
                                      pass: "froyefritzkobisherwin"
                                    }
                                  });

                                  // send mail with defined transport object
                                  transporter.sendMail(
                                    mailOptions,
                                    (error, info) => {
                                      if (error) {
                                        console.log(error);
                                        res.send({ message: "Error" });
                                        res.end();
                                      }
                                      console.log(
                                        "Message sent: %s",
                                        info.messageId
                                      );
                                      // Preview only available when sending through an Ethereal account
                                      console.log(
                                        "Preview URL: %s",
                                        nodemailer.getTestMessageUrl(info)
                                      );
                                      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                                      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
                                      res.send({ message: "Success" });
                                      res.end();
                                    }
                                  );
                                });
                              }
                            }
                          }
                        );
                      }
                    }
                  });
                  // woah
                }
              });
            }
          }
        );
      }
    });
  });

// Management Technician Schedule
managementRouter
  .get("/technician/schedule", (req, res) => {
    console.log("--Technician Schedule--");

    let scheduleQuery = `SELECT * FROM tbl_technician JOIN tbl_technicianschedule ON intTechnicianID = intScheduleTechnicianID WHERE strHiredStatus = "Schedule" AND date(datScheduleDate) = CURDATE()`;
    db.query(scheduleQuery, (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else if (results.length > 0) {
        console.log(results);

        for (let i = 0; i < results.length; i++) {
          results[i].datScheduleDate = moment(
            results[i].datScheduleDate
          ).format("MMMM DD, YYYY hh:mm a");
          if (i === results.length - 1) {
            console.log(results);
            let technicians = results;
            let requirementQuery = 'SELECT * FROM tbl_requirementdescription';
            db.query(requirementQuery, (err, results, fields) => {
              if (err) {
                console.log(err);
                res.send("Database Problem. See problem in the console.");
                res.end();
              }
              else{
                  console.log('putaaaaaaaaaaaa')
                  res.render("management/views/technicianschedule", {
                    technicians: technicians,
                    requirements: results
                  });
              }
            })
            
          }
        }
      } else {
        let requirementQuery = 'SELECT * FROM tbl_requirementdescription';
        db.query(requirementQuery, (err, results, fields) => {
          if (err) {
            console.log(err);
            res.send("Database Problem. See problem in the console.");
            res.end();
          }
          else{
              console.log('putaaaaaaaaaaaa')
              res.render("management/views/technicianschedule", {
                technicians: [],
                requirements: results
              });
          }
        })
      }
    });
  })
  .get("/technician/schedules", (req, res) => {
    console.log("--Technician Schedules--");

    let scheduleQuery = `SELECT * FROM tbl_technician JOIN tbl_technicianschedule ON intTechnicianID = intScheduleTechnicianID WHERE strHiredStatus = "Schedule"`;
    db.query(scheduleQuery, (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else if (results.length > 0) {
        console.log(results);
        res.send({ schedules: results, message: "Success" });
        res.end();
      } else {
        res.send({ schedules: results, message: "Error" });
        res.end();
      }
    });
  })
  .post("/technician/date", (req, res) => {
    console.log("--Technician Date--");
    let dataDate = moment(req.body.dataDate).format("YYYY-MM-DD");
    console.log(dataDate, "wow");
    let scheduleQuery = `SELECT * FROM tbl_technician JOIN tbl_technicianschedule ON intTechnicianID = intScheduleTechnicianID WHERE strHiredStatus = "Schedule" AND date(datScheduleDate) = ?`;
    db.query(scheduleQuery, [dataDate], (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
          results[i].datScheduleDate = moment(
            new Date(results[i].datScheduleDate)
          ).format("MMMM DD, YYYY h:mm a");
          if (i === results.length - 1) {
            console.log(results);

            res.send({
              technicians: results,
              message: "Success"
            });
            res.end();
          }
        }
      } else {
        res.send({
          technicians: results,
          message: "Error"
        });
        res.end();
      }
    });
  });

// Management Technician Requirements
managementRouter
  .get("/technician/requirement", (req, res) => {
    console.log("--Technician Requirements--");

    let requirementQuery = `SHOW COLUMNS FROM tbl_technicianrequirements;`;
    db.query(requirementQuery, (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else if (results.length > 0) {
        var requirementFields = results;

        var c = 0;
        for (let x = 0; x < requirementFields.length; x++) {
          c++;

          let FieldQuery = `SELECT * FROM tbl_requirementdescription WHERE strField = ?`;
          db.query(
            FieldQuery,
            [requirementFields[x].Field],
            (err, results, field) => {
              if (err) {
                console.log(err);
                res.send("Database Problem. See problem in the console.");
                res.end();
              } else {
                if (results.length > 0) {
                  requirementFields[x]["Description"] =
                    results[0].strFieldDescription;
                } else {
                  requirementFields[x]["Description"] = "";
                }

                if (x === c - 1) {
                  console.log(requirementFields);
                  res.render("management/views/technicianrequirement", {
                    requirements: requirementFields
                  });
                }
              }
            }
          );
        }
      } else {
        res.render("management/views/technicianrequirement", {
          requirements: results
        });
      }
    });
  })
  .post("/technician/requirement", (req, res) => {
    console.log(req.body);
    console.log("--Post: Requirement--");

    let requirementJSON = req.body;
    let nullConvert = "";
    let uniqueConvert = "";
    if (requirementJSON.nullField == "true") {
      nullConvert = "NULL";
    } else {
      nullConvert = "NOT NULL";
    }

    if (requirementJSON.uniqueField == "true") {
      uniqueConvert = `, ADD UNIQUE INDEX ${
        requirementJSON.requirementField
      }_UNIQUE (${requirementJSON.requirementField} ASC) VISIBLE;`;
    } else {
      uniqueConvert = "";
    }

    let requirementQuery = `ALTER TABLE tbl_technicianrequirements ADD COLUMN ${requirementJSON.requirementField} ${requirementJSON.dataType} ${nullConvert} ${uniqueConvert} DEFAULT 0`;
    console.log(requirementQuery);
    db.query(requirementQuery, (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } else {
        let addReqQuery = `INSERT INTO tbl_requirementdescription (strField, strFieldDescription) VALUES (?, ?)`;
        db.query(
          addReqQuery,
          [requirementJSON.requirementField, requirementJSON.descriptionField],
          (err, results, field) => {
            if (err) {
              console.log(err);
              res.send("Database Problem. See problem in the console.");
              res.end();
            } else {
              res.send({ message: "Success" });
              res.end();
            }
          }
        );
      }
    });
  })

  .post("/technician/requirement/edit", (req, res) => {
    console.log("Post: Edit Requirement");

    let requirementName = req.body.requirementName;

    let editQuery = `SHOW COLUMNS FROM tbl_technicianrequirements LIKE ?`;
    db.query(editQuery, [requirementName], (err, results, field) => {
      if (err) {
        console.log(err);
        res.send("Database Problem. See problem in the console.");
        res.end();
      } 
      else {
        if (results) {
          let requirementInfo = results[0];
          let descriptionQuery = `SELECT * FROM tbl_requirementdescription WHERE strField = ?`;
          db.query(descriptionQuery, [requirementName], (err, results, field) => {
            if (err) {
              console.log(err);
              res.send("Database Problem. See problem in the console.");
              res.end();
            }
            else{
              if(results){
                res.send({ requirementInfo: requirementInfo, descriptionInfo: results[0].strFieldDescription, message: "Success" });
                res.end();
              }
              else{
                res.send({ message: "Error" });
                res.end();
              }
            }
          });
        } 
        else {
          res.send({ message: "Error" });
          res.end();
        }
      }
    });
  })
  .post('/technician/requirement/delete', (req, res) => {
    console.log('Post: Requirement Save Changes')

    let requirementField = req.body.requirementField;

    let dropQuery = `ALTER TABLE tbl_technicianrequirements DROP COLUMN ${requirementField}, DROP INDEX ${requirementField}_UNIQUE; DELETE FROM tbl_requirementdescription WHERE strField = '${requirementField}';`
    dbQuery(dropQuery)

    function dbQuery(dropQuery){
      db.query(dropQuery, [dropQuery], (err, results, field) => {
        if (err) {
          console.log(err);
          if(err.errno == 1091){
            let anotherDropQuery = `ALTER TABLE tbl_technicianrequirements DROP COLUMN ${requirementField}; DELETE FROM tbl_requirementdescription WHERE strField = '${requirementField}';` 
            dbQuery(anotherDropQuery);
          }
          else{
            res.send("Database Problem. See problem in the console.");
            res.end();
          }
        }
        else{
          res.send({message: 'Success'});
          res.end();
        }
      })
    }



  })
  .post('/technician/schedule/save', (req, res) => {
    console.log('Post: Save Requirements');

    let status = req.body.status;
    let checkBoxJSON = req.body.checkBoxJSON;
    let checkBoxArray = req.body.checkBoxArray
    let technicianID = req.body.technicianID

    let requirementQuery = `UPDATE tbl_technicianrequirements SET `
    for(var i = 0; i < checkBoxArray.length; i++){
      if(i != checkBoxArray.length - 1){
        requirementQuery = requirementQuery + `${checkBoxArray[i]} = ${checkBoxJSON[checkBoxArray[i]]}, `
      }
      else if( i == checkBoxArray.length - 1){
        requirementQuery = requirementQuery + `${checkBoxArray[i]} = ${checkBoxJSON[checkBoxArray[i]]} `

        requirementQuery = requirementQuery + 'WHERE intTRTechnicianID = ?';
        db.query(requirementQuery, [technicianID], (err, results, field) => {
          if (err) {
            console.log(err);
            res.send("Database Problem. See problem in the console.");
            res.end();
          }
          else{
            if(status == 'Hire'){
              let updateQuery = `UPDATE tbl_technician SET strHiredStatus = ? WHERE intTechnicianID = ?; UPDATE tbl_technicianschedule SET strScheduleConfirmation = ? WHERE intScheduleTechnicianID = ?`
              db.query(updateQuery, [status, technicianID, 'Attended', technicianID], (err, results, fields)=> {
                if (err) {
                  console.log(err);
                  res.send("Database Problem. See problem in the console.");
                  res.end();
                }
                else{
                  res.send({message: 'Success'})
                  res.end();
                }
              })
            }
            else{
              let updateQuery = `UPDATE tbl_technician SET strHiredStatus = ? WHERE intTechnicianID = ?; UPDATE tbl_technicianschedule SET strScheduleConfirmation = ? WHERE intScheduleTechnicianID = ?`
              db.query(updateQuery, ['Schedule', technicianID, status, technicianID], (err, results, fields)=> {
                if (err) {
                  console.log(err);
                  res.send("Database Problem. See problem in the console.");
                  res.end();
                }
                else{
                  res.send({message: 'Success'})
                  res.end();
                }
              })
            }

            
          }
        })
      }
    }

  })
  .post('/technician/requirement/check', (req, res) => {
    console.log('--Post: check--')
    let checkQuery = `SELECT * FROM tbl_technicianrequirements WHERE intTRTechnicianID = ?`
    db.query(checkQuery, [req.body.technicianID], (err, results, fields) => {
      if(err) console.log(err);
      res.send({checks: results, message:'Success'})
      res.end();
    })
  })

// Management Customer
managementRouter
  .get('/customer', (req, res) => {
    res.render('management/views/customer');
  })
  .post('/joborder', (req, res) => {
    console.log('Post: Job Order');

    let specsJSON = req.body;
    let specsQuery = `INSERT INTO tbl_joborder (strBrand, strSeries, strModel, strProcessor, strMemoryType, strCustomerName, strAddress, strInspectionDetail, strCode, strMemoryCapacity, strStorageCapacity) VALUES (?, ?, ? ,? ,? ,? ,? ,? ,? ,? ,?);`
    var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    db.query(specsQuery, [specsJSON.brandSelect, specsJSON.seriesSelect, specsJSON.modelSelect, specsJSON.processorID, specsJSON.memoryType, specsJSON.strCustFullName, specsJSON.strCustAddress, specsJSON.strInspection, code, specsJSON.memoryID, specsJSON.storageID], (err, results, fields) => {
      if(err) console.log(err);

      res.send({message: 'Success', jobOrderID: results.insertId});
      res.end();
    })
  })
  .get('/invoice/:jobOrderID', (req, res) => {
    let jobOrderID = req.params.jobOrderID;
    let joQuery = `SELECT * FROM tbl_joborder WHERE intJobOrderID = ?`
    db.query(joQuery, [jobOrderID], (err, results, fields) => {
      if( err ) console.log(err);

      res.render('management/views/invoice', {jobOrder: results[0]});
    })
  })
  .get('/landing', (req,res) => {
    res.render('management/views/landing');
  })
  .post('/device/information', (req, res) => {
    let strCode = req.body.strCode;
    let codeQuery = `SELECT * FROM tbl_joborder WHERE strCode = ?`;
    db.query(codeQuery, [strCode], (err, results, field) => {
      if(err) console.log(err);
      if(results.length > 0){
        console.log(results)
        res.send({message: 'Success', devices: results[0]});
        res.end();
      }
      else{
        res.send({message: 'Error'});
        res.end();
      }
    })
  })

exports.index = router;
exports.management = managementRouter;
