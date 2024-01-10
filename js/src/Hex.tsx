export class LargeFlatAsciiHexPrinter {
  constructor() {
    this.width = 13;
    this.height = 7;
    this.sideLength = 3;
    this.sideHeight = 3;
    this.TEMPLATE =
      "   _ _ _ _   \n" +
      "  / # # # \\  \n" +
      " /# # # # #\\ \n" +
      "/# XXXXXXX #\\\n" +
      "\\# YYYYYYY #/\n" +
      " \\# # # # #/ \n" +
      "  \\_#_#_#_/  \n";
    this.hexOrientation = "FLAT"; // HexOrientation is assumed to be a simple string in this context.
  }

  getHex(textLine1, textLine2, fillerChar) {
    let line1 = this.restrictToLength(textLine1, 7);
    let line2 = this.restrictToLength(textLine2, 7);
    let hex = this.TEMPLATE.replace("XXXXXXX", line1).replace("YYYYYYY", line2);
    return hex.replace(/#/g, fillerChar);
  }

  mapHexCoordsToCharCoords(q, r) {
    return [
      (this.width - this.sideLength) * q,
      this.sideHeight * q + (this.height - 1) * r,
    ];
  }

  getMapSizeInChars(hexWidth, hexHeight) {
    const widthInChars =
      hexWidth * (this.width - this.sideLength) + this.sideLength;
    const heightInChars =
      ((hexWidth - 1) * this.height) / 2 + hexHeight * this.height;
    return [widthInChars, heightInChars];
  }

  restrictToLength(str, maxLength) {
    return str.length > maxLength ? str.substring(0, maxLength) : str;
  }
}

export class CharGrid {
  constructor(width, height) {
    this.width = width.toFixed(0);
    this.height = height.toFixed(0);
    console.log(`CharGrid dimensions: width = ${width}, height = ${height}`);
    this.grid = Array.from({ length: height }, () =>
      new Array(width).fill(" ")
    );
    console.log("Initial grid:", this.grid);
    this.prefillGrid();
  }

  prefillGrid() {
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        console.log(`Prefilling (${j}, ${i})`); // Log coordinates
        this.addChar(j, i, " ");
      }
    }
  }

  addString(x, y, input) {
    if (!input) return;
    for (let i = 0; i < input.length; i++) {
      this.addChar(x + i, y, input[i]);
    }
  }

  addChar(x, y, input) {
    console.log(`addChar called with x: ${x}, y: ${y}, input: '${input}'`); // Log values
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      const maxWidth = this.width - 1;
      const maxHeight = this.height - 1;
      throw new Error(`(${x},${y}) is outside (${maxWidth},${maxHeight})`);
    }

    this.grid[y][x] = input;
  }

  getChar(x, y) {
    return this.grid[y][x];
  }

  print(trimToBoundingBox) {
    let leftBound = trimToBoundingBox ? this.width - 1 : 0;
    let rightBound = trimToBoundingBox ? 0 : this.width - 1;
    let topBound = trimToBoundingBox ? this.height - 1 : 0;
    let bottomBound = trimToBoundingBox ? 0 : this.height - 1;

    if (trimToBoundingBox) {
      for (let i = 0; i < this.height; i++) {
        for (let j = 0; j < this.width; j++) {
          const c = this.grid[i][j];
          if (c !== " ") {
            leftBound = Math.min(leftBound, j);
            rightBound = Math.max(rightBound, j);
            topBound = Math.min(topBound, i);
            bottomBound = Math.max(bottomBound, i);
          }
        }
      }
    }

    let builder = "";
    for (let i = topBound; i <= bottomBound; i++) {
      for (let j = leftBound; j <= rightBound; j++) {
        builder += this.grid[i][j];
      }
      builder += "\n";
    }
    return builder;
  }
}

export class AsciiBoard {
  constructor(minQ, maxQ, minR, maxR, printer) {
    this.width = maxQ - minQ + 1;
    this.height = maxR - minR + 1;
    this.printer = printer;
    this.grid = this.createGrid();
  }

  createGrid() {
    const gridSize = this.printer.getMapSizeInChars(this.width, this.height);
    return new CharGrid(gridSize[0], gridSize[1]);
    // Note: You'll need to define CharGrid class or function as well in JavaScript.
  }

  addHex(textLine1, textLine2, fillerChar, hexQ, hexR) {
    const hex = this.printer.getHex(textLine1, textLine2, fillerChar);
    const charCoordinates = this.printer.mapHexCoordsToCharCoords(hexQ, hexR);
    const lines = hex.split("\n");

    console.log("Grid dimensions: ", this.grid.width, this.grid.height);

    lines.forEach((content, i) => {
      for (let j = 0; j < content.length; j++) {
        const x = charCoordinates[0] + j;
        const y = charCoordinates[1] + i;
        console.log(`Adding char at (${x}, ${y})`); // Log coordinates
        if (this.grid.getChar(x, y) === " ") {
          this.grid.addChar(x, y, content[j]);
        }
      }
    });
  }

  prettyPrint(wrapInBox) {
    return this.printBoard(wrapInBox);
  }

  printBoard(wrapInBox) {
    if (wrapInBox) {
      let sb = "";

      const lines = this.grid.print(true).split("\n");
      const contentLength = lines.length > 0 ? lines[0].length : 0;
      const verticalLine = this.getVerticalLine("=", contentLength);
      const spacerLine = this.getVerticalLine(" ", contentLength);

      sb += verticalLine;
      lines.forEach((line) => {
        sb += `| ${line} |\n`;
      });

      if (this.printer.hexOrientation === "FLAT") {
        sb += spacerLine;
      }
      sb += verticalLine;
      return sb;
    } else {
      return this.grid.print(true);
    }
  }

  getVerticalLine(filler, contentLength) {
    let verticalLine = "| ";
    for (let i = 0; i < contentLength; i++) {
      verticalLine += i % 2 === 0 ? filler : " ";
    }
    return verticalLine + " |\n";
  }
}
