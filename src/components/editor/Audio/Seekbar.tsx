import "./Seekbar.css";

type Props = {

  currentTime: number;

  duration: number;

  onSeek(
    time:number
  ):void;

};

export default function Seekbar({

  currentTime,

  duration,

  onSeek

}:Props){

  return(

    <div className="seekbar">

      <input

        type="range"

        min={0}

        max={duration || 0}

        step={0.01}

        value={currentTime}

        onChange={(e)=>{

          onSeek(

            Number(

              e.target.value

            )

          );

        }}

      />

    </div>

  );

}