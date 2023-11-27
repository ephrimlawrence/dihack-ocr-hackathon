import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import Konva from "konva";
import { confetti } from "tsparticles-confetti";
// const jsConfetti = new JSConfetti()
import { Stage, Layer, Line, Text } from 'react-konva';
import { Stage as UStage } from "konva/lib/Stage";
import { Block } from "typescript";

const API_URL = "http://localhost:8000"

function App() {
  const [mode, setMode] = useState<"write" | "speak">("write");
  const [isStageReady, setIsStageReady] = useState(false);
  // const [stage, setStage] = useState<any>();
  const [ocrOutput, setOcrOutput] = useState("");
  const [words, setWords] = useState([]);
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  // const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState<{ tool: string, points: number[] }[]>([]);
  const isDrawing = useRef(false);
  const stage = useRef<UStage>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const voices = useRef<SpeechSynthesisVoice[] | null>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

  // const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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


  const handleMouseDown = (e: any) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: { target: { getStage: () => any; }; }) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };


  useEffect(() => {
    // Fetch words from server
    getWords();

    var width = window.innerWidth - 50;
    var height = 400;

    // first we need Konva core things: stage and layer
    // var stage = new Konva.Stage({
    //   container: "konva-container",
    //   width: width,
    //   height: height,
    // });

    // var layer = new Konva.Layer();
    // stage.add(layer);

    // var isPaint = false;
    // var mode = "brush";
    // var lastLine: any = null;

    // stage.on("mousedown touchstart", function (e) {
    //   isPaint = true;
    //   const pos = stage.getPointerPosition()!;
    //   lastLine = new Konva.Line({
    //     stroke: "#df4b26",
    //     strokeWidth: 1,
    //     globalCompositeOperation:
    //       mode === "brush" ? "source-over" : "destination-out",
    //     // round cap for smoother lines
    //     lineCap: "round",
    //     lineJoin: "round",
    //     // add point twice, so we have some drawings even on a simple click
    //     points: [pos.x, pos.y, pos.x, pos.y],
    //   });
    //   layer.add(lastLine);
    // });

    // stage.on("mouseup touchend", function () {
    //   isPaint = false;
    // });

    // // and core function - drawing
    // stage.on("mousemove touchmove", function (e) {
    //   if (!isPaint) {
    //     return;
    //   }

    //   // prevent scrolling on touch devices
    //   e.evt.preventDefault();

    //   const pos = stage.getPointerPosition()!;
    //   var newPoints = lastLine.points().concat([pos.x, pos.y]);
    //   lastLine.points(newPoints);
    // });

    // const select = document.getElementById("tool")!;
    // select.addEventListener("change", function () {
    //   mode = (select as any).value;
    // });

    // setIsStageReady(true);
    // setStage(stage);
  }, []);

  const colsCount = () => {
    return Math.floor(12 / words.length);
  };

  const modeChanged = (value: any) => {
    if (value == "write") return;

    setMode(value)
    // let audioChunks: any[] = [];

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(async (stream) => {
        mediaRecorder.current = new MediaRecorder(stream);

        // const audioRecorder = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (e) => {
          //   audioChunks.push(e.data);
          // };

          console.log('here available');
          audioChunks.current?.push(e.data);
          console.log(audioChunks.current)
        }

        mediaRecorder.current.start(1000);


        // const audioUrl = URL.createObjectURL(blobObj);
        // console.log(audioUrl)
        // const audio = new Audio(audioUrl);
        // audio.play();
      })
  }

  const stopRecorder = async () => {

    // await setTimeout(() => 2000 * 15)
    mediaRecorder.current!.stop();

    console.log(audioChunks)
    const blobObj = new Blob(audioChunks.current, { type: "audio/ogg; codecs=opus" });

    var reader = new FileReader();
    var fd = new FormData();
    var mp3Name = encodeURIComponent('audio_recording_' + new Date().getTime() + '.mp3');
    console.log("mp3name = " + mp3Name);
    fd.append('fname', mp3Name);
    fd.append('file', blobObj);
    await fetch(`${API_URL}/audio`, {
      method: 'POST',
      headers: {
        // 'Content-Type': 'application/json
      },
      body: fd
    }).then(response => response.json())
  }

  const textToSpeach = async () => {
    const synth = window.speechSynthesis;

    const utterThis = new SpeechSynthesisUtterance('Pronounce the word "Derry Emmanuel"');
    const selectedOption = selectedVoice
    for (const voice of (voices.current || [])) {
      if (voice.lang === "en-US") {
        utterThis.voice = voice;
      }
    }
    utterThis.pitch = 1;
    utterThis.rate = 1;
    synth.speak(utterThis);

    // TODO: start recording
  }

  const populateVoiceList = () => {
    voices.current = window.speechSynthesis.getVoices();
    console.log(voices.current);
    const list = [];

    for (const voice of voices.current) {
      const option = document.createElement("option");
      option.textContent = `${voice.name} (${voice.lang})`;
      option.value = voice.name;

      if (voice.default) {
        option.textContent += " — DEFAULT";
      }

      list.push(option);
    }

    return list
  }

  return (
    <div className="App">
      <div className="">

        <button onClick={textToSpeach}>Text to Speech</button>

        <select id="voice-select" onChange={(e) => {
          setSelectedVoice(e.target.value);
        }}>
          {populateVoiceList().map((option, i) => {
            return (<option value={option.value} key={i}>{option.textContent}</option>)
          })}
        </select>

        <button onClick={stopRecorder}>Stop Recorder </button>
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

              <select className="select" onChange={(e) => modeChanged(e.target.value as any)}>
                <option value="write">Write</option>
                <option value="speak">Speak</option>
              </select>

              {/* <div id="konva-container" className="my-2"></div> */}

              {/* {this.canvas()} */}

              <Stage
                ref={stage}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
              >
                <Layer>
                  {/* <Text text="Just start drawing" x={5} y={30} /> */}
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke="#df4b26"
                      strokeWidth={5}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                      }
                    />
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        </div>

        <div id="row">
          <div className="col-md-12 text-center justify-content-center mb-3">
            <button className="btn btn-primary btn-lg" onClick={async () => {
              // Convert stage to image
              var dataURL = stage?.current?.toDataURL();

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
