import { useEditorStore } from "@/stores/editor.store";

const currentTime = useEditorStore(
    state => state.currentTime
);