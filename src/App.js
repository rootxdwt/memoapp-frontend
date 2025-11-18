import hark from 'hark';
import './App.css';
import { IoPlay, IoPause, IoEllipse, IoSquare } from "react-icons/io5";
import { useState, useRef, useEffect } from 'react';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [data,setData] = useState([])

  const recorderRef = useRef();
  const audioChunks = useRef([]);

  const isRecordingRef = useRef(false); 
  const isTranscribing = useRef(false)

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          var speechEvents = hark(stream, {});

          speechEvents.on('stopped_speaking', () => {
            // Check the Ref before transcribing
            if (!isRecordingRef.current) {
                return; 
            }
            
            console.log("Transcribing");
            transcribe();
          });

          recorderRef.current = new MediaRecorder(stream);

          recorderRef.current.ondataavailable = (e) => {
            audioChunks.current.push(e.data);
          };
        })
        .catch((err) => {
          console.error(`The following getUserMedia error occurred: ${err}`);
        });
    }
  }, []);

  const transcribe = async () => {
    if(isTranscribing.current) return
    isTranscribing.current=true
    if (audioChunks.current.length === 0) return;

    const blob = new Blob(audioChunks.current, { type: "audio/ogg; codecs=opus" });

    const form = new FormData();
    form.append('audio', blob, 'audio.ogg');
    
    try {
        const res = await fetch("http://localhost:5001/transcribe", { method: "POST", body: form });
        setData(await res.json())
    } catch (error) {
        console.error("Transcription error", error);
    }
    isTranscribing.current=false
  };

  const startRecord = () => {
    if (!recorderRef.current) return;
    
    audioChunks.current = []; 
    
    recorderRef.current.start(500);
    isRecordingRef.current = true; 
    setIsRecording(true);
  };

  const stopRecord = () => {
    if (!recorderRef.current) return;
    
    recorderRef.current.stop();
    isRecordingRef.current = false; 
    setIsRecording(false); 
  };

  const handleToggleRecord = () => {
      if (isRecording) {
          stopRecord();
      } else {
          startRecord();
      }
  };

  return (
    <>
      <div className='content'>
        <div className='controls'>
          <span 
            style={{ color: isRecording ? 'white' : 'red' }} 
            onClick={handleToggleRecord}
          >
            {isRecording ? <IoSquare /> : <IoEllipse />}
          </span>
          <span onClick={() => setIsPlaying(prev => !prev)}>
            {isPlaying ? <IoPause /> : <IoPlay />}
          </span>
        </div>
        <div className='textarea'>
          {data.map(e=>e.text).join("")}
        </div>
      </div>
    </>
  );
}

export default App;