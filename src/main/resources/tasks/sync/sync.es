//import cleanDeep from 'clean-deep'; // Cannot read property "__core-js_shared__" from undefined
//import deepEqual from 'fast-deep-equal';

//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {toStr} from '/lib/enonic/util';
import {
    createUser,
    getPrincipal,
    //getProfile,
    modifyProfile,
    modifyUser
} from '/lib/xp/auth';
import {run as runInContext} from '/lib/xp/context';
import {sanitize} from '/lib/xp/common';
import {connect} from '/lib/xp/node';
import {
    //list,
    progress
} from '/lib/xp/task';


//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {get as paginate} from '../../services/paginate/paginate.es';
import {get as graphRequest} from '../../services/graph/graph.es';

import {currentTimeMillis} from '../../lib/microsoftGraph/util/currentTimeMillis.es';
import {deepen} from '../../lib/microsoftGraph/util/deepen.es';
import getIsMaster from '../../lib/microsoftGraph/cluster/isMaster.es';
import {isString} from '../../lib/microsoftGraph/util/isString.es';
//import {sortObject} from '../../lib/microsoftGraph/util/sortObject.es';


//──────────────────────────────────────────────────────────────────────────────
// Private constants
//──────────────────────────────────────────────────────────────────────────────
//const TASK_NAME = `${app.name}:sync`;
//const STATE_FINISHED = 'FINISHED';

const connection = connect({
    repoId: 'system-repo',
    branch: 'master'
});

const PROFILE_CONFIG = {
    decideByType: true,
    enabled: true,
    nGram: true,
    fulltext: true,
    includeInAllText: true,
    indexValueProcessors: []
};


//──────────────────────────────────────────────────────────────────────────────
// Private function
//──────────────────────────────────────────────────────────────────────────────
/*function isAlreadyRunning() {
    const runningTasks = list({
        name: TASK_NAME,
        state: 'RUNNING'
    });
    log.info(toStr({runningTasks}));
    return runningTasks.some((runningTask) => {
        const info = runningTask.progress.info ? JSON.parse(runningTask.progress.info) : {};
        log.info(toStr({info}));
        const {state} = info;
        if (state && state !== STATE_FINISHED) {
            log.warning(`Task already running! ${toStr({runningTask})}`);
            return true;
        }
        return false;
    });
}*/


function pushValues(obj, arr) {
    Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (isString(v)) {
            arr.push(v);
        } else {
            pushValues(obj[k], arr); // recurse
        }
    });
} // function pushValues


function buildprofile({mapping, user}) {
    const profile = {};
    Object.keys(mapping).forEach((k) => {
        const field = mapping[k];
        if (isString(field)) {
            profile[k] = user[field];
        } else { // Scope
            profile[k] = buildprofile({mapping: mapping[k], user}); // recurse
        }
    }); // forEach
    return profile;
} // function buildprofile


//──────────────────────────────────────────────────────────────────────────────
// Public function
//──────────────────────────────────────────────────────────────────────────────
export function run(params) {
    if (!getIsMaster) {
        progress({
            info: JSON.stringify({
                error: 'Task only allowed to run on the master node'
            })
        });
        return;
    }

    runInContext({
        branch: 'master',
        user: {
            login: 'su',
            userStore: 'system'
        }
    }, () => {
        //if (isAlreadyRunning()) { return; }

        const startTime = currentTimeMillis();

        //log.info(toStr({params}));
        const {userStore} = params;
        if (!userStore) {
            progress({
                info: JSON.stringify({
                    error: 'Parameter userStore is required'
                })
            });
            return;
        }

        const config = deepen(app.config)[userStore]; //log.info(toStr({config: sortObject(config)}));
        const select = ['userPrincipalName']; // userPrincipalName is used in resource requests
        if (config.mapping) { select.concat(Object.keys(config.mapping).map(k => config.mapping[k])); }
        if (config.profile && config.profile.mapping) {
            pushValues(config.profile.mapping, select);
        }
        const requestParams = {
            params: {
                resource: 'users',
                select: select.filter((v, i, a) => a.indexOf(v) === i).join(','),
                userStore
            }
        }; //log.info(toStr({requestParams}));

        progress({
            info: JSON.stringify({
                state: 'Getting list of users from MS Graph API'
            })
        });
        const usersRes = paginate(requestParams);
        //log.info(toStr({usersRes}));

        let userArr = [];
        usersRes.body.graphResponses.forEach((r) => {
            userArr = userArr.concat(r.body.value);
        });
        //log.info(toStr({userArr}));

        let current = 0;
        const total = userArr.length;

        const users = {};
        // TODO Get list if users from Enonic and delete the ones that no longer exist in Graph
        userArr.forEach((user) => {
            current += 1;
            const name = sanitize(user[config.mapping.name]);
            progress({
                current,
                info: JSON.stringify({
                    name,
                    state: 'Getting user data from MS Graph API',
                    time: `${currentTimeMillis() - startTime}ms`,
                    userStore
                }),
                total
            });

            const key = `user:${userStore}:${name}`;

            try {
                const displayName = user[config.mapping.displayName];
                const email = user[config.mapping.email];

                // Just returns null even though the user doesn't exist.
                const principal = getPrincipal(key); //log.debug(toStr({principal}));
                if (principal) {
                    if (principal.displayName !== displayName || principal.email !== email) {
                        const modifyUserRes = modifyUser({
                            key,
                            editor: (u) => {
                                u.displayName = displayName; // eslint-disable-line no-param-reassign
                                u.email = email; // eslint-disable-line no-param-reassign
                                return u;
                            }
                        });
                        log.info(toStr({modifyUserRes}));
                        users[user.userPrincipalName] = modifyUserRes;
                    } else {
                        users[user.userPrincipalName] = principal;
                    }
                } else {
                    const createUserParams = {
                        displayName,
                        email,
                        name,
                        userStore
                    };
                    //log.info(toStr({createUserParams}));
                    const createRes = createUser(createUserParams);
                    log.info(toStr({createRes}));
                    users[user.userPrincipalName] = createRes;
                    const beforeRefreshMs = currentTimeMillis();
                    connection.refresh();
                    const afterRefreshMs = currentTimeMillis();
                    log.info(toStr({
                        beforeRefreshMs,
                        afterRefreshMs,
                        durationRefreshMs: afterRefreshMs - beforeRefreshMs
                    }));
                } // if !principal

                connection.modify({
                    key,
                    editor: (node) => {
                        let hasProfileConfig = false;
                        node._indexConfig.configs = node._indexConfig.configs.map((c) => { // eslint-disable-line no-param-reassign
                            if (c.path === 'profile') {
                                hasProfileConfig = true;
                                c.config = PROFILE_CONFIG; // eslint-disable-line no-param-reassign
                            }
                            return c;
                        }); // map
                        if (!hasProfileConfig) {
                            node._indexConfig.configs.push({
                                path: 'profile',
                                config: PROFILE_CONFIG
                            });
                        }
                        return node;
                    } // editor
                });

                const newProfile = buildprofile({mapping: config.profile.mapping, user}); //log.debug(toStr({newProfile}));

                if (config.resources) {
                    const resources = config.resources.replace(/ +/g, '').split(','); //log.debug(toStr({resources}));
                    const graphRequestParams = {
                        params: {
                            select: resources.join(','),
                            resource: `/users/${user.userPrincipalName}`,
                            userStore
                        }
                    }; //log.debug(toStr({graphRequestParams}));
                    //log.info('service/sync.get() before graphRequest');
                    const graphResponse = graphRequest(graphRequestParams);
                    //log.info('service/sync.get() after graphRequest');
                    if (graphResponse.status === 200 && graphResponse.body) {
                        resources.forEach((resource) => {
                            if (graphResponse.body[resource]) {
                                newProfile.graph[resource] = graphResponse.body[resource];
                            }
                        }); // forEach resource
                    }
                } // if config.resources

                /*const currentProfile = getProfile({key}); // log.debug(toStr({currentProfile}));
                const cleanedNewProfile = cleanDeep(newProfile);
                if (deepEqual(currentProfile, cleanedNewProfile)) {
                    log.info(toStr({equal: {currentProfile, cleanedNewProfile}}));
                    users[user.userPrincipalName].profile = currentProfile;
                } else {
                    log.info(toStr({notEqual: {currentProfile, cleanedNewProfile}}));*/
                const modifyProfileRes = modifyProfile({
                    key,
                    editor: () => newProfile /*(currentProfile) => { // eslint-disable-line no-unused-vars
                        // NOTE deepmerge will keep duplicating array contents!
                        const updatedProfile = merge(currentProfile, newProfile); //log.info(toStr({updatedProfile}));
                        return newProfile;
                    }*/
                });
                log.info(toStr({modifyProfileRes}));
                users[user.userPrincipalName].profile = modifyProfileRes; //getProfile({key});
                //}
            } catch (e) {
                log.error(`Something went wrong while processing user:${key} e:${e}`);
            }
        }); // forEach user

        progress({
            current,
            info: JSON.stringify({
                //state: STATE_FINISHED,
                time: `${currentTimeMillis() - startTime}ms`,
                userStore
            }),
            total
        });
    }); // runInContext
}
