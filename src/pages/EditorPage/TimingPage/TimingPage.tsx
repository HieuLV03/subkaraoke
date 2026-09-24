
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
    // MOBILE TIMING BUTTON
    // ============================================================

    /*
     * Giả lập đúng phím Space.
     *
     * PointerDown = Space Down
     * PointerUp   = Space Up
     *
     * SyncRecorder đang lắng nghe:
     *
     * window.addEventListener("keydown", ...)
     * window.addEventListener("keyup", ...)
     *
     * nên không cần thay đổi SyncRecorder.
     *
     * Pointer Events hoạt động cho:
     *
     * - Mouse
     * - Touch
     * - Pen
     *
     * Quan trọng:
     * Không dùng onPointerLeave để kết thúc timing.
     * Vì trên mobile ngón tay có thể lệch khỏi button
     * trong lúc đang giữ.
     */

    const handleTimingPointerDown = (
        e: React.PointerEvent<HTMLButtonElement>
    ) => {

        e.preventDefault();
        e.stopPropagation();


        // Giữ pointer trên button.
        // Nhờ vậy mobile vẫn giữ trạng thái nhấn
        // ngay cả khi ngón tay di chuyển nhẹ.

        try {

            e.currentTarget.setPointerCapture(
                e.pointerId
            );

        } catch {
            // Browser không hỗ trợ thì bỏ qua.
        }


        // SPACE DOWN

        window.dispatchEvent(
            new KeyboardEvent(
                "keydown",
                {
                    code: "Space",
                    key: " ",
                    bubbles: true
                }
            )
        );

    };


    const handleTimingPointerUp = (
        e: React.PointerEvent<HTMLButtonElement>
    ) => {

        e.preventDefault();
        e.stopPropagation();


        // SPACE UP

        window.dispatchEvent(
            new KeyboardEvent(
                "keyup",
                {
                    code: "Space",
                    key: " ",
                    bubbles: true
                }
            )
        );


        // Release pointer capture

        try {

            if (
                e.currentTarget.hasPointerCapture(
                    e.pointerId
                )
            ) {

                e.currentTarget.releasePointerCapture(
                    e.pointerId
                );

            }

        } catch {
            // Browser không hỗ trợ thì bỏ qua.
        }

    };


    // ============================================================
    // POINTER CANCEL
    // ============================================================

    const handleTimingPointerCancel = (
        e: React.PointerEvent<HTMLButtonElement>
    ) => {

        e.preventDefault();
        e.stopPropagation();


        // Nếu browser cancel pointer,
        // vẫn phải gửi SPACE UP để SyncRecorder
        // không bị mắc ở trạng thái đang timing.

        window.dispatchEvent(
            new KeyboardEvent(
                "keyup",
                {
                    code: "Space",
                    key: " ",
                    bubbles: true
                }
            )
        );

    };


    // ============================================================
    // PREVENT CONTEXT MENU
    // ============================================================

    const handleTimingContextMenu = (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {

        e.preventDefault();
        e.stopPropagation();

    };


    // ============================================================
    // PREVENT TEXT SELECTION
    // ============================================================

    const handleTimingSelectStart = (
        e: React.SyntheticEvent<HTMLButtonElement>
    ) => {

        e.preventDefault();

    };
// ============================================================
// PREVENT TEXT SELECTION / COPY
// ============================================================

const handleTimingSelectStartPage = (
    e: React.SyntheticEvent<HTMLDivElement>
) => {
    const target = e.target as HTMLElement;

    // Cho phép input chọn/sửa text bình thường
    if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
    ) {
        return;
    }

    e.preventDefault();
};

const handleTimingContextMenuPage = (
    e: React.MouseEvent<HTMLDivElement>
) => {
    e.preventDefault();
    e.stopPropagation();
};

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
                                                        start:
                                                            Number(
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
                                                        end:
                                                            Number(
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
                                                            start:
                                                                Number(
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
                                                            end:
                                                                Number(
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

                    {/* ==================================================
                        MOBILE TIMING BUTTON
                    ================================================== */}

                    <button
                        type="button"

                        className="timing-btn timing-space-btn"

                        onPointerDown={
                            handleTimingPointerDown
                        }

                        onPointerUp={
                            handleTimingPointerUp
                        }

                        onPointerCancel={
                            handleTimingPointerCancel
                        }

                        onContextMenu={
                            handleTimingContextMenu
                        }

                        onSelect={
                            handleTimingSelectStart
                        }

                        onDragStart={
                            e => {
                                e.preventDefault();
                            }
                        }
                    >

                        <span
                            className="timing-space-icon"
                        >
                            ●
                        </span>

                        <span>
                            TIMING
                        </span>

                    </button>


                    {/* ==================================================
                        RESET LAST
                    ================================================== */}

                    <button
                        className="timing-btn reset"
                        onClick={() => {
                            resetLastTiming();
                        }}
                    >
                        Reset Last
                    </button>


                    {/* ==================================================
                        RESET ALL
                    ================================================== */}

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


                    {/* ==================================================
                        NEXT
                    ================================================== */}

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