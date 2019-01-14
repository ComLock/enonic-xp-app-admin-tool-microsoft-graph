import {toStr} from '/lib/enonic/util';
import {get as getContext} from '/lib/xp/context';
import {connect} from '/lib/xp/node';


export function connectRepo({
	context = getContext(),
	repoId = 'system-repo',
	branch = 'master',
	principals, // = [`role:${ROLE_CRAWLER_READ}`],
	login = context.authInfo.user.login, // USER_CRAWLER_NAME
	userStore = context.authInfo.user.userStore, // USER_CRAWLER_USERSTORE
	user = {
		login,
		userStore
	}
} = {}) {
	//log.info(toStr({context}));
	const connectParams = {
		repoId,
		branch,
		principals: principals ? context.authInfo.principals.concat(principals.split(',')) : context.authInfo.principals,
		user
	};
	log.info(toStr({connectParams}));
	return connect(connectParams);
}
