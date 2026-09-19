import "./Inspector.css";

import LineEditor from "./LineEditor";
import WordEditor from "./WordEditor";
import StyleEditor from "./StyleEditor";

export default function Inspector(){

    return (

        <aside className="inspector">

            <div className="inspector-title">
                Inspector
            </div>

            <LineEditor />

            <WordEditor />

            <StyleEditor />

        </aside>

    );

}