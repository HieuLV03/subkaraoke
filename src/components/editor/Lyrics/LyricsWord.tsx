"use client";

import "./Preview.css";


type LyricWord = {

    id:string;

    word:string;

    start:number;

    end:number;

    synced:boolean;

};


type Props = {

    word:LyricWord;

    currentTime:number;

    color:string;

    activeColor:string;

};



export default function SubtitleWord({

    word,

    currentTime,

    color,

    activeColor

}:Props){


    let percent = 0;


    if(currentTime >= word.end){

        percent = 100;

    }

    else if(currentTime > word.start){

        percent =
        (
            (currentTime - word.start)
            /
            (word.end - word.start)
        ) * 100;

    }



    return (

        <span className="subtitle-word">


            <span

                className="subtitle-normal"

                style={{

                    color: color

                }}

            >

                {word.word}&nbsp;

            </span>



            <span

                className="subtitle-fill"

                style={{

                    width:`${percent}%`,

                    color:activeColor

                }}

            >

                {word.word}&nbsp;

            </span>


        </span>

    );

}