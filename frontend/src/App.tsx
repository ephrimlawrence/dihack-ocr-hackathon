import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import Konva from "konva";
import { Stage } from "konva/lib/Stage";
import { confetti } from "tsparticles-confetti";
// const jsConfetti = new JSConfetti()

const API_URL = "http://localhost:8000"

function App() {
  const [liked, setLiked] = useState(false);
  const [isStageReady, setIsStageReady] = useState(false);
  const [stage, setStage] = useState<Stage>();
  const [ocrOutput, setOcrOutput] = useState("");
  const [words, setWords] = useState([]);

  const getWords = async () => {
    await fetch(`${API_URL}/words`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        setWords(data.words.split(""));
      })
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    // Fetch words from server
    getWords();

    var width = window.innerWidth - 50;
    var height = 400;

    // first we need Konva core things: stage and layer
    var stage = new Konva.Stage({
      container: "konva-container",
      width: width,
      height: height,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    var isPaint = false;
    var mode = "brush";
    var lastLine: any = null;

    stage.on("mousedown touchstart", function (e) {
      isPaint = true;
      const pos = stage.getPointerPosition()!;
      lastLine = new Konva.Line({
        stroke: "#df4b26",
        strokeWidth: 5,
        globalCompositeOperation:
          mode === "brush" ? "source-over" : "destination-out",
        // round cap for smoother lines
        lineCap: "round",
        lineJoin: "round",
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      layer.add(lastLine);
    });

    stage.on("mouseup touchend", function () {
      isPaint = false;
    });

    // and core function - drawing
    stage.on("mousemove touchmove", function (e) {
      if (!isPaint) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = stage.getPointerPosition()!;
      var newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
    });

    const select = document.getElementById("tool")!;
    select.addEventListener("change", function () {
      mode = (select as any).value;
    });

    setIsStageReady(true);
    setStage(stage);
  }, []);

  const colsCount = () => {
    return Math.floor(12 / words.length);
  };

  return (
    <div className="App">
      <div className="">

        <div className="card card-body mt-2 mx-2">

          <div className="row" id="alphabets-row">
            {/* Create n number of columns based on the items in state.words array */}
            {words.map((word, index) => {
              return (
                <div className={`col-md-${colsCount} text-center justify-content-center rword-div`} key={index}>
                  <h1 className="rword">{word}</h1>
                </div>
              )
            })}
          </div>
        </div>


        <div className="card card-body my-3" id="konva-card">
          <div className="row">
            <div className="col-12 justify-content-center text-center">
              <select id="tool" className="select">
                <option value="brush">Brush</option>
                <option value="eraser">Eraser</option>
              </select>

              <div id="konva-container" className="my-2"></div>

              {/* {this.canvas()} */}
            </div>
          </div>
        </div>

        <div id="row">
          <div className="col-md-12 text-center justify-content-center mb-3">
            <button className="btn btn-primary btn-lg" onClick={async () => {
              // Convert stage to image
              var dataURL = stage?.toDataURL();

              // Send the image to the server
              await fetch(`${API_URL}/ocr`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: dataURL, word: "a" })
              }).then(response => response.json())
                .then(data => {
                  console.log('Success:', data)
                  const ocrOutput = data.words;

                  if (ocrOutput.replace(/\s/, '').toLowerCase() == words.join("").toLowerCase()) {
                    confetti("tsparticles", {
                      particleCount: 50,
                      shapes: ["square"],
                      colors: [
                        '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7',
                      ],
                    });
                    // jsConfetti.addConfetti({
                    //   confettiColors: [
                    //     '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', '#fbb1bd', '#f9bec7',
                    //   ],
                    // })
                  } else {
                    confetti("tsparticles", {
                      particleCount: 50,
                      shapes: ["heart", "star", "polygon", "circle"],
                      colors: ["#ffffff", "#ff0000"],
                    });
                  }
                })
                .catch(error => console.error('Error:', error))

            }}>Check Answer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
