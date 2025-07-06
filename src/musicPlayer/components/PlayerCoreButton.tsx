import React from "react";
import type {StateGroupStates} from "../../core/types";
import {musicPlayerBlueprint} from "../musicPlayerApp";

export type PlaybackStatus = StateGroupStates<typeof musicPlayerBlueprint, 'Player', 'playback'>;

interface PlayCoreButtonProps {
    playbackStatus: PlaybackStatus;
}

export const PlayerCoreButton: React.FC<PlayCoreButtonProps> = ({
                                                                    playbackStatus,
                                                                }) => {
    switch (playbackStatus) {
        case 'playing':
            return <button>Pause</button>
        case 'paused':
            return <button>Play</button>
        case 'stopped':
            return <button>Play</button>
        default:
            return <button>Play</button>
    }
}