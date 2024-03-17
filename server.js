const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const fss = require('fs-extra');

const app = express();
const PORT = process.env.PORT || 8000;
// Enable CORS
app.use(cors());
// Multer setup for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: function (req, file, cb) {
    // Keep original file name
    cb(null, file.originalname);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 10MB limit
});
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// POST endpoint for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }
    // Path to the uploaded file
    const filePath = req.file.path;
    // Extract repository link from request body
    const repository = req.body.repository;
    const qna = req.body.isQ;
    // Move the uploaded file to the repository directory
    // const moveCommand = `move "${filePath}" uploads\\"${req.file.originalname}"`;
    // await executeCommand(moveCommand);
    // Change directory to the repository
    const pathh = __dirname;
    process.chdir(path.join(__dirname, 'uploads'));
    console.log("dir is ",__dirname);
    
// Path to the directory where you want to clone the Git repository
const gitRepositoryPath = "RepoForTest4"; 
// Check if the directory exists
if (!fs.existsSync(gitRepositoryPath)) {
    // If the directory doesn't exist, clone the Git repository
    console.log("dir not exist");
    await executeCommand(`git clone https://github.com/ojaswi143/test ${gitRepositoryPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error cloning repository:', error);
            return;
        }
        console.log('Git repository cloned successfully.');
        // Now you can proceed with further operations like adding, committing, and pushing
    });
} else {
    // If the directory exists, change the working directory to the Git repository
    process.chdir(gitRepositoryPath);
    console.log(`Changed directory to ${gitRepositoryPath}`);
    // Now you can proceed with further operations like adding, committing, and pushing
}
    console.log("see the dir", __dirname);
    const sourceFileName = req.file.originalname;
    const sourcePath = path.join(__dirname, "uploads", sourceFileName);
    // Destination directory within the current directory
    const destinationDirName = 'RepoForTest4';
    const midFolder = (qna=='yes')?'testing1' : 'testing2';
    const destinationPath = path.join(__dirname, "uploads", destinationDirName, midFolder, sourceFileName);
    
    console.log("source ", sourcePath);
    console.log("qna here", qna);
    console.log("destination ", destinationPath);
    console.log("qna here", qna);
    
    fss.move(sourcePath, destinationPath, async (err) => {
        if (err) {
            console.error('Error moving file:', err);
            process.chdir(pathh);
            return res.status(500).send('Error moving file.');
        }
        console.log('File moved successfully.');
        // Change directory to the repository
        process.chdir(path.join(__dirname, 'uploads', destinationDirName));
        // Check if the directory exists
        if (!fs.existsSync('.git')) {
            // If the directory doesn't exist, initialize a new Git repository
            await executeCommand('git init');
            console.log('Initialized empty Git repository.');
        }
        // Add all files to the Git repository
        await executeCommand('git add .');
        // Check if there are changes to commit
        const status = await executeCommand('git status --porcelain');
        if (status.trim() === '') {
            // If there are no changes to commit, add a dummy commit
            await executeCommand('git commit --allow-empty -m "Dummy commit"');
        } else {
            // Commit changes
            await executeCommand('git commit -m "Add files"');
        }
        // Push changes to the remote repository
        await executeCommand('git push');
        console.log('Pushed changes to remote repository.');
        console.log("before :", process.cwd());
        process.chdir(pathh);
        console.log("after :", process.cwd())

        res.status(200).send('File uploaded successfully.');
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    process.chdir(pathh);
    res.status(500).send('Error uploading file.');
  }
});
// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
