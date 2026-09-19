import {
  useEffect,
  useRef
} from "react";

import WaveSurfer from "wavesurfer.js";

import "./Waveform.css";

type Props={

    src?:string;

    currentTime:number;

    playing:boolean;

    onReady?(
        duration:number
    ):void;

    onSeek?(
        time:number
    ):void;

};

export default function Waveform({

    src,

    currentTime,

    playing,

    onReady,

    onSeek

}:Props){

    const containerRef=
        useRef<HTMLDivElement>(null);

    const waveRef=
        useRef<WaveSurfer>();



    useEffect(()=>{

        if(
            !containerRef.current
            ||
            !src
        ) return;

        const wave=

        WaveSurfer.create({

            container:
                containerRef.current,

            height:100,

            waveColor:"#555",

            progressColor:"#4fc3f7",

            cursorColor:"#ff0000",

            cursorWidth:2,

            normalize:true,

            interact:true

        });

        wave.load(src);

        wave.on(

            "ready",

            ()=>{

                onReady?.(

                    wave.getDuration()

                );

            }

        );

        wave.on(

            "interaction",

            ()=>{

                onSeek?.(

                    wave.getCurrentTime()

                );

            }

        );

        waveRef.current=wave;

        return ()=>{

            wave.destroy();

        };

    },[src]);





    useEffect(()=>{

        const wave=waveRef.current;

        if(!wave) return;

        if(playing)

            wave.play();

        else

            wave.pause();

    },[playing]);






    useEffect(()=>{

        const wave=waveRef.current;

        if(!wave) return;

        if(

            Math.abs(

                wave.getCurrentTime()

                -

                currentTime

            )>0.05

        ){

            wave.setTime(

                currentTime

            );

        }

    },[currentTime]);



    return(

        <div

            className="waveform"

            ref={containerRef}

        />

    );

}