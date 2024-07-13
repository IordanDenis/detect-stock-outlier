"use client";

import { useState } from "react";

export default function Home() {
  // states to store selected input files and outlier files links, both initialized as empty arrays
  const [files, setFiles] = useState([]);
  const [outlierLinks, setOutlierLinks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // handler for file input change event, where the state gets updated with the selected files
  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  // handler for upload button click event
  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMessage("No files selected");
      return;
    }

    if (files.length > 2) {
      setErrorMessage("You can only upload a maximum of 2 files");
      return;
    }

    // Clear previous error messages
    setErrorMessage("");

    // create a new FormData object
    const formData = new FormData();

    // since files is an array, we will be working with for..of, and for each selected file, append it to FormData
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      // make a POST request to upload the files, with the created formData as body
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // parse the JSON response
      const result = await response.json();
      console.log("Outliers:", result.outliers);

      if (result.outliers && result.outliers.length > 0) {
        // update state with outlier file links
        setOutlierLinks(result.outliers);
      } else {
        setErrorMessage("No outliers detected");
      }
    } catch (error) {
      setErrorMessage(`Error uploading files: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Upload CSV Files</h1>
      {/*multiple tag that enables multiple file upload*/}
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {errorMessage && <div>{errorMessage}</div>}
      <div>
        {outlierLinks.map((link, index) => (
          <div key={index}>
            <a href={`/api/upload?file=${link}`} download>
              {link}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
