import {VDSEngine} from '../core/VDSEngine';
import {musicPlayerBlueprint, musicPlayerHandlers} from './musicPlayerApp';
import type {CoreState, EphemeralFeedback, Command} from '../core/types';

// ===================================================================
// 模拟一个优雅的日志记录器 (The Logger)
// ===================================================================
const logger = {
    log: (message: string) => console.log(` ${message}`),
    info: (message: string) => console.log(`\x1b[34mℹ ${message}\x1b[0m`), // 蓝色
    warn: (message: string) => console.warn(`\x1b[33m⚠ ${message}\x1b[0m`), // 黄色
    error: (message: string) => console.error(`\x1b[31m✖ ${message}\x1b[0m`), // 红色
    state: (state: CoreState) => {
        console.log(`\x1b[32m⬇ STATE UPDATE\x1b[0m\n${JSON.stringify(state, null, 2)}`);
    },
    divider: () => console.log("\n" + "─".repeat(50) + "\n"),
};

// ===================================================================
// 模拟器 (The Simulator)
// ===================================================================
class Simulator {
    private engine: VDSEngine;

    constructor() {
        logger.info("VDS Engine - Golden Sample Simulation");
        logger.log("Initializing engine with Music Player application...");
        this.engine = new VDSEngine(musicPlayerBlueprint, musicPlayerHandlers);

        this.subscribeToEngineEvents();

        logger.divider();
        logger.log("Initial State:");
        logger.state(this.engine.getState());
    }

    public async run(): Promise<void> {
        logger.divider();
        logger.info("Simulation Scenario Started");

        await this.dispatchAndLog({name: 'PLAY'}, "Attempting to PLAY while stopped (should be rejected)");

        await this.dispatchAndLog({
            name: 'LOAD_TRACK',
            payload: {trackUrl: 'path/to/good-song.mp3'}
        }, "Loading a valid track...");

        await this.dispatchAndLog({name: 'PLAY'}, "Playing the loaded track...");

        await this.dispatchAndLog({name: 'PLAY'}, "Attempting to PLAY while already playing (should be rejected)");

        await this.dispatchAndLog({name: 'PAUSE'}, "Pausing the track...");

        await this.dispatchAndLog({
            name: 'LOAD_TRACK',
            payload: {trackUrl: 'path/to/bad-song.mp3'}
        }, "Loading an invalid track...");

        logger.info("Simulation Scenario Finished");
    }

    private subscribeToEngineEvents(): void {
        this.engine.subscribeToState((newState) => {
            logger.state(newState);
        });

        this.engine.subscribeToFeedback('*', (feedback) => {
            const logFn = feedback.level === 'error' ? logger.error : logger.warn;
            logFn(`FEEDBACK [${feedback.name}]: ${feedback.message}`);
        });
    }

    private async dispatchAndLog(command: Command, description: string): Promise<void> {
        logger.log(`\n> ACTION: ${description}`);
        logger.log(`  Dispatching Command: ${command.name}, Payload: ${JSON.stringify(command.payload || {})}`);
        await this.engine.dispatch(command);
        // 短暂暂停以确保异步日志有机会打印出来
        await new Promise(res => setTimeout(res, 1100));
    }
}

// ===================================================================
// 程序入口 (The Main Entry Point)
// ===================================================================
const simulator = new Simulator();
simulator.run();