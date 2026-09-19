import { create } from "zustand";


interface PlayerState {


  // trạng thái phát nhạc
  isPlaying: boolean;


  // thời gian hiện tại
  currentTime: number;


  // tổng thời lượng
  duration: number;


  // âm lượng
  volume: number;


  // tốc độ phát
  playbackRate: number;



  // Actions

  play:
  () => void;


  pause:
  () => void;


  stop:
  () => void;


  setCurrentTime:
  (time:number)=>void;


  setDuration:
  (duration:number)=>void;


  setVolume:
  (volume:number)=>void;


  setPlaybackRate:
  (rate:number)=>void;


}



export const usePlayerStore =
create<PlayerState>((set)=>({



  isPlaying:false,


  currentTime:0,


  duration:0,


  volume:1,


  playbackRate:1,



  play:
  ()=>set({

    isPlaying:true

  }),



  pause:
  ()=>set({

    isPlaying:false

  }),



  stop:
  ()=>set({

    isPlaying:false,

    currentTime:0

  }),



  setCurrentTime:
  (time)=>
  set({

    currentTime:time

  }),



  setDuration:
  (duration)=>
  set({

    duration

  }),



  setVolume:
  (volume)=>
  set({

    volume

  }),



  setPlaybackRate:
  (rate)=>
  set({

    playbackRate:rate

  })



}));