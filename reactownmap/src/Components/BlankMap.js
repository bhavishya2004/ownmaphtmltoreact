// import { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";
// import * as topojson from "topojson-client";

// const BlankMap = () => {
//     const canvasRef = useRef(null);
//     const [countryData, setCountryData] = useState(null);

//     useEffect(() => {
//         const canvas = canvasRef.current;
//         const ctx = canvas.getContext("2d");

//         const fetchWorldData = async () => {
//             try {
//                 const response = await fetch("http://localhost:5000/api/world-data");
//                 const data = await response.json();
//                 setCountryData(data);
//             } catch (error) {
//                 console.error("Error fetching world data:", error);
//             }
//         };

//         const drawMap = async () => {
//             const worldData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
//             const countries = topojson.feature(worldData, worldData.objects.countries);

//             const projection = d3.geoNaturalEarth1()
//                 .translate([canvas.width / 2, canvas.height / 2])
//                 .scale(canvas.width / 6);

//             const path = d3.geoPath(projection, ctx);

//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             ctx.fillStyle = "lightgray";
//             ctx.strokeStyle = "black";

//             countries.features.forEach(feature => {
//                 ctx.beginPath();
//                 path(feature);
//                 ctx.fill();
//                 ctx.stroke();
//             });

//             if (countryData) {
//                 ctx.fillStyle = "black";
//                 ctx.font = "12px Arial";
//                 countryData.countries.forEach(country => {
//                     if (country.latitude && country.longitude) {
//                         const coords = projection([country.longitude, country.latitude]);
//                         if (coords) {
//                             ctx.fillText(country.name, coords[0], coords[1]);
//                         }
//                     }
//                 });
//             }
//         };

//         fetchWorldData();
//         drawMap();

//         window.addEventListener("resize", drawMap);
//         return () => window.removeEventListener("resize", drawMap);
//     }, [countryData]);

//     return (
//         <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block", backgroundColor: "#C8E6C9" }} />
//     );
// };

// export default BlankMap;



import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

const WorldMap = () => {
  const canvasRef = useRef(null);
  const [countriesData, setCountriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [worldGeoJSON, setWorldGeoJSON] = useState(null);

  // Fetch country data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/countries");
        const data = await response.json();
        setCountriesData(data.countries);
      } catch (error) {
        console.error("Error fetching country data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch and process world map data
  useEffect(() => {
    const fetchWorldData = async () => {
      try {
        const worldData = await d3.json(
          "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        );
        const countries = feature(worldData, worldData.objects.countries);
        setWorldGeoJSON(countries);
      } catch (error) {
        console.error("Error loading world map data:", error);
      }
    };

    fetchWorldData();
  }, []);

  // Draw map with current zoom level and position
  useEffect(() => {
    if (isLoading || !worldGeoJSON) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawMap = () => {
      // Set canvas dimensions
      const parentDiv = canvas.parentElement;
      canvas.width = parentDiv.clientWidth;
      canvas.height = parentDiv.clientHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#C8E6C9"; // Ocean color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save the current state
      ctx.save();

      // Apply transformations for zoom and pan
      ctx.translate(canvas.width / 2 + position.x, canvas.height / 2 + position.y);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Create projection
      const projection = d3.geoEquirectangular()
        .scale(canvas.width / (2 * Math.PI))
        .translate([canvas.width / 2, canvas.height / 2]);

      // Create path generator
      const path = d3.geoPath(projection, ctx);

      // Draw countries
      worldGeoJSON.features.forEach(feature => {
        ctx.beginPath();
        path(feature);
        ctx.fillStyle = "#D5D5D5"; // Land color
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Draw country names
      if (countriesData.length > 0) {
        ctx.fillStyle = "#333333";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        
        countriesData.forEach(country => {
          if (country.latitude && country.longitude) {
            const coords = projection([country.longitude, country.latitude]);
            if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
              ctx.fillText(country.name, coords[0], coords[1]);
            }
          }
        });
      }

      // Restore the original state
      ctx.restore();
    };

    drawMap();

    const handleResize = () => {
      drawMap();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [worldGeoJSON, countriesData, isLoading, scale, position]);

  // Zoom in function
  const handleZoomIn = () => {
    setScale(prevScale => prevScale * 1.2);
  };

  // Zoom out function
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(0.5, prevScale / 1.2));
  };

  // Reset zoom and position
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Pan functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition(prev => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {isLoading && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          Loading map...
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: "block", 
          width: "100%", 
          height: "100%",
          cursor: isDragging ? "grabbing" : "grab" 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Zoom controls */}
      <div style={{ 
        position: "absolute", 
        bottom: "20px", 
        right: "20px", 
        display: "flex", 
        flexDirection: "column",
        gap: "10px"
        
      }}>
        <button 
          onClick={handleZoomIn}
          style={{
            width: "40px",
            height: "40px",
            fontSize: "20px",
            borderRadius: "50%",
            border: "none",
            background: "white",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          style={{
            width: "40px",
            height: "40px",
            fontSize: "20px",
            borderRadius: "50%",
            border: "none",
            background: "white",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          -
        </button>
        <button 
          onClick={handleReset}
          style={{
            width: "40px",
            height: "40px",
            fontSize: "14px",
            borderRadius: "50%",
            border: "none",
            background: "white",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          ↺
        </button>
      </div>
    </div>
  );
};

export default WorldMap;