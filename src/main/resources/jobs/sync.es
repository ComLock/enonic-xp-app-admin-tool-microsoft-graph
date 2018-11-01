import {submitNamed} from '/lib/xp/task';
import isMaster from '../lib/microsoftGraph/cluster/isMaster.es';


export function run() {
    if (!isMaster()) { // Only execute job on master
        return;
    }
    log.info('Starting sync task...');
    submitNamed({
        name: 'sync',
        config: {
            userStore: 'graph' // NOTE Hardcode
        }
    });
} // export function run
