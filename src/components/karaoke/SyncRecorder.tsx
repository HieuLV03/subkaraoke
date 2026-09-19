"use client";

import { useEffect, useRef } from "react";

import { useEditorStore } from "@/stores/editor.store";
import { useLyricsStore } from "@/stores/lyrics.store";

export default function SyncRecorder() {

    // ========================================
    // VIDEO MASTER CLOCK
    // ========================================

    const currentTime =
        useEditorStore(
            state => state.currentTime
        );


    const holding =
        useRef(false);

    const raf =
        useRef<number | null>(null);

    const startTime =
        useRef(0);


    useEffect(() => {

        /*
         * =========================
         * KIỂM TRA ĐANG NHẬP TEXT
         * =========================
         */

        function isTyping(
            e: KeyboardEvent
        ) {

            const target =
                e.target as HTMLElement | null;

            if (!target) {
                return false;
            }

            return (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            );
        }


        /*
         * =========================
         * UPDATE WORD PREVIEW
         * =========================
         */

        function updatePreview() {

            if (!holding.current)
                return;

            const state =
                useLyricsStore.getState();

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;

            /*
             * Lấy currentTime từ EditorStore
             *
             * currentTime này chính là
             * video.currentTime
             */

            const time =
                useEditorStore.getState().currentTime;

            state.updateWord(
                line.id,
                word.id,
                {
                    end: time
                }
            );

            raf.current =
                requestAnimationFrame(
                    updatePreview
                );
        }


        /*
         * =========================
         * SPACE DOWN
         * =========================
         */

        function keyDown(
            e: KeyboardEvent
        ) {

            if (
                e.code !== "Space"
            ) {
                return;
            }


            /*
             * Nếu đang nhập text
             * thì Space vẫn là Space của textarea
             */

            if (isTyping(e)) {
                return;
            }


            /*
             * Đang giữ Space
             */

            if (
                holding.current
            ) {
                return;
            }


            e.preventDefault();


            const state =
                useLyricsStore.getState();


            /*
             * Tìm line còn word chưa sync
             */

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;


            /*
             * Tìm word tiếp theo
             */

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;


            /*
             * Bắt đầu giữ Space
             */

            holding.current = true;


            /*
             * VIDEO TIME
             */

            const time =
                useEditorStore.getState().currentTime;

            startTime.current =
                time;


            /*
             * Set START
             */

            state.updateWord(
                line.id,
                word.id,
                {
                    start: time,
                    end: time,
                    synced: false
                }
            );


            /*
             * Bắt đầu preview
             */

            updatePreview();


            console.log(
                "SYNC START",
                word.word,
                time
            );
        }


        /*
         * =========================
         * SPACE UP
         * =========================
         */

        function keyUp(
            e: KeyboardEvent
        ) {

            if (
                e.code !== "Space"
            ) {
                return;
            }


            if (isTyping(e)) {
                return;
            }


            if (
                !holding.current
            ) {
                return;
            }


            e.preventDefault();


            holding.current = false;


            /*
             * Dừng RAF
             */

            if (raf.current) {

                cancelAnimationFrame(
                    raf.current
                );

                raf.current = null;
            }


            /*
             * VIDEO TIME
             */

            const end =
                useEditorStore.getState().currentTime;


            const state =
                useLyricsStore.getState();


            /*
             * Tìm line đang sync
             */

            const line =
                state.lyrics.find(
                    line =>
                        line.words.some(
                            word =>
                                !word.synced
                        )
                );

            if (!line)
                return;


            /*
             * Tìm word đang sync
             */

            const word =
                line.words.find(
                    word =>
                        !word.synced
                );

            if (!word)
                return;


            /*
             * Lưu timing
             */

            state.updateWord(
                line.id,
                word.id,
                {
                    start:
                        startTime.current,

                    end,

                    synced:
                        true
                }
            );


            console.log(
                "SYNC END",
                {
                    word:
                        word.word,

                    start:
                        startTime.current,

                    end
                }
            );
        }


        /*
         * =========================
         * LISTENER
         * =========================
         */

        window.addEventListener(
            "keydown",
            keyDown
        );

        window.addEventListener(
            "keyup",
            keyUp
        );


        /*
         * =========================
         * CLEANUP
         * =========================
         */

        return () => {

            window.removeEventListener(
                "keydown",
                keyDown
            );

            window.removeEventListener(
                "keyup",
                keyUp
            );


            if (raf.current) {

                cancelAnimationFrame(
                    raf.current
                );

                raf.current = null;
            }

        };

    }, []);


    return null;
}