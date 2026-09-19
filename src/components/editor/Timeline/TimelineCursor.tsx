// src/components/editor/Timeline/TimelineCursor.tsx

import { useEditorStore } from "@/stores/editor.store";

export default function TimelineCursor() {

    const currentTime = useEditorStore(
        state => state.currentTime
    );

    const zoom = useEditorStore(
        state => state.zoom
    );

    const left = currentTime * zoom;

    return (

        <div
            className="timeline-cursor"
            style={{
                left
            }}
        >

            <div className="timeline-cursor-head" />

            <div className="timeline-cursor-line" />

        </div>

    );

}