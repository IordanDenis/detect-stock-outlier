import path from "path"; // node.js path package to handle file paths
import fs from "fs"; // node.js file system package for file operations

// define the directory where uploaded files will be stored
export const uploadDirectory = path.join(process.cwd(), "uploads");

// function to sample 30 consecutive data points starting from a random timestamp within the file
export const consecutiveDataPointsFromRandomTimestamp = (data) => {
  if (data.length < 30) throw new Error("Not enough data points in the file");
  const startIndex = Math.floor(Math.random() * (data.length - 30)); // get random start index
  return data.slice(startIndex, startIndex + 30); // return 30 consecutive data points
};

// Ensure the upload directory exists before processing files
export const ensureUploadDirectoryExists = async () => {
  if (!fs.existsSync(uploadDirectory)) {
    await fs.promises.mkdir(uploadDirectory, { recursive: true });
  }
};
