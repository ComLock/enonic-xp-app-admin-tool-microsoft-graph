import {run as runInContext} from '/lib/xp/context';
import {get as sync} from '../services/sync/sync.es';

export function run() {
    log.info('Starting sync service...');
    runInContext({
        branch: 'master',
        user: {
            login: 'su',
            userStore: 'system'
        }
    }, () => {
        //log.info('Admin context');
        try {
            sync({
                params: {
                    userStore: 'graph'
                }
            });
        } catch (e) {
            log.error(e);
        }
    });
    //log.info('Back to normal context');
    log.info('Sync service finished.');
} // export function run
