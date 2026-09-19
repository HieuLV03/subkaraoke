
"use client";

import { useEditorStore } from "@/stores/editor.store";
import { useLyricsStore } from "@/stores/lyrics.store";

import "./TimingPage.css";

export default function TimingPage() {

    console.count("TimingPage render");


    // ============================================================
    // STORE
    // ============================================================

    const resetAllTiming =
        useLyricsStore(
            state => state.resetAllTiming
        );

    const resetLastTiming =
        useLyricsStore(
            state => state.resetLastTiming
        );

    const setWorkspace =
        useEditorStore(
            state => state.setWorkspace
        );

    const selectedLineId =
        useLyricsStore(
            state => state.selectedLineId
        );

    const selectLine =
        useLyricsStore(
            state => state.selectLine
        );

    const lyrics =
        useLyricsStore(
            state => state.lyrics
        );

    const updateLine =
        useLyricsStore(
            state => state.updateLine
        );

    const updateWord =
        useLyricsStore(
            state => state.updateWord
        );


    // ============================================================
    // RESET ONE WORD
    // ============================================================

    const handleResetWord = (
        lineId: string,
        wordId: string
    ) => {

        updateWord(
            lineId,
            wordId,
            {
                start: 0,
                end: 0,
                synced: false
            }
        );

    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="timing-page">

            <div className="timing-content">

                {
                    lyrics.map(line => (

                        <div
                            key={line.id}

                            className={
                                `timing-line ${
                                    selectedLineId === line.id
                                        ? "timing-line-selected"
                                        : ""
                                }`
                            }

                            onClick={() =>
                                selectLine(line.id)
                            }
                        >

                            {/* ==================================================
                                LINE
                            ================================================== */}

                            <div className="timing-line-left">

                                <div className="timing-line-title">
                                    {line.text}
                                </div>


                                <div className="timing-line-time">

                                    <label>
                                        Start

                                        <input
                                            type="number"
                                            step="0.001"
                                            value={line.start}
                                            onChange={e => {

                                                updateLine(
                                                    line.id,
                                                    {
                                                        start: Number(
                                                            e.target.value
                                                        )
                                                    }
                                                );

                                            }}
                                        />
                                    </label>


                                    <label>
                                        End

                                        <input
                                            type="number"
                                            step="0.001"
                                            value={line.end}
                                            onChange={e => {

                                                updateLine(
                                                    line.id,
                                                    {
                                                        end: Number(
                                                            e.target.value
                                                        )
                                                    }
                                                );

                                            }}
                                        />
                                    </label>


                                    <span>
                                        Duration :{" "}
                                        {
                                            (
                                                line.end -
                                                line.start
                                            ).toFixed(3)
                                        }
                                        s
                                    </span>

                                </div>

                            </div>


                            {/* ==================================================
                                WORDS
                            ================================================== */}

                            <div className="timing-words">

                                {
                                    line.words.map(word => (

                                        <div
                                            key={word.id}
                                            className="timing-word"
                                        >

                                            <div className="word-text">

                                                {word.word}

                                            </div>


                                            {/* WORD START */}

                                            <input
                                                type="number"
                                                step="0.001"
                                                value={word.start}
                                                onChange={e => {

                                                    updateWord(
                                                        line.id,
                                                        word.id,
                                                        {
                                                            start: Number(
                                                                e.target.value
                                                            )
                                                        }
                                                    );

                                                }}
                                            />


                                            {/* WORD END */}

                                            <input
                                                type="number"
                                                step="0.001"
                                                value={word.end}
                                                onChange={e => {

                                                    updateWord(
                                                        line.id,
                                                        word.id,
                                                        {
                                                            end: Number(
                                                                e.target.value
                                                            )
                                                        }
                                                    );

                                                }}
                                            />


                                            {/* SYNC STATUS */}

                                            <span
                                                className={
                                                    word.synced
                                                        ? "synced"
                                                        : "unsynced"
                                                }
                                            >

                                                {
                                                    word.synced
                                                        ? "✓"
                                                        : "○"
                                                }

                                            </span>


                                            {/* RESET WORD */}

                                            <button
                                                type="button"
                                                className="timing-word-reset"
                                                title="Reset timing của từ này"
                                                onClick={e => {

                                                    e.stopPropagation();

                                                    handleResetWord(
                                                        line.id,
                                                        word.id
                                                    );

                                                }}
                                            >
                                                ↻
                                            </button>

                                        </div>

                                    ))
                                }

                            </div>

                        </div>

                    ))
                }

            </div>


            {/* ============================================================
                FOOTER
            ============================================================ */}

            <div className="timing-footer">


                <button
                    className="timing-btn"
                    onClick={() =>
                        setWorkspace("line")
                    }
                >
                    ← Previous
                </button>


                <div className="timing-actions">


                    <button
                        className="timing-btn reset"
                        onClick={() => {
                            resetLastTiming();
                        }}
                    >
                        Reset Last
                    </button>


                    <button
                        className="timing-btn reset-all"
                        onClick={() => {

                            const confirmed =
                                window.confirm(
                                    "Bạn có chắc muốn Reset All không?\n\nTất cả timing của line và word sẽ được reset."
                                );

                            if (!confirmed) return;

                            resetAllTiming();

                        }}
                    >
                        Reset All
                    </button>


                    <button
                        className="timing-btn"
                        onClick={() =>
                            setWorkspace("style")
                        }
                    >
                        Next →
                    </button>

                </div>

            </div>

        </div>

    );

}
