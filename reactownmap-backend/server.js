// const fs = require('fs');
// const https = require('https');

// // API URLs
// const API_COUNTRIES_STATES = "https://countriesnow.space/api/v0.1/countries/states";
// const API_COUNTRY_DETAILS = "https://restcountries.com/v3.1/all";

// // Function to fetch JSON data from API
// function fetchData(url) {
//     return new Promise((resolve, reject) => {
//         https.get(url, (res) => {
//             let data = '';

//             res.on('data', (chunk) => {
//                 data += chunk;
//             });

//             res.on('end', () => {
//                 try {
//                     resolve(JSON.parse(data));
//                 } catch (error) {
//                     reject(error);
//                 }
//             });

//         }).on('error', (err) => {
//             reject(err);
//         });
//     });
// }

// // Fetch both APIs and merge data
// async function generateWorldData() {
//     try {
//         console.log("⏳ Fetching country and state data...");
//         const countryStateData = await fetchData(API_COUNTRIES_STATES);
        
//         console.log("⏳ Fetching country details (latitude/longitude)...");
//         const countryDetails = await fetchData(API_COUNTRY_DETAILS);

//         // Convert country details into a map for easy lookup
//         const countryGeoMap = {};
//         countryDetails.forEach(country => {
//             if (country.name.common && country.latlng) {
//                 countryGeoMap[country.name.common] = {
//                     latitude: country.latlng[0],
//                     longitude: country.latlng[1]
//                 };
//             }
//         });

//         // Format the final JSON structure
//         const formattedData = {
//             countries: countryStateData.data.map(country => ({
//                 name: country.name,
//                 code: country.iso2,
//                 latitude: countryGeoMap[country.name]?.latitude || null,
//                 longitude: countryGeoMap[country.name]?.longitude || null,
//                 states: country.states.map(state => state.name)
//             }))
//         };

//         // Save data to a JSON file
//         fs.writeFileSync('worldcountriesstates.json', JSON.stringify(formattedData, null, 4));

//         console.log("✅ JSON file 'worldcountriesstates.json' with latitude & longitude generated successfully!");

//     } catch (error) {
//         console.error("❌ Error fetching data:", error.message);
//     }
// }

// // Run the function
// generateWorldData();



// // const fs = require('fs');
// // const https = require('https');

// // const API_COUNTRIES_STATES = "https://countriesnow.space/api/v0.1/countries/states";
// // const API_COUNTRY_DETAILS = "https://restcountries.com/v3.1/all";
// // const API_DISTRICTS = "https://example.com/districts";  // Replace with a valid API
// // const API_TALUKS = "https://example.com/taluks";  // Replace with a valid API

// // function fetchData(url) {
// //     return new Promise((resolve, reject) => {
// //         https.get(url, (res) => {
// //             let data = '';
// //             res.on('data', chunk => data += chunk);
// //             res.on('end', () => resolve(JSON.parse(data)));
// //             res.on('error', reject);
// //         });
// //     });
// // }

// // async function generateWorldData() {
// //     try {
// //         console.log("Fetching country and state data...");
// //         const countryStateData = await fetchData(API_COUNTRIES_STATES);

// //         console.log("Fetching country coordinates...");
// //         const countryDetails = await fetchData(API_COUNTRY_DETAILS);

// //         console.log("Fetching district data...");
// //         const districtData = await fetchData(API_DISTRICTS);

// //         console.log("Fetching taluk data...");
// //         const talukData = await fetchData(API_TALUKS);

// //         const countryGeoMap = {};
// //         countryDetails.forEach(country => {
// //             if (country.name.common && country.latlng) {
// //                 countryGeoMap[country.name.common] = {
// //                     latitude: country.latlng[0],
// //                     longitude: country.latlng[1]
// //                 };
// //             }
// //         });

// //         const formattedData = {
// //             countries: countryStateData.data.map(country => ({
// //                 name: country.name,
// //                 code: country.iso2,
// //                 latitude: countryGeoMap[country.name]?.latitude || null,
// //                 longitude: countryGeoMap[country.name]?.longitude || null,
// //                 states: country.states.map(state => ({
// //                     name: state.name,
// //                     districts: districtData[state.name] || [],
// //                     taluks: talukData[state.name] || []
// //                 }))
// //             }))
// //         };

// //         fs.writeFileSync('worldcountriesstates.json', JSON.stringify(formattedData, null, 4));
// //         console.log("✅ Data saved as 'worldcountriesstates.json'");

// //     } catch (error) {
// //         console.error("❌ Error:", error.message);
// //     }
// // }

// // generateWorldData();



const express = require('express');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

// API URLs
const API_COUNTRIES_STATES = "https://countriesnow.space/api/v0.1/countries/states";
const API_COUNTRY_DETAILS = "https://restcountries.com/v3.1/all";

// Function to fetch data from an API
async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error.message);
        return null;
    }
}

// Generate and save country data
async function generateWorldData() {
    console.log("⏳ Fetching country and state data...");
    const countryStateData = await fetchData(API_COUNTRIES_STATES);
    console.log("⏳ Fetching country details...");
    const countryDetails = await fetchData(API_COUNTRY_DETAILS);

    if (!countryStateData || !countryDetails) {
        console.error("❌ Failed to fetch data.");
        return;
    }

    // Create a mapping of country names to lat/lon
    const countryGeoMap = {};
    countryDetails.forEach(country => {
        if (country.name.common && country.latlng) {
            countryGeoMap[country.name.common.trim()] = {
                latitude: country.latlng[0],
                longitude: country.latlng[1]
            };
        }
    });

    // Structure final JSON data
    const formattedData = {
        countries: countryStateData.data.map(country => ({
            name: country.name.trim(),
            code: country.iso2,
            latitude: countryGeoMap[country.name]?.latitude || null,
            longitude: countryGeoMap[country.name]?.longitude || null,
            states: country.states.map(state => state.name)
        }))
    };

    // Save to a JSON file
    fs.writeFileSync('worldcountriesstates.json', JSON.stringify(formattedData, null, 4));
    console.log("✅ Data generated successfully!");
}

// API Endpoint to serve the JSON data
app.get('/api/countries', (req, res) => {
    fs.readFile('worldcountriesstates.json', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error reading data file" });
        }
        res.json(JSON.parse(data));
    });
});

// Generate data on startup
generateWorldData();

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
