import AudioControls from "./AudioControls";

import {
    useEditorStore
} from "@/stores/editor.store";


export default function AudioPanel(){


const playing =
useEditorStore(
    state=>state.playing
);


const currentTime =
useEditorStore(
    state=>state.currentTime
);


const duration =
useEditorStore(
    state=>state.duration
);


const playbackRate =
useEditorStore(
    state=>state.playbackRate
);


const volume =
useEditorStore(
    state=>state.volume
);



const play =
useEditorStore(
    state=>state.play
);


const pause =
useEditorStore(
    state=>state.pause
);


const setCurrentTime =
useEditorStore(
    state=>state.setCurrentTime
);


const setPlaybackRate =
useEditorStore(
    state=>state.setPlaybackRate
);


const setVolume =
useEditorStore(
    state=>state.setVolume
);




return (

<AudioControls


playing={playing}


currentTime={currentTime}


duration={duration}


playbackRate={playbackRate}


volume={volume}



onPlay={()=>{

    play();

}}



onPause={()=>{

    pause();

}}



onSeek={(time)=>{


    setCurrentTime(
        Math.max(
            0,
            time
        )
    );


}}



onRate={(rate)=>{


    setPlaybackRate(
        rate
    );


}}



onVolume={(value)=>{


    setVolume(
        value
    );


}}


/>

);


}