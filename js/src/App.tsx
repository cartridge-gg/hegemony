import { useState } from "react";
import "./App.css";
import { AsciiBoard, LargeFlatAsciiHexPrinter } from "./Hex";

function App() {
  const [textLine1, setTextLine1] = useState("");
  const [textLine2, setTextLine2] = useState("");
  const [fillerChar, setFillerChar] = useState("*");
  const [hexQ, setHexQ] = useState(2);
  const [hexR, setHexR] = useState(2);
  const [asciiGrid, setAsciiGrid] = useState("");

  const generateAsciiGrid = () => {
    const printer = new LargeFlatAsciiHexPrinter();
    const board = new AsciiBoard(10, 10, 20, 20, printer); // Adjust grid size as needed

    board.addHex(textLine1, textLine2, fillerChar, hexQ, hexR);
    setAsciiGrid(board.prettyPrint(true));
  };

  return (
    <div>
      <input
        type="text"
        value={textLine1}
        onChange={(e) => setTextLine1(e.target.value)}
        placeholder="Text Line 1"
      />
      <input
        type="text"
        value={textLine2}
        onChange={(e) => setTextLine2(e.target.value)}
        placeholder="Text Line 2"
      />
      <input
        type="text"
        value={fillerChar}
        onChange={(e) => setFillerChar(e.target.value)}
        placeholder="Filler Character"
        maxLength={1}
      />
      <input
        type="number"
        value={hexQ}
        onChange={(e) => setHexQ(parseInt(e.target.value))}
        placeholder="Hex Q Coordinate"
      />
      <input
        type="number"
        value={hexR}
        onChange={(e) => setHexR(parseInt(e.target.value))}
        placeholder="Hex R Coordinate"
      />
      <button onClick={generateAsciiGrid}>Generate ASCII Grid</button>
      <pre>{asciiGrid}</pre>
      <button onClick={() => window.print()}>Print</button>
    </div>
  );
}

export default App;
