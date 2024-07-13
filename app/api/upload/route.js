import { NextResponse } from "next/server";
import fs from "fs"; // node.js file system package for file operations
import path from "path"; // node.js path package to handle file paths
import Papa from "papaparse"; // CSV parser
import { detectOutliers, writeOutliersToCSV } from "@/lib/detectOutlier";
import {
  consecutiveDataPointsFromRandomTimestamp,
  ensureUploadDirectoryExists,
  uploadDirectory,
} from "@/lib/utils";

// function to read a CSV file and parse the content
const readCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    // create a readable stream for the file
    const fileStream = fs.createReadStream(filePath);

    Papa.parse(fileStream, {
      header: false,
      complete: (results) => {
        if (!results.data.length) reject(new Error("CSV file is empty"));
        try {
          const data = results.data.map((row) => ({
            stock_id: row[0],
            timestamp: row[1],
            stock_price: parseFloat(row[2]), // convert stock price to float
          }));
          resolve(data);
        } catch (error) {
          reject(new Error("Invalid CSV format"));
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

// POST handler to process uploaded files.
export async function POST(req) {
  // ensure the upload directory exists
  await ensureUploadDirectoryExists();

  // parse form data from the request
  const formData = await req.formData();

  const files = formData.getAll("files");
  if (files.length === 0)
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

  // Check if the number of files is more than 2
  if (files.length > 2) {
    return NextResponse.json(
      { error: "You can upload a maximum of 2 files" },
      { status: 400 }
    );
  }

  const outlierFiles = [];

  for (const file of files) {
    try {
      // define the path to save the file
      const filePath = path.join(uploadDirectory, file.name);

      // read file as an array buffer
      const arrayBuffer = await file.arrayBuffer();

      // write the file to disk
      await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

      // read and parse the csv file
      const data = await readCSVFile(filePath);
      console.log("Data read from CSV:", data);

      const consecutiveDataPoints =
        consecutiveDataPointsFromRandomTimestamp(data);
      console.log(`30 consecutive data points( length = ${
        consecutiveDataPoints.length
      }) starting from a random timestamp within the file:
          ${JSON.stringify(consecutiveDataPoints, null, 2)}`);

      const outliers = detectOutliers(consecutiveDataPoints);

      // define the outlier file name and the path for the outlier file
      const outlierFileName = `${file.name.split(".")[0]}-outliers.csv`;
      const outlierFilePath = path.join(uploadDirectory, outlierFileName);

      // write the outliers to the CSV file
      await writeOutliersToCSV(outliers, outlierFilePath);
      console.log(`Outliers written to ${outlierFileName}`);

      // add the outlier file name to the list
      outlierFiles.push(outlierFileName);
    } catch (error) {
      return NextResponse.json(
        { error: `Error processing file ${file.name}: ${error.message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ outliers: outlierFiles });
}

// GET handler to serve the outlier CSV files
export async function GET(request) {
  // get query params from the request URL
  const { searchParams } = new URL(request.url);

  // get the file name from the query parameters
  const fileName = searchParams.get("file");

  // define the path to the file
  const filePath = path.join(uploadDirectory, fileName);

  if (fs.existsSync(filePath)) {
    // read the file contents
    const fileContents = await fs.promises.readFile(filePath);
    return new Response(fileContents, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`, // set headers for file download
      },
    });
  } else {
    return new Response("File not found", { status: 404 });
  }
}
