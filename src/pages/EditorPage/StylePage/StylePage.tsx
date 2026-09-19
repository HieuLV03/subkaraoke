"use client";

import "./StylePage.css";

import {
    useEditorStore
} from "@/stores/editor.store";

import {
    useLyricsStore,
    defaultLyricStyle
} from "@/stores/lyrics.store";


export default function StylePage() {


    // ========================================
    // EDITOR
    // ========================================

    const setWorkspace =
        useEditorStore(
            state =>
                state.setWorkspace
        );


    // ========================================
    // LYRICS
    // ========================================

    const selectedLineId =
        useLyricsStore(
            state =>
                state.selectedLineId
        );


    const lyrics =
        useLyricsStore(
            state =>
                state.lyrics
        );


    const updateLine =
        useLyricsStore(
            state =>
                state.updateLine
        );


    // ========================================
    // SELECTED LINE
    // ========================================

    const selectedLine =
        lyrics.find(
            line =>
                line.id ===
                selectedLineId
        );


    // ========================================
    // STYLE
    // ========================================

    const style =
        selectedLine?.style ??
        defaultLyricStyle;


    // ========================================
    // VALUES
    // ========================================

    const fontSize =
        style.fontSize;

    const color =
        style.color;

    const activeColor =
        style.activeColor;

    const outlineWidth =
        style.outlineWidth;

    const y =
        style.y;


    // ========================================
    // UPDATE STYLE
    // ========================================

    const updateStyle = (
        values: Partial<typeof style>
    ) => {


        if (!selectedLineId) {

            return;

        }


        updateLine(

            selectedLineId,

            {

                style: {

                    ...style,

                    ...values

                }

            }

        );

    };


    // ========================================
    // RENDER
    // ========================================

    return (

        <div className="style-page">


            <div className="style-content">


                {/* =================================
                    TITLE
                ================================= */}

                <div className="style-card">

                    <h2>
                        Style
                    </h2>

                    <p>
                        Karaoke Style Settings
                    </p>


                    {!selectedLine && (

                        <p className="style-warning">

                            Select a line first.

                        </p>

                    )}

                </div>


                {/* =================================
                    FONT SIZE
                ================================= */}

                <div className="style-card">

                    <label>

                        <span>
                            Font Size
                        </span>

                        <span className="style-value">

                            {fontSize}px

                        </span>

                    </label>


                    <input

                        type="range"

                        min="20"

                        max="120"

                        value={fontSize}

                        disabled={
                            !selectedLine
                        }

                        onChange={e => {

                            updateStyle({

                                fontSize:
                                    Number(
                                        e.target.value
                                    )

                            });

                        }}

                    />

                </div>


                {/* =================================
                    TEXT COLOR
                ================================= */}

                <div className="style-card">

                    <label>

                        Text Color

                    </label>


                    <input

                        type="color"

                        value={color}

                        disabled={
                            !selectedLine
                        }

                        onChange={e => {

                            updateStyle({

                                color:
                                    e.target.value

                            });

                        }}

                    />

                </div>


                {/* =================================
                    HIGHLIGHT COLOR
                ================================= */}

                <div className="style-card">

                    <label>

                        Highlight Color

                    </label>


                    <input

                        type="color"

                        value={activeColor}

                        disabled={
                            !selectedLine
                        }

                        onChange={e => {

                            updateStyle({

                                activeColor:
                                    e.target.value

                            });

                        }}

                    />

                </div>


                {/* =================================
                    STROKE WIDTH
                ================================= */}

                <div className="style-card">

                    <label>

                        <span>
                            Stroke Width
                        </span>

                        <span className="style-value">

                            {outlineWidth}px

                        </span>

                    </label>


                    <input

                        type="range"

                        min="0"

                        max="10"

                        step="1"

                        value={outlineWidth}

                        disabled={
                            !selectedLine
                        }

                        onChange={e => {

                            updateStyle({

                                outlineWidth:
                                    Number(
                                        e.target.value
                                    )

                            });

                        }}

                    />

                </div>


                {/* =================================
                    POSITION Y
                ================================= */}

                <div className="style-card">

                    <label>

                        <span>
                            Position Y
                        </span>

                        <span className="style-value">

                            {y}px

                        </span>

                    </label>


                    <input

                        type="range"

                        min="0"

                        max="500"

                        step="1"

                        value={y}

                        disabled={
                            !selectedLine
                        }

                        onChange={e => {

                            updateStyle({

                                y:
                                    Number(
                                        e.target.value
                                    )

                            });

                        }}

                    />

                </div>


            </div>


            {/* =====================================
                FOOTER
            ===================================== */}

            <div className="style-footer">


                <button

                    className="style-btn"

                    onClick={() =>
                        setWorkspace(
                            "timing"
                        )
                    }

                >

                    ← Previous

                </button>


                <button

                    className="style-btn"

                    onClick={() =>
                        setWorkspace(
                            "export"
                        )
                    }

                >

                    Next →

                </button>


            </div>


        </div>

    );

}