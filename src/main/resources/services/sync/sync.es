//──────────────────────────────────────────────────────────────────────────────
// Node modules (resolved and bundled by webpack)
//──────────────────────────────────────────────────────────────────────────────
//import merge from 'deepmerge';


//──────────────────────────────────────────────────────────────────────────────
// Enonic XP libs (in jar file, resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {
    createUser,
    getPrincipal,
    //getProfile,
    getUser,
    modifyProfile,
    modifyUser
} from '/lib/xp/auth';
import {sanitize} from '/lib/xp/common';
import {get as getContext} from '/lib/xp/context';
import {connect} from '/lib/xp/node';

//──────────────────────────────────────────────────────────────────────────────
// App libs (transpiled to /build and resolved runtime)
//──────────────────────────────────────────────────────────────────────────────
import {get as paginate} from '../paginate/paginate.es';
import {get as graphRequest} from '../graph/graph.es';

import getIsMaster from '../../lib/microsoftGraph/cluster/isMaster.es';

import {CT_JSON} from '../../lib/microsoftGraph/contentType.es';

import {currentTimeMillis} from '../../lib/microsoftGraph/util/currentTimeMillis.es';
import {deepen} from '../../lib/microsoftGraph/util/deepen.es';
import {isString} from '../../lib/microsoftGraph/util/isString.es';
import {jsonError} from '../../lib/microsoftGraph/util/jsonError.es';
//import {sortObject} from '../../lib/microsoftGraph/util/sortObject.es';
import {toStr} from '../../lib/microsoftGraph/util/toStr.es';


//──────────────────────────────────────────────────────────────────────────────
// Private constants
//──────────────────────────────────────────────────────────────────────────────
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
// Private functions
//──────────────────────────────────────────────────────────────────────────────
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
// Exported functions
//──────────────────────────────────────────────────────────────────────────────
export function get(request) {
    const isMaster = getIsMaster();
    log.info(`service/sync.get() isMaster:${isMaster}`);

    const context = getContext();
    log.debug(`service/sync.get() context:${toStr(context)}`);

    const serviceUser = getUser();
    log.debug(`service/sync.get() serviceUser:${toStr(serviceUser)}`);

    const startTime = currentTimeMillis();
    const {userStore} = request.params;
    if (!userStore) {
        return jsonError('Url parameter userStore must be present!');
    }
    const config = deepen(app.config)[userStore]; //log.debug(toStr({config: sortObject(config)}));
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
    }; //log.debug(toStr({requestParams}));

    //log.info('service/sync.get() before paginate');
    const usersRes = paginate(requestParams);
    //log.info('service/sync.get() after paginate');
    const users = {};
    // TODO Get list if users from Enonic and delete the ones that no longer exist in Graph
    usersRes.body.graphResponses.forEach((r) => {
        r.body.value.forEach((user) => {
            const name = sanitize(user[config.mapping.name]);
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
                        }); log.info(toStr({modifyUserRes}));
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
                    const createRes = createUser(createUserParams); log.info(toStr({createRes}));
                    users[user.userPrincipalName] = createRes;
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

                //const currentProfile = getProfile({key}); log.debug(toStr({currentProfile}));
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

                // TODO Perhaps use deepdiff, lets trust Enonic for now.
                const modifyProfileRes = modifyProfile({
                    key,
                    editor: () => newProfile /*(currentProfile) => { // eslint-disable-line no-unused-vars
                        // NOTE deepmerge will keep duplicating array contents!
                        const updatedProfile = merge(currentProfile, newProfile); //log.info(toStr({updatedProfile}));
                        return newProfile;
                    }*/
                }); log.info(toStr({modifyProfileRes}));
                users[user.userPrincipalName].profile = modifyProfileRes; //getProfile({key});
            } catch (e) {
                log.error(`Something went wrong while processing user:${key} e:${e}`);
            }
        }); // forEach user
    }); // forEach graphResponse
    const endTime = currentTimeMillis();
    return {
        body: {
            isMaster,
            userCount: users.length,
            time: `${endTime - startTime}ms`
            //users
        },
        contentType: CT_JSON
    };
} // export function get
