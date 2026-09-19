"use client";


import {
    useLyricsStore
} from "@/stores/lyrics.store";


interface Props {

    lineId:string;

}



export default function LyricLine({

    lineId

}:Props){



    const line = useLyricsStore(

        state=>

            state.lyrics.find(

                item=>

                item.id===lineId

            )

    );




    const selectedLineId = useLyricsStore(

        state=>

        state.selectedLineId

    );




    const selectLine = useLyricsStore(

        state=>

        state.selectLine

    );





    if(!line){

        return null;

    }




    return (

        <div


            className={

                selectedLineId===line.id

                ?

                "lyric-line active"

                :

                "lyric-line"

            }



            onClick={()=>{


                selectLine(

                    line.id

                );


            }}



        >





            {/* TIME */}

            <div

                className="lyric-time"

            >


                {line.start.toFixed(2)}

                -

                {line.end.toFixed(2)}


            </div>








            {/* TEXT */}


            <div

                className="lyric-text"

            >


                {line.text}


            </div>









            <div

                className="lyric-words"

            >


            {

                line.words.map(word=>(


                    <span

                        key={word.id}

                    >


                        {word.word}

                        (

                        {word.start.toFixed(2)}

                        -

                        {word.end.toFixed(2)}

                        )


                    </span>


                ))

            }


            </div>





        </div>

    );


}