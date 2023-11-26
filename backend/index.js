
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Import the path module
const stream = require('stream');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const dbUrl =
  'mongodb://dina:<your db password>@ac-9ruu58i-shard-00-00.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-01.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-02.u74yfnc.mongodb.net:27017/Jobboard?ssl=true&replicaSet=atlas-k42jhx-shard-0&authSource=admin&retryWrites=true&w=majority';
//use your own db.
const connectionp = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbUrl, connectionp);

const db = mongoose.connection;

db.on('error', () => console.log('error in connecting'));
db.once('open', () => console.log('connected successfully'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'../public','index.html'));
});
app.listen(3000, () => {
    console.log('Listening on port 3000');
  });

  const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const jobApplicationSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    qualification: String,
    resume: {
      fileName: String,
      fileData: Buffer,
    },
    verificationToken: String,
  });
  
const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

const jobPostSchema = new mongoose.Schema({
  fullName: String,
  companyName: String,
  email: String,
  password: String,
  verificationToken: String,
});

const JobPost = mongoose.model('JobPost', jobPostSchema);

  
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'careerconnect2521@gmail.com',
    pass: '<your email password>',
  },
  });
  

  const frontendURL = 'https://careerconnect-qzj0.onrender.com';

  app.post('/uploadjob', upload.single('resume'), async (req, res) => {
    const { fullName, email, password, qualification } = req.body;
    const resumeFile = req.file;
  
    if (!resumeFile) {
      return res.status(400).send('No resume file uploaded.');
    }
    const existingUser = await JobPost.findOne({ email });
    const myexist = await JobApplication.findOne({ email});

    if(myexist){
      return res.status(400).send('User with this email already exists');
    }

    if (existingUser) {
      return res.status(400).send('User with this email already exists.');
    }
  
    const verificationToken = crypto.randomBytes(20).toString('hex');
  
    const newJobApplication = new JobApplication({
      fullName,
      email,
      password,
      qualification,
      resume: {
        fileName: resumeFile.originalname,
        fileData: resumeFile.buffer,
      },
      verificationToken,
    });
  
    try {
      const savedJobApplication = await newJobApplication.save();
  
      const mailOptions = {
        from: 'careerconnect2521@gmail.com',
        to: email,
        subject: 'Email Verification for Career Connect',
        html: `
        <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification for Career Connect</title>
      <style>
        body {
          width: 100%;
          background-color: #e6dddd;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        h3, p {
          color: #333;
        }

        h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }

        p {
          font-size: 16px;
          margin-bottom: 20px;
        }

        p:last-child {
          margin-bottom: 0;
        }

        a {
          color: #007BFF;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <h3>Dear ${fullName},</h3>
      <p>Welcome to Career Connect!</p>
      <p>To get started, please click the button below to verify your email:</p>
      <a href="${frontendURL}/verification.html?token=${verificationToken}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; font-size: 16px; border-radius: 5px; margin-top: 20px;">Verify Email</a>
      <p>If the button above doesn't work, you can also manually verify your email by copying and pasting the following link into your browser:</p>
      <p><a href="${frontendURL}/verification.html?token=${verificationToken}" style="color: #007BFF; text-decoration: none;">${frontendURL}/verify?token=${verificationToken}</a></p>
      <p>Thank you for joining Career Connect! If you have any questions or need assistance, feel free to contact us.</p>
      <p>Best regards,<br/>The Career Connect Team</p>
    </body>
    </html>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  
      res.status(200).send('Job application submitted successfully. Verification email sent.');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving job application to database.');
    }
  });

  app.post('/postjob', upload.none(), async (req, res) => {
    const { fullName, companyName, email, password } = req.body;
  
    const existingUser = await JobPost.findOne({ email });
    const myexist = await JobApplication.findOne({ email});

    if(myexist){
      return res.status(400).send('User with this email already exists');
    }

    if (existingUser) {
      return res.status(400).send('User with this email already exists.');
    }
  
    const verificationToken = crypto.randomBytes(20).toString('hex');
  
    const newJobPost = new JobPost({
      fullName,
      companyName,
      email,
      password,
      verificationToken,
    });
  
    try {
      const savedJobPost = await newJobPost.save();
  
      const mailOptions = {
        from: 'careerconnect2521@gmail.com',
        to: email,
        subject: 'Email Verification for Career Connect',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification for Career Connect</title>
        </head>
        <body>
          <div style="width: 100%; background-color: #f2f2f2; padding: 20px;">
            <h1 style="color: #333;">Email Verification for Career Connect</h1>
            <p style="color: #555; font-size: 18px;">Hello there,</p>
            <p style="color: #555; font-size: 17px;">Welcome to Career Connect! To get started, please click the button below to verify your email:</p>
            <a href="${frontendURL}/verification.html?token=${verificationToken}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; font-size: 16px; border-radius: 5px; margin-top: 20px;">Verify Email</a>
            <p style="color: #555; font-size: 17px; margin-top: 20px;">If the button above doesn't work, you can also manually verify your email by copying and pasting the following link into your browser:</p>
            <p style="color: #555; font-size: 18px;"><a href="${frontendURL}/verification.html?token=${verificationToken}" style="color: #007BFF; text-decoration: none;">${frontendURL}/verify?token=${verificationToken}</a></p>
            <p style="color: #555; font-size: 18px;">Thank you for joining Career Connect! If you have any questions or need assistance, feel free to contact us.</p>
            <p style="color: #555; font-size: 17px;">Best regards,<br/>The Career Connect Team</p>
            <p style="color: #555; font-size: 15px;">Best regards,<br/>The Career Connect Team</p>
          </div>
        </body>
        </html>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  
      res.status(200).send('Job post submitted successfully. Verification email sent.');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving job post to the database.');
    }
  });

  let loggedInUser = {};



  app.post('/login', upload.none(), async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const jobAppUser = await JobApplication.findOne({ email, password });
      if (jobAppUser) {
        if (!jobAppUser.verificationToken) {
          return res.status(401).json({ error: 'User not verified. Please check your email for verification.' });
        }
        
        loggedInUser = {
          name: jobAppUser.fullName,
          email: jobAppUser.email
      };

        res.status(200).json({value:'Candidate',email:jobAppUser.email});
        return;
      }
  
      const jobPostUser = await JobPost.findOne({ email, password });
      if (jobPostUser) {
        if (!jobPostUser.verificationToken) {
        return res.status(401).json({ error: 'User not verified. Please check your email for verification.' });
        }
        loggedInUser = {
          name: jobPostUser.fullName,
          email: jobPostUser.email,
          company: jobPostUser.companyName
      };
        
        res.status(200).json({ value: 'Employee', email: jobPostUser.email });
        return;
      }
  
      res.status(401).json({ error: 'Invalid credentials.' });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error during login.' });
    }
  });


app.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  const cand =await JobApplication.findOne({email: email});
  if(!cand){
    const emp =await JobPost.findOne({email: email});
    if(!emp){
      return res.status(200).json("No user Found");
    }
    if (emp.verificationToken === "true") {
      return res.status(200).json("Already verified");
    } else if (emp.verificationToken === code) {
      emp.verificationToken = true;
      await emp.save();
      return res.status(200).json("success");
    } else {
      return res.status(200).json("Invalid Token");
    }    
  }
  else if(cand.verificationToken === "true"){
    return res.status(200).json("Already verified");
  }
  else{
    if(cand.verificationToken === code){
    cand.verificationToken = true;
    await cand.save();
    return res.status(200).json("success");
    }else{
      return res.status(200).json("Invalid Token");
    }
  }

});

app.get('/getUserData',(req, res) => {
  var emailid = req.query.email;

  JobPost.findOne({email: emailid})
  .exec()
  .then((data) => {

    res.send(data);
  })
  .catch((error) => {
    res.status(500).send(error);
  });
});


const jobDetailsSchema = new mongoose.Schema({
  email: String,
  companyName:String,
  jobTitle:String,
  workplaceType:String,
  location:String,
  employmentType:String,
  jobDescription:String,
  requiredSkills:String,
  postedDate: { type: String,
    default: new Date().toLocaleDateString('en-GB') },
});

const postnewJob = mongoose.model('jobDetails',jobDetailsSchema);

app.post("/submitjobDetails", (req,res) => {
  const jobdata = req.body;

  const newjobdata = new postnewJob(jobdata);

  newjobdata.save()
  .then((result) => {
    res.send(loggedInUser.email);
  })
  .catch((error) => {
    return res.status(500).send();
  });
});


app.get('/getAllJobs', (req, res) => {
  postnewJob.find({})
    .sort({ _id: -1 }) 
    .exec()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send();
    });
});


const applicationDetailsSchema = new mongoose.Schema({
  userEmail: String,
  userName: String,
  jobId: String,
  coverLetter: String,
  appliedDate: { type: String,
    default: new Date().toLocaleDateString('en-GB') },
});

const ApplicationDetails = mongoose.model('ApplicationDetails', applicationDetailsSchema);

app.post("/submitjobApplications", upload.none(), async (req, res) => {
    const applicationdata = req.body;
    const userEmail = loggedInUser.email;

    const jobApplication = await JobApplication.findOne({ email: userEmail });

    const existingApplication = await ApplicationDetails.findOne({
      userEmail: userEmail,
      jobId: applicationdata.jobId,
    });

    if (existingApplication) {
      return res.send("Already Applied for this job");
    }

      const newappdet = new ApplicationDetails({
      userEmail: userEmail,
      userName: jobApplication.fullName,
      jobId: applicationdata.jobId,
      coverLetter: applicationdata.coverLetter
    });

    

    newappdet.save()
    .then((result) => {
      const mailOptions = {
        from: 'careerconnect2521@gmail.com',
        to: userEmail,
        subject: 'Job Application Submission',
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Job Application Submitted</title>
          <style>
            body {
              width: 100%;
              background-color: #e6dddd;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
      
            h3, p {
              color: #333;
            }
      
            h3 {
              font-size: 18px;
              margin-bottom: 10px;
            }
      
            p {
              font-size: 16px;
              margin-bottom: 20px;
            }
      
            p:last-child {
              margin-bottom: 0;
            }
          </style>
        </head>
        <body>
          <h3>Dear ${jobApplication.fullName},</h3>
          <p>Thank you for submitting your job application through our website. We appreciate your interest in the "${applicationdata.jobTitle}" position at ${applicationdata.companyName}.</p>
          <p>Your application has been successfully received and will be forwarded to the hiring manager for their review. They will be in touch with you soon to let you know next steps.</p>
          <p>In the meantime, please feel free to browse our website to find more job opportunities that match your skills and interests. You can also create a profile to receive personalized job recommendations and stay up-to-date on the latest job openings.</p>
          <p>Thank you again for using our website to find your next job. We wish you the best of luck in your job search.</p>
          <p>Sincerely,<br/>The CareerConnect Team</p>
        </body>
        </html>
      `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  
      res.send("Application submitted successfully");
    })
  
    .catch((error) => {
      return res.status(500).send();
    });
  
});


app.get('/getAllapplication', (req, res) => {

  const userEmail = loggedInUser.email;

  const alldetails = [];
  var i=1;
  var x =0;

  ApplicationDetails.find({userEmail : userEmail})
  .sort({ _id: -1 })
  .exec()
  .then((data) => {

    let count = 0;
    if(data.length === 0){
      res.status(200).json({ message: "No Records found" });
        }
    data.forEach((adata)=>{
      const ajobid = adata.jobId;

      postnewJob.findOne({_id : ajobid})
      .exec()
      .then((jdata) => {
            if(jdata){

              const dispdata={
                appliedDate : adata.appliedDate,
                coverLetter :adata.coverLetter,
                cname: jdata.companyName,
                jtitle: jdata.jobTitle,
                jdesc: jdata.jobDescription,
                jlocation: jdata.location,
                jtype: jdata.workplaceType,
                jemptype: jdata.employmentType,
                jreq: jdata.requiredSkills,
                jid: jdata._id,
              };
              alldetails.push(dispdata);
            }
            count++;
            if (count === data.length) {
              res.status(200).json(alldetails);
            }
          })
          .catch((error) => {
          });
    });
  })
  .catch((error) => {
    res.status(500).send();
  });
});


app.post('/logout', (req, res) => {
  loggedInUser = {}; 
  res.send( 'Logout successful');
});



app.get('/getAllposts', (req, res) => {
  const myemail = loggedInUser.email;

  postnewJob.find({email: myemail})
    .sort({ _id: -1 }) 
    .exec()
    .then((data) => {
      // console.log(data);
      if(data.length === 0){
        res.status(200).json({ message: "No Records found" });
          }
      res.send(data);
    })
    .catch((error) => {
      res.status(500).send();
    });
});

app.get('/getDatails', async (req, res) => {
  const { jobid, email } = req.query;
  // console.log(`my job id`,jobid);

      const jobDetails = await postnewJob.findOne({ _id: jobid, email: email });

      if (jobDetails) {
        res.send(jobDetails);
      } else {
          res.status(404).json({ error: 'Job details not found.' });
      }
  
});


app.get('/getapplicants', (req, res) => {
  const { jobsid, memail } = req.query; 
  const cappdata = [];
  let count = 0;

ApplicationDetails.find({jobId : jobsid})
.sort({ _id: -1 })
.exec()
.then((data) => {
  console.log(data);
  if(data.length === 0){
    res.status(200).json("No Records found");
  }
      data.forEach((applidata) => {
        JobApplication.findOne({email : applidata.userEmail})
        .exec()
        .then((userdata)=>{

          const displaydata = {
              coverletter : applidata.coverLetter,
              appdate : applidata.appliedDate,

              username: userdata.fullName,
              useremail : userdata.email,
              userqualification: userdata.qualification,
              useresume : userdata.resume,
              userbase : userdata.resume.fileData.toString('base64'),
          };

          cappdata.push(displaydata);
          count++;
            if (count === data.length) {
              res.status(200).json(cappdata);
            }
        });
      })
    });

});



app.get('/deleteJob', async (req, res) => {
  const { jobsid, memail } = req.query; 
  // console.log(`I got this id:`, jobsid);

  try {
    const deletedJob = await postnewJob.findOneAndDelete({ _id: jobsid, email: memail });

    if (!deletedJob) {
      res.status(200).json("No details found");
      return;
    }
    await ApplicationDetails.deleteMany({ jobId: jobsid });
    res.status(200).json('Job post deleted successfully.');
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json('Internal server error.');
  }
});


app.get('/deleteAppliedJob', async (req, res) => {
  const { deljobId, memail } = req.query; 
  console.log(deljobId,memail);
  try {
    const deletedJob = await ApplicationDetails.findOneAndDelete({jobId: deljobId,userEmail: memail});
    if (!deletedJob) {
      res.status(200).json("No details found");
      return;
    }
    res.status(200).json('Applied job deleted successfully.');
  } catch (error) {
    console.error('Error deleting applied job:', error);
    res.status(500).json('Internal server error.');
  }
});
