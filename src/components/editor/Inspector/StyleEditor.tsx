import "./Inspector.css";

import { useLyricsStore } from "@/stores/lyrics.store";

export default function StyleEditor() {

    const lyrics = useLyricsStore(
        state => state.lyrics
    );

    const selectedLineId = useLyricsStore(
        state => state.selectedLineId
    );

    const updateLine = useLyricsStore(
        state => state.updateLine
    );

    const line = lyrics.find(
        item => item.id === selectedLineId
    );

    if (!line) {

        return null;

    }

    const style = line.style ?? {

        fontFamily: "Arial",

        fontSize: 48,

        color: "#ffffff",

        activeColor: "#ffd700",

        outline: "#000000",

        outlineWidth: 3,

        shadow: true,

        x: 50,

        y: 88,

        align: "center"

    };

    return (

        <section>

            <h3>

                Style

            </h3>

            <label>

                Font

            </label>

            <input

                value={style.fontFamily}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                fontFamily:e.target.value

                            }

                        }

                    );

                }}

            />

            <label>

                Font Size

            </label>

            <input

                type="number"

                value={style.fontSize}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                fontSize:Number(e.target.value)

                            }

                        }

                    );

                }}

            />

            <label>

                Text Color

            </label>

            <input

                type="color"

                value={style.color}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                color:e.target.value

                            }

                        }

                    );

                }}

            />

            <label>

                Highlight Color

            </label>

            <input

                type="color"

                value={style.activeColor}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                activeColor:e.target.value

                            }

                        }

                    );

                }}

            />

            <label>

                Outline

            </label>

            <input

                type="color"

                value={style.outline}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                outline:e.target.value

                            }

                        }

                    );

                }}

            />

            <label>

                Outline Width

            </label>

            <input

                type="number"

                value={style.outlineWidth}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                outlineWidth:Number(e.target.value)

                            }

                        }

                    );

                }}

            />

            <label>

                Position X

            </label>

            <input

                type="number"

                value={style.x}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                x:Number(e.target.value)

                            }

                        }

                    );

                }}

            />

            <label>

                Position Y

            </label>

            <input

                type="number"

                value={style.y}

                onChange={(e)=>{

                    updateLine(

                        line.id,

                        {

                            style:{

                                ...style,

                                y:Number(e.target.value)

                            }

                        }

                    );

                }}

            />

        </section>

    );

}