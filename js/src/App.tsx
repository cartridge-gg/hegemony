import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import { SVG } from "@svgdotjs/svg.js";
import { defineHex, Grid, rectangle } from "honeycomb-grid";

function App() {
  const [count, setCount] = useState(0);

  const Hex = defineHex({ dimensions: 30, origin: "topLeft" });
  const grid = new Grid(Hex, rectangle({ width: 20, height: 20 }));

  const draw = SVG().addTo("body").size("100%", "100%");

  grid.forEach(renderSVG);

  function renderSVG(hex: Hex) {
    const polygon = draw
      // create a polygon from a hex's corner points
      .polygon(hex.corners.map(({ x, y }) => `${x},${y}`))
      .fill("none")
      .stroke({ width: 2, color: "#999" });

    return draw.group().add(polygon);
  }

  return (
    <>
      <pre></pre>
    </>
  );
}

export default App;
