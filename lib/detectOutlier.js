import fs from "fs"; // Node.js file system package for file operations
import Papa from "papaparse"; // CSV parser

// function to detect outliers in the data
export const detectOutliers = (dataPoints) => {
  try {
    // extract stock prices from data
    const prices = dataPoints.map((row) => row.stock_price);
    console.log("Prices:", prices);
    if (prices.some(isNaN)) throw new Error("Invalid stock price data");

    // mean price || accumulator(a) is initialized the first time with 0, and each iteration add b(current value) to the acumulator, and at the end divide the result by the length of array
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Formula: sqrt(sum((x - mean)^2) / N)
    // x is each data point
    // N is the number of data points
    const standardDeviation = Math.sqrt(
      prices
        .map((dataPoint) => Math.pow(dataPoint - mean, 2))
        .reduce((a, b) => a + b) / prices.length
    );

    // define outlier threshold which is 2 standard deviations
    const threshold = 2 * standardDeviation;

    // filter data to find outliers and map results to a new array
    const outliers = dataPoints
      .filter((row) => {
        const price = row.stock_price;
        return Math.abs(price - mean) > threshold; // identify outliers
      })
      .map((row) => ({
        stock_id: row.stock_id,
        timestamp: row.timestamp,
        actual_stock_price: row.stock_price,
        mean_of_consecutive_data_points: mean.toFixed(2),
        actual_stock_price_and_mean_difference: (
          row.stock_price - mean
        ).toFixed(2),
        percentage_deviation: (
          ((row.stock_price - mean) / threshold) *
          100
        ).toFixed(2),
      }));

    console.log("Outliers:", outliers);
    return outliers;
  } catch (error) {
    console.error("Error detecting outliers:", error);
    return [];
  }
};

// function to write outliers to a CSV file
export const writeOutliersToCSV = (outliers, filePath) => {
  if (outliers.length === 0) throw new Error("No outliers detected");

  // use Papa.unparse() to convert the outliers data to CSV format
  const csv = Papa.unparse(outliers);

  // write CSV data to specified file path
  fs.writeFileSync(filePath, csv);

  console.log(`Outliers written to CSV at ${filePath}`);
};
