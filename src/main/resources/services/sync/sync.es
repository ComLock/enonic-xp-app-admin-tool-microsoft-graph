//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {toStr} from '/lib/enonic/util';
import {
    get as getTask,
    //isRunning as getIsRunning,
    list,
    submitNamed
} from '/lib/xp/task';

//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import getIsMaster from '../../lib/microsoftGraph/cluster/isMaster.es';
import {jsonError} from '../../lib/microsoftGraph/util/jsonError.es';

const TASK_NAME = `${app.name}:sync`;

function runningId(name) {
    //const isRunning = getIsRunning(name);
    //log.info(toStr({isRunning}));
    const runningTasks = list({
        name,
        state: 'RUNNING'
    });
    //log.info(toStr({runningTasks}));
    return runningTasks.length ? runningTasks[0].id : false;
}

//──────────────────────────────────────────────────────────────────────────────
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    const isMaster = getIsMaster();
    log.info(`service/sync.get() isMaster:${isMaster}`);
    if (!isMaster) {
        return jsonError('You are only allowed to run this server on the active master node.');
    }

    const {userStore} = request.params;
    if (!userStore) {
        return jsonError('Url parameter userStore must be present!');
    }

    const taskId = runningId(TASK_NAME) || submitNamed({
        name: TASK_NAME,
        config: {
            userStore
        }
    });

    const task = getTask(taskId);
    const sampInnerHtml = JSON.stringify(task, null, 4)
        .replace(/ /g, '&nbsp;')
        .replace(/\n/g, '<br />');

    return {
        body: `<html>
    <head>
    </head>
    <body>
        <samp>${sampInnerHtml}</samp>
    </body>
</html>`,
        contentType: 'text/html; charset=utf-8'
    };
} // export function get
