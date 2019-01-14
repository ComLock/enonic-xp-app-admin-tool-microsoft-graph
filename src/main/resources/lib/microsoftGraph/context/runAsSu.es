import {run} from '/lib/xp/context';


export const runAsSu = (fn, {
	branch = 'master',
	repository = 'system-repo'
} = {}) => run({
	branch,
	repository,
	user: {
		login: 'su',
		userStore: 'system'
	},
	principals: ['role:system.admin']
}, () => fn());
