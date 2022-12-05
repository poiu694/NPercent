import React, { useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import Webcam from 'react-webcam';
import axios from 'axios';
import { drawKeypoints, drawSkeleton } from './util';
import { CONDITION_INFOMATION } from './constant';

export default function App() {
  const webcamRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [poses, setPoses] = useState([]);
  const [resultByPoses, setResultByPoses] = useState([]);
  const [exerciseNum, setExerciseNum] = useState(1);

  console.log(
    Object.entries(CONDITION_INFOMATION).map(([key, value]) =>
      console.log(`${key} ${value.name}`)
    )
  );

  const detectWebcamFeed = async (model) => {
    if (
      typeof webcamRef.current !== 'undefined' &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      // Make Estimation
      const pose = await model.estimateSinglePose(video);
      setPoses((prev) => [...prev, pose]);
      drawResult(pose, videoWidth, videoHeight, canvasRef);
    }
  };

  const drawResult = (pose, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext('2d');
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;
    drawKeypoints(pose['keypoints'], 0.6, ctx);
    drawSkeleton(pose['keypoints'], 0.7, ctx);
  };

  useEffect(() => {
    const runPosenet = async () => {
      const model = await posenet.load({
        inputResolution: { width: 640, height: 480 },
        scale: 0.8,
      });
      //
      const interval = setInterval(() => {
        detectWebcamFeed(model);
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    };
    runPosenet();
  }, []);

  useEffect(() => {
    async function sendPositions(poses) {
      try {
        const res = await axios.post('http://localhost:8000/convert', {
          exe_num: exerciseNum,
          frames: poses,
        });
        const { data } = res;
        setResultByPoses((prev) => [data, ...prev]);
      } catch (err) {
        console.error(err);
      }
    }
    if (poses.length === 5) {
      // console.log(poses);
      const threeFrameXYPositions = poses.map(({ keypoints }) => {
        return keypoints.map((keypoint) => ({
          x: keypoint.position.x,
          y: keypoint.position.y,
        }));
      });
      sendPositions(threeFrameXYPositions);
      setPoses([]);
    }
  }, [poses]);

  return (
    <div className="App">
      <h1>NPercent Tester Webpage</h1>
      <header className="app-header">
        <div className="webcam__container--wrapper">
          <Webcam
            ref={webcamRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              zindex: 9,
              width: 640,
              height: 480,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              zindex: 9,
              width: 640,
              height: 480,
            }}
          />
        </div>
        <div>
          <div
            className="header--exercise__content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            <div
              className="header--exercise__selector"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ marginRight: 16 }}>운동 선택</h3>
              <select
                value={exerciseNum}
                onChange={(e) => setExerciseNum(e.target.value)}
              >
                {[
                  1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                ].map((num) => (
                  <option key={num} value={num}>
                    {num} - {CONDITION_INFOMATION[num]?.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: 'start' }}>
              <h3>운동 조건</h3>
              {CONDITION_INFOMATION[exerciseNum]?.conditions.map(
                (condition, idx) => (
                  <div style={{ color: 'red', fontWeight: 700 }} key={idx}>
                    {idx + 1} : {condition}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </header>
      <table style={{ width: '100%', margin: '300px auto 0 auto' }}>
        <thead>
          <tr>
            {CONDITION_INFOMATION[exerciseNum]?.conditions.map((_, idx) => (
              <th key={idx}>{idx + 1}번</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultByPoses.map((results) => (
            <tr>
              {results.map((result) => (
                <td key={result}>{result.toFixed(1)}%</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
