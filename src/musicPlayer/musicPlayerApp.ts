import type {Blueprint, CommandHandlerMap} from '../core/types';
import {createBlueprint} from "../utils/blueprint";

// ===================================================================
// 1. 应用蓝图 (The Blueprint)
//    这是应用的“宪法”，定义了所有可能性。
// ===================================================================
export const musicPlayerBlueprint: Blueprint = createBlueprint({
    version: "1.0",
    appName: "VDS Music Player",
    clusters: {
        "Player": {
            description: "核心播放器",
            stateGroups: {
                playback: {
                    initial: "stopped",
                    states: ["stopped", "playing", "paused", "loading"] as const,
                    description: "播放器的宏观操作状态"
                },
                track: {
                    initial: "noTrack",
                    states: ["noTrack", "trackLoaded", "trackError"] as const,
                    description: "当前音轨的持久化状态"
                }
            },
            transitions: {
                on: {
                    "TRACK_LOAD_STARTED": {target: {playback: "loading"}},
                    "TRACK_LOAD_SUCCEEDED": {target: {playback: "paused", track: "trackLoaded"}},
                    "TRACK_LOAD_FAILED": {target: {playback: "stopped", track: "trackError"}},
                    "PLAYBACK_STARTED": {target: {playback: "playing"}},
                    "PLAYBACK_PAUSED": {target: {playback: "paused"}},
                    "PLAYBACK_STOPPED": {target: {playback: "stopped", track: "noTrack"}}
                }
            }
        }
    }
});

// ===================================================================
// 2. 业务服务 (The Business Service)
//    模拟与外部世界（如硬件API、网络）交互的纯粹业务逻辑。
//    它不知道 VDS 的存在。
// ===================================================================
class AudioService {
    log(message: string) {
        console.log(` MOCK_AUDIO_SERVICE | ${message}`);
    }

    async load(url: string): Promise<void> {
        this.log(`Attempting to load track from ${url}...`);
        await new Promise(res => setTimeout(res, 1000)); // 模拟网络延迟
        if (url && url.includes('good-song')) {
            this.log(`Track loaded successfully.`);
            return;
        }
        this.log(`Failed to load track.`);
        throw new Error("Invalid or unreachable track URL");
    }

    async play(): Promise<void> {
        this.log('Playback started.');
    }

    async pause(): Promise<void> {
        this.log('Playback paused.');
    }
}

const audioService = new AudioService();

// ===================================================================
// 3. 命令处理器 (The Command Handlers)
//    这是 VDS 与业务逻辑之间的“适配器”层。
//    它负责：接收命令、调用业务服务、生成事件/反馈。
// ===================================================================
export const musicPlayerHandlers: CommandHandlerMap = {
    'LOAD_TRACK': async (getState, command) => {
        const {trackUrl} = command.payload;
        const startEvent = {name: 'TRACK_LOAD_STARTED', payload: {url: trackUrl}};
        try {
            // 调用纯粹的业务服务
            await audioService.load(trackUrl);
            const successEvent = {name: 'TRACK_LOAD_SUCCEEDED', payload: {url: trackUrl}};
            return [startEvent, successEvent];
        } catch (error) {
            const failureEvent = {name: 'TRACK_LOAD_FAILED', payload: {error: error.message}};
            return [startEvent, failureEvent];
        }
    },

    'PLAY': async (getState, command) => {
        const {playback, track} = getState().clusters.Player;
        if (playback !== 'paused' || track !== 'trackLoaded') {
            return {
                name: 'INVALID_OPERATION',
                level: 'warning',
                message: `Cannot PLAY. Required state is 'paused/trackLoaded', but current is '${playback}/${track}'.`
            };
        }

        await audioService.play();
        return {name: 'PLAYBACK_STARTED'};
    },

    'PAUSE': async (getState, command) => {
        const {playback} = getState().clusters.Player;
        if (playback !== 'playing') {
            return {
                name: 'INVALID_OPERATION',
                level: 'warning',
                message: `Cannot PAUSE. Required state is 'playing', but current is '${playback}'.`
            };
        }

        await audioService.pause();
        return {name: 'PLAYBACK_PAUSED'};
    }
};