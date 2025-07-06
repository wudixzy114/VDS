import React from "react";
import {useVDSState} from "./react/hooks";
import {Decorator} from "./react/Decorator";
import {PlayerCoreButton} from "./musicPlayer/components/PlayerCoreButton";
import {musicPlayerBlueprint} from "./musicPlayer/musicPlayerApp";
import {ClusterStateType, Command} from "./core/types";

const PlayPauseButton = () => {
    const playbackStatus = useVDSState(state => state.clusters.Player.playback);
    let command: Command;
    if (playbackStatus === 'playing') {
        command = {name: 'PAUSE'};
    } else {
        command = {name: 'PLAY'};
    }

    return (
        <Decorator
            command={command}
            interactionIndicator={<RippleEffect/>}
        >
            <PlayerCoreButton playbackStatus={playbackStatus}/>
        </Decorator>
    );
}