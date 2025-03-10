import { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const BlankMap = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawMap();
        };

        const drawMap = async () => {
            const worldData = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
            const countries = topojson.feature(worldData, worldData.objects.countries);

            const projection = d3.geoNaturalEarth1()
                .translate([canvas.width / 2, canvas.height / 2])
                .scale(canvas.width / 6);

            const path = d3.geoPath(projection, ctx);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "lightgray";
            ctx.strokeStyle = "black";

            countries.features.forEach(feature => {
                ctx.beginPath();
                path(feature);
                ctx.fill();
                ctx.stroke();
            });
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    return (
        <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh", display: "block", backgroundColor: "#C8E6C9" }} />
    );
};

export default BlankMap;
