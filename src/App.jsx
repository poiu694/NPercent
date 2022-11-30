import React, { useEffect, useState } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import Webcam from 'react-webcam';
import axios from 'axios';
import { drawKeypoints, drawSkeleton } from './util';

export default function App() {
  const webcamRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [poses, setPoses] = useState([]);

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
    if (poses.length === 3) {
      const threePoses = poses;
      (async () => {
        const res = await axios.post('http://localhost:8080', {
          exe_num: 5,
          frames: threePoses,
        });
        console.log(res);
      })();
    }
  }, [poses]);

  return (
    <div className='App'>
      <h1>NPercent Tester Webpage</h1>
      <header className='app-header'>
        <div className='webcam__container--wrapper'>
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
        <h3>해당 부분에 집중해 보세요!</h3>
      </header>
      <table style={{ width: '100%', margin: '500px auto 0 auto' }}>
        <thead>
          <tr>
            <th>hi</th>
            <th>hi</th>
            <th>hi</th>
            <th>hi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>hi2</td>
            <td>hi2</td>
            <td>hi2</td>
            <td>hi2</td>
          </tr>
          <tr>
            <td>hi3</td>
            <td>hi3</td>
            <td>hi3</td>
            <td>hi3</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
