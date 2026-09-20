"use client";
import "./EditLinePage.css";
import { useState } from "react";
import { useEditorStore } from "@/stores/editor.store";
import {
    useLyricsStore,
    defaultLyricStyle
} from "@/stores/lyrics.store";
export default function EditLinePage() {
    const setWorkspace = useEditorStore(
        (state) => state.setWorkspace
    );
const autoResizeTextarea = (
    textarea: HTMLTextAreaElement
) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
};
 const resetAllTiming = useLyricsStore(
    state => state.resetAllTiming
);

const hasStartedTiming = useLyricsStore(
    state => state.hasStartedTiming
);

const startTiming = useLyricsStore(
    state => state.startTiming
);

    const {
        lyrics,
        setLyrics,
        updateLyrics, // dùng cái này để update realtime
    } = useLyricsStore();

    const [editingId, setEditingId] =
        useState<string | null>(null);

    // ============================
    // SPLIT LINE
    // ============================
    const splitLine = (id: string, cursor: number) => {
        updateLyrics((old) => {
            const index = old.findIndex((x) => x.id === id);
            if (index === -1) return old;

            const line = old[index];

            const firstText = line.text.slice(0, cursor).trim();
            const secondText = line.text.slice(cursor).trim();

            if (!firstText || !secondText) return old;

            const count = firstText.split(/\s+/).length;

            const firstWords = line.words.slice(0, count);
            const secondWords = line.words.slice(count);

            if (firstWords.length === 0 || secondWords.length === 0)
                return old;

            const firstLine = {
                ...line,
                id: crypto.randomUUID(),
                text: firstText,
                words: firstWords,
                start: firstWords[0].start,
                end: firstWords[firstWords.length - 1].end,
            };

            const secondLine = {
                ...line,
                id: crypto.randomUUID(),
                text: secondText,
                words: secondWords,
                start: secondWords[0].start,
                end: secondWords[secondWords.length - 1].end,
            };

            return [
                ...old.slice(0, index),
                firstLine,
                secondLine,
                ...old.slice(index + 1),
            ];
        });
    };

    // ============================
    // MERGE
    // ============================
    const mergeLine = (id: string) => {
        updateLyrics((old) => {
            const index = old.findIndex((x) => x.id === id);
            if (index <= 0) return old;

            const prev = old[index - 1];
            const current = old[index];

            const merged = {
                ...prev,
                text: prev.text + " " + current.text,
                words: [...prev.words, ...current.words],
                end: current.end,
            };

            return [
                ...old.slice(0, index - 1),
                merged,
                ...old.slice(index + 1),
            ];
        });
    };

    // ============================
    // UPDATE TIME
    // ============================
    const updateTime = (
        id: string,
        field: "start" | "end",
        value: number
    ) => {
        updateLyrics((old) =>
            old.map((line) => {
                if (line.id !== id) return line;

                // dịch toàn bộ word
                if (field === "start") {
                    const offset = value - line.start;

                    return {
                        ...line,
                        start: value,
                        words: line.words.map((word) => ({
                            ...word,
                            start: word.start + offset,
                            end: word.end + offset,
                        })),
                    };
                }

                // chỉ đổi end line
                return {
                    ...line,
                    end: value,
                };
            })
        );
    };
// ============================================================
// NEW TEXT
// Tạo line mới theo đúng cấu trúc LyricLine của AI
// ============================================================

const addNewLine = () => {

    const newId = crypto.randomUUID();

    updateLyrics((old) => {

        const lastLine =
            old.length > 0
                ? old[old.length - 1]
                : null;

        // ====================================================
        // TIME BAN ĐẦU
        // ====================================================

        const start =
            lastLine
                ? lastLine.end
                : 0;

        const end =
            start;


        // ====================================================
        // TẠO LINE
        // ====================================================

        const newLine = {

            id: newId,

            text: "",

            start,

            end,

            words: [],
  style: {
        ...defaultLyricStyle
    },
        };


        return [
            ...old,
            newLine,
        ];

    });


    setEditingId(newId);

};
    return (
        <div className="edit-line-page">
            {/* LIST */}
            <div className="edit-line-content">
                {lyrics.map((line) => (
                    <div key={line.id} className="edit-line-card">
                        {/* TIME */}
                        <div className="edit-line-time">
                            <div>
                                <label>Start</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={line.start}
                                    onChange={(e) =>
                                        updateTime(
                                            line.id,
                                            "start",
                                            Number(e.target.value)
                                        )
                                    }
                                    className="edit-line-input"
                                />
                            </div>

                            <div>
                                <label>End</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={line.end}
                                    onChange={(e) =>
                                        updateTime(
                                            line.id,
                                            "end",
                                            Number(e.target.value)
                                        )
                                    }
                                    className="edit-line-input"
                                />
                            </div>

                            <div>
                                Duration:{" "}
                                {(line.end - line.start).toFixed(2)}s
                            </div>
                        </div>

                        {/* TEXT */}
                     <textarea
    value={line.text}
    ref={(el) => {
        if (el) {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        }
    }}
onChange={(e) => {

    const textarea = e.currentTarget;

    const value = textarea.value;

    autoResizeTextarea(textarea);


    updateLyrics((old) => {

        return old.map((item) => {

            if (item.id !== line.id) {
                return item;
            }


            // =================================================
            // TEXT -> WORDS
            // =================================================

            const texts =
                value
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);


            const words = texts.map(
                (text, index) => {

                    const oldWord =
                        item.words[index];


                    // =========================================
                    // WORD ĐÃ CÓ
                    // Giữ nguyên toàn bộ timing + synced
                    // =========================================

                    if (oldWord) {

                        return {

                            ...oldWord,

                            word: text,

                        };

                    }


                    // =========================================
                    // WORD MỚI
                    // Timing mặc định = timing của LINE
                    // =========================================

                    return {

                        id:
                            crypto.randomUUID(),

                        word:
                            text,

                        start:
                            item.start,

                        end:
                            item.end,

                        synced:
                            false,

                    };

                }
            );


            // =================================================
            // RETURN LINE
            // =================================================

            return {

                ...item,

                text:
                    value,

                start:
                    item.start,

                end:
                    item.end,

                words,

            };

        });

    });

}}
    onFocus={(e) => {
        setEditingId(line.id);
        autoResizeTextarea(e.currentTarget);
    }}
    onBlur={() => setEditingId(null)}
    onKeyDown={(e) => {
        const cursor =
            e.currentTarget.selectionStart;

        if (e.key === "Enter") {
            e.preventDefault();
            splitLine(line.id, cursor);
        }

        if (
            e.key === "Backspace" &&
            cursor === 0
        ) {
            e.preventDefault();
            mergeLine(line.id);
        }
    }}
    className="edit-line-textarea"
/>
                        {/* BOTTOM */}
                        <div className="edit-line-bottom">
                            <span>{line.words.length} words</span>

                            <button
                                className="edit-line-delete"
                                onClick={() => {
                                    updateLyrics((old) =>
                                        old.filter(
                                            (x) => x.id !== line.id
                                        )
                                    );
                                }}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div className="edit-line-footer">
                    <button
        className="edit-line-new"
        onClick={addNewLine}
    >
        + New Text
    </button>
       <button
className="edit-line-next"
onClick={() => {

    if(!hasStartedTiming){

        resetAllTiming();

        startTiming();

    }

    setWorkspace("timing");

}}
>
Next →
</button>
            </div>
        </div>
    );
}